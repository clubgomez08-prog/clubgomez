import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function copEntero(n) {
  return Math.round(Number(n));
}

/**
 * Registro público de participante pendiente (service role).
 * Sustituye insert directo desde el cliente cuando RLS revoca anon sobre participantes.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      nombre,
      cedula,
      email,
      telefono,
      ciudad,
      cantidad,
      monto,
    } = body;

    const emailNorm = String(email ?? "").trim().toLowerCase();
    const cedulaNorm = String(cedula ?? "").trim();
    const nombreTrim = String(nombre ?? "").trim();

    if (!nombreTrim || !cedulaNorm || !emailNorm) {
      return NextResponse.json(
        { error: "Nombre, cédula y email son obligatorios" },
        { status: 400 }
      );
    }

    const qty = copEntero(cantidad);
    const montoCliente = copEntero(
      typeof monto === "number" ? monto : String(monto).replace(/\D/g, "")
    );

    if (qty < 1 || montoCliente < 1) {
      return NextResponse.json(
        { error: "Cantidad o monto inválido" },
        { status: 400 }
      );
    }

    const { data: rifa, error: rifaError } = await supabaseAdmin
      .from("rifas")
      .select("id, precio_boleto, estado")
      .eq("estado", "activa")
      .single();

    if (rifaError || !rifa) {
      return NextResponse.json(
        { error: "No hay rifa activa" },
        { status: 404 }
      );
    }

    const precio = copEntero(rifa.precio_boleto);
    const esperado = copEntero(qty * precio);

    if (montoCliente !== esperado) {
      return NextResponse.json(
        { error: "El monto no coincide con el precio de la rifa" },
        { status: 400 }
      );
    }

    const { data: participante, error: partError } = await supabaseAdmin
      .from("participantes")
      .insert({
        nombre: nombreTrim,
        cedula: cedulaNorm,
        email: emailNorm,
        telefono: String(telefono ?? "").trim() || null,
        ciudad: String(ciudad ?? "").trim() || null,
        cantidad_boletos: qty,
        total_pagado: esperado,
        rifa_id: rifa.id,
        estado_pago: "pendiente",
      })
      .select("id, email, rifa_id")
      .single();

    if (partError || !participante) {
      console.error("[registro-participante]", partError?.message);
      return NextResponse.json(
        { error: "Error al guardar datos" },
        { status: 500 }
      );
    }

    return NextResponse.json({ participante });
  } catch (e) {
    console.error("[registro-participante]", e?.message);
    return NextResponse.json(
      { error: "Solicitud inválida" },
      { status: 400 }
    );
  }
}
