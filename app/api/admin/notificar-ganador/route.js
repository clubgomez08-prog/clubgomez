import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { enviarEmailGanador } from "@/lib/email";

export async function POST(request) {
  try {
    const body = await request.json();
    const { sorteo_id, participante_id, rifa_id } = body;

    let participante = null;
    let rifa = null;
    let numeroBoleto = null;

    // CASO 1: viene sorteo_id (flujo original)
    if (sorteo_id) {
      const { data: sorteo, error: sorteoError } = await supabaseAdmin
        .from("sorteos")
        .select("*, participantes:participante_ganador_id(*), rifas(*)")
        .eq("id", sorteo_id)
        .single();

      if (sorteoError || !sorteo) {
        return NextResponse.json(
          { error: "Sorteo no encontrado" },
          { status: 404 }
        );
      }
      participante = sorteo.participantes;
      rifa = sorteo.rifas;
      numeroBoleto = sorteo.numero_boleto;
    }
    // CASO 2: viene participante_id + rifa_id (flujo nuevo)
    else if (participante_id && rifa_id) {
      const { data: p, error: pError } = await supabaseAdmin
        .from("participantes")
        .select("*")
        .eq("id", participante_id)
        .single();

      if (pError || !p) {
        return NextResponse.json(
          { error: "Participante no encontrado" },
          { status: 404 }
        );
      }

      const { data: r, error: rError } = await supabaseAdmin
        .from("rifas")
        .select("*")
        .eq("id", rifa_id)
        .single();

      if (rError || !r) {
        return NextResponse.json(
          { error: "Rifa no encontrada" },
          { status: 404 }
        );
      }

      participante = p;
      rifa = r;
    }
    // CASO 3: solo participante_id sin rifa_id
    else if (participante_id) {
      const { data: p, error: pError } = await supabaseAdmin
        .from("participantes")
        .select("*, rifas(*)")
        .eq("id", participante_id)
        .single();

      if (pError || !p) {
        return NextResponse.json(
          { error: "Participante no encontrado" },
          { status: 404 }
        );
      }
      participante = p;
      rifa = p.rifas;
    } else {
      return NextResponse.json(
        { error: "Se requiere sorteo_id o participante_id" },
        { status: 400 }
      );
    }

    if (!participante || !rifa) {
      return NextResponse.json(
        { error: "No se pudieron obtener los datos del ganador" },
        { status: 400 }
      );
    }

    // Obtener numeroBoleto si no viene del sorteo
    if (!numeroBoleto) {
      const { data: boletos } = await supabaseAdmin
        .from("boletos")
        .select("numero")
        .eq("participante_id", participante.id)
        .order("numero", { ascending: true });

      const numerosGanadores = (boletos || []).map((b) => b.numero);
      numeroBoleto =
        numerosGanadores.length > 0 ? numerosGanadores.join(", ") : "—";
    }

    await enviarEmailGanador(participante, rifa, numeroBoleto);
    return NextResponse.json({ success: true, message: "Email enviado" });
  } catch (err) {
    console.error("[Notificar] Error:", err?.message || "Error desconocido");
    return NextResponse.json(
      { error: err.message || "Error enviando email" },
      { status: 500 }
    );
  }
}
