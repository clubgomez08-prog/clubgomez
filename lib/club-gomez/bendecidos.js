import { formatearNumero } from "@/lib/club-gomez/claves-pool";
import { duenoDelNumero } from "@/lib/club-gomez/anticipados";

/** Números de $1.000.000 del sorteo de las 3 motos. */
export const NUMEROS_BENDECIDOS = [
  "0181",
  "1661",
  "2162",
  "3692",
  "4399",
  "5165",
  "6742",
  "7134",
  "8900",
  "9008",
];

const ACCION_ESTADO = "bendecidos_estado";
const PREMIO = "$1.000.000";

export function esSorteoConBendecidos(sorteo) {
  return sorteo?.slug === "navidad";
}

export function formatearBendecido(numero) {
  return formatearNumero(String(numero || "").replace(/\D/g, ""), 4);
}

export function esNumeroBendecido(numero) {
  return NUMEROS_BENDECIDOS.includes(formatearBendecido(numero));
}

function mapaInicial() {
  // Empiezan apagados: no se asignan hasta que Daniel los active.
  return Object.fromEntries(NUMEROS_BENDECIDOS.map((n) => [n, false]));
}

export async function leerBendecidos(supabaseAdmin, sorteoId) {
  const activos = mapaInicial();
  const { data, error } = await supabaseAdmin
    .from("actividad_admin")
    .select("detalle, created_at")
    .eq("accion", ACCION_ESTADO)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) return { activos, error };
  const fila = (data || []).find((row) => row.detalle?.sorteoId === sorteoId);
  const guardados = fila?.detalle?.activos || {};
  for (const n of NUMEROS_BENDECIDOS) {
    if (Object.prototype.hasOwnProperty.call(guardados, n)) {
      activos[n] = Boolean(guardados[n]);
    }
  }
  return { activos, error: null };
}

/** Números bendecidos apagados: no se pueden asignar. */
export async function numerosBendecidosApagados(supabaseAdmin, sorteoId) {
  if (!sorteoId) return [];
  const { activos, error } = await leerBendecidos(supabaseAdmin, sorteoId);
  if (error) throw new Error(error.message || "No se pudieron leer los números bendecidos");
  return NUMEROS_BENDECIDOS.filter((n) => !activos[n]);
}

export async function guardarBendecido(supabaseAdmin, user, sorteoId, numero, activo) {
  const n = formatearBendecido(numero);
  if (!NUMEROS_BENDECIDOS.includes(n)) {
    return { error: "Ese número no está en la lista de bendecidos." };
  }
  const { activos, error } = await leerBendecidos(supabaseAdmin, sorteoId);
  if (error) return { error: error.message };
  activos[n] = Boolean(activo);
  const { error: ins } = await supabaseAdmin.from("actividad_admin").insert({
    admin_email: user?.email || null,
    accion: ACCION_ESTADO,
    detalle: { sorteoId, activos },
  });
  if (ins) return { error: ins.message };
  return { activos, error: null };
}

export async function listarBendecidosConDueno(supabaseAdmin, sorteoId) {
  const { activos, error } = await leerBendecidos(supabaseAdmin, sorteoId);
  if (error) return { items: [], error: error.message };

  const claves = [];
  for (let from = 0; from < 20000; from += 1000) {
    const { data, error: errClaves } = await supabaseAdmin
      .from("claves")
      .select("numero, membresia_id")
      .eq("sorteo_id", sorteoId)
      .range(from, from + 999);
    if (errClaves) return { items: [], error: errClaves.message };
    claves.push(...(data || []));
    if (!data || data.length < 1000) break;
  }

  const porNumero = new Map();
  for (const c of claves) {
    porNumero.set(formatearBendecido(c.numero), c.membresia_id);
  }

  const memIds = [
    ...new Set(
      NUMEROS_BENDECIDOS.map((n) => porNumero.get(n)).filter(Boolean)
    ),
  ];
  const dueñosPorMem = {};
  if (memIds.length) {
    const { data: membresias, error: errMem } = await supabaseAdmin
      .from("membresias")
      .select("id, created_at, miembros(nombre, telefono)")
      .in("id", memIds);
    if (errMem) return { items: [], error: errMem.message };
    for (const m of membresias || []) {
      dueñosPorMem[m.id] = m.miembros
        ? {
            nombre: m.miembros.nombre,
            telefono: m.miembros.telefono || "",
            desde: m.created_at,
          }
        : null;
    }
  }

  const items = NUMEROS_BENDECIDOS.map((numero) => {
    const memId = porNumero.get(numero);
    const dueno = memId ? dueñosPorMem[memId] || null : null;
    return {
      numero,
      activo: Boolean(activos[numero]),
      premio: PREMIO,
      dueno,
      ganadorMillon: Boolean(dueno),
    };
  });
  return { items, error: null };
}

export { duenoDelNumero, PREMIO };
