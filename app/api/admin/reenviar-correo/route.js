import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { getPlanById } from "@/lib/club-gomez/planes";
import { esEmailPlaceholder } from "@/lib/club-gomez/activar-membresia";
import { enviarTicketCompra } from "@/lib/email";
import { registrarActividad } from "@/lib/admin-actividad";

export const dynamic = "force-dynamic";

/** Reenvía el mismo correo de oportunidades de una membresía (no asigna nada nuevo). */
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
    const membresiaId = String(body.membresiaId || "").trim();
    if (!membresiaId) {
      return NextResponse.json({ error: "Falta la membresía" }, { status: 400 });
    }

    const { data: mem, error } = await supabaseAdmin
      .from("membresias")
      .select("id, plan_id, estado, miembros(id, nombre, email), claves(numero), pagos(monto_cop, estado)")
      .eq("id", membresiaId)
      .maybeSingle();

    if (error || !mem) {
      return NextResponse.json({ error: "Membresía no encontrada" }, { status: 404 });
    }
    if (mem.estado === "cancelada") {
      return NextResponse.json({ error: "Esa venta está anulada." }, { status: 400 });
    }
    const miembro = mem.miembros || {};
    if (esEmailPlaceholder(miembro.email)) {
      return NextResponse.json(
        { error: "Este cliente no tiene correo registrado. Usa WhatsApp." },
        { status: 400 }
      );
    }
    const numeros = (mem.claves || []).map((c) => c.numero).sort();
    if (!numeros.length) {
      return NextResponse.json({ error: "Esta membresía no tiene números." }, { status: 400 });
    }

    const plan = getPlanById(mem.plan_id);
    const pago = (mem.pagos || []).find((p) => p.estado === "aprobado");

    await enviarTicketCompra(
      {
        id: miembro.id,
        nombre: miembro.nombre,
        email: miembro.email,
        cantidad_boletos: numeros.length,
        total_pagado: pago?.monto_cop || plan.precio,
      },
      { nombre: `Plan ${plan.nombre}` },
      numeros,
      { useParticipantEmail: true }
    );

    await registrarActividad(supabaseAdmin, user, "correo_reenviado", {
      nombre: miembro.nombre,
      email: miembro.email,
      numeros,
    });

    return NextResponse.json({ ok: true, email: miembro.email });
  } catch (err) {
    console.error("[admin/reenviar-correo]", err);
    return NextResponse.json(
      { error: err.message || "No se pudo reenviar el correo" },
      { status: 500 }
    );
  }
}
