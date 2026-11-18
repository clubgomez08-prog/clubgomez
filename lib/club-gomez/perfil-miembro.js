import { PLANES_MEMBRESIA } from "@/lib/club-gomez/planes";
import { metaCryptonCampana } from "@/lib/club-gomez/beneficios-catalog";
import { fechaLegible } from "@/lib/club-gomez/sorteos";
import { digitosDeTopes, formatearNumero } from "@/lib/club-gomez/claves-pool";

/**
 * Arma el objeto que consume el portal /miembro a partir de filas Supabase.
 */
export function construirPerfilPortal({ miembro, membresia = null, plan = null, claves = [], sorteo = null }) {
  if (!miembro) return null;

  const planId = plan?.id || membresia?.plan_id || null;
  const planLocal = planId ? PLANES_MEMBRESIA[planId] : null;
  const activa = membresia?.estado === "activa";
  const crypton = metaCryptonCampana();
  const premio = sorteo?.premio || sorteo?.nombre || crypton.premio;
  const fechaSorteo = sorteo ? fechaLegible(sorteo.fecha_sorteo) : crypton.fechaLabel;
  const loteria = sorteo?.loteria || `Lotería de ${crypton.loteria}`;
  const digitos = digitosDeTopes(sorteo?.fisico_max, sorteo?.web_max);
  const listaClaves = Array.isArray(claves)
    ? claves
        .map((c) => (typeof c === "string" ? c : c?.numero))
        .filter(Boolean)
        .map((n) => formatearNumero(n, digitos))
    : [];

  return {
    id: miembro.id,
    email: miembro.email,
    nombre: miembro.nombre,
    telefono: miembro.telefono || "",
    ciudad: miembro.ciudad || "Colombia",
    cedula: miembro.cedula || "",
    fechaNacimiento: miembro.fecha_nacimiento || null,
    planId,
    planNombre: planLocal?.nombre || plan?.nombre || "Sin plan",
    planTag:
      planLocal?.tag ||
      plan?.tag ||
      (sorteo
        ? "Tus números juegan hasta el día del sorteo."
        : "Crea tu cuenta gratis. Cuando pagues un sorteo, aquí ves tus números."),
    precioLabel: planLocal?.precioLabel || "—",
    clavesCount: listaClaves.length,
    claves: listaClaves,
    estado: activa ? "activa" : miembro.estado || "pendiente",
    inicio: membresia?.inicia_en || null,
    fin: membresia?.vence_en || null,
    premio: activa ? premio : "",
    fechaSorteo: activa ? fechaSorteo : "",
    loteria: activa ? loteria : "",
    beneficios: activa
      ? [
          {
            id: sorteo?.slug || "crypton",
            titulo: premio,
            fechas: [fechaSorteo, loteria].filter(Boolean).join(" · "),
            estado: "activo",
          },
        ]
      : [],
    sinMembresia: !activa,
    authUserId: miembro.auth_user_id || null,
  };
}

export async function cargarPerfilPorAuthUserId(supabaseAdmin, authUserId) {
  const { data: miembro, error } = await supabaseAdmin
    .from("miembros")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) throw error;
  if (!miembro) return null;

  const { data: membresia } = await supabaseAdmin
    .from("membresias")
    .select("*")
    .eq("miembro_id", miembro.id)
    .in("estado", ["activa", "pendiente_pago"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let plan = null;
  let claves = [];

  if (membresia) {
    const { data: planRow } = await supabaseAdmin
      .from("planes")
      .select("*")
      .eq("id", membresia.plan_id)
      .maybeSingle();
    plan = planRow;

    if (membresia.estado === "activa") {
      const { data: clavesRows } = await supabaseAdmin
        .from("claves")
        .select("numero")
        .eq("membresia_id", membresia.id)
        .order("created_at", { ascending: true });
      claves = clavesRows || [];
    }
  }

  let sorteo = null;
  if (membresia?.sorteo_id) {
    const { data } = await supabaseAdmin
      .from("sorteos_rifa")
      .select("slug, nombre, premio, fecha_sorteo, loteria, fisico_max, web_max")
      .eq("id", membresia.sorteo_id)
      .maybeSingle();
    sorteo = data || null;
  }

  return construirPerfilPortal({ miembro, membresia, plan, claves, sorteo });
}
