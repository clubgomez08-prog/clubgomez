import { PLANES_MEMBRESIA } from "@/lib/club-gomez/planes";

const NOMBRES = [
  "Valentina Rojas",
  "Santiago Mejía",
  "Camila Ordóñez",
  "Andrés Felipe Gómez",
  "Laura Sofía Rincón",
  "Daniela Vargas",
  "Juan Esteban Cruz",
  "Mariana López",
];

const CIUDADES = [
  "Cúcuta, Norte de Santander",
  "Bucaramanga, Santander",
  "Medellín, Antioquia",
  "Bogotá D.C.",
  "Cali, Valle",
  "Barrancabermeja, Santander",
];

const PLAN_IDS = ["elite", "selecto", "esencial"];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function genClaves(rng, count) {
  const set = new Set();
  while (set.size < count) {
    set.add(String(Math.floor(rng() * 1000)).padStart(3, "0"));
  }
  return [...set];
}

/**
 * Genera un perfil demo de miembro a partir del email (determinístico).
 */
export function crearDemoMiembro(email) {
  const seed = hashStr(String(email || "demo").toLowerCase());
  const rng = mulberry32(seed || 1);
  const planId = PLAN_IDS[Math.floor(rng() * PLAN_IDS.length)];
  const plan = PLANES_MEMBRESIA[planId];
  const nombre = NOMBRES[Math.floor(rng() * NOMBRES.length)];
  const ciudad = CIUDADES[Math.floor(rng() * CIUDADES.length)];
  const diasActivo = 3 + Math.floor(rng() * 24);
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - diasActivo);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 30);

  const beneficios = [
    {
      id: "crypton",
      titulo: "Yamaha Crypton 0 km + $1.000.000",
      fechas: "17 de octubre · Lotería de Boyacá",
      estado: "activo",
    },
  ];

  return {
    id: `demo-${seed.toString(16)}`,
    email: email || "demo@miembro.club",
    nombre,
    telefono: `3${String(Math.floor(rng() * 9e9)).padStart(9, "0").slice(0, 9)}`,
    ciudad,
    planId: plan.id,
    planNombre: plan.nombre,
    planTag: plan.tag,
    precioLabel: plan.precioLabel,
    clavesCount: plan.claves,
    claves: genClaves(rng, plan.claves),
    estado: "activa",
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
    beneficios,
    descuentosUsados: 0,
  };
}

export const DEMO_MIEMBRO_CREDS = {
  email: "demo@miembro.club",
  password: "demo123",
};

export const SESSION_KEY = "cg-miembro-demo-session";
