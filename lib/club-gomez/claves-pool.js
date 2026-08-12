/** Pool de claves Motilón: 0000–9999, únicas por periodo YYYY-MM
 *  Web (Bold):     0000–6000
 *  Venta física:   6001–9999
 */

export const CLAVES_POOL_SIZE = 10000;

export const CLAVES_RANGO = {
  web: { min: 0, max: 6000, label: "Web 0000–6000" },
  fisico: { min: 6001, max: 9999, label: "Físico 6001–9999" },
};

/**
 * @param {string|number} n
 * @returns {string}
 */
export function padClave(n) {
  const digits = String(n ?? "").replace(/\D/g, "");
  if (!digits) return "0000";
  return digits.padStart(4, "0").slice(-4);
}

export function canalClaveDeOrigen(origen) {
  const o = String(origen || "").toLowerCase();
  if (o === "manual" || o === "fisico") return "fisico";
  return "web";
}

function rangoDeCanal(canal) {
  return CLAVES_RANGO[canal] || CLAVES_RANGO.web;
}

function sizeRango({ min, max }) {
  return max - min + 1;
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
 * Asigna N claves libres del periodo, según canal (web o físico).
 * @param {import("@supabase/supabase-js").SupabaseClient} supabaseAdmin
 * @param {{ count: number, periodo?: string, canal?: "web"|"fisico" }} opts
 * @returns {Promise<string[]>}
 */
export async function asignarClavesDelPool(
  supabaseAdmin,
  { count, periodo, canal = "web" }
) {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  if (n <= 0) return [];

  const per = periodo || periodoDe();
  const rango = rangoDeCanal(canal);
  const poolSize = sizeRango(rango);

  const { data: usadas, error } = await supabaseAdmin
    .from("claves")
    .select("numero")
    .eq("periodo", per);

  if (error) throw new Error(error.message);

  const occupied = new Set((usadas || []).map((r) => padClave(r.numero)));
  let ocupadasEnRango = 0;
  for (const num of occupied) {
    const v = Number(num);
    if (v >= rango.min && v <= rango.max) ocupadasEnRango += 1;
  }
  const libres = poolSize - ocupadasEnRango;
  if (libres < n) {
    throw new Error(
      `No hay claves ${canal} suficientes en ${per} (${rango.label}). Libres: ${libres}, se necesitan: ${n}.`
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
    const raw = rango.min + Math.floor(Math.random() * poolSize);
    const candidate = padClave(raw);
    if (occupied.has(candidate)) continue;
    occupied.add(candidate);
    assigned.push(candidate);
  }

  return assigned;
}

/**
 * Parsea claves escritas a mano (6001, 6002 o una por línea).
 * @returns {string[]}
 */
export function parseClavesInput(raw) {
  const parts = String(raw || "")
    .split(/[\s,;]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.map((p) => padClave(p));
}

/**
 * Valida claves físicas ingresadas (impresas): rango 6001–9999, únicas y libres.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabaseAdmin
 * @param {{ numeros: string[], periodo?: string, countEsperado?: number }} opts
 */
export async function validarClavesFisicas(
  supabaseAdmin,
  { numeros, periodo, countEsperado }
) {
  const rango = CLAVES_RANGO.fisico;
  const list = (numeros || []).map((n) => padClave(n)).filter(Boolean);

  if (typeof countEsperado === "number" && list.length !== countEsperado) {
    throw new Error(
      `Debes ingresar ${countEsperado} clave${countEsperado === 1 ? "" : "s"} (las que imprimiste y entregaste).`
    );
  }
  if (!list.length) {
    throw new Error("Ingresa las claves impresas (6001–9999).");
  }

  const seen = new Set();
  for (const n of list) {
    const v = Number(n);
    if (!/^\d{4}$/.test(n) || v < rango.min || v > rango.max) {
      throw new Error(
        `La clave ${n} no es válida. Las físicas van de 6001 a 9999.`
      );
    }
    if (seen.has(n)) {
      throw new Error(`La clave ${n} está repetida.`);
    }
    seen.add(n);
  }

  const per = periodo || periodoDe();
  const { data: usadas, error } = await supabaseAdmin
    .from("claves")
    .select("numero")
    .eq("periodo", per)
    .in("numero", list);

  if (error) throw new Error(error.message);

  const ocupadas = (usadas || []).map((r) => padClave(r.numero));
  if (ocupadas.length) {
    throw new Error(
      `Estas claves ya están asignadas este mes: ${ocupadas.join(", ")}.`
    );
  }

  return list;
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabaseAdmin
 * @param {string} [periodo]
 */
export async function inventarioClavesPeriodo(supabaseAdmin, periodo) {
  const per = periodo || periodoDe();
  const { data, error } = await supabaseAdmin
    .from("claves")
    .select("numero")
    .eq("periodo", per);

  if (error) throw new Error(error.message);

  const nums = (data || []).map((r) => Number(padClave(r.numero)));
  const emitidasWeb = nums.filter(
    (n) => n >= CLAVES_RANGO.web.min && n <= CLAVES_RANGO.web.max
  ).length;
  const emitidasFisico = nums.filter(
    (n) => n >= CLAVES_RANGO.fisico.min && n <= CLAVES_RANGO.fisico.max
  ).length;
  const totalWeb = sizeRango(CLAVES_RANGO.web);
  const totalFisico = sizeRango(CLAVES_RANGO.fisico);
  const emitidas = nums.length;

  return {
    periodo: per,
    emitidas,
    libres: Math.max(0, CLAVES_POOL_SIZE - emitidas),
    total: CLAVES_POOL_SIZE,
    web: {
      emitidas: emitidasWeb,
      libres: Math.max(0, totalWeb - emitidasWeb),
      total: totalWeb,
    },
    fisico: {
      emitidas: emitidasFisico,
      libres: Math.max(0, totalFisico - emitidasFisico),
      total: totalFisico,
    },
  };
}
