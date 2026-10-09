import { consultarVoucherBold } from "@/lib/club-gomez/bold";
import { activarMembresiaManual } from "@/lib/club-gomez/activar-membresia";
import { planDeSolicitud } from "@/lib/club-gomez/planes-db";

export function parseNotasSolicitud(notas) {
  try {
    return notas ? JSON.parse(notas) : {};
  } catch {
    return {};
  }
}

/**
 * Pregunta a Bold por la orden de la solicitud y, solo si Bold dice APPROVED,
 * activa la membresía (números + pago + correo). Nunca activa sin confirmación de Bold.
 * @returns {Promise<{ estado: "activada"|"ya_activa"|"sin_cobro"|"pendiente"|"sin_orden", paymentStatus?: string, resultado?: object, notas: object }>}
 */
export async function activarSolicitudSiBoldCobro(supabaseAdmin, solicitud) {
  const notas = parseNotasSolicitud(solicitud.notas);
  const orderId = String(notas.bold_order_id || "").trim();
  if (!orderId) return { estado: "sin_orden", notas };
  if (solicitud.estado === "convertida") return { estado: "ya_activa", notas };

  const voucher = await consultarVoucherBold(orderId);
  const paymentStatus = String(voucher?.payment_status || "").toUpperCase();

  if (paymentStatus === "PROCESSING" || paymentStatus === "PENDING") {
    return { estado: "pendiente", paymentStatus, notas };
  }
  if (paymentStatus !== "APPROVED") {
    return { estado: "sin_cobro", paymentStatus, notas };
  }

  const resultado = await activarMembresiaManual(supabaseAdmin, {
    planId: solicitud.plan_id,
    plan: planDeSolicitud(solicitud.plan_id, notas),
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

  return {
    estado: resultado.alreadyActive ? "ya_activa" : "activada",
    paymentStatus,
    resultado,
    voucher,
    notas,
  };
}
