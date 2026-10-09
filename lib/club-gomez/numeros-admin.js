import { CLAVES_RANGO, padClave } from "@/lib/club-gomez/claves-pool";
import { getPlanById } from "@/lib/club-gomez/planes";

export function canalDeNumero(numero) {
  const v = Number(padClave(numero));
  return v >= CLAVES_RANGO.web.min && v <= CLAVES_RANGO.web.max ? "web" : "fisico";
}

/**
 * Números asignados en el periodo con su dueño (solo lectura).
 * @returns {Promise<Array<{numero:string, canal:string, fecha:string, membresiaId:string,
 *   planId:string|null, planNombre:string, origen:string|null, miembroId:string|null,
 *   nombre:string, telefono:string, email:string, cedula:string}>>}
 */
export async function listarNumerosPeriodo(supabaseAdmin, periodo) {
  const { data, error } = await supabaseAdmin
    .from("claves")
    .select(
      "numero, created_at, membresia_id, membresias(plan_id, origen, estado, miembro_id, miembros(id, nombre, telefono, email, cedula))"
    )
    .eq("periodo", periodo)
    .order("numero", { ascending: true })
    .range(0, 1999);

  if (error) throw new Error(error.message);

  return (data || []).map((c) => {
    const mem = c.membresias || {};
    const mi = mem.miembros || {};
    const email = String(mi.email || "");
    return {
      numero: padClave(c.numero),
      canal: canalDeNumero(c.numero),
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
