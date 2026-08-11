import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { periodoDe } from "@/lib/club-gomez/claves-pool";
import { LOTERIA_INTERNA } from "@/lib/club-gomez/claves-whatsapp";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (supabaseMissingEnv) {
      return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get("periodo") || periodoDe();

    const { data: beneficios, error } = await supabaseAdmin
      .from("sorteos_beneficio")
      .select("*")
      .eq("periodo", periodo)
      .order("fecha_sorteo", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const ids = (beneficios || [])
      .map((b) => b.ganador_miembro_id)
      .filter(Boolean);

    let miembrosMap = {};
    if (ids.length > 0) {
      const { data: miembros } = await supabaseAdmin
        .from("miembros")
        .select("id, nombre, email, telefono")
        .in("id", ids);
      for (const m of miembros || []) {
        miembrosMap[m.id] = m;
      }
    }

    const enriched = (beneficios || []).map((b) => ({
      ...b,
      ganador: b.ganador_miembro_id
        ? miembrosMap[b.ganador_miembro_id] || null
        : null,
    }));

    return NextResponse.json({
      ok: true,
      periodo,
      loteria: LOTERIA_INTERNA,
      beneficios: enriched,
    });
  } catch (err) {
    console.error("[admin/beneficios GET]", err);
    return NextResponse.json(
      { error: err.message || "Error al listar" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (supabaseMissingEnv) {
      return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
    }

    const body = await request.json();
    const premio = String(body.premio || "").trim();
    const fecha_sorteo = String(body.fecha_sorteo || "").trim();
    const descripcion = String(body.descripcion || "").trim() || null;

    if (!premio || !fecha_sorteo) {
      return NextResponse.json(
        { error: "premio y fecha_sorteo son obligatorios" },
        { status: 400 }
      );
    }

    const periodo = body.periodo
      ? String(body.periodo).trim()
      : fecha_sorteo.slice(0, 7);

    const { data, error } = await supabaseAdmin
      .from("sorteos_beneficio")
      .insert({
        periodo,
        fecha_sorteo,
        premio,
        descripcion,
        loteria: LOTERIA_INTERNA,
        estado: "programado",
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, beneficio: data });
  } catch (err) {
    console.error("[admin/beneficios POST]", err);
    return NextResponse.json(
      { error: err.message || "Error al crear" },
      { status: 500 }
    );
  }
}
