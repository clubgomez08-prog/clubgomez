"use client";

const STORAGE_KEY = "club-gomez-admin-mockup-v1";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function hoursAgo(n) {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString();
}

export const SEED_DATA = {
  rifas: [
    {
      id: "r1",
      nombre: "Moto Yamaha MT-07 2025",
      estado: "activa",
      precio_boleto: 15000,
      total_numeros: 10000,
      boletos_vendidos: 6842,
      created_at: daysAgo(45),
      descripcion: "Gran rifa de moto deportiva",
      premios_anticipados: [{ nombre: "Casco AGV", numero: 777 }],
      numeros_bendecidos: [{ numero: 333, premio: "Bono $50.000" }],
    },
    {
      id: "r2",
      nombre: "iPhone 16 Pro Max",
      estado: "activa",
      precio_boleto: 8000,
      total_numeros: 5000,
      boletos_vendidos: 2103,
      created_at: daysAgo(12),
      descripcion: "Smartphone última generación",
      premios_anticipados: [],
      numeros_bendecidos: [],
    },
    {
      id: "r3",
      nombre: "Viaje Cartagena Todo Incluido",
      estado: "finalizada",
      precio_boleto: 12000,
      total_numeros: 8000,
      boletos_vendidos: 8000,
      created_at: daysAgo(90),
      descripcion: "Paquete para 2 personas",
      premios_anticipados: [],
      numeros_bendecidos: [],
    },
  ],
  participantes: [
    {
      id: "p1",
      rifa_id: "r1",
      nombre: "Carlos Mendoza",
      email: "carlos.m@email.com",
      telefono: "3001234567",
      cantidad_boletos: 5,
      total_pagado: 75000,
      estado_pago: "aprobado",
      canal: "online",
      created_at: hoursAgo(2),
      boletos: [1042, 2891, 5500, 7234, 9100],
    },
    {
      id: "p2",
      rifa_id: "r1",
      nombre: "María García",
      email: "maria.g@email.com",
      telefono: "3109876543",
      cantidad_boletos: 10,
      total_pagado: 150000,
      estado_pago: "pendiente",
      canal: "online",
      created_at: hoursAgo(5),
      boletos: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
    },
    {
      id: "p3",
      rifa_id: "r2",
      nombre: "Juan Pérez",
      email: "juan.p@email.com",
      telefono: "3205551234",
      cantidad_boletos: 3,
      total_pagado: 24000,
      estado_pago: "aprobado",
      canal: "fisico",
      created_at: hoursAgo(8),
      boletos: [42, 108, 999],
    },
    {
      id: "p4",
      rifa_id: "r1",
      nombre: "Ana Rodríguez",
      email: "ana.r@email.com",
      telefono: "3154448899",
      cantidad_boletos: 2,
      total_pagado: 30000,
      estado_pago: "rechazado",
      canal: "online",
      created_at: daysAgo(1),
      boletos: [4567, 8901],
    },
    {
      id: "p5",
      rifa_id: "r2",
      nombre: "Pedro López",
      email: "pedro.l@email.com",
      telefono: "3187776655",
      cantidad_boletos: 20,
      total_pagado: 160000,
      estado_pago: "aprobado",
      canal: "online",
      created_at: daysAgo(2),
      boletos: Array.from({ length: 20 }, (_, i) => 100 + i),
    },
    {
      id: "p6",
      rifa_id: "r1",
      nombre: "Laura Torres",
      email: "laura.t@email.com",
      telefono: "3012223344",
      cantidad_boletos: 8,
      total_pagado: 120000,
      estado_pago: "aprobado",
      canal: "fisico",
      created_at: daysAgo(3),
      boletos: [111, 222, 333, 444, 555, 666, 777, 888],
    },
  ],
  landing: {
    banner_izquierda: "",
    banner_derecha: "",
    whatsapp_numero: "573001234567",
    whatsapp_activo: true,
  },
  sorteos: [
    {
      id: "s1",
      rifa_id: "r3",
      numero_ganador: 4521,
      ganador_nombre: "Diego Ramírez",
      ganador_email: "diego.r@email.com",
      created_at: daysAgo(5),
      notificado: true,
    },
  ],
  actividad: [
    { id: "a1", tipo: "pago_aprobado", usuario: "Admin", detalle: "Aprobó pago de Carlos Mendoza", created_at: hoursAgo(2) },
    { id: "a2", tipo: "venta_fisica", usuario: "Admin", detalle: "Registró venta física — Laura Torres (8 boletos)", created_at: hoursAgo(4) },
    { id: "a3", tipo: "rifa_editada", usuario: "Admin", detalle: "Actualizó precio de Moto Yamaha MT-07", created_at: daysAgo(1) },
    { id: "a4", tipo: "campana", usuario: "Sistema", detalle: "Campaña WhatsApp enviada a 342 contactos", created_at: daysAgo(2) },
    { id: "a5", tipo: "sorteo", usuario: "Admin", detalle: "Sorteo ejecutado — Viaje Cartagena #4521", created_at: daysAgo(5) },
  ],
  equipo: [
    { id: "u1", nombre: "Admin Principal", email: "admin@clubgomez.com", rol: "superadmin", activo: true, ultimo_acceso: hoursAgo(1) },
    { id: "u2", nombre: "Operador Ventas", email: "ventas@clubgomez.com", rol: "operador", activo: true, ultimo_acceso: hoursAgo(6) },
    { id: "u3", nombre: "Soporte", email: "soporte@clubgomez.com", rol: "soporte", activo: false, ultimo_acceso: daysAgo(3) },
  ],
  campanas: [
    { id: "c1", nombre: "Recordatorio pago pendiente", canal: "whatsapp", estado: "activa", enviados: 342, abiertos: 198, conversiones: 23, created_at: daysAgo(3) },
    { id: "c2", nombre: "Nueva rifa iPhone — lanzamiento", canal: "email", estado: "completada", enviados: 1200, abiertos: 680, conversiones: 89, created_at: daysAgo(10) },
    { id: "c3", nombre: "Últimos boletos Moto", canal: "whatsapp", estado: "borrador", enviados: 0, abiertos: 0, conversiones: 0, created_at: daysAgo(0) },
  ],
  automatizaciones: [
    { id: "auto1", nombre: "Aprobar pagos Mercado Pago", trigger: "pago_confirmado", accion: "aprobar_automatico", activa: true },
    { id: "auto2", nombre: "Recordatorio 24h pendiente", trigger: "pago_pendiente_24h", accion: "enviar_whatsapp", activa: true },
    { id: "auto3", nombre: "Alerta 90% vendido", trigger: "boletos_90pct", accion: "notificar_admin", activa: false },
  ],
  notificaciones: [
    { id: "n1", titulo: "5 pagos pendientes", mensaje: "Hay participantes esperando aprobación", leida: false, tipo: "warning", created_at: hoursAgo(1) },
    { id: "n2", titulo: "Rifa al 68% vendida", mensaje: "Moto Yamaha MT-07 superó el 65% de ventas", leida: false, tipo: "info", created_at: hoursAgo(3) },
    { id: "n3", titulo: "Campaña completada", mensaje: "Lanzamiento iPhone — 89 conversiones", leida: true, tipo: "success", created_at: daysAgo(1) },
  ],
  ventasDiarias: [
    { dia: "Lun", ventas: 420000 },
    { dia: "Mar", ventas: 680000 },
    { dia: "Mié", ventas: 510000 },
    { dia: "Jue", ventas: 890000 },
    { dia: "Vie", ventas: 1200000 },
    { dia: "Sáb", ventas: 950000 },
    { dia: "Dom", ventas: 730000 },
  ],
};

function loadStore() {
  if (typeof window === "undefined") return structuredClone(SEED_DATA);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(SEED_DATA);
    return JSON.parse(raw);
  } catch {
    return structuredClone(SEED_DATA);
  }
}

function saveStore(data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("mock-admin-update"));
}

export function getMockStore() {
  return loadStore();
}

export function resetMockStore() {
  saveStore(structuredClone(SEED_DATA));
}

export function logActividad(tipo, detalle, usuario = "Admin") {
  const store = loadStore();
  store.actividad.unshift({
    id: uid(),
    tipo,
    usuario,
    detalle,
    created_at: new Date().toISOString(),
  });
  store.actividad = store.actividad.slice(0, 50);
  saveStore(store);
}

export function getRifas() {
  return loadStore().rifas;
}

export function getRifa(id) {
  return loadStore().rifas.find((r) => r.id === id) || null;
}

export function createRifa(data) {
  const store = loadStore();
  const rifa = {
    id: uid(),
    estado: "activa",
    boletos_vendidos: 0,
    created_at: new Date().toISOString(),
    premios_anticipados: [],
    numeros_bendecidos: [],
    ...data,
  };
  store.rifas.unshift(rifa);
  saveStore(store);
  logActividad("rifa_creada", `Creó rifa "${rifa.nombre}"`);
  return rifa;
}

export function updateRifa(id, data) {
  const store = loadStore();
  const idx = store.rifas.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  store.rifas[idx] = { ...store.rifas[idx], ...data };
  saveStore(store);
  logActividad("rifa_editada", `Actualizó rifa "${store.rifas[idx].nombre}"`);
  return store.rifas[idx];
}

export function deleteRifa(id) {
  const store = loadStore();
  const rifa = store.rifas.find((r) => r.id === id);
  store.rifas = store.rifas.filter((r) => r.id !== id);
  saveStore(store);
  if (rifa) logActividad("rifa_eliminada", `Eliminó rifa "${rifa.nombre}"`);
}

export function getParticipantes(filtros = {}) {
  let list = [...loadStore().participantes];
  if (filtros.rifa_id) list = list.filter((p) => p.rifa_id === filtros.rifa_id);
  if (filtros.estado) list = list.filter((p) => p.estado_pago === filtros.estado);
  if (filtros.buscar) {
    const q = filtros.buscar.toLowerCase();
    list = list.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.telefono.includes(q)
    );
  }
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const page = filtros.page || 1;
  const size = filtros.pageSize || 20;
  const total = list.length;
  const start = (page - 1) * size;
  return { participantes: list.slice(start, start + size), total, paginas: Math.ceil(total / size) };
}

export function aprobarParticipante(id) {
  const store = loadStore();
  const p = store.participantes.find((x) => x.id === id);
  if (!p) return null;
  p.estado_pago = "aprobado";
  saveStore(store);
  logActividad("pago_aprobado", `Aprobó pago de ${p.nombre}`);
  return p;
}

export function rechazarParticipante(id) {
  const store = loadStore();
  const p = store.participantes.find((x) => x.id === id);
  if (!p) return null;
  p.estado_pago = "rechazado";
  saveStore(store);
  logActividad("pago_rechazado", `Rechazó pago de ${p.nombre}`);
  return p;
}

export function crearVentaFisica(data) {
  const store = loadStore();
  const rifa = store.rifas.find((r) => r.id === data.rifa_id);
  const participante = {
    id: uid(),
    rifa_id: data.rifa_id,
    nombre: data.nombre,
    email: data.email || "",
    telefono: data.telefono,
    cantidad_boletos: data.cantidad_boletos,
    total_pagado: data.cantidad_boletos * (rifa?.precio_boleto || 0),
    estado_pago: "aprobado",
    canal: "fisico",
    created_at: new Date().toISOString(),
    boletos: data.boletos || [],
  };
  store.participantes.unshift(participante);
  if (rifa) rifa.boletos_vendidos += data.cantidad_boletos;
  saveStore(store);
  logActividad("venta_fisica", `Registró venta física — ${data.nombre} (${data.cantidad_boletos} boletos)`);
  return participante;
}

export function ejecutarSorteo(rifaId) {
  const store = loadStore();
  const rifa = store.rifas.find((r) => r.id === rifaId);
  if (!rifa) return null;
  const aprobados = store.participantes.filter(
    (p) => p.rifa_id === rifaId && p.estado_pago === "aprobado"
  );
  if (aprobados.length === 0) return null;
  const ganador = aprobados[Math.floor(Math.random() * aprobados.length)];
  const numero = ganador.boletos[Math.floor(Math.random() * ganador.boletos.length)] || 1;
  const sorteo = {
    id: uid(),
    rifa_id: rifaId,
    numero_ganador: numero,
    ganador_nombre: ganador.nombre,
    ganador_email: ganador.email,
    created_at: new Date().toISOString(),
    notificado: false,
  };
  store.sorteos.unshift(sorteo);
  rifa.estado = "finalizada";
  saveStore(store);
  logActividad("sorteo", `Sorteo ejecutado — ${rifa.nombre} #${numero}`);
  return sorteo;
}

export function getStats() {
  const store = loadStore();
  const aprobados = store.participantes.filter((p) => p.estado_pago === "aprobado");
  const ventasTotales = aprobados.reduce((a, p) => a + p.total_pagado, 0);
  const boletosVendidos = aprobados.reduce((a, p) => a + p.cantidad_boletos, 0);
  const activas = store.rifas.filter((r) => r.estado === "activa");
  const recaudacionPorRifa = activas.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    total: aprobados.filter((p) => p.rifa_id === r.id).reduce((a, p) => a + p.total_pagado, 0),
  }));
  return {
    rifasActivas: activas.length,
    participantes: aprobados.length,
    ventasTotales,
    boletosVendidos,
    pendientes: store.participantes.filter((p) => p.estado_pago === "pendiente").length,
    rechazados: store.participantes.filter((p) => p.estado_pago === "rechazado").length,
    recaudacionPorRifa,
    ultimosParticipantes: [...store.participantes]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map((p) => ({
        ...p,
        rifas: { nombre: store.rifas.find((r) => r.id === p.rifa_id)?.nombre || "—" },
      })),
    ventasDiarias: store.ventasDiarias,
    actividad: store.actividad.slice(0, 8),
    notificacionesNoLeidas: store.notificaciones.filter((n) => !n.leida).length,
  };
}

export function getLanding() {
  return loadStore().landing;
}

export function updateLanding(data) {
  const store = loadStore();
  store.landing = { ...store.landing, ...data };
  saveStore(store);
  logActividad("landing", "Actualizó configuración de landing");
  return store.landing;
}

export function getEquipo() {
  return loadStore().equipo;
}

export function updateMiembroEquipo(id, data) {
  const store = loadStore();
  const idx = store.equipo.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  store.equipo[idx] = { ...store.equipo[idx], ...data };
  saveStore(store);
  return store.equipo[idx];
}

export function crearMiembroEquipo(data) {
  const store = loadStore();
  const miembro = { id: uid(), activo: true, ultimo_acceso: new Date().toISOString(), ...data };
  store.equipo.push(miembro);
  saveStore(store);
  logActividad("equipo", `Agregó miembro ${data.nombre}`);
  return miembro;
}

export function getCampanas() {
  return loadStore().campanas;
}

export function crearCampana(data) {
  const store = loadStore();
  const campana = {
    id: uid(),
    estado: "borrador",
    enviados: 0,
    abiertos: 0,
    conversiones: 0,
    created_at: new Date().toISOString(),
    ...data,
  };
  store.campanas.unshift(campana);
  saveStore(store);
  logActividad("campana", `Creó campaña "${campana.nombre}"`);
  return campana;
}

export function lanzarCampana(id) {
  const store = loadStore();
  const c = store.campanas.find((x) => x.id === id);
  if (!c) return null;
  c.estado = "activa";
  c.enviados = Math.floor(Math.random() * 500) + 100;
  c.abiertos = Math.floor(c.enviados * 0.6);
  c.conversiones = Math.floor(c.abiertos * 0.12);
  saveStore(store);
  logActividad("campana", `Campaña "${c.nombre}" enviada a ${c.enviados} contactos`);
  return c;
}

export function getAutomatizaciones() {
  return loadStore().automatizaciones;
}

export function toggleAutomatizacion(id) {
  const store = loadStore();
  const a = store.automatizaciones.find((x) => x.id === id);
  if (!a) return null;
  a.activa = !a.activa;
  saveStore(store);
  logActividad("automatizacion", `${a.activa ? "Activó" : "Desactivó"} "${a.nombre}"`);
  return a;
}

export function getNotificaciones() {
  return loadStore().notificaciones;
}

export function marcarNotificacionLeida(id) {
  const store = loadStore();
  const n = store.notificaciones.find((x) => x.id === id);
  if (n) n.leida = true;
  saveStore(store);
}

export function getActividad() {
  return loadStore().actividad;
}

export function getSorteos() {
  return loadStore().sorteos;
}
