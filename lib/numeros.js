import { supabaseAdmin } from "@/lib/supabase";

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
  for (let i = 0; i < cantidad; i++) {
    const serie = (i).toString().padStart(seriesLength, "0");
    const numero = (0).toString().padStart(numeroLength, "0");
    numeros.push(`${serie}-${numero}`);
  }
  return numeros;
}

/**
 * Asigna números de boleto a un participante tras pago aprobado.
 * Formato: "0473-00" (serie de 4 dígitos + número 00).
 * Usa serie_actual de la rifa para evitar duplicados.
 * @param {string} rifaId - ID de la rifa
 * @param {string} participanteId - ID del participante
 * @param {number} cantidad - Cantidad de boletos a asignar
 * @returns {Promise<string[]>} Array de números asignados
 */
export async function asignarNumerosParticipante(rifaId, participanteId, cantidad) {
  const { data: rifa, error: rifaError } = await supabaseAdmin
    .from("rifas")
    .select("serie_actual, total_numeros")
    .eq("id", rifaId)
    .single();

  if (rifaError || !rifa) {
    throw new Error("Rifa no encontrada");
  }

  let serieActual = rifa.serie_actual ?? 0;
  const totalNumeros = rifa.total_numeros ?? 10000;
  const seriesLength = 4;
  const numeroLength = 2;

  const numeros = [];
  for (let i = 0; i < cantidad; i++) {
    const serieStr = (serieActual + i).toString().padStart(seriesLength, "0");
    const numeroStr = "00";
    numeros.push(`${serieStr}-${numeroStr}`);
  }

  if (serieActual + cantidad > totalNumeros) {
    throw new Error("No hay suficientes números disponibles en la rifa");
  }

  const boletos = numeros.map((numero) => ({
    rifa_id: rifaId,
    participante_id: participanteId,
    numero,
  }));

  const { error: insertError } = await supabaseAdmin
    .from("boletos")
    .insert(boletos);

  if (insertError) {
    throw new Error(insertError.message);
  }

  await supabaseAdmin
    .from("rifas")
    .update({ serie_actual: serieActual + cantidad })
    .eq("id", rifaId);

  return numeros;
}
