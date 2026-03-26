import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { supabaseAdmin } from "@/lib/supabase";
import { asignarNumerosParticipante } from "@/lib/numeros";
import {
  enviarTicketCompra,
  enviarConfirmacionAdmin,
  enviarNotificacionBendecido,
} from "@/lib/email";
import {
  parseNumerosBendecidos,
  getNumerosString,
} from "@/lib/numeros-bendecidos";
import {
  politicaVerificacionWebhookMp,
  verificarFirmaWebhookMercadoPago,
} from "@/lib/mercadopago-webhook-verify";

const client = process.env.MP_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
  : null;

function copEntero(n) {
  return Math.round(Number(n));
}

function logId(id) {
  const s = id == null ? "" : String(id);
  if (s.length <= 4) return "****";
  return `…${s.slice(-4)}`;
}

async function montoEsperadoParticipante(participante) {
  const { data: rifa, error } = await supabaseAdmin
    .from("rifas")
    .select("precio_boleto")
    .eq("id", participante.rifa_id)
    .single();

  if (error || !rifa) {
    throw new Error("Rifa no encontrada para validar monto");
  }

  const qty = participante.cantidad_boletos ?? 0;
  const precio = copEntero(rifa.precio_boleto);
  return copEntero(qty * precio);
}

/**
 * Solo "approved" asigna boletos. Otros estados no modifican un aprobado previo.
 * rejected/cancelled → rechazado solo si sigue pendiente.
 * pending/in_process/etc. → ack sin cambios (MP puede renotificar al cambiar a approved).
 */
async function procesarPago(paymentId) {
  if (!client) {
    throw new Error("MP_ACCESS_TOKEN no configurado");
  }

  const paymentClient = new Payment(client);
  const payment = await paymentClient.get({ id: paymentId });

  if (!payment || !payment.id) {
    throw new Error("Pago no encontrado");
  }

  const participanteId = payment.external_reference;
  if (!participanteId) {
    throw new Error("external_reference faltante");
  }

  const { data: participante, error: partError } = await supabaseAdmin
    .from("participantes")
    .select("id, rifa_id, cantidad_boletos, nombre, email, estado_pago, total_pagado, mp_payment_id")
    .eq("id", participanteId)
    .single();

  if (partError || !participante) {
    throw new Error("Participante no encontrado");
  }

  const status = payment.status;

  if (status === "approved") {
    if (
      participante.estado_pago === "aprobado" &&
      participante.mp_payment_id &&
      String(participante.mp_payment_id) !== String(payment.id)
    ) {
      console.warn(
        "[Webhook MP] Participante ya aprobado con otro pago",
        logId(participante.id)
      );
      return { received: true, skipped: true, reason: "ya_aprobado_otro_pago" };
    }

    const esperado = await montoEsperadoParticipante(participante);
    const pagadoMp = copEntero(payment.transaction_amount);
    const totalDb = copEntero(participante.total_pagado);

    if (pagadoMp !== esperado || totalDb !== esperado) {
      console.error(
        "[Webhook MP] Monto no coincide pago",
        logId(payment.id),
        "pagadoMp/esperado/totalDb",
        pagadoMp,
        esperado,
        totalDb
      );
      return { received: true, skipped: true, reason: "monto_invalido" };
    }

    const rifaId = participante.rifa_id;
    const cantidad = participante.cantidad_boletos ?? 1;

    const { count: countAntes } = await supabaseAdmin
      .from("boletos")
      .select("*", { count: "exact", head: true })
      .eq("participante_id", participante.id);

    const nAntes = countAntes ?? 0;

    const { data: claimedRows, error: claimError } = await supabaseAdmin
      .from("participantes")
      .update({
        estado_pago: "aprobado",
        mp_payment_id: String(payment.id),
      })
      .eq("id", participante.id)
      .eq("estado_pago", "pendiente")
      .select("id");

    if (claimError) {
      throw new Error(claimError.message);
    }

    let claimedThisRequest = Array.isArray(claimedRows) && claimedRows.length > 0;
    let participanteActual = participante;

    if (!claimedThisRequest) {
      const { data: p2, error: e2 } = await supabaseAdmin
        .from("participantes")
        .select("id, rifa_id, cantidad_boletos, nombre, email, estado_pago, total_pagado, mp_payment_id")
        .eq("id", participante.id)
        .single();

      if (e2 || !p2) {
        throw new Error("Participante no encontrado tras claim");
      }

      if (
        p2.estado_pago === "aprobado" &&
        String(p2.mp_payment_id) === String(payment.id)
      ) {
        participanteActual = p2;
      } else if (p2.estado_pago === "aprobado") {
        return { received: true, skipped: true, reason: "race_otro_pago" };
      } else {
        return { received: true, skipped: true, reason: "no_claim_pendiente" };
      }
    }

    let numeros = [];
    try {
      numeros = await asignarNumerosParticipante(
        rifaId,
        participanteActual.id,
        cantidad
      );
    } catch (assignErr) {
      if (claimedThisRequest) {
        const { error: revErr } = await supabaseAdmin
          .from("participantes")
          .update({ estado_pago: "pendiente", mp_payment_id: null })
          .eq("id", participanteActual.id)
          .eq("mp_payment_id", String(payment.id));
        if (revErr) {
          console.error("[Webhook MP] Revert participante falló:", revErr.message);
        }
      }
      console.error("[Webhook MP] Error asignando boletos:", assignErr?.message);
      throw assignErr;
    }

    const completo = numeros.length >= cantidad;
    const enviarCorreos =
      completo && (claimedThisRequest || nAntes < cantidad);

    const { data: rifa } = await supabaseAdmin
      .from("rifas")
      .select("id, nombre, precio_boleto, numeros_bendecidos")
      .eq("id", rifaId)
      .single();

    if (rifa && enviarCorreos) {
      try {
        await enviarTicketCompra(participanteActual, rifa, numeros);
      } catch (emailErr) {
        console.error(
          "[Webhook MP] Error enviando ticket:",
          emailErr?.message || "Error desconocido"
        );
      }
      try {
        await enviarConfirmacionAdmin(participanteActual, rifa);
      } catch (emailErr) {
        console.error(
          "[Webhook] Error notificación admin:",
          emailErr?.message || "Error desconocido"
        );
      }

      const bendecidosSet = new Set(
        getNumerosString(parseNumerosBendecidos(rifa.numeros_bendecidos))
      );
      const numerosBendecidosAsignados = numeros.filter((n) =>
        bendecidosSet.has(String(n ?? "").trim())
      );
      if (numerosBendecidosAsignados.length > 0) {
        try {
          await enviarNotificacionBendecido(
            participanteActual,
            rifa,
            numerosBendecidosAsignados
          );
        } catch (bendErr) {
          console.error(
            "[Webhook MP] Error notificación bendecido:",
            bendErr?.message || "Error desconocido"
          );
        }
      }
    }

    return { received: true, numeros };
  }

  if (status === "rejected" || status === "cancelled") {
    await supabaseAdmin
      .from("participantes")
      .update({ estado_pago: "rechazado" })
      .eq("id", participante.id)
      .eq("estado_pago", "pendiente");
    return { received: true };
  }

  return { received: true };
}

async function manejarRequest(request) {
  const politica = politicaVerificacionWebhookMp();
  if (politica.action === "block") {
    console.error("[Webhook MP]", politica.blockReason);
    return NextResponse.json(
      { error: "Configuración de webhook incompleta" },
      { status: 503 }
    );
  }
  if (politica.warn) {
    console.warn("[Webhook MP]", politica.warn);
  }

  const rawBody = await request.text();
  let body = {};
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (politica.action === "verify") {
    const v = verificarFirmaWebhookMercadoPago({
      requestUrl: request.url,
      headers: request.headers,
      dataIdFromBody: body?.data?.id,
      secret: process.env.MP_WEBHOOK_SECRET?.trim() ?? "",
    });
    if (!v.ok) {
      console.warn("[Webhook MP] Firma inválida:", v.reason);
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const { type, data } = body;
  const paymentId = data?.id;

  if (type === "payment" && paymentId) {
    await procesarPago(String(paymentId));
  }

  return NextResponse.json({ received: true });
}

export async function POST(request) {
  try {
    return await manejarRequest(request);
  } catch (err) {
    console.error("[Webhook MP] Error:", err?.message || "Error desconocido");
    return NextResponse.json(
      { error: err.message || "Error procesando webhook" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  if (process.env.MP_WEBHOOK_ALLOW_GET !== "1") {
    return NextResponse.json({ error: "Método no permitido" }, { status: 405 });
  }

  try {
    const politica = politicaVerificacionWebhookMp();
    if (politica.action === "block") {
      return NextResponse.json(
        { error: "Configuración de webhook incompleta" },
        { status: 503 }
      );
    }
    if (politica.warn) {
      console.warn("[Webhook MP GET]", politica.warn);
    }

    if (politica.action === "verify") {
      const v = verificarFirmaWebhookMercadoPago({
        requestUrl: request.url,
        headers: request.headers,
        secret: process.env.MP_WEBHOOK_SECRET?.trim() ?? "",
      });
      if (!v.ok) {
        console.warn("[Webhook MP GET] Firma inválida:", v.reason);
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic");
    const id = searchParams.get("id");

    if (topic === "payment" && id) {
      await procesarPago(id);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Webhook MP] Error GET:", err?.message || "Error desconocido");
    return NextResponse.json(
      { error: err.message || "Error procesando webhook" },
      { status: 500 }
    );
  }
}
