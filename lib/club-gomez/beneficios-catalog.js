/** Catálogo de premios Club Gómez — fuente única para homepage + panel admin */

export const MESES_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** YYYY-MM-DD → "6 de octubre" */
export function formatFechaEs(isoDate) {
  const raw = String(isoDate || "").slice(0, 10);
  const [y, m, d] = raw.split("-");
  if (!y || !m || !d) return raw || "—";
  const mes = MESES_ES[Number(m) - 1] || m;
  return `${Number(d)} de ${mes}`;
}

export function labelPeriodoEs(periodo) {
  const [y, m] = String(periodo || "").split("-");
  if (!y || !m) return periodo || "";
  const mes = MESES_ES[Number(m) - 1] || m;
  return `${mes} de ${y}`;
}

export function beneficioSrc(imagenKey) {
  return `/club-gomez/${imagenKey}.png`;
}

/**
 * Premios del mes (marketing + operación).
 * Cada `fechasIso` genera una fila en sorteos_beneficio.
 */
export const CATALOGO_PREMIOS = [
  {
    slug: "nevera",
    nombre: "Nevera MABE No Frost Congelador Superior 297 Litros",
    imagenKey: "beneficio-nevera",
    labelPlaceholder: "Nevera MABE 297L",
    destacado: false,
    fechasIso: ["2026-10-06", "2026-10-22"],
  },
  {
    slug: "estufa",
    nombre: "Estufa de Piso MABE 4 Puestos Gas Natural",
    imagenKey: "beneficio-estufa",
    labelPlaceholder: "Estufa MABE 4 puestos",
    destacado: false,
    fechasIso: ["2026-10-07", "2026-10-15", "2026-10-28"],
  },
  {
    slug: "lavadora",
    nombre: "Lavadora KALLEY Carga Superior 12 Kilos",
    imagenKey: "beneficio-lavadora",
    labelPlaceholder: "Lavadora KALLEY 12kg",
    destacado: false,
    fechasIso: ["2026-10-08", "2026-10-20", "2026-10-30"],
  },
  {
    slug: "bici",
    nombre: "Bicicleta Profit Jasper Rin 29",
    imagenKey: "beneficio-bici",
    labelPlaceholder: "Bicicleta Profit Jasper",
    destacado: false,
    fechasIso: ["2026-10-09", "2026-10-16", "2026-10-24"],
  },
  {
    slug: "parlante",
    nombre: "Parlante KALLEY K-SPK300D Negro",
    imagenKey: "beneficio-parlante",
    labelPlaceholder: "Parlante KALLEY",
    destacado: false,
    fechasIso: ["2026-10-10", "2026-10-22", "2026-10-29"],
  },
  {
    slug: "tv",
    nombre: 'TV KALLEY 50" 4K-UHD Smart TV',
    imagenKey: "beneficio-tv",
    labelPlaceholder: 'TV KALLEY 50"',
    destacado: false,
    fechasIso: ["2026-10-14", "2026-10-21"],
  },
  {
    slug: "laptop",
    nombre: 'Portátil LENOVO IdeaPad Slim 3 15.3" i5 / 8GB / 512GB',
    imagenKey: "beneficio-laptop",
    labelPlaceholder: "Lenovo IdeaPad Slim 3",
    destacado: false,
    fechasIso: ["2026-10-13", "2026-10-24"],
  },
  {
    slug: "moto-110",
    nombre: "Motocicleta AKT Special 110 X",
    imagenKey: "beneficio-moto-110",
    labelPlaceholder: "AKT Special 110 X",
    destacado: true,
    fechasIso: ["2026-10-17"],
  },
  {
    slug: "moto-125",
    nombre: "Motocicleta AKT NKD 125",
    imagenKey: "beneficio-moto-125",
    labelPlaceholder: "AKT NKD 125",
    destacado: true,
    fechasIso: ["2026-10-31"],
  },
];

export const DESTACADO_MES_META = {
  id: "motos",
  titulo: "2 MOTOS AKT",
  subtitulo: "Special 110 X + NKD 125",
  imagenPc: "/club-gomez/beneficio-motos.png",
  imagenMovil: "/club-gomez/beneficio-motos-movil.png",
  slugs: ["moto-110", "moto-125"],
};

export const BENEFICIOS_CLOVER = [
  {
    id: "nevera",
    nombre: "Nevera MABE",
    imagenKey: "beneficio-nevera",
    labelPlaceholder: "Nevera MABE",
  },
  {
    id: "tv",
    nombre: 'TV 50" KALLEY',
    imagenKey: "beneficio-tv",
    labelPlaceholder: 'TV KALLEY 50"',
  },
  {
    id: "bici",
    nombre: "Bicicleta Profit",
    imagenKey: "beneficio-bici",
    labelPlaceholder: "Bicicleta rin 29",
  },
  {
    id: "laptop",
    nombre: "Lenovo IdeaPad",
    imagenKey: "beneficio-laptop",
    labelPlaceholder: "Laptop Lenovo",
  },
];

/** Filas listas para insertar en sorteos_beneficio */
export function filasSeedCatalogo(periodo = "2026-10") {
  const rows = [];
  for (const item of CATALOGO_PREMIOS) {
    for (const fecha of item.fechasIso) {
      if (!String(fecha).startsWith(periodo)) continue;
      rows.push({
        periodo,
        fecha_sorteo: fecha,
        premio: item.nombre,
        descripcion: `Homepage · ${item.slug}`,
        slug: item.slug,
        imagen_key: item.imagenKey,
        destacado: Boolean(item.destacado),
        loteria: "Motilón Noche",
        estado: "programado",
      });
    }
  }
  return rows;
}

/** Agrupa filas DB → cards de homepage */
export function agruparPremiosDesdeFilas(filas = []) {
  const bySlug = new Map();

  for (const row of filas) {
    const catalog =
      CATALOGO_PREMIOS.find((c) => c.slug === row.slug) ||
      CATALOGO_PREMIOS.find((c) => c.nombre === row.premio);

    const slug = row.slug || catalog?.slug || row.id;
    const nombre = row.premio || catalog?.nombre || "Premio";
    const imagenKey = row.imagen_key || catalog?.imagenKey || null;
    const destacado = Boolean(row.destacado ?? catalog?.destacado);

    if (!bySlug.has(slug)) {
      bySlug.set(slug, {
        id: slug,
        slug,
        nombre,
        imagenKey,
        labelPlaceholder: catalog?.labelPlaceholder || nombre,
        destacado,
        fechasIso: [],
        fechas: [],
        filas: [],
      });
    }
    const g = bySlug.get(slug);
    const iso = String(row.fecha_sorteo).slice(0, 10);
    if (iso && !g.fechasIso.includes(iso)) {
      g.fechasIso.push(iso);
      g.fechas.push(formatFechaEs(iso));
    }
    g.filas.push(row);
  }

  for (const g of bySlug.values()) {
    g.fechasIso.sort();
    g.fechas = g.fechasIso.map(formatFechaEs);
  }

  const items = [...bySlug.values()].sort((a, b) => {
    const da = a.fechasIso[0] || "";
    const db = b.fechasIso[0] || "";
    return da.localeCompare(db);
  });

  const fechasDestacado = items
    .filter((i) => DESTACADO_MES_META.slugs.includes(i.slug) || i.destacado)
    .flatMap((i) => i.fechasIso);
  fechasDestacado.sort();

  const destacado = {
    ...DESTACADO_MES_META,
    fechas: [...new Set(fechasDestacado)].map(formatFechaEs),
    fechasIso: [...new Set(fechasDestacado)],
  };

  const grid = items.filter(
    (i) => !DESTACADO_MES_META.slugs.includes(i.slug)
  );

  return { items, grid, destacado };
}

/** Fallback offline si no hay DB / seed */
export function beneficiosFallbackDesdeCatalogo(periodo = "2026-10") {
  const filas = filasSeedCatalogo(periodo).map((r, i) => ({
    ...r,
    id: `fallback-${i}`,
  }));
  return agruparPremiosDesdeFilas(filas);
}

// Compat con imports antiguos
export const DESTACADO_MES = {
  ...DESTACADO_MES_META,
  fechas: ["17 de octubre", "31 de octubre"],
};

export const BENEFICIOS_MES = CATALOGO_PREMIOS.filter(
  (c) => !DESTACADO_MES_META.slugs.includes(c.slug)
).map((c) => ({
  id: c.slug,
  nombre: c.nombre,
  fechas: c.fechasIso.map(formatFechaEs),
  imagenKey: c.imagenKey,
  labelPlaceholder: c.labelPlaceholder,
}));
