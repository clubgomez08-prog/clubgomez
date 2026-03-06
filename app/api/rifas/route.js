import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data: rifasData, error } = await supabaseAdmin
    .from("rifas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rifas = rifasData || [];
  let ventasPorRifa = {};

  const { data: ventasData, error: ventasError } = await supabaseAdmin
    .from("boletos")
    .select("rifa_id");

  if (!ventasError && ventasData) {
    ventasPorRifa = ventasData.reduce((acc, b) => {
      if (b?.rifa_id) acc[b.rifa_id] = (acc[b.rifa_id] || 0) + 1;
      return acc;
    }, {});
  }

  const rifasConVentas = rifas.map((r) => ({
    ...r,
    boletos_vendidos: ventasPorRifa[r.id] || 0,
  }));

  return NextResponse.json(rifasConVentas);
}

export async function POST(request) {
  const body = await request.json();

  const rifa = {
    nombre: body.nombre,
    descripcion: body.descripcion ?? null,
    imagen_url: body.imagen_url ?? null,
    precio_boleto: body.precio_boleto,
    total_numeros: body.total_numeros ?? 10000,
    porcentaje_sorteo: body.porcentaje_sorteo ?? 80,
    premios_anticipados: Array.isArray(body.premios_anticipados)
      ? body.premios_anticipados
      : [],
  };

  if (!rifa.nombre || rifa.precio_boleto == null) {
    return NextResponse.json(
      { error: "nombre y precio_boleto son requeridos" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin.from("rifas").insert(rifa).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
