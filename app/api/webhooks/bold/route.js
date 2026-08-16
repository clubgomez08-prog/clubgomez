import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarFirmaWebhookBold } from "@/lib/club-gomez/bold";
import { activarMembresiaManual } from "@/lib/club-gomez/activar-membresia";
import { getPlanById } from "@/lib/club-gomez/planes";
import { sendPurchaseCapi } from "@/lib/club-gomez/meta-capi";

export const dynamic = "force-dynamic";

function parseNotas(notas) {
  try {
    return notas ? JSON.parse(notas) : {};
  } catch {
    return {};
  }
}

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

    const { data: solicitudes } = await supabaseAdmin
      .from("solicitudes_membresia")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80);

    const solicitud = (solicitudes || []).find((s) => {
      const n = parseNotas(s.notas);
      return reference && n.bold_order_id === reference;
    });

    if (!solicitud) {
      console.warn("[webhooks/bold] solicitud no encontrada", reference);
      return NextResponse.json({ ok: true, missing: true });
    }

    if (solicitud.estado === "convertida") {
      return NextResponse.json({ ok: true, already: true });
    }

    const notas = parseNotas(solicitud.notas);
    await activarMembresiaManual(supabaseAdmin, {
      planId: solicitud.plan_id,
      nombre: solicitud.nombre,
      cedula: solicitud.cedula,
      email: solicitud.email,
      telefono: solicitud.telefono,
      ciudad: solicitud.ciudad,
      fechaNacimiento: notas.fecha_nacimiento || null,
      origen: "bold",
      solicitudId: solicitud.id,
      boldOrderId: reference,
      boldTransactionId: paymentId,
      montoCop: event?.data?.amount?.total || null,
    });

    try {
      const plan = getPlanById(solicitud.plan_id);
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
    return NextResponse.json({ ok: false, error: "internal" }, { status: 200 });
  }
}
