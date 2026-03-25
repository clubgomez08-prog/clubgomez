import { supabaseBrowser } from "./supabase-browser";

/**
 * Obtiene la sesión actual del usuario
 */
export async function getSession() {
  const { data: { session } } = await supabaseBrowser.auth.getSession();
  return session;
}

/**
 * Cierra la sesión del usuario
 */
export async function signOut() {
  await supabaseBrowser.auth.signOut();
}

/**
 * Headers para fetch autenticado hacia rutas API protegidas (Bearer Supabase).
 */
export async function getAdminAuthHeaders() {
  const {
    data: { session },
  } = await supabaseBrowser.auth.getSession();
  const token = session?.access_token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
