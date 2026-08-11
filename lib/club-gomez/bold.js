import { createHash, createHmac, timingSafeEqual } from "crypto";
import { publicAppBaseUrl } from "@/lib/public-app-url";

export function boldIdentityKey() {
  return (
    process.env.NEXT_PUBLIC_BOLD_IDENTITY_KEY?.trim() ||
    process.env.BOLD_IDENTITY_KEY?.trim() ||
    ""
  );
}

export function boldSecretKey() {
  return process.env.BOLD_SECRET_KEY?.trim() || "";
}

export function boldConfigured() {
  return Boolean(boldIdentityKey() && boldSecretKey());
}

export function generarIntegritySignature({ orderId, amount, currency = "COP" }) {
  const secret = boldSecretKey();
  if (!secret) throw new Error("BOLD_SECRET_KEY no configurada");
  const cadena = `${orderId}${amount}${currency}${secret}`;
  return createHash("sha256").update(cadena, "utf8").digest("hex");
}

export function crearOrderId(planId) {
  const ts = Date.now();
  const plan = String(planId || "plan").replace(/[^a-z0-9]/gi, "").slice(0, 12);
  // Solo alfanumérico, guiones y guiones bajos (docs Bold)
  return `cg_${plan}_${ts}`.slice(0, 60);
}

/**
 * Bold exige https en redirection-url (rechaza http://localhost → BTN-001).
 * En local omitimos la URL o usamos la de producción HTTPS.
 */
export function boldRedirectionUrl(baseUrl) {
  const candidates = [
    String(baseUrl || "").trim().replace(/\/$/, ""),
    publicAppBaseUrl(),
    "https://clubgomez.vercel.app",
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    const normalized = raw.replace("://127.0.0.1", "://localhost");
    if (normalized.startsWith("https://")) {
      return `${normalized}/pago/resultado`;
    }
  }

  // null = no enviar redirectionUrl (Bold usa dominio padre)
  return null;
}

export async function consultarVoucherBold(orderId) {
  const apiKey = boldIdentityKey();
  if (!apiKey) throw new Error("BOLD_IDENTITY_KEY no configurada");

  const url = `https://payments.api.bold.co/v2/payment-voucher/${encodeURIComponent(orderId)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `x-api-key ${apiKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error || `Bold HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/** En pruebas Bold firma con secret vacío. En prod usa BOLD_SECRET_KEY si BOLD_WEBHOOK_USE_PROD_SECRET=1 */
export function verificarFirmaWebhookBold(rawBody, signatureHeader) {
  const signature = String(signatureHeader || "");
  const useProd = process.env.BOLD_WEBHOOK_USE_PROD_SECRET === "1";
  const keyForHmac = useProd ? boldSecretKey() : "";
  const encoded = Buffer.from(String(rawBody), "utf8").toString("base64");
  const hashed = createHmac("sha256", keyForHmac).update(encoded).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(hashed, "utf8"), Buffer.from(signature, "utf8"));
  } catch {
    return hashed === signature;
  }
}
