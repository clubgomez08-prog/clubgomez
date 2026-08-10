/** Catálogo de membresías Club Gómez */

export const PLANES_MEMBRESIA = {
  elite: {
    id: "elite",
    nombre: "Élite",
    precio: 90000,
    precioLabel: "90.000",
    claves: 10,
    tag: "Vives la mejor versión del Club",
    equiv: "La experiencia completa del Club",
  },
  selecto: {
    id: "selecto",
    nombre: "Selecto",
    precio: 60000,
    precioLabel: "60.000",
    claves: 7,
    tag: "Vas en serio con el Club",
    equiv: "El equilibrio ideal",
  },
  esencial: {
    id: "esencial",
    nombre: "Esencial",
    precio: 30000,
    precioLabel: "30.000",
    claves: 3,
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
    `Claves: ${plan.claves}`,
    `Nombre: ${nombre}`,
    `Cédula: ${cedula}`,
    `Email: ${email}`,
    `Teléfono: ${telefono}`,
    `Ciudad: ${ciudad}`,
  ];
  const text = lineas.join("\n");
  return `https://wa.me/${WHATSAPP_MEMBRESIA}?text=${encodeURIComponent(text)}`;
}
