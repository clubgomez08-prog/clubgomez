import { Resend } from "resend";

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

/**
 * Envía email al comprador con su ticket digital
 * @param {Object} participante - Participante con nombre, email, total_pagado, cantidad_boletos
 * @param {Object} rifa - Rifa con nombre
 * @param {string[]} boletos - Números asignados (ej: ["0001-00", "0002-00"])
 */
export async function enviarTicketCompra(participante, rifa, boletos) {
  const resend = getResend();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const ticketUrl = `${appUrl}/confirmacion?participante=${participante.id}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(ticketUrl)}`;

  const numerosLista = (boletos || []).map((n) => `<span style="display:inline-block;padding:4px 8px;margin:2px;background:#1f2937;border-radius:4px;font-family:monospace;">${n}</span>`).join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#0a0a0a;color:#e5e5e5;">
  <div style="max-width:500px;margin:0 auto;padding:24px;">
    <div style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:20px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="margin:0;color:#0a0a0a;font-size:22px;font-weight:700;">${rifa?.nombre || "Rifa"}</h1>
      <p style="margin:8px 0 0;color:rgba(0,0,0,0.8);font-size:14px;">Ticket digital</p>
    </div>
    <div style="background:#171717;padding:24px;border:1px solid #262626;border-top:none;border-radius:0 0 12px 12px;">
      <p style="font-size:16px;margin:0 0 20px;">Hola <strong>${participante?.nombre || "Participante"}</strong>,</p>
      <p style="font-size:14px;color:#a3a3a3;margin:0 0 20px;">Gracias por tu compra. Aquí está el resumen de tu participación:</p>
      <div style="background:#262626;padding:16px;border-radius:8px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:14px;"><strong>Cantidad de boletos:</strong> ${participante?.cantidad_boletos ?? 0}</p>
        <p style="margin:0;font-size:14px;"><strong>Total pagado:</strong> <span style="color:#f59e0b;">${formatPrecio(participante?.total_pagado)}</span></p>
      </div>
      <p style="font-size:14px;margin:0 0 8px;"><strong>Tus números asignados:</strong></p>
      <div style="margin-bottom:20px;">${numerosLista || "<p style='color:#a3a3a3;'>Pendiente de asignación</p>"}</div>
      <div style="text-align:center;margin:24px 0;">
        <img src="${qrImageUrl}" alt="QR Ticket" width="150" height="150" style="border:4px solid #f59e0b;border-radius:8px;" />
      </div>
      <p style="font-size:13px;color:#a3a3a3;text-align:center;margin:20px 0 0;">Guarda este email, es tu comprobante oficial.</p>
    </div>
    <p style="font-size:12px;color:#525252;text-align:center;margin-top:16px;">Sistema de Rifas Digitales</p>
  </div>
</body>
</html>
  `.trim();

  const to =
    process.env.NODE_ENV === "development" && process.env.RESEND_TEST_EMAIL
      ? process.env.RESEND_TEST_EMAIL
      : participante.email;
  const { data, error } = await resend.emails.send({
    from: "Rifas <onboarding@resend.dev>",
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

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;padding:20px;">
  <h2 style="color:#0a0a0a;">💰 Nueva venta registrada</h2>
  <p><strong>${participante?.nombre || "N/A"}</strong> compró <strong>${participante?.cantidad_boletos ?? 0}</strong> boletos en la rifa <strong>${rifa?.nombre || "N/A"}</strong>.</p>
  <ul style="list-style:none;padding:0;">
    <li><strong>Email:</strong> ${participante?.email || "N/A"}</li>
    <li><strong>Teléfono:</strong> ${participante?.telefono || "N/A"}</li>
    <li><strong>Total pagado:</strong> ${formatPrecio(participante?.total_pagado)}</li>
  </ul>
</body>
</html>
  `.trim();

  const { data, error } = await resend.emails.send({
    from: "Rifas <onboarding@resend.dev>",
    to: [to],
    subject: `💰 Nueva venta: ${participante?.nombre || "Cliente"} compró ${participante?.cantidad_boletos ?? 0} boletos`,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
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

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#0a0a0a;color:#e5e5e5;">
  <div style="max-width:520px;margin:0 auto;padding:24px;">
    <div style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 50%,#b45309 100%);padding:32px;border-radius:16px 16px 0 0;text-align:center;">
      <h1 style="margin:0;color:#0a0a0a;font-size:28px;font-weight:800;letter-spacing:1px;">¡ERES EL GANADOR!</h1>
      <p style="margin:12px 0 0;color:rgba(0,0,0,0.9);font-size:18px;font-weight:600;">${rifa?.nombre || "Rifa"}</p>
    </div>
    <div style="background:#171717;padding:32px;border:1px solid #262626;border-top:none;border-radius:0 0 16px 16px;">
      <p style="font-size:20px;margin:0 0 24px;">¡Felicidades <strong>${participante?.nombre || "Ganador"}</strong>! 🎉</p>
      <p style="font-size:16px;color:#a3a3a3;margin:0 0 20px;">Tu número ganador es:</p>
      <div style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:20px;border-radius:12px;text-align:center;margin-bottom:24px;">
        <span style="font-size:32px;font-weight:800;color:#0a0a0a;font-family:monospace;letter-spacing:4px;">${numeroBoleto || "—"}</span>
      </div>
      <div style="background:#262626;padding:20px;border-radius:8px;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-size:15px;"><strong>Para reclamar tu premio:</strong></p>
        <p style="margin:0;font-size:14px;color:#a3a3a3;line-height:1.6;">Contacta al organizador de la rifa con este email y tu número ganador. Conserva este correo como comprobante oficial de tu victoria.</p>
      </div>
      <p style="font-size:14px;color:#737373;margin:0;">Datos registrados: ${participante?.email || "—"} · ${participante?.telefono || "—"}</p>
    </div>
    <p style="font-size:12px;color:#525252;text-align:center;margin-top:16px;">Sistema de Rifas Digitales</p>
  </div>
</body>
</html>
  `.trim();

  const { data, error } = await resend.emails.send({
    from: "Rifas <onboarding@resend.dev>",
    to: [to],
    subject: `🏆 ¡GANASTE la rifa ${rifa?.nombre || "Rifa"}!`,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
