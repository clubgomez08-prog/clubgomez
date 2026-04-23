import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { asignarNumerosParticipante } from "@/lib/numeros";

export const dynamic = "force-dynamic";

function normalizarTexto(valor) {
  if (valor == null) return "";
  return String(valor).trim();
}

function normalizarEmail(email) {
  const e = normalizarTexto(email).toLowerCase();
  return e || "sin-email@rifex.app";
}

export async function POST(request) {
  let participanteCreadoId = null;
  let numerosAsignados = false;

  try {
    const user = await verificarSesionAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const rifaId = normalizarTexto(body.rifa_id);
    const nombre = normalizarTexto(body.nombre);
    const cedula = normalizarTexto(body.cedula);
    const email = normalizarEmail(body.email);
    const telefono = normalizarTexto(body.telefono) || null;
    const ciudad = normalizarTexto(body.ciudad) || null;
    const notas = normalizarTexto(body.notas) || null;
    const cantidadBoletos = Number(body.cantidad_boletos);

    if (!rifaId || !nombre || !cedula || !Number.isFinite(cantidadBoletos)) {
      return NextResponse.json(
        {
          error:
            "rifa_id, nombre, cedula y cantidad_boletos son obligatorios",
        },
        { status: 400 }
      );
    }

    if (cantidadBoletos < 50) {
      return NextResponse.json(
        { error: "cantidad_boletos debe ser mayor o igual a 50" },
        { status: 400 }
      );
    }

    const { data: rifa, error: rifaError } = await supabaseAdmin
      .from("rifas")
      .select("id, precio_boleto")
      .eq("id", rifaId)
      .single();

    if (rifaError || !rifa) {
      return NextResponse.json({ error: "Rifa no encontrada" }, { status: 404 });
    }

    const precioBoleto = Number(rifa.precio_boleto);
    if (!Number.isFinite(precioBoleto) || precioBoleto < 0) {
      return NextResponse.json(
        { error: "precio_boleto inválido en la rifa" },
        { status: 400 }
      );
    }

    const loteId = `FISICO-${Date.now()}`;
    const totalPagado = Math.round(precioBoleto * cantidadBoletos);

    const { data: participante, error: partError } = await supabaseAdmin
      .from("participantes")
      .insert({
        rifa_id: rifa.id,
        nombre,
        cedula,
        email,
        telefono,
        ciudad,
        cantidad_boletos: cantidadBoletos,
        total_pagado: totalPagado,
        estado_pago: "aprobado",
        canal_venta: "fisico",
        mp_payment_id: loteId,
        notas,
      })
      .select("id")
      .single();

    if (partError || !participante) {
      return NextResponse.json(
        { error: partError?.message || "Error al crear participante" },
        { status: 500 }
      );
    }

    participanteCreadoId = participante.id;

    const numeros = await asignarNumerosParticipante(
      rifa.id,
      participante.id,
      cantidadBoletos
    );

    numerosAsignados = true;

    return NextResponse.json({
      ok: true,
      participante_id: participante.id,
      numeros: numeros || [],
      lote_id: loteId,
      total_pagado: totalPagado,
    });
  } catch (err) {
    if (participanteCreadoId) {
      try {
        if (numerosAsignados) {
          await supabaseAdmin
            .from("boletos")
            .delete()
            .eq("participante_id", participanteCreadoId);
        }

        await supabaseAdmin
          .from("participantes")
          .delete()
          .eq("id", participanteCreadoId);
      } catch (rollbackErr) {
        console.error(
          "[admin/venta-fisica] Error en rollback:",
          rollbackErr?.message || rollbackErr
        );
      }
    }

    console.error("[admin/venta-fisica]", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Error al registrar venta física" },
      { status: 500 }
    );
  }
}
