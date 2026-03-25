import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function copEntero(n) {
  return Math.round(Number(n));
}

export async function GET(request, { params }) {
  const { id } = await params;

  const { data: participante, error: participanteError } = await supabaseAdmin
    .from("participantes")
    .select(
      "id, nombre, cantidad_boletos, total_pagado, rifa_id, estado_pago"
    )
    .eq("id", id)
    .single();

  if (participanteError || !participante) {
    return NextResponse.json(
      { error: "Participante no encontrado" },
      { status: 404 }
    );
  }

  const { data: boletos, error: boletosError } = await supabaseAdmin
    .from("boletos")
    .select("numero")
    .eq("participante_id", id)
    .order("numero");

  const numeros = boletosError ? [] : (boletos || []).map((b) => b.numero);

  return NextResponse.json({
    id: participante.id,
    nombre: participante.nombre,
    cantidad_boletos: participante.cantidad_boletos,
    total_pagado: copEntero(participante.total_pagado),
    rifa_id: participante.rifa_id,
    estado_pago: participante.estado_pago,
    boletos: numeros,
  });
}
