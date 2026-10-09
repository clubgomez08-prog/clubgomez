import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { CLAVES_RANGO, periodoDe } from "@/lib/club-gomez/claves-pool";
import { listarNumerosPeriodo } from "@/lib/club-gomez/numeros-admin";

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
    const periodo = /^\d{4}-\d{2}$/.test(searchParams.get("periodo") || "")
      ? searchParams.get("periodo")
      : periodoDe();

    const numeros = await listarNumerosPeriodo(supabaseAdmin, periodo);
    return NextResponse.json({ ok: true, periodo, rangos: CLAVES_RANGO, numeros });
  } catch (err) {
    console.error("[admin/numeros]", err);
    return NextResponse.json(
      { error: err.message || "Error al cargar números" },
      { status: 500 }
    );
  }
}
