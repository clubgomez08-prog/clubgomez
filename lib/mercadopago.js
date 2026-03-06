import { MercadoPagoConfig, Preference } from "mercadopago";

const accessToken = process.env.MP_ACCESS_TOKEN;

const client = accessToken
  ? new MercadoPagoConfig({ accessToken })
  : null;

/**
 * Crea una preferencia de pago en MercadoPago
 * @param {Object} items - Array de items a pagar
 * @param {string} backUrl - URL de retorno tras el pago
 * @param {string} externalReference - ID de referencia (ej: participante_id)
 */
export async function crearPreferenciaPago({ items, backUrl, externalReference }) {
  if (!client) {
    throw new Error("MP_ACCESS_TOKEN no configurado");
  }

  const preference = new Preference(client);

  const response = await preference.create({
    body: {
      items,
      back_urls: {
        success: `${backUrl}/confirmacion`,
        failure: `${backUrl}/comprar`,
        pending: `${backUrl}/confirmacion`,
      },
      auto_return: "approved",
      external_reference: externalReference || "",
    },
  });

  return response;
}
