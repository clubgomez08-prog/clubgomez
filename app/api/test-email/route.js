import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { enviarTicketCompra } from "@/lib/email";

export async function GET() {
  try {
    const { data: participante, error: partError } = await supabaseAdmin
      .from("participantes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (partError || !participante) {
      return NextResponse.json(
        { error: "No hay participantes en la base de datos" },
        { status: 404 }
      );
    }

    const { data: rifa, error: rifaError } = await supabaseAdmin
      .from("rifas")
      .select("*")
      .eq("id", participante.rifa_id)
      .single();

    if (rifaError || !rifa) {
      return NextResponse.json(
        { error: "Rifa no encontrada para el participante" },
        { status: 404 }
      );
    }

    const { data: boletos } = await supabaseAdmin
      .from("boletos")
      .select("numero")
      .eq("participante_id", participante.id)
      .order("numero");

    const numeros = (boletos || []).map((b) => b.numero);

    const result = await enviarTicketCompra(participante, rifa, numeros);

    return NextResponse.json({
      success: true,
      emailId: result?.id,
      to: participante.email,
    });
  } catch (err) {
    console.error("Test email error:", err);
    return NextResponse.json(
      { error: err.message || "Error enviando email de prueba" },
      { status: 500 }
    );
  }
}
