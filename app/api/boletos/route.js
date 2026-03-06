import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { asignarNumeros } from "@/lib/numeros";

export async function POST(request) {
  const body = await request.json();
  const { rifaId, cantidad, participanteId } = body;

  if (!rifaId || !cantidad || !participanteId) {
    return NextResponse.json(
      { error: "Faltan parámetros: rifaId, cantidad, participanteId" },
      { status: 400 }
    );
  }

  const numeros = asignarNumeros(rifaId, cantidad);

  const boletos = numeros.map((numero) => ({
    rifa_id: rifaId,
    participante_id: participanteId,
    numero,
  }));

  const { data, error } = await supabaseAdmin.from("boletos").insert(boletos).select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
