import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";

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

    const { data, error } = await supabaseAdmin
      .from("actividad_admin")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      const sinTabla = error.code === "42P01" || error.code === "PGRST205";
      return NextResponse.json(
        {
          error: sinTabla
            ? "Falta crear el historial: corre la migración 019_historial_planes_editables.sql en Supabase."
            : error.message,
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, actividad: data || [] });
  } catch (err) {
    console.error("[admin/actividad]", err);
    return NextResponse.json(
      { error: err.message || "Error al cargar historial" },
      { status: 500 }
    );
  }
}
