import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { normalizarCampana } from "@/lib/club-gomez/campanas";

export const dynamic = "force-dynamic";

function mensajeTabla(error) {
  if (error?.code === "42P01" || error?.code === "PGRST205") {
    return "Falta crear la tabla de campañas: corre la migración 018_campanas.sql en Supabase.";
  }
  return error?.message || "Error";
}

export async function GET(request) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (supabaseMissingEnv) {
      return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
    }

    const { data, error } = await supabaseAdmin
      .from("campanas")
      .select("*")
      .order("activa", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: mensajeTabla(error) }, { status: 400 });
    }
    return NextResponse.json({ ok: true, campanas: data || [] });
  } catch (err) {
    console.error("[admin/campanas GET]", err);
    return NextResponse.json(
      { error: err.message || "Error al listar campañas" },
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

    const body = await request.json().catch(() => ({}));
    const { payload, error: errVal } = normalizarCampana({
      nombre: "",
      periodo: "",
      ...body,
    });
    if (errVal) {
      return NextResponse.json({ error: errVal }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("campanas")
      .insert({ ...payload, activa: false })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: mensajeTabla(error) }, { status: 400 });
    }
    return NextResponse.json({ ok: true, campana: data });
  } catch (err) {
    console.error("[admin/campanas POST]", err);
    return NextResponse.json(
      { error: err.message || "Error al crear campaña" },
      { status: 500 }
    );
  }
}
