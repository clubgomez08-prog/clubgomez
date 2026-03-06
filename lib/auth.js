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
