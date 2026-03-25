import { MercadoPagoConfig, Preference } from "mercadopago";
import { publicAppBaseUrl } from "@/lib/public-app-url";

const accessToken = process.env.MP_ACCESS_TOKEN;

const client = accessToken ? new MercadoPagoConfig({ accessToken }) : null;

/**
 * Crea una preferencia de pago en MercadoPago para un participante
 * @param {Object} participante - Participante creado en Supabase
 * @param {Object} rifa - Rifa con nombre y precio
 * @returns {Promise<{ init_point: string, preference_id: string }>}
 */
export async function crearPreferencia(participante, rifa) {
  if (!client) {
    throw new Error("MP_ACCESS_TOKEN no configurado");
  }

  const appUrl = publicAppBaseUrl();
  const preference = new Preference(client);
  const precioUnit = rifa.precio_boleto ?? 0;
  const cantidad = participante.cantidad_boletos ?? 1;

  const response = await preference.create({
    body: {
      items: [
        {
          title: rifa.nombre || "Rifa",
          quantity: cantidad,
          unit_price: Number(precioUnit),
          currency_id: "COP",
        },
      ],
      back_urls: {
        success: `${appUrl}/confirmacion?participante=${participante.id}`,
        failure: `${appUrl}/comprar`,
        pending: `${appUrl}/confirmacion?participante=${participante.id}`,
      },
      notification_url: `${appUrl}/api/webhooks/mercadopago?source_news=webhooks`,
      external_reference: participante.id,
    },
  });

  return {
    init_point: response.init_point || response.sandbox_init_point,
    preference_id: response.id,
  };
}
