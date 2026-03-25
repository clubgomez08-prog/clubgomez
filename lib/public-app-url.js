/**
 * URL pública de la app (webhooks, back_urls). En producción debe venir de env; sin fallback de dominio fijo.
 */
export function publicAppBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || "";
  if (!raw && process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL es obligatoria en producción");
  }
  return raw || "http://localhost:3000";
}
