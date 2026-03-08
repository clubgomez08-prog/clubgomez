import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { enviarEmailGanador } from "@/lib/email";

export async function POST(request) {
  const body = await request.json();
  const sorteoId = body.sorteo_id;

  if (!sorteoId) {
    return NextResponse.json(
      { error: "sorteo_id es requerido" },
      { status: 400 }
    );
  }

  const { data: sorteo, error: sorteoError } = await supabaseAdmin
    .from("sorteos")
    .select("*, participantes:participante_ganador_id(*), rifas(*)")
    .eq("id", sorteoId)
    .single();

  if (sorteoError || !sorteo) {
    return NextResponse.json(
      { error: "Sorteo no encontrado" },
      { status: 404 }
    );
  }

  const participante = sorteo.participantes;
  const rifa = sorteo.rifas;
  const numeroBoleto = sorteo.numero_boleto;

  if (!participante || !rifa) {
    return NextResponse.json(
      { error: "Datos incompletos del sorteo" },
      { status: 400 }
    );
  }

  try {
    await enviarEmailGanador(participante, rifa, numeroBoleto);
    return NextResponse.json({ success: true, message: "Email enviado" });
  } catch (err) {
    console.error("Error notificando ganador:", err);
    return NextResponse.json(
      { error: err.message || "Error enviando email" },
      { status: 500 }
    );
  }
}
