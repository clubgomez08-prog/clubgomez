/** Fecha de nacimiento / cumpleaños */

/**
 * @param {unknown} raw
 * @returns {string|null} YYYY-MM-DD o null
 */
export function parseFechaNacimiento(raw) {
  const s = String(raw || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;

  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }

  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  if (date.getTime() > todayUtc) return null;
  if (y < 1920) return null;

  // Edad mínima 12 (club familiar / razonable)
  const age =
    now.getUTCFullYear() -
    y -
    (now.getUTCMonth() + 1 < m ||
    (now.getUTCMonth() + 1 === m && now.getUTCDate() < d)
      ? 1
      : 0);
  if (age < 12) return null;

  return s;
}

/**
 * Mes/día de hoy en America/Bogota.
 * @returns {{ month: number, day: number, year: number }}
 */
export function hoyEnBogota() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type) =>
    Number(parts.find((p) => p.type === type)?.value || 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
  };
}
