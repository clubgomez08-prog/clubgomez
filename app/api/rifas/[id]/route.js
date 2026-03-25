import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";

export const dynamic = "force-dynamic";

const DEFAULT_PAQUETES_TICKETS = [50, 100, 150, 200, 250, 500, 1000];

function normalizarPaquetesTickets(input) {
  if (input === undefined || input === null) return DEFAULT_PAQUETES_TICKETS;
  if (!Array.isArray(input)) return DEFAULT_PAQUETES_TICKETS;
  const nums = input
    .map((x) => parseInt(x, 10))
    .filter((n) => !isNaN(n) && n >= 1);
  const unique = [...new Set(nums)].sort((a, b) => a - b).slice(0, 8);
  return unique.length >= 1 ? unique : DEFAULT_PAQUETES_TICKETS;
}

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
  const user = await verificarSesionAdmin(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  /** Solo campos enviados en el body (evita borrar datos con PATCH parcial). */
  const rifa = {};
  if (body.nombre !== undefined) rifa.nombre = body.nombre;
  if (body.descripcion !== undefined) rifa.descripcion = body.descripcion;
  if (body.imagen_url !== undefined) rifa.imagen_url = body.imagen_url;
  if (body.precio_boleto !== undefined) rifa.precio_boleto = body.precio_boleto;
  if (body.total_numeros !== undefined) {
    rifa.total_numeros = body.total_numeros ?? 10000;
  }
  if (body.porcentaje_sorteo !== undefined) {
    rifa.porcentaje_sorteo = body.porcentaje_sorteo ?? 80;
  }
  if (body.premios_anticipados !== undefined) {
    rifa.premios_anticipados = body.premios_anticipados;
  }
  if (body.imagenes_url !== undefined) rifa.imagenes_url = body.imagenes_url;
  if (body.video_url !== undefined) rifa.video_url = body.video_url;
  if (body.estado !== undefined && body.estado !== null) rifa.estado = body.estado;
  if (body.paquetes_tickets !== undefined) {
    rifa.paquetes_tickets = normalizarPaquetesTickets(body.paquetes_tickets);
  }
  if (body.imagen_banner_izquierda !== undefined) {
    rifa.imagen_banner_izquierda =
      body.imagen_banner_izquierda?.trim?.() || null;
  }
  if (body.imagen_banner_derecha !== undefined) {
    rifa.imagen_banner_derecha = body.imagen_banner_derecha?.trim?.() || null;
  }

  if (Object.keys(rifa).length === 0) {
    return NextResponse.json(
      { error: "No hay campos para actualizar" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("rifas")
    .update(rifa)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const user = await verificarSesionAdmin(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await supabaseAdmin.from("rifas").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
