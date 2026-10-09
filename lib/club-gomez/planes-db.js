import { PLANES_MEMBRESIA, PLAN_DEFAULT_ID, formatCop } from "@/lib/club-gomez/planes";

const TTL_MS = 20_000;
let cache = null;
let cacheAt = 0;

export const LIMITES_PLAN = {
  precioMin: 1000,
  precioMax: 5_000_000,
  clavesMin: 1,
  clavesMax: 50,
};

function enteroValido(v, min, max) {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

/** Une la fila de la tabla `planes` con el plan del código. Cualquier dato raro → valor del código. */
export function fusionarPlan(base, row) {
  if (!row) return base;
  const precio = enteroValido(row.precio_cop, LIMITES_PLAN.precioMin, LIMITES_PLAN.precioMax) ?? base.precio;
  const claves = enteroValido(row.claves, LIMITES_PLAN.clavesMin, LIMITES_PLAN.clavesMax) ?? base.claves;
  const antes = enteroValido(row.precio_antes, LIMITES_PLAN.precioMin, LIMITES_PLAN.precioMax);
  return {
    ...base,
    nombre: String(row.nombre || "").trim() || base.nombre,
    precio,
    precioLabel: formatCop(precio),
    precioAntes: antes ? formatCop(antes) : base.precioAntes,
    claves,
    tag: String(row.tag || "").trim() || base.tag,
    equiv: String(row.equiv || "").trim() || base.equiv,
  };
}

/** Planes vigentes (base de datos con respaldo al código). Nunca lanza error. */
export async function cargarPlanes(supabaseAdmin, { fresco = false } = {}) {
  if (!fresco && cache && Date.now() - cacheAt < TTL_MS) return cache;
  try {
    const { data, error } = await supabaseAdmin
      .from("planes")
      .select("id, nombre, precio_cop, claves, tag, precio_antes, equiv");
    if (error) throw error;
    const filas = Object.fromEntries((data || []).map((r) => [r.id, r]));
    const planes = {};
    for (const [id, base] of Object.entries(PLANES_MEMBRESIA)) {
      planes[id] = fusionarPlan(base, filas[id]);
    }
    cache = planes;
    cacheAt = Date.now();
    return planes;
  } catch (err) {
    console.warn("[planes-db] usando planes del código:", err?.message || err);
    return cache || PLANES_MEMBRESIA;
  }
}

export function invalidarPlanes() {
  cache = null;
  cacheAt = 0;
}

export async function obtenerPlan(supabaseAdmin, planId) {
  const planes = await cargarPlanes(supabaseAdmin);
  const key = String(planId || "").trim().toLowerCase();
  return planes[key] || planes[PLAN_DEFAULT_ID];
}

/**
 * Plan con el que se cobró una solicitud web. Usa lo que se guardó al abrir
 * Bold (precio y oportunidades del momento); si no hay, el plan del código.
 */
export function planDeSolicitud(planId, notas = {}) {
  const key = String(planId || "").trim().toLowerCase();
  const base = PLANES_MEMBRESIA[key] || PLANES_MEMBRESIA[PLAN_DEFAULT_ID];
  const claves = enteroValido(notas.claves, LIMITES_PLAN.clavesMin, LIMITES_PLAN.clavesMax);
  const precio = enteroValido(notas.amount, LIMITES_PLAN.precioMin, LIMITES_PLAN.precioMax);
  if (!claves) return base;
  return {
    ...base,
    nombre: String(notas.plan_nombre || "").trim() || base.nombre,
    claves,
    precio: precio ?? base.precio,
    precioLabel: formatCop(precio ?? base.precio),
  };
}
