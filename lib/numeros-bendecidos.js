const RE_NUMERO_BENDECIDO = /^\d{4}-\d{2}$/;
const MAX_BENDECIDOS = 20;

/**
 * Normaliza números bendecidos desde BD o body (strings u objetos).
 * @param {unknown} raw
 * @returns {{ numero: string, bloqueado: boolean }[]}
 */
export function parseNumerosBendecidos(raw) {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return [];

  const out = [];
  const seen = new Set();

  for (const item of raw) {
    let numero;
    let bloqueado = false;

    if (item != null && typeof item === "object" && !Array.isArray(item)) {
      numero = String(item.numero ?? "").trim();
      bloqueado = Boolean(item.bloqueado);
    } else {
      numero = String(item ?? "").trim();
      bloqueado = false;
    }

    if (!RE_NUMERO_BENDECIDO.test(numero)) continue;
    if (seen.has(numero)) continue;
    seen.add(numero);
    out.push({ numero, bloqueado });
    if (out.length >= MAX_BENDECIDOS) break;
  }

  return out;
}

/**
 * Solo números con bloqueado === false (pueden salir en asignación aleatoria / premio activo).
 * @param {{ numero: string, bloqueado: boolean }[]} lista
 * @returns {string[]}
 */
export function getNumerosActivos(lista) {
  if (!Array.isArray(lista)) return [];
  return lista
    .filter((n) => n && !n.bloqueado)
    .map((n) => n.numero);
}

/**
 * Todos los números bendecidos como strings, sin importar bloqueo.
 * @param {({ numero: string, bloqueado: boolean }|string)[]} lista
 * @returns {string[]}
 */
export function getNumerosString(lista) {
  if (!Array.isArray(lista)) return [];
  return lista
    .map((n) =>
      typeof n === "string"
        ? String(n).trim()
        : String(n?.numero ?? "").trim()
    )
    .filter(Boolean);
}
