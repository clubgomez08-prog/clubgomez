import { supabaseAdmin } from "@/lib/supabase";

/**
 * Valida el JWT del usuario enviado en Authorization: Bearer <token>.
 * @param {Request} request
 * @returns {Promise<object|null>} user de Supabase Auth o null
 */
export async function verificarSesionAdmin(request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "")?.trim();
  if (!token) return null;

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return null;
  return user;
}
