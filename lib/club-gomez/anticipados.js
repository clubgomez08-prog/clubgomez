import { formatearNumero } from "@/lib/club-gomez/claves-pool";

/** Sábados de $500.000 de este sorteo. El 26 de diciembre no entra: ese día son las motos. */
export const DIAS_ANTICIPADOS = [
  { fecha: "2026-11-21", etiqueta: "Sábado 21 de noviembre" },
  { fecha: "2026-11-28", etiqueta: "Sábado 28 de noviembre" },
  { fecha: "2026-12-05", etiqueta: "Sábado 5 de diciembre" },
  { fecha: "2026-12-12", etiqueta: "Sábado 12 de diciembre" },
  { fecha: "2026-12-19", etiqueta: "Sábado 19 de diciembre" },
];

const ACCION_ESTADO = "anticipados_estado";

export function esSorteoConAnticipados(sorteo) {
  return sorteo?.slug === "navidad";
}

export function fechaDeAnticipado(fecha) {
  return DIAS_ANTICIPADOS.find((d) => d.fecha === fecha) || null;
}

function diasVacios() {
  return Object.fromEntries(DIAS_ANTICIPADOS.map((d) => [d.fecha, ""]));
}

export async function leerAnticipados(supabaseAdmin, sorteoId) {
  const dias = diasVacios();
  const { data, error } = await supabaseAdmin
    .from("actividad_admin")
    .select("detalle, created_at")
    .eq("accion", ACCION_ESTADO)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return { dias, error };
  const fila = (data || []).find((row) => row.detalle?.sorteoId === sorteoId);
  const guardados = fila?.detalle?.dias || {};
  for (const dia of DIAS_ANTICIPADOS) {
    const numero = String(guardados[dia.fecha] || "").replace(/\D/g, "");
    dias[dia.fecha] = numero ? formatearNumero(numero, 4) : "";
  }
  return { dias, error: null };
}

export async function guardarAnticipado(supabaseAdmin, user, sorteoId, fecha, numero) {
  const { dias, error } = await leerAnticipados(supabaseAdmin, sorteoId);
  if (error) return { error: error.message };
  dias[fecha] = numero || "";
  const { error: ins } = await supabaseAdmin.from("actividad_admin").insert({
    admin_email: user?.email || null,
    accion: ACCION_ESTADO,
    detalle: { sorteoId, dias },
  });
  if (ins) return { error: ins.message };
  return { dias, error: null };
}

export async function duenoDelNumero(supabaseAdmin, sorteoId, numero) {
  const buscado = formatearNumero(numero, 4);
  const claves = [];
  for (let from = 0; from < 20000; from += 1000) {
    const { data, error } = await supabaseAdmin
      .from("claves")
      .select("id, numero, sorteo_id, membresia_id")
      .eq("sorteo_id", sorteoId)
      .range(from, from + 999);
    if (error) return { error: error.message, dueno: null };
    claves.push(...(data || []));
    if (!data || data.length < 1000) break;
  }

  const clave = claves.find((c) => formatearNumero(c.numero, 4) === buscado);
  if (!clave?.membresia_id) return { dueno: null, error: null };

  const { data: membresia } = await supabaseAdmin
    .from("membresias")
    .select("id, miembro_id, created_at")
    .eq("id", clave.membresia_id)
    .maybeSingle();
  if (!membresia?.miembro_id) return { dueno: null, error: null };

  const { data: miembro } = await supabaseAdmin
    .from("miembros")
    .select("nombre, telefono")
    .eq("id", membresia.miembro_id)
    .maybeSingle();

  return {
    error: null,
    dueno: miembro
      ? {
          nombre: miembro.nombre,
          telefono: miembro.telefono || "",
          desde: membresia.created_at,
        }
      : null,
  };
}
