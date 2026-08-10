import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { getPlanById } from "@/lib/club-gomez/planes";

function bad(msg, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

/** Guarda solicitud de membresía (antes de WhatsApp / pago). */
export async function POST(request) {
  try {
    if (supabaseMissingEnv) {
      return bad("Supabase no está configurado.", 503);
    }

    const body = await request.json();
    const plan = getPlanById(body.planId || body.plan_id);
    const nombre = String(body.nombre || "").trim();
    const cedula = String(body.cedula || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const telefono = String(body.telefono || "").trim();
    const ciudad = String(body.ciudad || "").trim() || null;

    if (!nombre) return bad("Escribe tu nombre completo.");
    if (!cedula) return bad("Escribe tu cédula.");
    if (!email || !email.includes("@")) return bad("Escribe un email válido.");
    if (!telefono) return bad("Escribe tu WhatsApp.");

    const { data, error } = await supabaseAdmin
      .from("solicitudes_membresia")
      .insert({
        plan_id: plan.id,
        nombre,
        cedula,
        email,
        telefono,
        ciudad,
        estado: "nueva",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[solicitudes-membresia]", error);
      return bad(error.message || "No se pudo guardar la solicitud.", 400);
    }

    return NextResponse.json({ ok: true, id: data.id, planId: plan.id });
  } catch (err) {
    console.error("[solicitudes-membresia]", err);
    return bad(err.message || "Error inesperado.", 500);
  }
}
