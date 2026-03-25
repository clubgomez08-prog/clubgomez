import { Resend } from "resend";
import { publicAppBaseUrl } from "@/lib/public-app-url";

export function resendFromAddress() {
  const f =
    process.env.RESEND_EMAIL_FROM?.trim() || process.env.EMAIL_FROM?.trim();
  if (f) return f;
  if (process.env.NODE_ENV === "production") {
    throw new Error("RESEND_EMAIL_FROM o EMAIL_FROM requerido en producción");
  }
  return "RIFEX <info@rifex.app>";
}

const RIFEX_LOGO_URL =
  "https://res.cloudinary.com/dmmnaypmc/image/upload/v1774429833/logo-rifex_odtuey.png";
const C_BG = "#071521";
const C_NAVY = "#0B1F33";
const C_GOLD = "#F2B233";
const C_GREEN = "#22C55E";
const C_TEXT = "#F8FAFC";
const WA_NUMBER = "3114405488";
const WA_LINK = "https://wa.me/573114405488";
const SUPPORT_EMAIL = "clubrifex@gmail.com";
const IG_HANDLE = "@clubrifex";
const IG_LINK = "https://www.instagram.com/clubrifex/";
const COPYRIGHT = "© 2026 RIFEX — Todos los derechos reservados";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY no configurado");
  }
  return new Resend(apiKey);
}

function formatPrecio(n) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function formatFechaParticipante(createdAt) {
  if (!createdAt) return "—";
  try {
    return new Date(createdAt).toLocaleString("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

/**
 * Envía email al comprador con su ticket digital
 * @param {Object} participante - Participante con nombre, email, total_pagado, cantidad_boletos
 * @param {Object} rifa - Rifa con nombre
 * @param {string[]} boletos - Números asignados (ej: ["0001-00", "0002-00"])
 * @param {{ useParticipantEmail?: boolean }} [options]
 */
export async function enviarTicketCompra(participante, rifa, boletos, options = {}) {
  const resend = getResend();
  const appUrl = publicAppBaseUrl();
  const ticketUrl = `${appUrl}/confirmacion?participante=${participante.id}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(ticketUrl)}`;

  const numerosRows =
    (boletos || []).length > 0
      ? (boletos || [])
          .map(
            (n) =>
              `<tr><td align="center" style="padding:10px 8px;"><table cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="padding:16px 24px;font-family:Consolas,'Courier New',monospace;font-size:22px;font-weight:700;color:${C_GOLD};background-color:${C_NAVY};border:2px solid ${C_GOLD};border-radius:12px;text-align:center;">${n}</td></tr></table></td></tr>`
          )
          .join("")
      : `<tr><td align="center" style="padding:20px 12px;font-family:Arial,sans-serif;font-size:14px;color:${C_TEXT};opacity:0.75;">Pendiente de asignación</td></tr>`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:${C_BG};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C_BG};">
<tr>
<td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:${C_BG};">
<tr>
<td style="background-color:${C_NAVY};border:2px solid ${C_GOLD};border-radius:16px 16px 0 0;padding:28px 20px;" align="center">
<img src="${RIFEX_LOGO_URL}" alt="RIFEX" width="200" height="64" style="display:block;margin:0 auto 16px auto;border:0;outline:none;text-decoration:none;" />
<p style="margin:0;font-family:Arial,'Segoe UI',sans-serif;font-size:20px;font-weight:700;color:${C_GOLD};text-align:center;">Tu ticket de participación</p>
</td>
</tr>
<tr>
<td style="padding:28px 24px 8px 24px;font-family:Arial,'Segoe UI',sans-serif;font-size:16px;line-height:1.55;color:${C_TEXT};">
<p style="margin:0 0 16px 0;">Hola <strong>${participante?.nombre || "Participante"}</strong>,</p>
<p style="margin:0 0 24px 0;color:${C_TEXT};opacity:0.92;">Tu pago fue confirmado exitosamente. Aquí están los detalles de tu participación:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C_NAVY};border:2px solid ${C_GOLD};border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:20px 18px;font-family:Arial,'Segoe UI',sans-serif;font-size:15px;color:${C_TEXT};line-height:1.6;">
<p style="margin:0 0 10px 0;"><span style="color:${C_GOLD};font-weight:700;">Rifa:</span> ${rifa?.nombre || "—"}</p>
<p style="margin:0 0 10px 0;"><span style="color:${C_GOLD};font-weight:700;">Cantidad de boletos:</span> ${participante?.cantidad_boletos ?? 0}</p>
<p style="margin:0;"><span style="color:${C_GOLD};font-weight:700;">Total pagado:</span> ${formatPrecio(participante?.total_pagado)}</p>
</td></tr>
</table>
<p style="margin:0 0 14px 0;font-family:Arial,'Segoe UI',sans-serif;font-size:15px;font-weight:700;color:${C_GOLD};">Tus números asignados:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${numerosRows}</table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto 20px auto;">
<tr><td align="center" style="padding:4px;">
<img src="${qrImageUrl}" alt="Código QR de tu ticket" width="150" height="150" style="display:block;border:3px solid ${C_GOLD};border-radius:12px;margin:0 auto;" />
</td></tr>
</table>
<p style="margin:0 0 24px 0;font-family:Arial,'Segoe UI',sans-serif;font-size:14px;color:${C_TEXT};opacity:0.88;text-align:center;line-height:1.5;">Guarda este correo, es tu comprobante oficial de participación.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 8px auto;">
<tr>
<td align="center" bgcolor="${C_GREEN}" style="border-radius:10px;">
<a href="${appUrl}/mis-tickets" target="_blank" style="display:inline-block;padding:14px 32px;font-family:Arial,'Segoe UI',sans-serif;font-size:15px;font-weight:700;color:${C_BG};text-decoration:none;">Ver mis tickets</a>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="background-color:${C_NAVY};border:2px solid ${C_GOLD};border-top:none;border-radius:0 0 16px 16px;padding:24px 16px;" align="center">
<img src="${RIFEX_LOGO_URL}" alt="RIFEX" width="120" height="39" style="display:block;margin:0 auto 14px auto;border:0;" />
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
<tr><td align="center" style="font-family:Arial,'Segoe UI',sans-serif;font-size:13px;color:${C_TEXT};line-height:1.75;">
<a href="${WA_LINK}" style="color:${C_GREEN};text-decoration:none;">WhatsApp: ${WA_NUMBER}</a><br />
<a href="mailto:${SUPPORT_EMAIL}" style="color:${C_GREEN};text-decoration:none;">Email: ${SUPPORT_EMAIL}</a><br />
<a href="${IG_LINK}" style="color:${C_GREEN};text-decoration:none;">Instagram: ${IG_HANDLE}</a>
</td></tr>
</table>
<p style="margin:16px 0 0 0;font-family:Arial,'Segoe UI',sans-serif;font-size:11px;color:${C_TEXT};opacity:0.65;text-align:center;">${COPYRIGHT}</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>
  `.trim();

  const to =
    options.useParticipantEmail === true
      ? participante.email
      : process.env.NODE_ENV === "development" && process.env.RESEND_TEST_EMAIL
        ? process.env.RESEND_TEST_EMAIL
        : participante.email;
  const { data, error } = await resend.emails.send({
    from: resendFromAddress(),
    to: [to],
    subject: `🎟️ Tu ticket para ${rifa?.nombre || "Rifa"} - ${participante?.cantidad_boletos ?? 0} boletos`,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Notificación al admin de nueva venta
 * @param {Object} participante - Participante con nombre, email, telefono, cantidad_boletos, total_pagado
 * @param {Object} rifa - Rifa con nombre
 */
export async function enviarConfirmacionAdmin(participante, rifa) {
  const to =
    process.env.NODE_ENV === "development" && process.env.RESEND_TEST_EMAIL
      ? process.env.RESEND_TEST_EMAIL
      : process.env.ADMIN_EMAIL;
  if (!to) {
    return null;
  }

  const resend = getResend();
  const estadoLabel = participante?.estado_pago || "aprobado";

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:${C_BG};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C_BG};">
<tr>
<td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:${C_BG};">
<tr>
<td style="background-color:${C_NAVY};border:2px solid ${C_GOLD};border-radius:16px 16px 0 0;padding:24px 20px;" align="center">
<img src="${RIFEX_LOGO_URL}" alt="RIFEX" width="180" height="58" style="display:block;margin:0 auto 12px auto;border:0;" />
<p style="margin:0;font-family:Arial,'Segoe UI',sans-serif;font-size:18px;font-weight:700;color:${C_GOLD};text-align:center;">Nueva venta registrada</p>
</td>
</tr>
<tr>
<td style="padding:24px 20px 8px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C_NAVY};border:2px solid ${C_GOLD};border-radius:12px;">
<tr><td style="padding:20px 18px;font-family:Arial,'Segoe UI',sans-serif;font-size:14px;color:${C_TEXT};line-height:1.65;">
<p style="margin:0 0 14px 0;"><strong style="color:${C_GOLD};">Nombre:</strong> ${participante?.nombre || "—"}</p>
<p style="margin:0 0 14px 0;"><strong style="color:${C_GOLD};">Email:</strong> ${participante?.email || "—"}</p>
<p style="margin:0 0 14px 0;"><strong style="color:${C_GOLD};">Teléfono:</strong> ${participante?.telefono || "—"}</p>
<p style="margin:0 0 14px 0;"><strong style="color:${C_GOLD};">Ciudad:</strong> ${participante?.ciudad || "—"}</p>
<p style="margin:0 0 14px 0;"><strong style="color:${C_GOLD};">Cédula:</strong> ${participante?.cedula || "—"}</p>
<p style="margin:0 0 14px 0;"><strong style="color:${C_GOLD};">Rifa:</strong> ${rifa?.nombre || "—"}</p>
<p style="margin:0 0 14px 0;"><strong style="color:${C_GOLD};">Cantidad boletos:</strong> ${participante?.cantidad_boletos ?? 0}</p>
<p style="margin:0 0 14px 0;"><strong style="color:${C_GOLD};">Total pagado:</strong> ${formatPrecio(participante?.total_pagado)}</p>
<p style="margin:0 0 14px 0;"><strong style="color:${C_GOLD};">Fecha:</strong> ${formatFechaParticipante(participante?.created_at)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
<tr><td bgcolor="${C_GREEN}" style="border-radius:8px;padding:8px 16px;font-family:Arial,'Segoe UI',sans-serif;font-size:13px;font-weight:700;color:${C_BG};text-align:center;">Estado de pago: ${estadoLabel}</td></tr>
</table>
</td></tr>
</table>
</td>
</tr>
<tr>
<td style="padding:8px 20px 28px 20px;" align="center">
<p style="margin:0;font-family:Arial,'Segoe UI',sans-serif;font-size:11px;color:${C_TEXT};opacity:0.65;text-align:center;">${COPYRIGHT}</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>
  `.trim();

  const { data, error } = await resend.emails.send({
    from: resendFromAddress(),
    to: [to],
    subject: `💰 Nueva venta`,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Genera el HTML del email al ganador (para reutilizar en envío real y pruebas)
 * @param {Object} participante - Participante con nombre, email, telefono
 * @param {Object} rifa - Rifa con nombre
 * @param {string} numeroBoleto - Número ganador (ej: "0473-00")
 */
export function generarHtmlEmailGanador(participante, rifa, numeroBoleto) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:${C_BG};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C_BG};">
<tr>
<td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:${C_BG};">
<tr>
<td style="background:linear-gradient(135deg,#FFD666 0%,${C_GOLD} 45%,#C9A227 100%);border:2px solid ${C_GOLD};border-radius:16px 16px 0 0;padding:28px 20px 24px 20px;" align="center">
<img src="${RIFEX_LOGO_URL}" alt="RIFEX" width="200" height="64" style="display:block;margin:0 auto 18px auto;border:0;" />
<p style="margin:0;font-family:Arial,'Segoe UI',sans-serif;font-size:26px;font-weight:800;color:${C_BG};text-align:center;letter-spacing:0.5px;">Resultado del sorteo</p>
</td>
</tr>
<tr>
<td style="padding:28px 24px 8px 24px;font-family:Arial,'Segoe UI',sans-serif;font-size:16px;line-height:1.55;color:${C_TEXT};">
<p style="margin:0 0 20px 0;font-size:18px;">Estimado/a <strong>${participante?.nombre || "participante"}</strong>, le informamos que su boleto resultó favorecido en el sorteo de la rifa siguiente:</p>
<p style="margin:0 0 8px 0;font-size:15px;color:${C_GOLD};font-weight:700;text-align:center;">${rifa?.nombre || "Rifa"}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 28px 0;background-color:${C_NAVY};border:3px solid ${C_GOLD};border-radius:14px;box-shadow:0 0 0 1px rgba(242,178,51,0.35);">
<tr><td align="center" style="padding:28px 16px;">
<p style="margin:0 0 12px 0;font-family:Arial,'Segoe UI',sans-serif;font-size:14px;color:${C_TEXT};opacity:0.9;">Número de boleto correspondiente al resultado</p>
<p style="margin:0;font-family:Consolas,'Courier New',monospace;font-size:36px;font-weight:800;color:${C_GOLD};letter-spacing:3px;text-align:center;line-height:1.2;">${numeroBoleto || "—"}</p>
</td></tr>
</table>
<p style="margin:0 0 14px 0;font-size:16px;font-weight:700;color:${C_GOLD};">Pasos para completar el proceso</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:22px;">
<tr><td style="padding:8px 0;font-family:Arial,'Segoe UI',sans-serif;font-size:14px;color:${C_TEXT};line-height:1.6;">1. Responda este correo o contáctenos por WhatsApp</td></tr>
<tr><td style="padding:8px 0;font-family:Arial,'Segoe UI',sans-serif;font-size:14px;color:${C_TEXT};line-height:1.6;">2. Tenga a la mano su documento de identidad</td></tr>
<tr><td style="padding:8px 0;font-family:Arial,'Segoe UI',sans-serif;font-size:14px;color:${C_TEXT};line-height:1.6;">3. Coordinamos con usted los siguientes pasos para la entrega</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C_NAVY};border:2px solid ${C_GOLD};border-radius:12px;margin-bottom:20px;">
<tr><td style="padding:20px 18px;font-family:Arial,'Segoe UI',sans-serif;font-size:14px;color:${C_TEXT};line-height:1.8;">
<p style="margin:0 0 12px 0;font-weight:700;color:${C_GOLD};">Contacto RIFEX</p>
<p style="margin:0 0 8px 0;"><a href="${WA_LINK}" style="color:${C_GREEN};text-decoration:none;font-weight:600;">WhatsApp: ${WA_NUMBER}</a></p>
<p style="margin:0 0 8px 0;"><a href="mailto:${SUPPORT_EMAIL}" style="color:${C_GREEN};text-decoration:none;font-weight:600;">Email: ${SUPPORT_EMAIL}</a></p>
<p style="margin:0;"><a href="${IG_LINK}" style="color:${C_GREEN};text-decoration:none;font-weight:600;">Instagram: ${IG_HANDLE}</a></p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
<tr>
<td bgcolor="${C_GREEN}" style="border-radius:8px;">
<a href="${WA_LINK}" target="_blank" style="display:inline-block;padding:12px 22px;font-family:Arial,'Segoe UI',sans-serif;font-size:14px;font-weight:700;color:${C_BG};text-decoration:none;">Escribir por WhatsApp</a>
</td>
</tr>
</table>
</td></tr>
</table>
<p style="margin:0 0 24px 0;font-family:Arial,'Segoe UI',sans-serif;font-size:11px;color:${C_TEXT};opacity:0.72;line-height:1.55;">La entrega se efectuará previa verificación de identidad. RIFEX podrá comprobar la autenticidad del boleto.</p>
</td>
</tr>
<tr>
<td style="background-color:${C_NAVY};border:2px solid ${C_GOLD};border-top:none;border-radius:0 0 16px 16px;padding:24px 16px;" align="center">
<img src="${RIFEX_LOGO_URL}" alt="RIFEX" width="120" height="39" style="display:block;margin:0 auto 12px auto;border:0;" />
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
<tr><td align="center" style="font-family:Arial,'Segoe UI',sans-serif;font-size:12px;color:${C_TEXT};line-height:1.7;">
<a href="${WA_LINK}" style="color:${C_GREEN};text-decoration:none;">${WA_NUMBER}</a> · <a href="mailto:${SUPPORT_EMAIL}" style="color:${C_GREEN};text-decoration:none;">${SUPPORT_EMAIL}</a> · <a href="${IG_LINK}" style="color:${C_GREEN};text-decoration:none;">${IG_HANDLE}</a>
</td></tr>
</table>
<p style="margin:14px 0 0 0;font-family:Arial,'Segoe UI',sans-serif;font-size:11px;color:${C_TEXT};opacity:0.65;text-align:center;">${COPYRIGHT}</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>
  `.trim();
}

/**
 * Email al ganador del sorteo
 * @param {Object} participante - Participante con nombre, email, telefono
 * @param {Object} rifa - Rifa con nombre
 * @param {string} numeroBoleto - Número ganador (ej: "0473-00")
 */
export async function enviarEmailGanador(participante, rifa, numeroBoleto) {
  const resend = getResend();
  const to =
    process.env.NODE_ENV === "development" && process.env.RESEND_TEST_EMAIL
      ? process.env.RESEND_TEST_EMAIL
      : participante.email;
  const html = generarHtmlEmailGanador(participante, rifa, numeroBoleto);

  const { data, error } = await resend.emails.send({
    from: resendFromAddress(),
    to: [to],
    subject: `RIFEX — Resultado del sorteo: ${rifa?.nombre || "Rifa"}`,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
