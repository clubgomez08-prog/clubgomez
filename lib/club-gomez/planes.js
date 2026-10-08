/** Catálogo de membresías Club Gómez */

export const PLANES_MEMBRESIA = {
  elite: {
    id: "elite",
    nombre: "Élite",
    precio: 100000,
    precioLabel: "100.000",
    precioAntes: "180.000",
    claves: 6,
    tag: "Vives la mejor versión del Club",
    equiv: "La experiencia completa del Club",
  },
  selecto: {
    id: "selecto",
    nombre: "Selecto",
    precio: 50000,
    precioLabel: "50.000",
    precioAntes: "90.000",
    claves: 3,
    tag: "Vas en serio con el Club",
    equiv: "El equilibrio ideal",
  },
  esencial: {
    id: "esencial",
    nombre: "Esencial",
    precio: 20000,
    precioLabel: "20.000",
    precioAntes: "30.000",
    claves: 1,
    tag: "Arrancas con el Club",
    equiv: "O sea, entras mes a mes",
  },
};

export const PLAN_DEFAULT_ID = "esencial";

export const WHATSAPP_MEMBRESIA = "573137453511";

export function getPlanById(planId) {
  const key = String(planId || "")
    .trim()
    .toLowerCase();
  return PLANES_MEMBRESIA[key] || PLANES_MEMBRESIA[PLAN_DEFAULT_ID];
}

/** Cuántas oportunidades/claves debe recibir ese plan de pago. */
export function clavesDelPlan(planId) {
  return getPlanById(planId).claves;
}

export function labelOportunidades(n) {
  const c = Number(n) || 0;
  return `${c} oportunidad${c === 1 ? "" : "es"}`;
}

export function formatCop(n) {
  return Number(n).toLocaleString("es-CO");
}

export function construirUrlWhatsappMembresia({
  plan,
  nombre,
  email,
  cedula,
  telefono,
  ciudad,
}) {
  const lineas = [
    "Hola Club Gómez! Quiero activar mi membresía.",
    `Plan: ${plan.nombre}`,
    `Precio: $${plan.precioLabel} COP / mes`,
    `Oportunidades: ${plan.claves}`,
    `Nombre: ${nombre}`,
    `Cédula: ${cedula}`,
    `Email: ${email}`,
    `Teléfono: ${telefono}`,
    `Ciudad: ${ciudad}`,
  ];
  const text = lineas.join("\n");
  return `https://wa.me/${WHATSAPP_MEMBRESIA}?text=${encodeURIComponent(text)}`;
}
