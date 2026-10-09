/** Inicio y fin del periodo "YYYY-MM" en hora de Colombia (UTC-5, sin horario de verano). */
export function rangoPeriodoBogota(periodo) {
  const [y, m] = periodo.split("-").map(Number);
  const sigY = m === 12 ? y + 1 : y;
  const sigM = m === 12 ? 1 : m + 1;
  const pad = (n) => String(n).padStart(2, "0");
  return {
    desde: `${y}-${pad(m)}-01T00:00:00-05:00`,
    hasta: `${sigY}-${pad(sigM)}-01T00:00:00-05:00`,
  };
}
