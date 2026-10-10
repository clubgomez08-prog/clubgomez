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
 * getSession() solo lee lo guardado en el navegador y puede devolver un permiso vencido.
 * getUser() lo renueva con Supabase antes de usarlo.
 */
export async function getAdminAuthHeaders() {
  try {
    const { data: userData } = await supabaseBrowser.auth.getUser();
    let session = null;
    if (userData?.user) {
      session = (await supabaseBrowser.auth.getSession()).data.session;
    } else {
      session = (await supabaseBrowser.auth.refreshSession()).data.session;
    }
    const token = session?.access_token;
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}
