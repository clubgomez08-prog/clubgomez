/** Localiza la solicitud Bold por order-id (no solo las últimas N filas). */

export async function buscarSolicitudPorBoldOrder(supabase, orderId) {
  const id = String(orderId || "").trim();
  if (!id || !/^[\w.-]{6,80}$/.test(id)) return null;

  const { data, error } = await supabase
    .from("solicitudes_membresia")
    .select("*")
    .ilike("notas", `%${id}%`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;

  return (
    (data || []).find((s) => {
      try {
        const n = JSON.parse(s.notas || "{}");
        return n.bold_order_id === id;
      } catch {
        return false;
      }
    }) || null
  );
}
