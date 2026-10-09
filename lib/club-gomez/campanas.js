export const CAMPANAS_BUCKET = "campanas";

const CAMPOS_TEXTO = [
  "nombre",
  "periodo",
  "hero_eyebrow",
  "hero_titulo",
  "hero_titulo_acento",
  "hero_efectivo",
  "hero_cta",
  "hero_img_pc",
  "hero_img_movil",
  "fecha_sorteo",
  "loteria",
];

export const CAMPANA_VACIA = {
  nombre: "",
  periodo: "",
  hero_eyebrow: "",
  hero_titulo: "",
  hero_titulo_acento: "",
  hero_efectivo: "",
  hero_cta: "¡Participar!",
  hero_img_pc: "",
  hero_img_movil: "",
  fecha_sorteo: "",
  loteria: "Lotería de Boyacá",
  fotos_destacado: [],
};

/** Limpia el body del panel y devuelve { payload, error }. */
export function normalizarCampana(body) {
  const payload = {};
  for (const campo of CAMPOS_TEXTO) {
    if (campo in body) {
      const v = String(body[campo] ?? "").trim();
      payload[campo] = v || null;
    }
  }
  if ("fotos_destacado" in body) {
    payload.fotos_destacado = (Array.isArray(body.fotos_destacado)
      ? body.fotos_destacado
      : []
    )
      .map((u) => String(u || "").trim())
      .filter(Boolean)
      .slice(0, 6);
  }

  if ("nombre" in payload && !payload.nombre) {
    return { error: "El nombre de la campaña es obligatorio" };
  }
  if ("periodo" in payload && !/^\d{4}-\d{2}$/.test(payload.periodo || "")) {
    return { error: "El periodo debe ser AAAA-MM (ej. 2026-11)" };
  }
  if (payload.fecha_sorteo && !/^\d{4}-\d{2}-\d{2}$/.test(payload.fecha_sorteo)) {
    return { error: "Fecha de sorteo inválida" };
  }
  return { payload };
}
