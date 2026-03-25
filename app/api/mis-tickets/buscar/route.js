import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const MAX_LEN = 200;

/**
 * Consulta participaciones + boletos por cédula y email (service role).
 * Sustituye lecturas anon directas cuando RLS cierra participantes/boletos al público.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const cedula = String(body.cedula ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!cedula || !email) {
      return NextResponse.json(
        { error: "Cédula y email son obligatorios" },
        { status: 400 }
      );
    }
    if (cedula.length > MAX_LEN || email.length > MAX_LEN) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { data: participantes, error: err } = await supabaseAdmin
      .from("participantes")
      .select(
        `
        id,
        nombre,
        cedula,
        email,
        cantidad_boletos,
        total_pagado,
        estado_pago,
        created_at,
        rifa_id,
        rifas (
          id,
          nombre,
          precio_boleto,
          estado,
          numeros_bendecidos
        )
      `
      )
      .eq("cedula", cedula)
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (err) {
      console.error("[mis-tickets/buscar]", err.message);
      return NextResponse.json(
        { error: "Error al buscar tickets" },
        { status: 500 }
      );
    }

    const lista = participantes || [];
    if (lista.length === 0) {
      return NextResponse.json({ resultados: [] });
    }

    const resultadosConBoletos = await Promise.all(
      lista.map(async (p) => {
        const { data: boletos } = await supabaseAdmin
          .from("boletos")
          .select("numero")
          .eq("participante_id", p.id)
          .order("numero", { ascending: true });

        const nb = Array.isArray(p.rifas?.numeros_bendecidos)
          ? p.rifas.numeros_bendecidos.map((x) => String(x ?? "").trim())
          : [];

        return {
          id: p.id,
          nombre: p.nombre,
          cantidad_boletos: p.cantidad_boletos,
          total_pagado: p.total_pagado,
          estado_pago: p.estado_pago,
          created_at: p.created_at,
          boletos: boletos || [],
          numeros_bendecidos: nb,
          rifas: p.rifas?.nombre
            ? { nombre: p.rifas.nombre }
            : null,
        };
      })
    );

    return NextResponse.json({ resultados: resultadosConBoletos });
  } catch (e) {
    console.error("[mis-tickets/buscar]", e?.message);
    return NextResponse.json(
      { error: "Solicitud inválida" },
      { status: 400 }
    );
  }
}
