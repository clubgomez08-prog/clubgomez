import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rifaId = searchParams.get("rifa_id");

  if (!rifaId) {
    return NextResponse.json(
      { error: "rifa_id es requerido" },
      { status: 400 }
    );
  }

  const { data: sorteos, error } = await supabaseAdmin
    .from("sorteos")
    .select("*, participantes:participante_ganador_id(nombre, email, telefono)")
    .eq("rifa_id", rifaId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("ERROR GET sorteos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (sorteos || []).map((s) => ({
    id: s.id,
    participante_nombre: s.participantes?.nombre,
    participante_email: s.participantes?.email,
    participante_telefono: s.participantes?.telefono,
    numero_boleto: s.numero_boleto,
    created_at: s.created_at,
  }));

  return NextResponse.json({ sorteos: items });
}

export async function POST(request) {
  const body = await request.json();
  const rifaId = body.rifa_id;

  if (!rifaId) {
    return NextResponse.json(
      { error: "rifa_id es requerido" },
      { status: 400 }
    );
  }

  const { data: rifa, error: rifaError } = await supabaseAdmin
    .from("rifas")
    .select("id, nombre, estado, total_numeros, porcentaje_sorteo")
    .eq("id", rifaId)
    .single();

  if (rifaError || !rifa) {
    return NextResponse.json({ error: "Rifa no encontrada" }, { status: 404 });
  }

  if (rifa.estado === "finalizada") {
    return NextResponse.json(
      { error: "Esta rifa ya fue sorteada" },
      { status: 400 }
    );
  }

  const { count: totalBoletos } = await supabaseAdmin
    .from("boletos")
    .select("id", { count: "exact", head: true })
    .eq("rifa_id", rifaId);

  const vendidos = totalBoletos ?? 0;
  const total = rifa.total_numeros ?? 10000;
  const porcentajeMin = rifa.porcentaje_sorteo ?? 80;
  const porcentajeActual = total > 0 ? (vendidos / total) * 100 : 0;

  if (porcentajeActual < porcentajeMin) {
    return NextResponse.json(
      {
        error: `Se requiere al menos ${porcentajeMin}% vendido. Actual: ${porcentajeActual.toFixed(1)}%`,
      },
      { status: 400 }
    );
  }

  const { data: boletos, error: boletosError } = await supabaseAdmin
    .from("boletos")
    .select("id, numero, participante_id")
    .eq("rifa_id", rifaId);

  if (boletosError || !boletos || boletos.length === 0) {
    return NextResponse.json(
      { error: "No hay boletos vendidos para sortear" },
      { status: 400 }
    );
  }

  const boletoGanador = boletos[Math.floor(Math.random() * boletos.length)];

  const { data: participante, error: partError } = await supabaseAdmin
    .from("participantes")
    .select("id, nombre, email, telefono")
    .eq("id", boletoGanador.participante_id)
    .single();

  if (partError || !participante) {
    return NextResponse.json(
      { error: "Participante ganador no encontrado" },
      { status: 500 }
    );
  }

  const { data: sorteo, error: sorteoError } = await supabaseAdmin
    .from("sorteos")
    .insert({
      rifa_id: rifaId,
      participante_ganador_id: participante.id,
      numero_boleto: boletoGanador.numero,
    })
    .select()
    .single();

  if (sorteoError) {
    return NextResponse.json(
      { error: sorteoError.message || "Error guardando sorteo" },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabaseAdmin
    .from("rifas")
    .update({ estado: "finalizada" })
    .eq("id", rifaId);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message || "Error actualizando estado de la rifa" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ganador: {
      nombre: participante.nombre,
      email: participante.email,
      telefono: participante.telefono,
      numero_boleto: boletoGanador.numero,
      serie: boletoGanador.numero?.split("-")[0] || boletoGanador.numero,
    },
    sorteo_id: sorteo.id,
  });
}
