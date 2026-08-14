/** Meta / Facebook Pixel helpers (Club Gómez) */

export const META_PIXEL_ID = "825977093882247";

export function trackMeta(event, params) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  const name = String(event || "").trim();
  // Evita __missing_event en Events Manager (eventos sin nombre / inválidos)
  if (!name || name.startsWith("__") || name === "undefined" || name === "null") {
    return;
  }
  if (params && Object.keys(params).length > 0) {
    window.fbq("track", name, params);
  } else {
    window.fbq("track", name);
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

/**
 * Iniciar checkout — clic en “Suscribirme ya” / “Pagar con Bold”.
 * Es el evento de intención de compra (botón comprar / checkout).
 */
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
 * Compra — al confirmar pago Bold en /pago/resultado.
 * Usa eventID = orderId para deduplicar recargas.
 */
export function trackPurchase(plan, { orderId } = {}) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;

  const oid = orderId ? String(orderId).trim() : "";
  if (oid) {
    const key = `cg_meta_purchase_${oid}`;
    try {
      if (sessionStorage.getItem(key) === "1") return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode */
    }
  }

  const value = Number(plan?.precio);
  const payload = {
    content_ids: [plan?.id || "esencial"],
    content_name: plan?.nombre ? `Plan ${plan.nombre}` : "Membresía Club Gómez",
    content_type: "product",
    value: Number.isFinite(value) && value > 0 ? value : 0,
    currency: "COP",
    num_items: 1,
    ...(oid ? { order_id: oid } : {}),
  };

  if (oid) {
    window.fbq("track", "Purchase", payload, { eventID: oid });
  } else {
    trackMeta("Purchase", payload);
  }
}
