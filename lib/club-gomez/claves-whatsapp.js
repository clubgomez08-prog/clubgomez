/** Mensajes de oportunidades para correo / WhatsApp */

export const WA_NUMBER_DIGITS = "573137453511";
export const LOTERIA_INTERNA = "Lotería de Boyacá";

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
    incluirMotilon
      ? "Participo por la Yamaha Crypton 0 km + $1.000.000."
      : null,
    incluirMotilon
      ? `Lotería: ${LOTERIA_INTERNA} · 17 de octubre (últimos 3 números)`
      : null,
    "Mis oportunidades:",
    lista,
  ].filter(Boolean);

  return lineas.join("\n");
}

export function construirUrlWhatsappClaves(opts, flags = {}) {
  const text = construirTextoClavesWhatsapp(opts, flags);
  return `https://wa.me/${WA_NUMBER_DIGITS}?text=${encodeURIComponent(text)}`;
}
