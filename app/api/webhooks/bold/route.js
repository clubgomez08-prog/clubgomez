import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarFirmaWebhookBold } from "@/lib/club-gomez/bold";
import { activarSolicitudSiBoldCobro } from "@/lib/club-gomez/activar-pago-bold";
import { planDeSolicitud } from "@/lib/club-gomez/planes-db";
import { sendPurchaseCapi } from "@/lib/club-gomez/meta-capi";
import { buscarSolicitudPorBoldOrder } from "@/lib/club-gomez/solicitudes-bold";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-bold-signature") || "";

  try {
    if (supabaseMissingEnv) {
      return NextResponse.json({ ok: false }, { status: 503 });
    }

    const skipSig = process.env.BOLD_WEBHOOK_SKIP_SIGNATURE === "1";
    if (!skipSig && !verificarFirmaWebhookBold(rawBody, signature)) {
      console.warn("[webhooks/bold] firma inválida");
      return NextResponse.json({ ok: false, error: "firma" }, { status: 400 });
    }

    const event = JSON.parse(rawBody || "{}");
    if (event.type !== "SALE_APPROVED") {
      return NextResponse.json({ ok: true, ignored: event.type || "unknown" });
    }

    const reference =
      event?.data?.metadata?.reference ||
      event?.data?.reference ||
      event?.data?.metadata?.order_id ||
      null;
    const paymentId = event?.data?.payment_id || event?.subject || null;

    if (!reference && !paymentId) {
      return NextResponse.json({ ok: true, ignored: "sin referencia" });
    }

    const solicitud = reference
      ? await buscarSolicitudPorBoldOrder(supabaseAdmin, reference)
      : null;

    if (!solicitud) {
      console.warn("[webhooks/bold] solicitud no encontrada", reference);
      return NextResponse.json({ ok: true, missing: true });
    }

    if (solicitud.estado === "convertida") {
      return NextResponse.json({ ok: true, already: true });
    }

    // El aviso solo dispara la revisión: se activa únicamente si la API de Bold confirma el cobro.
    const revision = await activarSolicitudSiBoldCobro(supabaseAdmin, solicitud);
    if (revision.estado === "pendiente") {
      return NextResponse.json({ ok: false, pending: true }, { status: 503 });
    }
    if (revision.estado !== "activada") {
      return NextResponse.json({ ok: true, estado: revision.estado });
    }

    const notas = revision.notas;
    const plan = planDeSolicitud(solicitud.plan_id, notas);

    try {
      const value =
        Number(event?.data?.amount?.total) ||
        Number(notas.amount) ||
        plan.precio ||
        0;
      await sendPurchaseCapi({
        orderId: reference,
        value,
        currency: "COP",
        planId: plan.id,
        planNombre: plan.nombre,
        email: solicitud.email,
        telefono: solicitud.telefono,
        nombre: solicitud.nombre,
        ciudad: solicitud.ciudad,
        fechaNacimiento: notas.fecha_nacimiento || null,
        fbp: notas.fbp || null,
        fbc: notas.fbc || null,
        eventSourceUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://clubgomez.co"}/pago/resultado`,
      });
    } catch (capiErr) {
      console.error("[webhooks/bold] capi:", capiErr?.message || capiErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhooks/bold]", err);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
