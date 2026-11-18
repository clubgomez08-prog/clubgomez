import { CLAVES_RANGO, digitosDeTopes, formatearNumero } from "@/lib/club-gomez/claves-pool";
import { getPlanById } from "@/lib/club-gomez/planes";

export function canalDeNumero(numero, rangos = null) {
  const v = Number(String(numero ?? "").replace(/\D/g, ""));
  const web = rangos?.web || CLAVES_RANGO.web;
  const fisico = rangos?.fisico || CLAVES_RANGO.fisico;
  if (Number.isFinite(v) && v >= web.min && v <= web.max) return "web";
  if (Number.isFinite(v) && v >= fisico.min && v <= fisico.max) return "fisico";
  return "fisico";
}

export function rangosDeSorteo(sorteo) {
  const ok = (n) => Number.isInteger(n) && n >= 0 && n <= 9999;
  if (!sorteo || !ok(sorteo.fisico_min) || !ok(sorteo.fisico_max) || !ok(sorteo.web_min) || !ok(sorteo.web_max)) {
    return { rangos: CLAVES_RANGO, digitos: 3 };
  }
  return {
    rangos: {
      fisico: { min: sorteo.fisico_min, max: sorteo.fisico_max },
      web: { min: sorteo.web_min, max: sorteo.web_max },
    },
    digitos: digitosDeTopes(sorteo.fisico_max, sorteo.web_max),
  };
}

/**
 * Números asignados en el periodo con su dueño (solo lectura).
 * @returns {Promise<Array<{numero:string, canal:string, fecha:string, membresiaId:string,
 *   planId:string|null, planNombre:string, origen:string|null, miembroId:string|null,
 *   nombre:string, telefono:string, email:string, cedula:string}>>}
 */
export async function listarNumerosPeriodo(supabaseAdmin, periodo, sorteoId = null) {
  let formato = { rangos: CLAVES_RANGO, digitos: 3 };
  if (sorteoId) {
    const { data: sorteo } = await supabaseAdmin
      .from("sorteos_rifa")
      .select("fisico_min, fisico_max, web_min, web_max")
      .eq("id", sorteoId)
      .maybeSingle();
    formato = rangosDeSorteo(sorteo);
  }

  const data = [];
  for (let from = 0; from < 20000; from += 1000) {
    let consulta = supabaseAdmin
      .from("claves")
      .select(
        "numero, created_at, membresia_id, membresias(plan_id, origen, estado, miembro_id, miembros(id, nombre, telefono, email, cedula))"
      )
      .order("numero", { ascending: true })
      .range(from, from + 999);
    consulta = sorteoId ? consulta.eq("sorteo_id", sorteoId) : consulta.eq("periodo", periodo);
    const { data: page, error } = await consulta;
    if (error) throw new Error(error.message);
    data.push(...(page || []));
    if (!page || page.length < 1000) break;
  }

  return data.map((c) => {
    const mem = c.membresias || {};
    const mi = mem.miembros || {};
    const email = String(mi.email || "");
    return {
      numero: formatearNumero(c.numero, formato.digitos),
      canal: canalDeNumero(c.numero, formato.rangos),
      fecha: c.created_at,
      membresiaId: c.membresia_id,
      planId: mem.plan_id || null,
      planNombre: mem.plan_id ? getPlanById(mem.plan_id).nombre : "—",
      origen: mem.origen || null,
      miembroId: mi.id || mem.miembro_id || null,
      nombre: mi.nombre || "—",
      telefono: mi.telefono || "",
      email: email.endsWith("@sin-email.clubgomez.co") ? "" : email,
      cedula: String(mi.cedula || "").startsWith("fis-") ? "" : mi.cedula || "",
    };
  });
}
