import { NextResponse } from "next/server";
import {
  enviarTicketCompra,
  enviarFelicitacionCumpleanos,
  enviarBienvenidaRegistro,
  resendFromAddress,
} from "@/lib/email";
import { verificarSesionAdmin } from "@/lib/auth-admin";

export const dynamic = "force-dynamic";

const TIPOS = new Set(["claves", "cumpleanos", "bienvenida"]);

export async function POST(request) {
  const user = await verificarSesionAdmin(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const emailDestino = String(body.emailDestino || body.email || "")
      .trim()
      .toLowerCase();
    const tipo = String(body.tipo || "").trim().toLowerCase();
    const nombre = String(body.nombre || "Miembro Prueba").trim();

    if (!emailDestino || !emailDestino.includes("@")) {
      return NextResponse.json(
        { error: "Email destino inválido" },
        { status: 400 }
      );
    }

    if (!TIPOS.has(tipo)) {
      return NextResponse.json(
        {
          error:
            "tipo inválido. Usa: claves | cumpleanos | bienvenida",
        },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY no configurado" },
        { status: 500 }
      );
    }

    let data = null;
    let label = "";

    if (tipo === "claves") {
      label = "Confirmación + claves";
      data = await enviarTicketCompra(
        {
          id: "00000000-0000-0000-0000-00000000d3d0",
          nombre,
          email: emailDestino,
          cantidad_boletos: 3,
          total_pagado: 30000,
        },
        { nombre: "Plan Esencial (PRUEBA)" },
        ["0421", "1783", "9056"],
        { useParticipantEmail: true }
      );
    } else if (tipo === "cumpleanos") {
      label = "Felicitación de cumpleaños";
      data = await enviarFelicitacionCumpleanos({
        nombre,
        email: emailDestino,
      });
    } else if (tipo === "bienvenida") {
      label = "Bienvenida al registrarse";
      data = await enviarBienvenidaRegistro({
        nombre,
        email: emailDestino,
      });
    }

    return NextResponse.json({
      ok: true,
      success: true,
      message: `[PRUEBA] ${label} enviado a ${emailDestino}`,
      from: resendFromAddress(),
      id: data?.id || null,
      tipo,
    });
  } catch (err) {
    console.error("[email-prueba]", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Error al enviar email de prueba" },
      { status: 500 }
    );
  }
}
