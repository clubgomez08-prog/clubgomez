import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { crearPreferencia } from "@/lib/mercadopago";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rifaId = searchParams.get("rifa_id");

  let query = supabaseAdmin.from("participantes").select("*");

  if (rifaId) {
    query = query.eq("rifa_id", rifaId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request) {
  const body = await request.json();

  const participanteData = {
    nombre: body.nombre,
    email: body.email,
    telefono: body.telefono,
    ciudad: body.ciudad,
    cedula: body.cedula,
    rifa_id: body.rifa_id,
    cantidad_boletos: body.cantidad_boletos,
    total_pagado: body.total_pagado,
    estado_pago: "pendiente",
  };

  if (!participanteData.nombre || !participanteData.email || !participanteData.rifa_id || participanteData.cantidad_boletos == null || participanteData.total_pagado == null) {
    return NextResponse.json(
      { error: "Faltan campos requeridos: nombre, email, rifa_id, cantidad_boletos, total_pagado" },
      { status: 400 }
    );
  }

  const { data: participante, error } = await supabaseAdmin
    .from("participantes")
    .insert(participanteData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: rifa, error: rifaError } = await supabaseAdmin
    .from("rifas")
    .select("id, nombre, precio_boleto")
    .eq("id", participante.rifa_id)
    .single();

  if (rifaError || !rifa) {
    return NextResponse.json({ error: "Rifa no encontrada" }, { status: 404 });
  }

  let initPoint = null;
  try {
    const { init_point, preference_id } = await crearPreferencia(participante, rifa);
    initPoint = init_point;

    await supabaseAdmin
      .from("participantes")
      .update({ mp_preference_id: preference_id })
      .eq("id", participante.id);
  } catch (mpError) {
    return NextResponse.json(
      { error: mpError.message || "Error creando preferencia de pago" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    participante_id: participante.id,
    init_point: initPoint,
  });
}
