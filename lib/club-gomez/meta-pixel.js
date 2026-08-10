/** Meta / Facebook Pixel helpers (Club Gómez) */

export const META_PIXEL_ID = "825977093882247";

export function trackMeta(event, params) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  if (params && Object.keys(params).length > 0) {
    window.fbq("track", event, params);
  } else {
    window.fbq("track", event);
  }
}

/** Ver contenido — página principal */
export function trackViewContent(extra = {}) {
  trackMeta("ViewContent", {
    content_name: "Club Gómez — Inicio",
    content_category: "landing",
    ...extra,
  });
}

/** Completar registro de cuenta */
export function trackCompleteRegistration(extra = {}) {
  trackMeta("CompleteRegistration", {
    status: true,
    content_name: "Registro miembro",
    ...extra,
  });
}

/** Iniciar checkout / solicitud de plan */
export function trackInitiateCheckout(plan) {
  trackMeta("InitiateCheckout", {
    content_ids: [plan?.id || "esencial"],
    content_name: plan?.nombre ? `Plan ${plan.nombre}` : "Membresía",
    content_type: "product",
    value: Number(plan?.precio) || 0,
    currency: "COP",
    num_items: 1,
  });
}

/** Agregar información de pago / datos para WhatsApp */
export function trackAddPaymentInfo(plan) {
  trackMeta("AddPaymentInfo", {
    content_ids: [plan?.id || "esencial"],
    content_name: plan?.nombre ? `Plan ${plan.nombre}` : "Membresía",
    value: Number(plan?.precio) || 0,
    currency: "COP",
  });
}

/**
 * Compra — por ahora al completar solicitud WhatsApp.
 * Cuando exista Wompi, mover este evento a la confirmación de pago.
 */
export function trackPurchase(plan, { orderId } = {}) {
  trackMeta("Purchase", {
    content_ids: [plan?.id || "esencial"],
    content_name: plan?.nombre ? `Plan ${plan.nombre}` : "Membresía",
    content_type: "product",
    value: Number(plan?.precio) || 0,
    currency: "COP",
    num_items: 1,
    ...(orderId ? { order_id: String(orderId) } : {}),
  });
}
