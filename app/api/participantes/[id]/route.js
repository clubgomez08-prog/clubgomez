import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request, { params }) {
  const { id } = await params;

  const { data: participante, error: participanteError } = await supabaseAdmin
    .from("participantes")
    .select("*")
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
    ...participante,
    boletos: numeros,
  });
}
