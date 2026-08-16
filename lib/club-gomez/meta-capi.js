/**
 * Meta Conversions API (servidor) — opcional.
 * Si no hay META_CAPI_ACCESS_TOKEN, no hace nada (no rompe pagos).
 * Dedup con pixel: mismo event_id = bold orderId.
 */
import { createHash } from "crypto";

const DEFAULT_PIXEL_ID = "825977093882247";

function sha256(value) {
  const v = String(value || "").trim();
  if (!v) return null;
  return createHash("sha256").update(v).digest("hex");
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizePhoneCo(phone) {
  let d = String(phone || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("57") && d.length >= 12) return d.slice(0, 12);
  if (d.length === 10) return `57${d}`;
  return d;
}

function normalizeDob(iso) {
  const m = String(iso || "")
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}${m[2]}${m[3]}`;
  if (/^\d{8}$/.test(String(iso || "").trim())) return String(iso).trim();
  return "";
}

function stripCity(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function stripName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function buildUserData({
  email,
  telefono,
  nombre,
  ciudad,
  fechaNacimiento,
  fbp,
  fbc,
  clientIp,
  userAgent,
  externalId,
}) {
  const emailNorm = normalizeEmail(email);
  const ph = normalizePhoneCo(telefono);
  const parts = String(nombre || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const fn = stripName(parts[0] || "");
  const ln = stripName(parts.length > 1 ? parts.slice(1).join(" ") : "");
  const db = normalizeDob(fechaNacimiento);
  const ct = stripCity(ciudad);
  const ext = String(externalId || emailNorm || ph || "").trim();

  const user_data = {
    country: [sha256("co")],
  };
  if (emailNorm) user_data.em = [sha256(emailNorm)];
  if (ph) user_data.ph = [sha256(ph)];
  if (fn) user_data.fn = [sha256(fn)];
  if (ln) user_data.ln = [sha256(ln)];
  if (db) user_data.db = [sha256(db)];
  if (ct) user_data.ct = [sha256(ct)];
  if (ext) user_data.external_id = [sha256(ext)];
  if (fbp) user_data.fbp = String(fbp);
  if (fbc) user_data.fbc = String(fbc);
  if (clientIp) user_data.client_ip_address = String(clientIp).split(",")[0].trim();
  if (userAgent) user_data.client_user_agent = String(userAgent).slice(0, 512);

  return user_data;
}

/**
 * Envía Purchase por CAPI. Nunca lanza: errores solo se loguean.
 */
export async function sendPurchaseCapi({
  orderId,
  value,
  currency = "COP",
  planId,
  planNombre,
  email,
  telefono,
  nombre,
  ciudad,
  fechaNacimiento,
  fbp,
  fbc,
  clientIp,
  userAgent,
  externalId,
  eventSourceUrl,
}) {
  const token = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  const pixelId = process.env.META_PIXEL_ID?.trim() || DEFAULT_PIXEL_ID;

  if (!token) {
    return { ok: true, skipped: true, reason: "no_token" };
  }
  if (!orderId) {
    return { ok: false, skipped: true, reason: "no_order_id" };
  }

  const event = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: String(orderId),
    action_source: "website",
    event_source_url:
      eventSourceUrl ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://clubgomez.co",
    user_data: buildUserData({
      email,
      telefono,
      nombre,
      ciudad,
      fechaNacimiento,
      fbp,
      fbc,
      clientIp,
      userAgent,
      externalId,
    }),
    custom_data: {
      currency,
      value: Number(value) || 0,
      content_ids: [planId || "esencial"],
      content_name: planNombre
        ? `Plan ${planNombre}`
        : "Membresía Club Gómez",
      content_type: "product",
      num_items: 1,
      order_id: String(orderId),
    },
  };

  try {
    const url = `https://graph.facebook.com/v21.0/${pixelId}/events`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [event],
        access_token: token,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[meta-capi] Purchase fail:", res.status, json);
      return { ok: false, error: json };
    }
    return { ok: true, response: json };
  } catch (err) {
    console.error("[meta-capi] Purchase error:", err?.message || err);
    return { ok: false, error: String(err?.message || err) };
  }
}
