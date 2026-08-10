import { Resend } from "resend";
import { publicAppBaseUrl } from "@/lib/public-app-url";
import {
  construirUrlWhatsappClaves,
  LOTERIA_INTERNA,
} from "@/lib/club-gomez/claves-whatsapp";

export function resendFromAddress() {
  const f =
    process.env.RESEND_EMAIL_FROM?.trim() || process.env.EMAIL_FROM?.trim();
  if (f) return f;
  // Demo/build sin env: no tumbar el deploy
  return "Club Gómez <onboarding@resend.dev>";
}

const CLUB_LOGO_URL =
  "https://club-gomez.vercel.app/club-gomez/logo-header.png";
const C_BG = "#050607";
const C_NAVY = "#0a1206";
const C_GOLD = "#B8E351";
const C_GREEN = "#B8E351";
const C_TEXT = "#F8FAFC";
const WA_NUMBER = "3137453511";
const WA_LINK = "https://wa.me/573137453511";
const SUPPORT_EMAIL = "soporte@clubgomez.com";
const IG_HANDLE = "@clubgomez";
const IG_LINK = "https://www.instagram.com/";
const COPYRIGHT = "© 2026 Club Gómez — Todos los derechos reservados";

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY no configurado");
  }
  return new Resend(apiKey);
}

function getResend() {
  return getResendClient();
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
 * Envía email al miembro con sus claves (Motilón Noche solo aquí, no en landing)
 * @param {Object} participante - Participante con nombre, email, total_pagado, cantidad_boletos
 * @param {Object} rifa - Plan/rifa con nombre
 * @param {string[]} boletos - Claves / números asignados
 * @param {{ useParticipantEmail?: boolean }} [options]
 */
export async function enviarTicketCompra(participante, rifa, boletos, options = {}) {
  const resend = getResend();
  const appUrl = publicAppBaseUrl();
  const ticketUrl = `${appUrl}/confirmacion?participante=${participante.id}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(ticketUrl)}`;
  const claves = boletos || [];
  const waClavesUrl = construirUrlWhatsappClaves(
    {
      nombre: participante?.nombre,
      planNombre: rifa?.nombre,
      claves,
    },
    { incluirMotilon: true }
  );

  const numerosRows = (() => {
    const list = claves;
    if (list.length === 0) {
      return `<tr><td align="center" style="padding:20px 12px;font-family:Arial,sans-serif;font-size:14px;color:#071521;opacity:0.75;">Pendiente de asignación</td></tr>`;
    }
    const gridRows = [];
    for (let i = 0; i < list.length; i += 4) {
      const chunk = list.slice(i, i + 4);
      const cells = chunk.map(
        (n) =>
          `<td width="25%" style="width:25%;padding:4px;text-align:center;vertical-align:top;"><div style="background-color:#ffffff;color:${C_GOLD};border:1px solid rgba(184,227,81,0.55);border-radius:6px;font-family:Consolas,'Courier New',monospace;font-size:13px;padding:6px 4px;display:block;width:100%;text-align:center;box-sizing:border-box;">${n}</div></td>`
      );
      while (cells.length < 4) {
        cells.push(
          `<td width="25%" style="width:25%;padding:4px;text-align:center;">&nbsp;</td>`
        );
      }
      gridRows.push(`<tr>${cells.join("")}</tr>`);
    }
    return `<tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="4" border="0">${gridRows.join("")}</table></td></tr>`;
  })();

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
<tr>
<td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">
<tr>
<td style="background-color:#ffffff;border:2px solid ${C_GOLD};border-radius:16px 16px 0 0;padding:28px 20px;" align="center">
<img src="${CLUB_LOGO_URL}" alt="Club Gómez" width="200" height="64" style="display:block;margin:0 auto 16px auto;border:0;outline:none;text-decoration:none;" />
<p style="margin:0;font-family:Arial,'Segoe UI',sans-serif;font-size:20px;font-weight:700;color:${C_GOLD};text-align:center;">Tu membresía Club Gómez</p>
</td>
</tr>
<tr>
<td style="padding:28px 24px 8px 24px;font-family:Arial,'Segoe UI',sans-serif;font-size:16px;line-height:1.55;color:#071521;">
<p style="margin:0 0 16px 0;">Hola <strong>${participante?.nombre || "Miembro"}</strong>,</p>
<p style="margin:0 0 24px 0;color:#071521;opacity:0.92;">Tu membresía quedó activa. Aquí tienes tus claves con oportunidades y el detalle para los beneficios del mes.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border:2px solid ${C_GOLD};border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:20px 18px;font-family:Arial,'Segoe UI',sans-serif;font-size:15px;color:#071521;line-height:1.6;">
<p style="margin:0 0 10px 0;"><span style="color:${C_GOLD};font-weight:700;">Plan / membresía:</span> ${rifa?.nombre || "—"}</p>
<p style="margin:0 0 10px 0;"><span style="color:${C_GOLD};font-weight:700;">Claves:</span> ${participante?.cantidad_boletos ?? claves.length ?? 0}</p>
<p style="margin:0 0 10px 0;"><span style="color:${C_GOLD};font-weight:700;">Lotería:</span> ${LOTERIA_INTERNA}</p>
<p style="margin:0;"><span style="color:${C_GOLD};font-weight:700;">Total:</span> ${formatPrecio(participante?.total_pagado)}</p>
</td></tr>
</table>
<p style="margin:0 0 14px 0;font-family:Arial,'Segoe UI',sans-serif;font-size:15px;font-weight:700;color:${C_GOLD};">Tus claves asignadas:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${numerosRows}</table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto 12px auto;">
<tr><td align="center" style="padding:4px;">
<img src="${qrImageUrl}" alt="Código QR de tu membresía" width="150" height="150" style="display:block;border:3px solid ${C_GOLD};border-radius:12px;margin:0 auto;" />
</td></tr>
</table>
<p style="margin:0 0 20px 0;font-family:Arial,'Segoe UI',sans-serif;font-size:14px;color:#071521;opacity:0.88;text-align:center;line-height:1.5;">Guarda este correo: es tu comprobante y el detalle de tus claves.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 12px auto;">
<tr>
<td align="center" bgcolor="${C_GREEN}" style="border-radius:10px;">
<a href="${waClavesUrl}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Arial,'Segoe UI',sans-serif;font-size:15px;font-weight:700;color:${C_BG};text-decoration:none;">Enviar mis claves por WhatsApp</a>
</td>
</tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 8px auto;">
<tr>
<td align="center" style="border-radius:10px;border:2px solid ${C_GOLD};">
<a href="${appUrl}/confirmacion?participante=${participante?.id || ""}" target="_blank" style="display:inline-block;padding:12px 28px;font-family:Arial,'Segoe UI',sans-serif;font-size:14px;font-weight:700;color:${C_GOLD};text-decoration:none;">Ver confirmación web</a>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="background-color:#ffffff;border:2px solid ${C_GOLD};border-top:none;border-radius:0 0 16px 16px;padding:24px 16px;" align="center">
<img src="${CLUB_LOGO_URL}" alt="Club Gómez" width="120" height="39" style="display:block;margin:0 auto 14px auto;border:0;" />
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
<tr><td align="center" style="font-family:Arial,'Segoe UI',sans-serif;font-size:13px;color:#071521;line-height:1.75;">
<a href="${WA_LINK}" style="color:${C_GREEN};text-decoration:none;">WhatsApp: ${WA_NUMBER}</a><br />
<a href="mailto:${SUPPORT_EMAIL}" style="color:${C_GREEN};text-decoration:none;">Email: ${SUPPORT_EMAIL}</a><br />
<a href="${IG_LINK}" style="color:${C_GREEN};text-decoration:none;">Instagram: ${IG_HANDLE}</a>
</td></tr>
</table>
<p style="margin:16px 0 0 0;font-family:Arial,'Segoe UI',sans-serif;font-size:11px;color:#071521;opacity:0.65;text-align:center;">${COPYRIGHT}</p>
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
    subject: `Tus claves Club Gómez — ${rifa?.nombre || "Membresía"} (${LOTERIA_INTERNA})`,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Correo de bienvenida al crear cuenta (sin exigir membresía).
 * @param {{ nombre?: string, email: string }} miembro
 */
export async function enviarBienvenidaRegistro(miembro) {
  if (!miembro?.email) {
    throw new Error("Email del miembro requerido");
  }

  const resend = getResend();
  const appUrl = publicAppBaseUrl();
  const loginUrl = `${appUrl}/miembro/login`;
  const planesUrl = `${appUrl}/#membresias`;
  const firstName = String(miembro.nombre || "Miembro").split(" ")[0];

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
<tr>
<td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">
<tr>
<td style="background-color:#ffffff;border:2px solid ${C_GOLD};border-radius:16px 16px 0 0;padding:28px 20px;" align="center">
<img src="${CLUB_LOGO_URL}" alt="Club Gómez" width="200" height="64" style="display:block;margin:0 auto 16px auto;border:0;outline:none;text-decoration:none;" />
<p style="margin:0;font-family:Arial,'Segoe UI',sans-serif;font-size:20px;font-weight:700;color:${C_GOLD};text-align:center;">¡Bienvenido al Club Gómez!</p>
</td>
</tr>
<tr>
<td style="padding:28px 24px 8px 24px;font-family:Arial,'Segoe UI',sans-serif;font-size:16px;line-height:1.55;color:#071521;">
<p style="margin:0 0 16px 0;">Hola <strong>${firstName}</strong>,</p>
<p style="margin:0 0 16px 0;color:#071521;opacity:0.92;">Tu cuenta ya está creada. Puedes entrar cuando quieras; la membresía la activas después, cuando elijas tu plan.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border:2px solid ${C_GOLD};border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:20px 18px;font-family:Arial,'Segoe UI',sans-serif;font-size:15px;color:#071521;line-height:1.6;">
<p style="margin:0 0 10px 0;"><span style="color:${C_GOLD};font-weight:700;">Email de acceso:</span> ${miembro.email}</p>
<p style="margin:0;"><span style="color:${C_GOLD};font-weight:700;">Estado:</span> Cuenta lista · Sin plan aún</p>
</td></tr>
</table>
<p style="margin:0 0 20px 0;color:#071521;opacity:0.92;">Cuando actives un plan (Élite, Selecto o Esencial) recibirás tus claves por este mismo correo.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 12px auto;">
<tr>
<td align="center" bgcolor="${C_GREEN}" style="border-radius:10px;">
<a href="${loginUrl}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Arial,'Segoe UI',sans-serif;font-size:15px;font-weight:700;color:${C_BG};text-decoration:none;">Entrar a mi cuenta</a>
</td>
</tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 8px auto;">
<tr>
<td align="center" style="border-radius:10px;border:2px solid ${C_GOLD};">
<a href="${planesUrl}" target="_blank" style="display:inline-block;padding:12px 28px;font-family:Arial,'Segoe UI',sans-serif;font-size:14px;font-weight:700;color:${C_GOLD};text-decoration:none;">Ver planes y suscribirme</a>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="background-color:#ffffff;border:2px solid ${C_GOLD};border-top:none;border-radius:0 0 16px 16px;padding:24px 16px;" align="center">
<img src="${CLUB_LOGO_URL}" alt="Club Gómez" width="120" height="39" style="display:block;margin:0 auto 14px auto;border:0;" />
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
<tr><td align="center" style="font-family:Arial,'Segoe UI',sans-serif;font-size:13px;color:#071521;line-height:1.75;">
<a href="${WA_LINK}" style="color:${C_GREEN};text-decoration:none;">WhatsApp: ${WA_NUMBER}</a><br />
<a href="mailto:${SUPPORT_EMAIL}" style="color:${C_GREEN};text-decoration:none;">Email: ${SUPPORT_EMAIL}</a><br />
<a href="${IG_LINK}" style="color:${C_GREEN};text-decoration:none;">Instagram: ${IG_HANDLE}</a>
</td></tr>
</table>
<p style="margin:16px 0 0 0;font-family:Arial,'Segoe UI',sans-serif;font-size:11px;color:#071521;opacity:0.65;text-align:center;">${COPYRIGHT}</p>
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
    process.env.NODE_ENV === "development" && process.env.RESEND_TEST_EMAIL
      ? process.env.RESEND_TEST_EMAIL
      : miembro.email;

  const { data, error } = await resend.emails.send({
    from: resendFromAddress(),
    to: [to],
    subject: "Bienvenido a Club Gómez — tu cuenta está lista",
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/** Notificaciones a admin (Daniel) apagadas por defecto: queman el cupo gratis de Resend. */
export function resendNotifyAdminEnabled() {
  const v = process.env.RESEND_NOTIFY_ADMIN?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/**
 * Notificación al admin de nueva venta
 * @param {Object} participante - Participante con nombre, email, telefono, cantidad_boletos, total_pagado
 * @param {Object} rifa - Rifa con nombre
 */
export async function enviarConfirmacionAdmin(participante, rifa) {
  if (!resendNotifyAdminEnabled()) {
    return null;
  }

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
<img src="${CLUB_LOGO_URL}" alt="Club Gómez" width="180" height="58" style="display:block;margin:0 auto 12px auto;border:0;" />
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
 * Notifica al admin que se asignó al menos un número bendecido en la compra.
 * @param {Object} participante
 * @param {Object} rifa
 * @param {string[]} numerosBendecidosList - Números que coinciden con la lista bendecida de la rifa
 */
export async function enviarNotificacionBendecido(
  participante,
  rifa,
  numerosBendecidosList
) {
  if (!resendNotifyAdminEnabled()) {
    return null;
  }

  const to = process.env.ADMIN_EMAIL?.trim();
  if (!to) {
    return null;
  }

  const resend = getResend();
  const nums = (numerosBendecidosList || [])
    .map((n) => String(n ?? "").trim())
    .filter(Boolean);
  const numsHtml = nums
    .map(
      (n) =>
        `<span style="display:inline-block;margin:6px 6px 0 0;padding:10px 16px;font-family:Consolas,'Courier New',monospace;font-size:18px;font-weight:800;color:${C_BG};background-color:${C_GOLD};border:2px solid #FFF8E1;border-radius:10px;">${n}</span>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:${C_BG};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C_BG};">
<tr>
<td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:${C_BG};">
<tr>
<td style="background-color:${C_NAVY};border:2px solid ${C_GOLD};border-radius:16px 16px 0 0;padding:24px 20px;" align="center">
<img src="${CLUB_LOGO_URL}" alt="Club Gómez" width="180" height="58" style="display:block;margin:0 auto 12px auto;border:0;" />
<p style="margin:0;font-family:Arial,'Segoe UI',sans-serif;font-size:20px;font-weight:700;color:${C_GOLD};text-align:center;">🌟 ¡Número bendecido asignado!</p>
</td>
</tr>
<tr>
<td style="padding:24px 20px;font-family:Arial,'Segoe UI',sans-serif;font-size:15px;color:${C_TEXT};line-height:1.6;">
<p style="margin:0 0 16px 0;">Un participante recibió en su compra al menos un número incluido en la lista de <strong style="color:${C_GOLD};">números bendecidos</strong> de la rifa.</p>
<p style="margin:0 0 10px 0;"><strong style="color:${C_GOLD};">Rifa:</strong> ${rifa?.nombre || "—"}</p>
<p style="margin:0 0 10px 0;"><strong style="color:${C_GOLD};">Nombre:</strong> ${participante?.nombre || "—"}</p>
<p style="margin:0 0 10px 0;"><strong style="color:${C_GOLD};">Email:</strong> ${participante?.email || "—"}</p>
<p style="margin:0 0 18px 0;"><strong style="color:${C_GOLD};">Teléfono:</strong> ${participante?.telefono || "—"}</p>
<p style="margin:0 0 8px 0;font-weight:700;color:${C_GOLD};">Número(s) bendecido(s) asignado(s):</p>
<div style="margin-top:4px;">${numsHtml}</div>
</td>
</tr>
<tr>
<td style="padding:8px 20px 24px 20px;" align="center">
<p style="margin:0;font-family:Arial,'Segoe UI',sans-serif;font-size:11px;color:${C_TEXT};opacity:0.65;">${COPYRIGHT}</p>
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
    subject: "🌟 ¡Número bendecido asignado!",
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
<img src="${CLUB_LOGO_URL}" alt="Club Gómez" width="200" height="64" style="display:block;margin:0 auto 18px auto;border:0;" />
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
<p style="margin:0 0 12px 0;font-weight:700;color:${C_GOLD};">Contacto Club Gómez</p>
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
<p style="margin:0 0 24px 0;font-family:Arial,'Segoe UI',sans-serif;font-size:11px;color:${C_TEXT};opacity:0.72;line-height:1.55;">La entrega se efectuará previa verificación de identidad. Club Gómez podrá comprobar la autenticidad del beneficio.</p>
</td>
</tr>
<tr>
<td style="background-color:${C_NAVY};border:2px solid ${C_GOLD};border-top:none;border-radius:0 0 16px 16px;padding:24px 16px;" align="center">
<img src="${CLUB_LOGO_URL}" alt="Club Gómez" width="120" height="39" style="display:block;margin:0 auto 12px auto;border:0;" />
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
    subject: `Club Gómez — Resultado: ${rifa?.nombre || "Beneficio"}`,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
