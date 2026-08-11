import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { consultarVoucherBold } from "@/lib/club-gomez/bold";
import { activarMembresiaManual } from "@/lib/club-gomez/activar-membresia";

function bad(msg, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

function parseNotas(notas) {
  try {
    return notas ? JSON.parse(notas) : {};
  } catch {
    return {};
  }
}

/** Confirma pago Bold por order-id y activa membresía si APPROVED. */
export async function POST(request) {
  try {
    if (supabaseMissingEnv) return bad("Supabase no configurado.", 503);

    const body = await request.json();
    const orderId = String(body.orderId || body["bold-order-id"] || "").trim();
    const txStatusHint = String(body.txStatus || body["bold-tx-status"] || "")
      .trim()
      .toLowerCase();

    if (!orderId) return bad("Falta bold-order-id.");

    const { data: solicitudes, error: solErr } = await supabaseAdmin
      .from("solicitudes_membresia")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(40);

    if (solErr) return bad(solErr.message, 400);

    const solicitud = (solicitudes || []).find((s) => {
      const n = parseNotas(s.notas);
      return n.bold_order_id === orderId;
    });

    if (!solicitud) {
      return bad("No encontramos la solicitud de este pago.", 404);
    }

    if (solicitud.estado === "convertida") {
      return NextResponse.json({
        ok: true,
        alreadyActive: true,
        status: "APPROVED",
        mensaje: "Tu membresía ya estaba activa.",
      });
    }

    let voucher = null;
    try {
      voucher = await consultarVoucherBold(orderId);
    } catch (err) {
      console.error("[bold/confirmar] voucher:", err?.message || err);
      if (txStatusHint === "approved") {
        // En pruebas a veces el voucher tarda; confiamos en el hint + reintento
        return NextResponse.json({
          ok: false,
          pending: true,
          error:
            "Bold aún no refleja el pago. Espera unos segundos y recarga, o usa “Probar webhook” en Bold.",
        });
      }
      return bad(err.message || "No se pudo consultar Bold.", 502);
    }

    const paymentStatus = String(voucher?.payment_status || "").toUpperCase();

    if (paymentStatus === "NO_TRANSACTION_FOUND" || paymentStatus === "PROCESSING" || paymentStatus === "PENDING") {
      return NextResponse.json({
        ok: false,
        pending: true,
        status: paymentStatus,
        error: "El pago aún se está procesando. Recarga en unos segundos.",
      });
    }

    if (paymentStatus !== "APPROVED") {
      return NextResponse.json({
        ok: false,
        status: paymentStatus,
        error: `Pago no aprobado (${paymentStatus || "desconocido"}).`,
      });
    }

    const resultado = await activarMembresiaManual(supabaseAdmin, {
      planId: solicitud.plan_id,
      nombre: solicitud.nombre,
      cedula: solicitud.cedula,
      email: solicitud.email,
      telefono: solicitud.telefono,
      ciudad: solicitud.ciudad,
      fechaNacimiento: parseNotas(solicitud.notas).fecha_nacimiento || null,
      origen: "bold",
      solicitudId: solicitud.id,
      boldOrderId: orderId,
      boldTransactionId: voucher?.transaction_id || null,
      montoCop: voucher?.total || null,
    });

    return NextResponse.json({
      ok: true,
      status: "APPROVED",
      emailOk: resultado.emailOk,
      clavesCount: resultado.claves?.length || 0,
      alreadyActive: Boolean(resultado.alreadyActive),
      mensaje: resultado.alreadyActive
        ? "Membresía ya activa."
        : "Pago aprobado. Membresía activada.",
    });
  } catch (err) {
    console.error("[bold/confirmar]", err);
    return bad(err.message || "Error al confirmar el pago.", 500);
  }
}
