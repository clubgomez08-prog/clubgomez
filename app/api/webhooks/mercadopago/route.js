import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { supabaseAdmin } from "@/lib/supabase";
import { asignarNumerosParticipante } from "@/lib/numeros";

const client = process.env.MP_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
  : null;

async function procesarPago(paymentId) {
  if (!client) {
    throw new Error("MP_ACCESS_TOKEN no configurado");
  }

  const paymentClient = new Payment(client);
  const payment = await paymentClient.get({ id: paymentId });

  if (!payment || !payment.id) {
    throw new Error("Pago no encontrado");
  }

  const participanteId = payment.external_reference;
  if (!participanteId) {
    throw new Error("external_reference faltante");
  }

  const { data: participante, error: partError } = await supabaseAdmin
    .from("participantes")
    .select("id, rifa_id, cantidad_boletos, nombre, email, estado_pago")
    .eq("id", participanteId)
    .single();

  if (partError || !participante) {
    throw new Error("Participante no encontrado");
  }

  if (payment.status === "approved") {
    if (participante.estado_pago === "aprobado") {
      return { received: true, alreadyProcessed: true };
    }

    const rifaId = participante.rifa_id;
    const cantidad = participante.cantidad_boletos ?? 1;

    const numeros = await asignarNumerosParticipante(
      rifaId,
      participante.id,
      cantidad
    );

    const { error: updateError } = await supabaseAdmin
      .from("participantes")
      .update({
        estado_pago: "aprobado",
        mp_payment_id: String(payment.id),
      })
      .eq("id", participante.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (participante.email && process.env.RESEND_API_KEY) {
      try {
        const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/confirmacion?participante=${participante.id}`;
        await enviarTicketEmail({
          to: participante.email,
          nombre: participante.nombre,
          numeros,
          qrUrl: ticketUrl,
        });
      } catch (emailErr) {
        console.error("Error enviando email:", emailErr);
      }
    }

    return { received: true, numeros };
  }

  if (payment.status === "rejected" || payment.status === "cancelled") {
    await supabaseAdmin
      .from("participantes")
      .update({ estado_pago: "rechazado" })
      .eq("id", participante.id);
  }

  return { received: true };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, data } = body;
    const paymentId = data?.id;

    if (type === "payment" && paymentId) {
      await procesarPago(String(paymentId));
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook MercadoPago error:", err);
    return NextResponse.json(
      { error: err.message || "Error procesando webhook" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic");
    const id = searchParams.get("id");

    if (topic === "payment" && id) {
      await procesarPago(id);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook MercadoPago GET error:", err);
    return NextResponse.json(
      { error: err.message || "Error procesando webhook" },
      { status: 500 }
    );
  }
}
