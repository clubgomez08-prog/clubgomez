import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía email con el ticket digital
 * @param {string} to - Email del destinatario
 * @param {string} nombre - Nombre del participante
 * @param {Array} numeros - Números de boleto asignados
 * @param {string} qrUrl - URL o data del QR
 */
export async function enviarTicketEmail({ to, nombre, numeros, qrUrl }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY no configurado");
  }

  const { data, error } = await resend.emails.send({
    from: "Rifas <onboarding@resend.dev>",
    to: [to],
    subject: `Tu ticket - Rifas`,
    html: `
      <h1>¡Gracias por tu compra, ${nombre}!</h1>
      <p>Tus números asignados: ${numeros.join(", ")}</p>
      ${qrUrl ? `<p>Escanea el QR para verificar tu ticket</p>` : ""}
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
