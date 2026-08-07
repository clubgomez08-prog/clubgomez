import { NextResponse } from "next/server";
import {
  generarHtmlEmailGanador,
  enviarTicketCompra,
  resendFromAddress,
  getResendClient,
} from "@/lib/email";
import { verificarSesionAdmin } from "@/lib/auth-admin";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const user = await verificarSesionAdmin(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { emailDestino, nombreRifa, precioRifa, tipo } = await request.json();

    if (!emailDestino || !emailDestino.includes("@")) {
      return NextResponse.json(
        { error: "Email destino inválido" },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY no configurado" },
        { status: 500 }
      );
    }

    const resend = getResendClient();

    if (tipo === "comprador") {
      const participanteCompradorPrueba = {
        id: "00000000-0000-0000-0000-00000000d3d0",
        nombre: "Juan Prueba",
        email: emailDestino,
        cantidad_boletos: 5,
        total_pagado: 1000,
      };
      const rifaCompradorPrueba = {
        nombre: nombreRifa || "Sorteo de prueba",
      };
      const numerosCompradorPrueba = [
        "1234-56",
        "7890-12",
        "3456-78",
        "9012-34",
        "5678-90",
      ];

      try {
        const data = await enviarTicketCompra(
          participanteCompradorPrueba,
          rifaCompradorPrueba,
          numerosCompradorPrueba,
          { useParticipantEmail: true }
        );
        return NextResponse.json({
          success: true,
          message: `Email de prueba (comprador) enviado a ${emailDestino}`,
          id: data?.id,
        });
      } catch (sendErr) {
        return NextResponse.json(
          { error: sendErr?.message || "Error al enviar email de comprador" },
          { status: 500 }
        );
      }
    }

    const participanteSimulado = {
      nombre: "Juan Pérez (PRUEBA)",
      email: emailDestino,
      telefono: "—",
    };
    const rifaSimulada = {
      nombre: nombreRifa || "Sorteo de prueba",
    };
    const numeroBoletoSimulado = "0042";

    const htmlEmail = generarHtmlEmailGanador(
      participanteSimulado,
      rifaSimulada,
      numeroBoletoSimulado
    );

    const { data, error } = await resend.emails.send({
      from: resendFromAddress(),
      to: [emailDestino],
      subject: `🏆 [PRUEBA] Club Gómez — Notificación: ${nombreRifa || "Beneficio de prueba"}`,
      html: htmlEmail,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Email de prueba enviado a ${emailDestino}`,
      id: data?.id,
    });
  } catch (err) {
    console.error(
      "[email-prueba] Error:",
      err?.message || "Error desconocido"
    );
    return NextResponse.json(
      { error: "Error al enviar email de prueba" },
      { status: 500 }
    );
  }
}
