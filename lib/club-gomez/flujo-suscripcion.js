import { leerSesionLocal } from "@/lib/club-gomez/cuentas-miembro";

/** ¿Hay sesión de miembro en el navegador? */
export function haySesionMiembro() {
  return Boolean(leerSesionLocal());
}

/** Solo paths internos relativos (evita open redirect). */
export function sanitizarNext(next) {
  const raw = String(next || "").trim();
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export function rutaRegistroConNext(nextPath) {
  const next = sanitizarNext(nextPath) || "/#membresias";
  return `/miembro/registro?next=${encodeURIComponent(next)}`;
}

export function rutaLoginConNext(nextPath) {
  const next = sanitizarNext(nextPath) || "/#membresias";
  return `/miembro/login?next=${encodeURIComponent(next)}`;
}

/**
 * Flujo Suscribirme:
 * - sin sesión → registro (con next al destino)
 * - con sesión + plan → formulario
 * - con sesión sin plan → true (el caller hace scroll a #membresias)
 */
export function irASuscribir({ planId } = {}) {
  const destino = planId
    ? `/formulario?plan=${encodeURIComponent(planId)}`
    : "/#membresias";

  if (typeof window === "undefined") return false;

  if (!haySesionMiembro()) {
    window.location.href = rutaRegistroConNext(destino);
    return false;
  }

  if (planId) {
    window.location.href = destino;
    return true;
  }

  return true;
}

/** Tras login/registro, ir a `next` o al portal. */
export function irDespuesDeAuth(next, fallback = "/miembro") {
  if (typeof window === "undefined") return;
  const dest = sanitizarNext(next) || fallback;
  window.location.href = dest;
}
