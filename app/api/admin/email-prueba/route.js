import { generarHtmlEmailGanador } from "@/lib/email";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { emailDestino, nombreRifa, precioRifa } = await request.json();

    if (!emailDestino || !emailDestino.includes("@")) {
      return Response.json(
        { error: "Email destino inválido" },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return Response.json(
        { error: "RESEND_API_KEY no configurado" },
        { status: 500 }
      );
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
      from: "RIFEX <onboarding@resend.dev>",
      to: [emailDestino],
      subject: `🏆 [PRUEBA] RIFEX — Notificación de ganador: ${nombreRifa || "Sorteo de prueba"}`,
      html: htmlEmail,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: `Email de prueba enviado a ${emailDestino}`,
      id: data?.id,
    });
  } catch (err) {
    console.error(
      "[email-prueba] Error:",
      err?.message || "Error desconocido"
    );
    return Response.json(
      { error: "Error al enviar email de prueba" },
      { status: 500 }
    );
  }
}
