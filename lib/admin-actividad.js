/**
 * Guarda una acción del panel en el historial. Nunca lanza error:
 * si la tabla no existe, la acción principal sigue funcionando.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabaseAdmin
 * @param {{ email?: string } | null} user
 * @param {string} accion
 * @param {object} [detalle]
 */
export async function registrarActividad(supabaseAdmin, user, accion, detalle = {}) {
  try {
    const { error } = await supabaseAdmin.from("actividad_admin").insert({
      admin_email: user?.email || null,
      accion,
      detalle,
    });
    if (error) console.warn("[actividad_admin]", error.message);
  } catch (err) {
    console.warn("[actividad_admin]", err?.message || err);
  }
}

export const ACCIONES_LABEL = {
  venta_fisica: "Venta física registrada",
  venta_anulada: "Venta anulada",
  pago_web_activado: "Pago web activado a mano",
  correo_reenviado: "Correo de oportunidades reenviado",
  plan_editado: "Plan editado",
  campana_guardada: "Campaña guardada",
  campana_activada: "Campaña activada",
  campana_borrada: "Campaña borrada",
  premio_creado: "Fecha de premio creada",
  premio_resultado: "Resultado de premio registrado",
  premio_entregado: "Premio entregado",
  exportar: "Exportación descargada",
};
