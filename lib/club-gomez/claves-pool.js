/** Pool de claves Motilón: 0000–9999, únicas por periodo YYYY-MM */

export const CLAVES_POOL_SIZE = 10000;

/**
 * @param {string|number} n
 * @returns {string}
 */
export function padClave(n) {
  const digits = String(n ?? "").replace(/\D/g, "");
  if (!digits) return "0000";
  return digits.padStart(4, "0").slice(-4);
}

/**
 * @param {Date|string} [date]
 * @returns {string} YYYY-MM
 */
export function periodoDe(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 7);
  }
  return d.toISOString().slice(0, 7);
}

/**
 * Asigna N claves libres del periodo (0000–9999).
 * @param {import("@supabase/supabase-js").SupabaseClient} supabaseAdmin
 * @param {{ count: number, periodo?: string }} opts
 * @returns {Promise<string[]>}
 */
export async function asignarClavesDelPool(supabaseAdmin, { count, periodo }) {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  if (n <= 0) return [];

  const per = periodo || periodoDe();
  const { data: usadas, error } = await supabaseAdmin
    .from("claves")
    .select("numero")
    .eq("periodo", per);

  if (error) throw new Error(error.message);

  const occupied = new Set((usadas || []).map((r) => padClave(r.numero)));
  const libres = CLAVES_POOL_SIZE - occupied.size;
  if (libres < n) {
    throw new Error(
      `No hay claves suficientes en el pool del periodo ${per}. Libres: ${libres}, se necesitan: ${n}.`
    );
  }

  const assigned = [];
  let attempts = 0;
  const maxAttempts = Math.max(50000, n * 200);

  while (assigned.length < n) {
    attempts += 1;
    if (attempts > maxAttempts) {
      throw new Error("No se pudieron asignar claves únicas del pool.");
    }
    const candidate = padClave(Math.floor(Math.random() * CLAVES_POOL_SIZE));
    if (occupied.has(candidate)) continue;
    occupied.add(candidate);
    assigned.push(candidate);
  }

  return assigned;
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabaseAdmin
 * @param {string} [periodo]
 */
export async function inventarioClavesPeriodo(supabaseAdmin, periodo) {
  const per = periodo || periodoDe();
  const { count, error } = await supabaseAdmin
    .from("claves")
    .select("*", { count: "exact", head: true })
    .eq("periodo", per);

  if (error) throw new Error(error.message);
  const emitidas = count ?? 0;
  return {
    periodo: per,
    emitidas,
    libres: Math.max(0, CLAVES_POOL_SIZE - emitidas),
    total: CLAVES_POOL_SIZE,
  };
}
