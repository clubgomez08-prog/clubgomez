/**
 * URL pública de la app (webhooks, back_urls).
 * Sin env en demo/build: usa VERCEL_URL o localhost (no tumba el deploy).
 */
export function publicAppBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || "";
  if (raw) return raw;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}
