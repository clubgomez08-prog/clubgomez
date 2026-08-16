/** Meta / Facebook Pixel helpers (Club Gómez) */

export const META_PIXEL_ID = "825977093882247";

const USER_STORAGE_KEY = "cg_meta_user_v1";

/** Normaliza texto: minúsculas, sin diacríticos ni espacios (ciudad). */
function stripCity(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Solo letras minúsculas (nombre). */
function stripNamePart(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

/** Teléfono CO: dígitos con 57. */
export function normalizePhoneCo(phone) {
  let d = String(phone || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("57") && d.length >= 12) return d.slice(0, 12);
  if (d.length === 10) return `57${d}`;
  if (d.length === 11 && d.startsWith("3")) return `57${d}`;
  return d;
}

/** Fecha → YYYYMMDD */
export function normalizeDob(isoOrDate) {
  const raw = String(isoOrDate || "").trim();
  if (/^\d{8}$/.test(raw)) return raw;
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}${m[2]}${m[3]}`;
  return "";
}

/**
 * Arma objeto Advanced Matching (plain text; el pixel hashea solo).
 * Solo incluye campos con valor — no manda vacíos.
 */
export function buildAdvancedMatching(user = {}) {
  const email = String(user.email || user.em || "")
    .trim()
    .toLowerCase();
  const ph = normalizePhoneCo(user.telefono || user.phone || user.ph);
  const nombre = String(user.nombre || user.name || "").trim();
  const parts = nombre.split(/\s+/).filter(Boolean);
  const fn = stripNamePart(user.fn || parts[0] || "");
  const ln = stripNamePart(
    user.ln || (parts.length > 1 ? parts.slice(1).join(" ") : "")
  );
  const db = normalizeDob(user.fecha_nacimiento || user.fechaNacimiento || user.db);
  const ct = stripCity(user.ciudad || user.city || user.ct);
  const external_id = String(
    user.external_id || user.miembroId || user.id || email || ph || ""
  ).trim();

  const out = {};
  if (email && email.includes("@")) out.em = email;
  if (ph) out.ph = ph;
  if (fn) out.fn = fn;
  if (ln) out.ln = ln;
  if (db) out.db = db;
  if (ct) out.ct = ct;
  out.country = "co";
  if (external_id) out.external_id = external_id;
  return out;
}

export function persistMetaUser(user) {
  if (typeof window === "undefined") return;
  try {
    const built = buildAdvancedMatching(user);
    if (!built.em && !built.ph) return;
    sessionStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify({
        email: built.em || "",
        telefono: built.ph || "",
        nombre: user.nombre || "",
        ciudad: user.ciudad || "",
        fecha_nacimiento: user.fecha_nacimiento || user.fechaNacimiento || "",
        external_id: built.external_id || "",
      })
    );
  } catch {
    /* private mode */
  }
}

export function readPersistedMetaUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Lee cookies _fbp / _fbc para CAPI / notas de pago */
export function readMetaCookies() {
  if (typeof document === "undefined") return { fbp: "", fbc: "" };
  const jar = String(document.cookie || "");
  const get = (name) => {
    const m = jar.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : "";
  };
  return { fbp: get("_fbp"), fbc: get("_fbc") };
}

/**
 * Re-init del pixel con Advanced Matching.
 * Seguro llamar varias veces; no toca PageView ni desconecta el pixel.
 * Doc Meta: https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching
 */
export function applyAdvancedMatching(user) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  const data = buildAdvancedMatching(user || {});
  if (!data.em && !data.ph && !data.external_id) return;
  try {
    window.fbq("init", META_PIXEL_ID, data);
    persistMetaUser(user || data);
  } catch (err) {
    console.warn("[meta-pixel] advanced matching:", err?.message || err);
  }
}

export function trackMeta(event, params) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  const name = String(event || "").trim();
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
  if (extra?.email || extra?.telefono || extra?.nombre) {
    applyAdvancedMatching(extra);
  }
  trackMeta("CompleteRegistration", {
    status: true,
    content_name: extra?.content_name || "Registro miembro",
  });
}

/**
 * Iniciar checkout — clic en “Suscribirme ya” / “Pagar con Bold”.
 * user opcional: si hay datos, aplica Advanced Matching antes (no cambia el evento).
 */
export function trackInitiateCheckout(plan, user) {
  if (user) applyAdvancedMatching(user);
  trackMeta("InitiateCheckout", {
    content_ids: [plan?.id || "esencial"],
    content_name: plan?.nombre ? `Plan ${plan.nombre}` : "Membresía",
    content_type: "product",
    value: Number(plan?.precio) || 0,
    currency: "COP",
    num_items: 1,
  });
}

/** Agregar información de pago */
export function trackAddPaymentInfo(plan, user) {
  if (user) applyAdvancedMatching(user);
  trackMeta("AddPaymentInfo", {
    content_ids: [plan?.id || "esencial"],
    content_name: plan?.nombre ? `Plan ${plan.nombre}` : "Membresía",
    value: Number(plan?.precio) || 0,
    currency: "COP",
  });
}

/**
 * Compra — al confirmar pago Bold en /pago/resultado.
 * Usa eventID = orderId para deduplicar recargas / CAPI.
 */
export function trackPurchase(plan, { orderId, user } = {}) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;

  const matched = user || readPersistedMetaUser();
  if (matched) applyAdvancedMatching(matched);

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
