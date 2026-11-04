/** Sorteos independientes. Cada uno tiene página, planes, números y mensajes. */

import { campanaParaLanding } from "@/lib/club-gomez/campana-landing";
import { BENEFICIO_CARDS } from "@/lib/club-gomez/stickers";

export const SORTEO_PUBLIC_BASE = "https://clubgomez.co/sorteo";

export const SLUGS_RESERVADOS = new Set([
  "admin",
  "api",
  "miembro",
  "formulario",
  "pago",
  "beneficios",
  "sorteo",
]);

export const FUENTES = {
  bebas: { label: "Bebas (títulos de impacto)", css: "var(--font-bebas), Impact, sans-serif" },
  oswald: { label: "Oswald (compacta)", css: "var(--font-oswald), sans-serif" },
  poppins: { label: "Poppins (texto)", css: "var(--font-poppins), sans-serif" },
};

export const MENSAJE_WHATSAPP_DEFAULT =
  "Hola {nombre}, bienvenido a Daniel Gomez Stunt te informamos que has comprado una boleta con el número {numeros} para {premio}, la cual juega el día {fecha} con las tres últimas cifras de la {loteria}, mucha suerte";

export const CAMPOS_SORTEO = [
  "nombre",
  "slug",
  "estado",
  "es_principal",
  "trabajando",
  "fecha_sorteo",
  "loteria",
  "premio",
  "premio_extra",
  "hero_eyebrow",
  "hero_titulo",
  "hero_titulo_acento",
  "hero_efectivo",
  "hero_cta",
  "hero_img_pc",
  "hero_img_movil",
  "texto_planes",
  "texto_footer",
  "texto_banda",
  "color_fondo",
  "color_texto",
  "color_acento",
  "fuente_titulos",
  "fuente_texto",
  "fondo_imagen",
  "mostrar_testimonios",
  "mostrar_ver_claves",
  "mostrar_banda",
  "mostrar_destacado",
  "fisico_min",
  "fisico_max",
  "web_min",
  "web_max",
  "mensaje_whatsapp",
  "mensaje_correo_asunto",
  "mensaje_correo_cuerpo",
];

const BOOLEANOS = new Set([
  "es_principal",
  "trabajando",
  "mostrar_testimonios",
  "mostrar_ver_claves",
  "mostrar_banda",
  "mostrar_destacado",
]);

const NUMEROS = new Set(["fisico_min", "fisico_max", "web_min", "web_max"]);

export function faltaTablaSorteo(error) {
  const msg = String(error?.message || error || "");
  return /sorteos_rifa|sorteo_planes|sorteo_id|schema cache/i.test(msg);
}

export function slugificar(raw) {
  return String(raw || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function validarSlug(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "El link solo puede llevar letras, números y guiones. Ejemplo: fz-noviembre";
  }
  if (SLUGS_RESERVADOS.has(slug)) {
    return "Ese nombre de link está reservado. Elige otro.";
  }
  return "";
}

export function urlPublicaSorteo(slug) {
  return `${SORTEO_PUBLIC_BASE}/${slug}`;
}

function colorOk(v) {
  return /^#[0-9a-fA-F]{6}$/.test(String(v || ""));
}

export function normalizarSorteo(body) {
  const payload = {};
  for (const campo of CAMPOS_SORTEO) {
    if (!(campo in body)) continue;
    if (BOOLEANOS.has(campo)) {
      payload[campo] = Boolean(body[campo]);
      continue;
    }
    if (NUMEROS.has(campo)) {
      const n = Number(body[campo]);
      if (!Number.isInteger(n) || n < 0 || n > 999) {
        return { error: "Los rangos de números van de 0 a 999." };
      }
      payload[campo] = n;
      continue;
    }
    const v = body[campo] == null ? "" : String(body[campo]).trim();
    payload[campo] = v || null;
  }

  if ("nombre" in payload && !payload.nombre) {
    return { error: "El nombre del sorteo es obligatorio." };
  }
  if ("slug" in payload) {
    payload.slug = slugificar(payload.slug);
    const mal = validarSlug(payload.slug);
    if (mal) return { error: mal };
  }
  if ("estado" in payload && !["borrador", "en_venta", "cerrado"].includes(payload.estado)) {
    return { error: "Estado inválido." };
  }
  if (payload.fecha_sorteo && !/^\d{4}-\d{2}-\d{2}$/.test(payload.fecha_sorteo)) {
    return { error: "La fecha del sorteo no es válida." };
  }
  for (const c of ["color_fondo", "color_texto", "color_acento"]) {
    if (payload[c] && !colorOk(payload[c])) {
      return { error: "Los colores deben ser como #050607." };
    }
  }
  if (payload.fuente_titulos && !FUENTES[payload.fuente_titulos]) {
    return { error: "Esa fuente de títulos no está disponible." };
  }
  if (payload.fuente_texto && !FUENTES[payload.fuente_texto]) {
    return { error: "Esa fuente de texto no está disponible." };
  }
  if ("fotos_destacado" in body) {
    payload.fotos_destacado = (Array.isArray(body.fotos_destacado) ? body.fotos_destacado : [])
      .map((u) => String(u || "").trim())
      .filter(Boolean)
      .slice(0, 6);
  }
  if (
    payload.fisico_min != null &&
    payload.fisico_max != null &&
    payload.fisico_min > payload.fisico_max
  ) {
    return { error: "El rango físico está al revés." };
  }
  if (payload.web_min != null && payload.web_max != null && payload.web_min > payload.web_max) {
    return { error: "El rango web está al revés." };
  }
  if ("bloque_tarjetas" in body) {
    const bloque = limpiarBloqueTarjetas(body.bloque_tarjetas);
    if (bloque?.error) return bloque;
    payload.bloque_tarjetas = bloque;
  }
  if ("premios_extra" in body) {
    const premios = limpiarPremiosExtra(body.premios_extra);
    if (premios?.error) return premios;
    payload.premios_extra = premios;
  }
  return { payload };
}

function fotosPremioExtra(item) {
  const lista = Array.isArray(item?.fotos) ? item.fotos : [];
  const fotos = [];
  for (const raw of [item?.imagen, ...lista]) {
    const url = String(raw || "").trim().slice(0, 400);
    if (!url || fotos.includes(url)) continue;
    fotos.push(url);
    if (fotos.length >= 4) break;
  }
  return fotos;
}

export function limpiarPremiosExtra(raw) {
  if (raw == null || raw === "") return [];
  if (!Array.isArray(raw)) return { error: "Los premios extra no tienen el formato correcto." };
  return raw
    .slice(0, 6)
    .map((item) => {
      const fotos = fotosPremioExtra(item);
      return {
        nombre: String(item?.nombre || "").trim().slice(0, 80),
        detalle: String(item?.detalle || "").trim().slice(0, 160),
        mismo_numero: item?.mismo_numero !== false,
        fotos,
        imagen: fotos[0] || "",
      };
    })
    .filter((item) => item.nombre);
}

function listaNatural(nombres) {
  const lista = nombres.filter(Boolean);
  if (lista.length <= 1) return lista[0] || "";
  if (lista.length === 2) return `${lista[0]} y ${lista[1]}`;
  return `${lista.slice(0, -1).join(", ")} y ${lista[lista.length - 1]}`;
}

export const BLOQUE_TARJETAS_DEFAULT = {
  titulo: "Una membresía",
  acento: "exclusiva",
  bajada: "para disfrutar cada mes de:",
  boton: "Quiero suscribirme",
  items: BENEFICIO_CARDS.map((c) => ({
    titulo: c.title,
    texto: c.desc,
    sticker: c.sticker,
  })),
};

export function limpiarBloqueTarjetas(raw) {
  if (raw == null || raw === "") return null;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return { error: "Las tarjetas no tienen el formato correcto." };
  }
  const items = (Array.isArray(raw.items) ? raw.items : [])
    .slice(0, 4)
    .map((item) => ({
      titulo: String(item?.titulo || "").trim().slice(0, 40),
      texto: String(item?.texto || "").trim().slice(0, 280),
      sticker: String(item?.sticker || "").trim().slice(0, 400),
    }))
    .filter((item) => item.titulo && item.texto && item.sticker);
  if (!items.length) return { error: "Cada tarjeta necesita título, texto y sticker." };
  return {
    titulo: String(raw.titulo || BLOQUE_TARJETAS_DEFAULT.titulo).trim().slice(0, 40),
    acento: String(raw.acento || "").trim().slice(0, 24),
    bajada: String(raw.bajada || "").trim().slice(0, 80),
    boton: String(raw.boton || BLOQUE_TARJETAS_DEFAULT.boton).trim().slice(0, 40),
    items,
  };
}

/** Si Postgres aún no tiene una columna nueva, se quita para no perder el resto del guardado. */
export function payloadSinColumnaQueFalta(payload, error) {
  const msg = String(error?.message || "");
  const hallado = msg.match(/'([a-z0-9_]+)' column/i) || msg.match(/column "([a-z0-9_]+)"/i);
  const col = hallado?.[1];
  if (!col || !Object.prototype.hasOwnProperty.call(payload, col)) return null;
  const next = { ...payload };
  delete next[col];
  return next;
}

export function renderMensaje(plantilla, vars) {
  return String(plantilla || "").replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] == null ? "" : String(vars[k])
  );
}

export function fechaLegible(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  if (!m) return "";
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return `${Number(m[3])} de ${meses[Number(m[2]) - 1]}`;
}

export function temaDeSorteo(s) {
  const fondo = s?.color_fondo || "#050607";
  const texto = s?.color_texto || "#ffffff";
  const acento = s?.color_acento || "#B8E351";
  const fuenteTitulo = FUENTES[s?.fuente_titulos]?.css || FUENTES.bebas.css;
  const fuenteTexto = FUENTES[s?.fuente_texto]?.css || FUENTES.poppins.css;
  return {
    "--cg-lime": acento,
    "--cg-bg": fondo,
    "--cg-texto": texto,
    "--cg-font-titulo": fuenteTitulo,
    "--cg-font-texto": fuenteTexto,
    background: s?.fondo_imagen
      ? `${fondo} url(${s.fondo_imagen}) center/cover`
      : fondo,
    color: texto,
    fontFamily: fuenteTexto,
  };
}

/** Props de la landing pública a partir de un sorteo y sus planes. */
export function propsDeSorteo(s, planes) {
  const premio = s.premio || s.nombre;
  const fecha = fechaLegible(s.fecha_sorteo);
  const extras = Array.isArray(s.premios_extra) ? s.premios_extra : [];
  const nombresPremio = [premio, ...extras.map((p) => p.nombre)].filter(Boolean);
  return {
    campana: campanaParaLanding(sorteoComoCampana(s)),
    tema: temaDeSorteo(s),
    secciones: {
      banda: s.mostrar_banda !== false,
      destacado: s.mostrar_destacado !== false,
      testimonios: s.mostrar_testimonios !== false,
      verClaves: s.mostrar_ver_claves !== false,
    },
    planes: (planes || []).filter((p) => p.activo !== false).map(planPublico),
    introPlanes:
      s.texto_planes ||
      [premio ? `Entras a ${premio}` : "", [fecha, s.loteria].filter(Boolean).join(", ")]
        .filter(Boolean)
        .join(". ")
        .replace(/\.+$/, "") + (premio || fecha || s.loteria ? "." : ""),
    frasePremio: nombresPremio.length ? `Participas por ${listaNatural(nombresPremio)}.` : "",
    premiosExtra: extras,
    premioPrincipal: premio,
    sorteoSlug: s.slug,
    cerrado: s.estado === "cerrado",
    textoBanda: s.texto_banda ? [s.texto_banda, premio, fecha, s.loteria].filter(Boolean) : null,
    bloqueTarjetas: s.bloque_tarjetas || null,
    textoFooter: s.texto_footer || premio,
  };
}

/** Forma que ya entiende el hero y el destacado. */
export function sorteoComoCampana(s) {
  if (!s) return null;
  return {
    hero_eyebrow: s.hero_eyebrow,
    hero_titulo: s.hero_titulo,
    hero_titulo_acento: s.hero_titulo_acento,
    hero_efectivo: s.premio_extra || s.hero_efectivo || "",
    hero_cta: s.hero_cta,
    hero_img_pc: s.hero_img_pc,
    hero_img_movil: s.hero_img_movil,
    fecha_sorteo: s.fecha_sorteo,
    loteria: s.loteria,
    fotos_destacado: s.fotos_destacado || [],
  };
}

export function planPublico(row) {
  const precio = Number(String(row.precio_cop ?? "").replace(/\D/g, "")) || 0;
  const antes = Number(String(row.precio_antes ?? "").replace(/\D/g, ""));
  const recomendado = row.recomendado === true;
  return {
    id: row.id,
    nombre: row.nombre,
    precio,
    precioLabel: precio.toLocaleString("es-CO"),
    precioAntes: antes > precio ? antes.toLocaleString("es-CO") : "",
    claves: Number(row.claves) || 1,
    tag: row.tag || "",
    equiv: row.tag || "",
    recomendado,
    etiqueta: String(row.etiqueta || "").trim(),
    sufijo: String(row.precio_sufijo || "").trim(),
    boton: String(row.boton || "").trim(),
  };
}

export async function leerSorteoPor(supabaseAdmin, filtro) {
  let q = supabaseAdmin.from("sorteos_rifa").select("*");
  if (filtro.id) q = q.eq("id", filtro.id);
  else if (filtro.slug) q = q.eq("slug", filtro.slug);
  else if (filtro.trabajando) q = q.eq("trabajando", true);
  else if (filtro.principal) q = q.eq("es_principal", true);
  const { data, error } = await q.maybeSingle();
  if (error) {
    if (faltaTablaSorteo(error)) return { sorteo: null, faltaTabla: true };
    throw new Error(error.message);
  }
  return { sorteo: data, faltaTabla: false };
}

export async function planesDeSorteo(supabaseAdmin, sorteoId) {
  const { data, error } = await supabaseAdmin
    .from("sorteo_planes")
    .select("*")
    .eq("sorteo_id", sorteoId)
    .order("orden", { ascending: true });
  if (error) {
    if (faltaTablaSorteo(error)) return [];
    throw new Error(error.message);
  }
  return data || [];
}

/** El plan del sorteo también existe en `planes` porque membresías y Bold lo exigen. */
export async function espejarPlan(supabaseAdmin, plan) {
  const { error } = await supabaseAdmin.from("planes").upsert(
    {
      id: plan.id,
      nombre: plan.nombre,
      precio_cop: plan.precio_cop,
      claves: plan.claves,
      tag: plan.tag || null,
      activo: false,
    },
    { onConflict: "id" }
  );
  if (error) throw new Error(error.message);
}
