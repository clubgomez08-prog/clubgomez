import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { normalizarCampana } from "@/lib/club-gomez/campanas";
import { registrarActividad } from "@/lib/admin-actividad";

export const dynamic = "force-dynamic";

/** Edita la campaña. Con { activa: true } la deja como única activa. */
export async function PUT(request, { params }) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (supabaseMissingEnv) {
      return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { payload, error: errVal } = normalizarCampana(body);
    if (errVal) {
      return NextResponse.json({ error: errVal }, { status: 400 });
    }

    const ahora = new Date().toISOString();

    if (body.activa === true) {
      const { error: offErr } = await supabaseAdmin
        .from("campanas")
        .update({ activa: false, updated_at: ahora })
        .eq("activa", true)
        .neq("id", id);
      if (offErr) {
        return NextResponse.json({ error: offErr.message }, { status: 400 });
      }
      payload.activa = true;
    }

    const { data, error } = await supabaseAdmin
      .from("campanas")
      .update({ ...payload, updated_at: ahora })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Campaña no encontrada" },
        { status: 400 }
      );
    }
    await registrarActividad(
      supabaseAdmin,
      user,
      body.activa === true ? "campana_activada" : "campana_guardada",
      { nombre: data.nombre, periodo: data.periodo }
    );
    return NextResponse.json({ ok: true, campana: data });
  } catch (err) {
    console.error("[admin/campanas PUT]", err);
    return NextResponse.json(
      { error: err.message || "Error al guardar campaña" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (supabaseMissingEnv) {
      return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
    }

    const { id } = await params;
    const { data: actual } = await supabaseAdmin
      .from("campanas")
      .select("activa, nombre")
      .eq("id", id)
      .single();
    if (actual?.activa) {
      return NextResponse.json(
        { error: "No se puede borrar la campaña activa. Activa otra primero." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("campanas").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    await registrarActividad(supabaseAdmin, user, "campana_borrada", {
      nombre: actual?.nombre || id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/campanas DELETE]", err);
    return NextResponse.json(
      { error: err.message || "Error al borrar campaña" },
      { status: 500 }
    );
  }
}
