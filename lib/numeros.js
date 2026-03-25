import { supabaseAdmin } from "@/lib/supabase";

/** Máximo de combinaciones distintas: 0000-00 … 9999-99 → 10_000 × 100 */
const MAX_COMBINACIONES_BOLETO = 10000 * 100;

/**
 * Genera números de boleto en formato serie-numero (0000-00, 0001-00...)
 * @param {string} rifaId - ID de la rifa
 * @param {number} cantidad - Cantidad de números a asignar
 * @param {number} seriesLength - Dígitos de la serie (default 4)
 * @param {number} numeroLength - Dígitos del número (default 2)
 * @returns {string[]} Array de números asignados
 */
// deprecated — Lógica secuencial reemplazada por asignarNumerosParticipante (aleatorio). Se conserva por compatibilidad.
export function asignarNumeros(rifaId, cantidad, seriesLength = 4, numeroLength = 2) {
  const numeros = [];
  for (let i = 0; i < cantidad; i++) {
    const serie = i.toString().padStart(seriesLength, "0");
    const numero = (0).toString().padStart(numeroLength, "0");
    numeros.push(`${serie}-${numero}`);
  }
  return numeros;
}

function generarNumeroAleatorioBoleto() {
  const parte1 = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  const parte2 = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0");
  return `${parte1}-${parte2}`;
}

/**
 * Asigna números de boleto aleatorios únicos por rifa tras pago aprobado.
 * Formato: "2847-63" (4 dígitos aleatorios + 2 dígitos serial aleatorios).
 * @param {string} rifaId - ID de la rifa
 * @param {string} participanteId - ID del participante
 * @param {number} cantidad - Cantidad de boletos a asignar
 * @returns {Promise<string[]>} Array de números asignados
 */
export async function asignarNumerosParticipante(rifaId, participanteId, cantidad) {
  if (!rifaId || !participanteId || cantidad == null || Number(cantidad) < 1) {
    throw new Error("Parámetros inválidos para asignar boletos");
  }

  const n = Number(cantidad);

  const { data: rifaRow, error: rifaError } = await supabaseAdmin
    .from("rifas")
    .select("id")
    .eq("id", rifaId)
    .single();

  if (rifaError || !rifaRow) {
    throw new Error("Rifa no encontrada");
  }

  const { data: yaDelParticipante, error: yaError } = await supabaseAdmin
    .from("boletos")
    .select("numero")
    .eq("participante_id", participanteId)
    .eq("rifa_id", rifaId)
    .order("numero");

  if (yaError) {
    throw new Error(yaError.message);
  }

  const numerosYa = (yaDelParticipante || []).map((r) => r.numero).filter(Boolean);
  if (numerosYa.length >= n) {
    return numerosYa;
  }

  const falta = n - numerosYa.length;

  const { data: existentesRows, error: selectError } = await supabaseAdmin
    .from("boletos")
    .select("numero")
    .eq("rifa_id", rifaId);

  if (selectError) {
    throw new Error(selectError.message);
  }

  const usados = new Set(
    (existentesRows || []).map((r) => r.numero).filter(Boolean)
  );

  if (usados.size + falta > MAX_COMBINACIONES_BOLETO) {
    throw new Error(
      "No hay suficientes números disponibles en la rifa (límite 1.000.000 de combinaciones únicas)"
    );
  }

  const asignados = [];
  const MAX_INTENTOS_POR_BOLETO = 100000;

  for (let i = 0; i < falta; i++) {
    let candidato;
    let intentos = 0;
    do {
      candidato = generarNumeroAleatorioBoleto();
      intentos++;
      if (intentos > MAX_INTENTOS_POR_BOLETO) {
        throw new Error(
          "No se pudo generar un número único: demasiados intentos (rifa casi sin cupos libres)"
        );
      }
    } while (usados.has(candidato));

    usados.add(candidato);
    asignados.push(candidato);
  }

  const boletos = asignados.map((numero) => ({
    rifa_id: rifaId,
    participante_id: participanteId,
    numero,
  }));

  const { error: insertError } = await supabaseAdmin.from("boletos").insert(boletos);

  if (insertError) {
    throw new Error(insertError.message);
  }

  return [...numerosYa, ...asignados];
}
