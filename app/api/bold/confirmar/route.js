import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { consultarVoucherBold } from "@/lib/club-gomez/bold";
import { activarMembresiaManual } from "@/lib/club-gomez/activar-membresia";
import { getPlanById } from "@/lib/club-gomez/planes";
import { sendPurchaseCapi } from "@/lib/club-gomez/meta-capi";

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

function clienteMetaDeSolicitud(solicitud, notas = {}) {
  return {
    email: solicitud.email,
    telefono: solicitud.telefono,
    nombre: solicitud.nombre,
    ciudad: solicitud.ciudad,
    fechaNacimiento: notas.fecha_nacimiento || null,
    fbp: notas.fbp || null,
    fbc: notas.fbc || null,
  };
}

async function maybeCapiPurchase({
  request,
  orderId,
  plan,
  value,
  solicitud,
  notas,
}) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ua = request.headers.get("user-agent") || "";
  try {
    await sendPurchaseCapi({
      orderId,
      value,
      currency: "COP",
      planId: plan.id,
      planNombre: plan.nombre,
      ...clienteMetaDeSolicitud(solicitud, notas),
      clientIp: forwarded,
      userAgent: ua,
      eventSourceUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://clubgomez.co"}/pago/resultado`,
    });
  } catch (err) {
    console.error("[bold/confirmar] capi:", err?.message || err);
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
      const planYa = getPlanById(solicitud.plan_id);
      const metaYa = parseNotas(solicitud.notas);
      const valueYa = Number(metaYa.amount) || planYa.precio || 0;
      await maybeCapiPurchase({
        request,
        orderId,
        plan: planYa,
        value: valueYa,
        solicitud,
        notas: metaYa,
      });
      return NextResponse.json({
        ok: true,
        alreadyActive: true,
        status: "APPROVED",
        planId: planYa.id,
        planNombre: planYa.nombre,
        value: valueYa,
        email: solicitud.email,
        telefono: solicitud.telefono,
        nombre: solicitud.nombre,
        ciudad: solicitud.ciudad,
        fecha_nacimiento: metaYa.fecha_nacimiento || null,
        clavesCount: 0,
        mensaje: "Tu membresía ya estaba activa.",
      });
    }

    let voucher = null;
    try {
      voucher = await consultarVoucherBold(orderId);
    } catch (err) {
      console.error("[bold/confirmar] voucher:", err?.message || err);
      if (txStatusHint === "approved") {
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

    if (
      paymentStatus === "NO_TRANSACTION_FOUND" ||
      paymentStatus === "PROCESSING" ||
      paymentStatus === "PENDING"
    ) {
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

    const notas = parseNotas(solicitud.notas);
    const resultado = await activarMembresiaManual(supabaseAdmin, {
      planId: solicitud.plan_id,
      nombre: solicitud.nombre,
      cedula: solicitud.cedula,
      email: solicitud.email,
      telefono: solicitud.telefono,
      ciudad: solicitud.ciudad,
      fechaNacimiento: notas.fecha_nacimiento || null,
      origen: "bold",
      solicitudId: solicitud.id,
      boldOrderId: orderId,
      boldTransactionId: voucher?.transaction_id || null,
      montoCop: voucher?.total || null,
    });

    const plan = getPlanById(solicitud.plan_id);
    const value =
      Number(voucher?.total) || Number(notas.amount) || plan.precio || 0;

    await maybeCapiPurchase({
      request,
      orderId,
      plan,
      value,
      solicitud,
      notas,
    });

    return NextResponse.json({
      ok: true,
      status: "APPROVED",
      emailOk: resultado.emailOk,
      clavesCount: resultado.claves?.length || 0,
      alreadyActive: Boolean(resultado.alreadyActive),
      planId: plan.id,
      planNombre: plan.nombre,
      value,
      email: solicitud.email,
      telefono: solicitud.telefono,
      nombre: solicitud.nombre,
      ciudad: solicitud.ciudad,
      fecha_nacimiento: notas.fecha_nacimiento || null,
      mensaje: resultado.alreadyActive
        ? "Membresía ya activa."
        : "Pago aprobado. Membresía activada.",
    });
  } catch (err) {
    console.error("[bold/confirmar]", err);
    return bad(err.message || "Error al confirmar el pago.", 500);
  }
}
