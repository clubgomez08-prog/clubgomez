/**
 * Genera números de boleto en formato serie-numero (0000-00, 0001-00...)
 * @param {string} rifaId - ID de la rifa
 * @param {number} cantidad - Cantidad de números a asignar
 * @param {number} seriesLength - Dígitos de la serie (default 4)
 * @param {number} numeroLength - Dígitos del número (default 2)
 * @returns {string[]} Array de números asignados
 */
export function asignarNumeros(rifaId, cantidad, seriesLength = 4, numeroLength = 2) {
  const numeros = [];
  const seriePad = "0".repeat(seriesLength);
  const numeroPad = "0".repeat(numeroLength);

  // Obtener siguiente serie disponible (en DB se haría consulta real)
  // Por ahora: generar secuencial desde 0000-00
  const inicio = 0;

  for (let i = 0; i < cantidad; i++) {
    const serie = (inicio + i).toString().padStart(seriesLength, "0");
    const numero = (0).toString().padStart(numeroLength, "0"); // 00 por defecto
    numeros.push(`${serie}-${numero}`);
  }

  return numeros;
}
