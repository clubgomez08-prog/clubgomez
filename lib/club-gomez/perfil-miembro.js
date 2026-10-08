import { PLANES_MEMBRESIA } from "@/lib/club-gomez/planes";
import { metaCryptonCampana } from "@/lib/club-gomez/beneficios-catalog";

/**
 * Arma el objeto que consume el portal /miembro a partir de filas Supabase.
 */
export function construirPerfilPortal({ miembro, membresia = null, plan = null, claves = [] }) {
  if (!miembro) return null;

  const planId = plan?.id || membresia?.plan_id || null;
  const planLocal = planId ? PLANES_MEMBRESIA[planId] : null;
  const activa = membresia?.estado === "activa";
  const crypton = metaCryptonCampana();
  const listaClaves = Array.isArray(claves)
    ? claves.map((c) => (typeof c === "string" ? c : c?.numero)).filter(Boolean)
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
      "Crea tu cuenta gratis. Activa tu membresía cuando quieras.",
    precioLabel: planLocal?.precioLabel || "—",
    clavesCount: listaClaves.length,
    claves: listaClaves,
    estado: activa ? "activa" : miembro.estado || "pendiente",
    inicio: membresia?.inicia_en || null,
    fin: membresia?.vence_en || null,
    beneficios: activa
      ? [
          {
            id: "crypton",
            titulo: crypton.premio,
            fechas: `${crypton.fechaLabel} · Lotería de ${crypton.loteria}`,
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

  return construirPerfilPortal({ miembro, membresia, plan, claves });
}
