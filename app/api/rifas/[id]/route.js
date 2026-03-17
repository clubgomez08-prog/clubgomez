import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request, { params }) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("rifas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Rifa no encontrada" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request, { params }) {
  const { id } = await params;
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
      : undefined,
  };
  if (body.estado != null) rifa.estado = body.estado;
  if (body.imagenes_url !== undefined) rifa.imagenes_url = body.imagenes_url;
  if (body.premios_anticipados !== undefined) rifa.premios_anticipados = body.premios_anticipados;

  const cleaned = Object.fromEntries(
    Object.entries(rifa).filter(([, v]) => v !== undefined)
  );

  const { data, error } = await supabaseAdmin
    .from("rifas")
    .update(cleaned)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const { id } = await params;

  const { error } = await supabaseAdmin.from("rifas").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
