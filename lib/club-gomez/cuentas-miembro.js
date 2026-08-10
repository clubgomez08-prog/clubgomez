/** Cliente de cuentas de miembro → APIs Supabase */

import { SESSION_KEY, crearDemoMiembro, DEMO_MIEMBRO_CREDS } from "@/lib/club-gomez/demo-miembro";

export const AUTH_TOKEN_KEY = "cg-miembro-access-token";

function guardarSesion(perfil, session) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(perfil));
  if (session?.access_token) {
    sessionStorage.setItem(AUTH_TOKEN_KEY, session.access_token);
  } else {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function leerSesionLocal() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function leerAccessToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function cerrarSesionLocal() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function registrarCuenta(payload) {
  try {
    const res = await fetch("/api/miembro/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || "No se pudo registrar." };
    }
    if (data.perfil) guardarSesion(data.perfil, data.session);
    return {
      ok: true,
      perfil: data.perfil,
      session: data.session,
      aviso: data.aviso,
    };
  } catch {
    return { ok: false, error: "Error de conexión. Intenta de nuevo." };
  }
}

export async function iniciarSesionCuenta(email, password) {
  const emailNorm = String(email || "")
    .trim()
    .toLowerCase();
  const pass = String(password || "");

  if (!emailNorm || !pass) {
    return { ok: false, error: "Completa email y contraseña." };
  }

  // Demo offline rápida (también la API la acepta)
  if (
    emailNorm === DEMO_MIEMBRO_CREDS.email &&
    pass === DEMO_MIEMBRO_CREDS.password
  ) {
    const perfil = crearDemoMiembro(emailNorm);
    guardarSesion(perfil, null);
    return { ok: true, perfil, demo: true };
  }

  try {
    const res = await fetch("/api/miembro/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailNorm, password: pass }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || "No se pudo iniciar sesión." };
    }
    guardarSesion(data.perfil, data.session);
    return { ok: true, perfil: data.perfil, session: data.session };
  } catch {
    return { ok: false, error: "Error de conexión. Intenta de nuevo." };
  }
}

/** Refresca el perfil desde Supabase si hay token. */
export async function refrescarPerfilSesion() {
  const token = leerAccessToken();
  if (!token) return { ok: false, error: "Sin token" };

  try {
    const res = await fetch("/api/miembro/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || "Sesión expirada" };
    }
    guardarSesion(data.perfil, { access_token: token });
    return { ok: true, perfil: data.perfil };
  } catch {
    return { ok: false, error: "Error de conexión" };
  }
}
