import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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

  const participante = {
    nombre: body.nombre,
    email: body.email,
    telefono: body.telefono,
    ciudad: body.ciudad,
    cedula: body.cedula,
    rifa_id: body.rifa_id,
    cantidad_boletos: body.cantidad_boletos,
    total_pagado: body.total_pagado,
  };

  if (!participante.nombre || !participante.email || !participante.rifa_id || participante.cantidad_boletos == null || participante.total_pagado == null) {
    return NextResponse.json(
      { error: "Faltan campos requeridos: nombre, email, rifa_id, cantidad_boletos, total_pagado" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("participantes")
    .insert(participante)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
