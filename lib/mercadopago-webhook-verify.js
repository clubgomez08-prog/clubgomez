import crypto from "crypto";

/**
 * Valida el header x-signature de Mercado Pago (Webhooks > Tus integraciones).
 * @see https://www.mercadopago.com.co/developers/es/docs/your-integrations/notifications/webhooks
 *
 * @param {object} opts
 * @param {string} opts.requestUrl - URL completa de la petición (incluye query)
 * @param {Headers|Record<string,string>} opts.headers
 * @param {string} [opts.dataIdFromBody] - data.id del JSON si no viene en query
 * @param {string} opts.secret - MP_WEBHOOK_SECRET del panel
 * @param {number} [opts.maxSkewMs=300000] - ventana anti-replay (5 min)
 * @returns {{ ok: boolean, reason?: string }}
 */
export function verificarFirmaWebhookMercadoPago(opts) {
  const { requestUrl, headers, dataIdFromBody, secret, maxSkewMs = 300_000 } = opts;

  const get = (name) => {
    if (headers && typeof headers.get === "function") {
      return headers.get(name) || headers.get(name.toLowerCase());
    }
    const h = headers || {};
    return h[name] || h[name.toLowerCase()] || "";
  };

  const xSignature = get("x-signature");
  const xRequestId = get("x-request-id");

  if (!xSignature || !secret) {
    return { ok: false, reason: "firma_o_secreto_faltante" };
  }

  let ts;
  let v1;
  for (const part of xSignature.split(",")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === "ts") ts = value;
    else if (key === "v1") v1 = value;
  }

  if (!v1) {
    return { ok: false, reason: "v1_faltante" };
  }

  if (ts) {
    const tsNum = Number(ts);
    const tsMs = tsNum < 1e12 ? tsNum * 1000 : tsNum;
    if (Number.isFinite(tsMs)) {
      const skew = Math.abs(Date.now() - tsMs);
      if (skew > maxSkewMs) {
        return { ok: false, reason: "ts_fuera_de_ventana" };
      }
    }
  }

  const url = new URL(requestUrl);
  let dataId = url.searchParams.get("data.id") || "";
  if (!dataId && dataIdFromBody != null && dataIdFromBody !== "") {
    dataId = String(dataIdFromBody);
  }
  if (/^[a-f0-9]+$/i.test(dataId)) {
    dataId = dataId.toLowerCase();
  }

  const segments = [];
  if (dataId) segments.push(`id:${dataId};`);
  if (xRequestId) segments.push(`request-id:${xRequestId};`);
  if (ts) segments.push(`ts:${ts};`);
  const manifest = segments.join("");

  if (!manifest) {
    return { ok: false, reason: "manifest_vacio" };
  }

  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(v1, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { ok: false, reason: "hmac_no_coincide" };
    }
  } catch {
    return { ok: false, reason: "hmac_invalido" };
  }

  return { ok: true };
}

/**
 * @returns {{ action: 'verify' | 'skip' | 'block', blockReason?: string, warn?: string }}
 */
export function politicaVerificacionWebhookMp() {
  const isProd = process.env.NODE_ENV === "production";
  const skip = process.env.MP_WEBHOOK_SKIP_SIGNATURE === "1";
  const hasSecret = Boolean(process.env.MP_WEBHOOK_SECRET?.trim());

  if (isProd) {
    if (skip) {
      return {
        action: "skip",
        warn: "MP_WEBHOOK_SKIP_SIGNATURE=1 en producción (solo emergencias)",
      };
    }
    if (!hasSecret) {
      return { action: "block", blockReason: "MP_WEBHOOK_SECRET no configurada" };
    }
    return { action: "verify" };
  }

  if (hasSecret && !skip) {
    return { action: "verify" };
  }
  return {
    action: "skip",
    warn: "Firma webhook omitida (dev: sin MP_WEBHOOK_SECRET o con MP_WEBHOOK_SKIP_SIGNATURE=1)",
  };
}
