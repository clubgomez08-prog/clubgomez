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

/**
 * Flujo compartido: claim aprobado + mp_payment_id, asignar boletos, correos (tickets, admin, bendecidos).
 * Usado por webhook Mercado Pago y por aprobación manual en admin.
 *
 * @param {object} opts
 * @param {string} opts.participanteId - UUID participante
 * @param {string} opts.referenciaPago - ID pago MP o MANUAL-*
 * @param {string} [opts.metodo_pago] - etiqueta de auditoría (ej. mercadopago, manual, whatsapp)
 * @returns {Promise<{ success: true, numeros: string[] } | { success: false, skipped: true, reason: string }>}
 */
export async function ejecutarAprobacionBoletosYCorreos({
  participanteId,
  referenciaPago,
  metodo_pago = "desconocido",
}) {
  const ref = String(referenciaPago ?? "").trim();
  if (!participanteId || !ref) {
    throw new Error("participanteId y referenciaPago son obligatorios");
  }

  const tag = `[aprobar-participante:${metodo_pago}]`;

  const { data: participante, error: partError } = await supabaseAdmin
    .from("participantes")
    .select(
      "id, rifa_id, cantidad_boletos, nombre, email, estado_pago, total_pagado, mp_payment_id"
    )
    .eq("id", participanteId)
    .single();

  if (partError || !participante) {
    throw new Error("Participante no encontrado");
  }

  if (
    participante.estado_pago === "aprobado" &&
    participante.mp_payment_id &&
    String(participante.mp_payment_id) !== ref
  ) {
    console.warn(tag, "Participante ya aprobado con otra referencia");
    return { success: false, skipped: true, reason: "ya_aprobado_otro_pago" };
  }

  const rifaId = participante.rifa_id;
  const cantidad = participante.cantidad_boletos ?? 1;

  const { count: countAntes } = await supabaseAdmin
    .from("boletos")
    .select("*", { count: "exact", head: true })
    .eq("participante_id", participante.id);

  const nAntes = countAntes ?? 0;

  let claimedThisRequest = false;
  let participanteActual = participante;

  if (participante.estado_pago === "pendiente") {
    const { data: claimedRows, error: claimError } = await supabaseAdmin
      .from("participantes")
      .update({
        estado_pago: "aprobado",
        mp_payment_id: ref,
      })
      .eq("id", participante.id)
      .eq("estado_pago", "pendiente")
      .select("id");

    if (claimError) {
      throw new Error(claimError.message);
    }

    claimedThisRequest = Array.isArray(claimedRows) && claimedRows.length > 0;

    if (!claimedThisRequest) {
      const { data: p2, error: e2 } = await supabaseAdmin
        .from("participantes")
        .select(
          "id, rifa_id, cantidad_boletos, nombre, email, estado_pago, total_pagado, mp_payment_id"
        )
        .eq("id", participante.id)
        .single();

      if (e2 || !p2) {
        throw new Error("Participante no encontrado tras claim");
      }

      if (
        p2.estado_pago === "aprobado" &&
        String(p2.mp_payment_id) === ref
      ) {
        participanteActual = p2;
      } else if (p2.estado_pago === "aprobado") {
        return { success: false, skipped: true, reason: "race_otro_pago" };
      } else {
        return { success: false, skipped: true, reason: "no_claim_pendiente" };
      }
    }
  } else if (
    participante.estado_pago === "aprobado" &&
    String(participante.mp_payment_id) === ref
  ) {
    participanteActual = participante;
    claimedThisRequest = false;
  } else if (participante.estado_pago === "aprobado") {
    return { success: false, skipped: true, reason: "ya_aprobado_otro_pago" };
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
        .eq("mp_payment_id", ref);
      if (revErr) {
        console.error(tag, "Revert participante falló:", revErr.message);
      }
    }
    console.error(tag, "Error asignando boletos:", assignErr?.message);
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
        tag,
        "Error enviando ticket:",
        emailErr?.message || "Error desconocido"
      );
    }
    try {
      await enviarConfirmacionAdmin(participanteActual, rifa);
    } catch (emailErr) {
      console.error(
        tag,
        "Error notificación admin:",
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
          tag,
          "Error notificación bendecido:",
          bendErr?.message || "Error desconocido"
        );
      }
    }
  }

  return { success: true, numeros };
}
