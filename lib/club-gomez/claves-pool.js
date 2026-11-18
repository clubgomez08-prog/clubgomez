/** Pool del mes y de los sorteos de 3 cifras (000–999).
 *  Un sorteo puede traer su propio rango, hasta 9999.
 *  Físico del mes: 000–700. Web del mes: 701–999.
 */

export const CLAVES_POOL_SIZE = 1000;
export const NUMERO_TOPE = 9999;

export const CLAVES_RANGO = {
  web: { min: 701, max: 999, label: "Web 701–999" },
  fisico: { min: 0, max: 700, label: "Físico 000–700" },
};

/**
 * 3 últimos dígitos (000–999).
 * @param {string|number} n
 * @returns {string}
 */
export function padClave(n) {
  return formatearNumero(n, 3);
}

/** 4 cifras si el sorteo pasa de 999. Si no, se quedan en 3. */
export function digitosDeTopes(...topes) {
  const max = Math.max(
    ...topes.map((n) => Number(n)).filter((n) => Number.isFinite(n))
  );
  return max > 999 ? 4 : 3;
}

export function formatearNumero(n, digitos = 3) {
  const ancho = digitos >= 4 ? 4 : 3;
  const digits = String(n ?? "").replace(/\D/g, "");
  if (!digits) return "0".repeat(ancho);
  return digits.slice(-ancho).padStart(ancho, "0");
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
    return periodoDe(new Date());
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  if (!y || !m) return d.toISOString().slice(0, 7);
  return `${y}-${m}`;
}

/**
 * Asigna N claves libres del periodo, según canal (web o físico).
 * @param {import("@supabase/supabase-js").SupabaseClient} supabaseAdmin
 * @param {{ count: number, periodo?: string, canal?: "web"|"fisico" }} opts
 * @returns {Promise<string[]>}
 */
export async function asignarClavesDelPool(
  supabaseAdmin,
  { count, periodo, canal = "web", sorteoId = null, rango: rangoPedido = null }
) {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  if (n <= 0) return [];

  const per = periodo || periodoDe();
  const rango = rangoPedido || rangoDeCanal(canal);
  const poolSize = sizeRango(rango);
  const digitos = digitosDeTopes(rango.max);
  const fmt = (valor) => formatearNumero(valor, digitos);

  const usadas = [];
  for (let from = 0; from < 20000; from += 1000) {
    let consulta = supabaseAdmin.from("claves").select("numero").range(from, from + 999);
    consulta = sorteoId ? consulta.eq("sorteo_id", sorteoId) : consulta.eq("periodo", per);
    const { data, error } = await consulta;
    if (error) throw new Error(error.message);
    usadas.push(...(data || []));
    if (!data || data.length < 1000) break;
  }

  const occupied = new Set((usadas || []).map((r) => fmt(r.numero)));
  let ocupadasEnRango = 0;
  for (const num of occupied) {
    const v = Number(num);
    if (v >= rango.min && v <= rango.max) ocupadasEnRango += 1;
  }
  const libres = poolSize - ocupadasEnRango;
  if (libres < n) {
    throw new Error(
      `No hay números libres en este sorteo (${fmt(rango.min)}–${fmt(rango.max)}). Libres: ${libres}, se necesitan: ${n}.`
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
    const candidate = fmt(raw);
    if (occupied.has(candidate)) continue;
    occupied.add(candidate);
    assigned.push(candidate);
  }

  return assigned;
}

/**
 * Parsea claves escritas a mano (701, 702 o una por línea).
 * @returns {string[]}
 */
export function parseClavesInput(raw, digitos = 3) {
  const parts = String(raw || "")
    .split(/[\s,;]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.map((p) => formatearNumero(p, digitos));
}

/**
 * Valida claves físicas ingresadas (impresas): rango 000–700, únicas y libres.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabaseAdmin
 * @param {{ numeros: string[], periodo?: string, countEsperado?: number }} opts
 */
export async function validarClavesFisicas(
  supabaseAdmin,
  { numeros, periodo, countEsperado, sorteoId = null, rango: rangoPedido = null }
) {
  const rango = rangoPedido || CLAVES_RANGO.fisico;
  const digitos = digitosDeTopes(rango.max);
  const list = (numeros || [])
    .map((n) => String(n ?? "").trim())
    .filter(Boolean)
    .map((n) => formatearNumero(n, digitos));

  if (typeof countEsperado === "number" && list.length !== countEsperado) {
    throw new Error(
      `Debes ingresar ${countEsperado} clave${countEsperado === 1 ? "" : "s"} (las que imprimiste y entregaste).`
    );
  }
  if (!list.length) {
    throw new Error(
      `Ingresa las claves impresas (${formatearNumero(rango.min, digitos)}–${formatearNumero(rango.max, digitos)}).`
    );
  }

  const seen = new Set();
  for (const n of list) {
    const v = Number(n);
    if (n.length !== digitos || v < rango.min || v > rango.max) {
      throw new Error(
        `La clave ${n} no es válida. En este sorteo van de ${formatearNumero(rango.min, digitos)} a ${formatearNumero(rango.max, digitos)}.`
      );
    }
    if (seen.has(n)) {
      throw new Error(`La clave ${n} está repetida.`);
    }
    seen.add(n);
  }

  const per = periodo || periodoDe();
  let consulta = supabaseAdmin.from("claves").select("numero").in("numero", list);
  consulta = sorteoId ? consulta.eq("sorteo_id", sorteoId) : consulta.eq("periodo", per);
  const { data: usadas, error } = await consulta;

  if (error) throw new Error(error.message);

  const ocupadas = (usadas || []).map((r) => formatearNumero(r.numero, digitos));
  if (ocupadas.length) {
    throw new Error(
      sorteoId
        ? `Estos números ya están vendidos en este sorteo: ${ocupadas.join(", ")}.`
        : `Estas claves ya están asignadas este mes: ${ocupadas.join(", ")}.`
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
