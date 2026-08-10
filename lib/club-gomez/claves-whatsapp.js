/** Mensajes de claves para correo / WhatsApp (Motilón solo en canales privados) */

export const WA_NUMBER_DIGITS = "573137453511";
export const LOTERIA_INTERNA = "Motilón Noche";

/**
 * @param {{ nombre?: string, planNombre?: string, claves?: string[] }} opts
 * @param {{ incluirMotilon?: boolean }} [flags]
 */
export function construirTextoClavesWhatsapp(opts, flags = {}) {
  const { nombre = "", planNombre = "", claves = [] } = opts;
  const { incluirMotilon = false } = flags;
  const lista =
    Array.isArray(claves) && claves.length > 0
      ? claves.map((c) => `• ${c}`).join("\n")
      : "• Pendiente de asignación";

  const lineas = [
    "Hola Club Gómez!",
    nombre ? `Soy ${nombre}.` : null,
    planNombre ? `Plan: ${planNombre}` : null,
    incluirMotilon ? `Lotería: ${LOTERIA_INTERNA}` : null,
    "Mis claves con oportunidades:",
    lista,
  ].filter(Boolean);

  return lineas.join("\n");
}

export function construirUrlWhatsappClaves(opts, flags = {}) {
  const text = construirTextoClavesWhatsapp(opts, flags);
  return `https://wa.me/${WA_NUMBER_DIGITS}?text=${encodeURIComponent(text)}`;
}
