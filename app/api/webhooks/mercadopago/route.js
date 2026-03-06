import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request) {
  const body = await request.json();

  // Tipos de notificación: payment, plan, subscription, invoice, point_integration_wh
  const { type, data } = body;

  if (type === "payment") {
    const paymentId = data?.id;
    if (!paymentId) {
      return NextResponse.json({ error: "ID de pago faltante" }, { status: 400 });
    }

    // Verificar estado del pago en MercadoPago (requiere llamada API)
    // Por ahora: marcar como pagado en Supabase cuando llegue el webhook
    const { error } = await supabaseAdmin
      .from("participantes")
      .update({ estado_pago: "aprobado", pago_id: paymentId })
      .eq("pago_id", paymentId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
