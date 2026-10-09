/** Textos e imágenes del premio principal en la landing (hero + destacado). Seguro para cliente. */

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** Lo que muestra la landing hoy (Crypton). Respaldo ante cualquier falla. */
export const CAMPANA_LANDING_DEFAULT = {
  heroEyebrow: "0 km · la nueva moto del Club",
  heroTitulo: "YAMAHA",
  heroTituloAcento: "CRYPTON",
  heroEfectivo: "+ $1.000.000 EN EFECTIVO",
  heroCta: "¡Participar!",
  heroImgPc: "/club-gomez/hero-crypton-pc.png",
  heroImgMovil: "/club-gomez/hero-crypton-movil.jpg",
  fechaSorteo: "2026-10-17",
  loteria: "Lotería de Boyacá",
  fotos: [
    { src: "/club-gomez/daniel-crypton.jpg", alt: "Daniel con la Yamaha Crypton" },
    { src: "/club-gomez/crypton-frente-sol.jpg", alt: "Yamaha Crypton" },
    { src: "/club-gomez/crypton-trasera-sol.jpg", alt: "Yamaha Crypton" },
  ],
  pill: "0 kilómetros",
  destacadoFecha: "17 de octubre · Lotería de Boyacá",
  destacadoPremio: "Yamaha Crypton",
  destacadoEfectivo: "+ $1.000.000 en efectivo",
  destacadoKicker:
    "Crypton 0 km más $1.000.000 en efectivo. 17 de octubre, Lotería de Boyacá.",
};

const D = CAMPANA_LANDING_DEFAULT;

function txt(v) {
  return String(v ?? "").trim();
}

function fechaLarga(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  if (!m) return "";
  return `${Number(m[3])} de ${MESES[Number(m[2]) - 1]}`;
}

function tituloNormal(s) {
  return txt(s)
    .toLowerCase()
    .replace(/(^|\s)(\S)/g, (_, sp, c) => sp + c.toUpperCase());
}

/** "+ $1.000.000 EN EFECTIVO" → { monto: "+ $1.000.000", resto: " EN EFECTIVO" } */
export function partirEfectivo(efectivo) {
  const s = txt(efectivo);
  const m = /^(\+?\s*\$\s*[\d.,]+)(.*)$/.exec(s);
  return m ? { monto: m[1], resto: m[2] } : { monto: s, resto: "" };
}

/**
 * Mezcla la fila de `campanas` con los valores de hoy: cualquier campo vacío usa el respaldo,
 * salvo el premio extra (vacío = sin efectivo, como indica el panel).
 * Si el premio, la fecha y la lotería son los de hoy, se conservan los textos actuales tal cual.
 */
export function campanaParaLanding(fila) {
  if (!fila || typeof fila !== "object") return D;

  const c = {
    heroEyebrow: txt(fila.hero_eyebrow) || D.heroEyebrow,
    heroTitulo: txt(fila.hero_titulo) || D.heroTitulo,
    heroTituloAcento: txt(fila.hero_titulo_acento) || D.heroTituloAcento,
    heroEfectivo: txt(fila.hero_efectivo),
    heroCta: txt(fila.hero_cta) || D.heroCta,
    heroImgPc: txt(fila.hero_img_pc) || D.heroImgPc,
    heroImgMovil: txt(fila.hero_img_movil) || txt(fila.hero_img_pc) || D.heroImgMovil,
    fechaSorteo: txt(fila.fecha_sorteo).slice(0, 10) || D.fechaSorteo,
    loteria: txt(fila.loteria) || D.loteria,
  };

  const mismoPremio =
    c.heroTitulo === D.heroTitulo &&
    c.heroTituloAcento === D.heroTituloAcento &&
    c.heroEfectivo === D.heroEfectivo &&
    c.fechaSorteo === D.fechaSorteo &&
    c.loteria === D.loteria;

  const premio = tituloNormal(`${c.heroTitulo} ${c.heroTituloAcento}`);
  const urls = Array.isArray(fila.fotos_destacado)
    ? fila.fotos_destacado.map(txt).filter(Boolean)
    : [];
  const mismasFotos =
    urls.length === D.fotos.length && urls.every((u, i) => u === D.fotos[i].src);
  const fotos = !urls.length || mismasFotos
    ? D.fotos
    : urls.map((src) => ({ src, alt: premio }));

  if (mismoPremio) {
    return { ...D, ...c, fotos };
  }

  const fecha = fechaLarga(c.fechaSorteo);
  const efectivoMin = c.heroEfectivo.toLowerCase();
  const { monto } = partirEfectivo(c.heroEfectivo);
  const fechaLoteria = [fecha, c.loteria].filter(Boolean);

  return {
    ...c,
    fotos,
    pill: "",
    destacadoFecha: fechaLoteria.join(" · "),
    destacadoPremio: premio,
    destacadoEfectivo: efectivoMin,
    destacadoKicker:
      `${premio}${monto ? ` más ${monto.replace(/^\+\s*/, "")} en efectivo` : ""}.` +
      (fechaLoteria.length ? ` ${fechaLoteria.join(", ")}.` : ""),
  };
}
