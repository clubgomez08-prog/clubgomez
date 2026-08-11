import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";

export const dynamic = "force-dynamic";

/**
 * Marca premio como entregado (logística hecha).
 */
export async function POST(request, { params }) {
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

    const { data: beneficio, error: benErr } = await supabaseAdmin
      .from("sorteos_beneficio")
      .select("*")
      .eq("id", id)
      .single();

    if (benErr || !beneficio) {
      return NextResponse.json({ error: "Beneficio no encontrado" }, { status: 404 });
    }

    if (beneficio.estado !== "jugado") {
      return NextResponse.json(
        { error: "Solo se puede marcar entrega si hay ganador (estado jugado)" },
        { status: 400 }
      );
    }

    const ahora = new Date().toISOString();
    const { data: updated, error: upErr } = await supabaseAdmin
      .from("sorteos_beneficio")
      .update({
        estado: "entregado",
        entregado_en: ahora,
        updated_at: ahora,
        notas: body.notas
          ? String(body.notas).trim()
          : beneficio.notas,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, beneficio: updated });
  } catch (err) {
    console.error("[admin/beneficios/entregar]", err);
    return NextResponse.json(
      { error: err.message || "Error al marcar entrega" },
      { status: 500 }
    );
  }
}
