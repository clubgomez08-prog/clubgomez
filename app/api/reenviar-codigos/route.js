import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { enviarTicketCompra } from "@/lib/email";

export const dynamic = "force-dynamic";

const MS_30_MIN = 30 * 60 * 1000;

const MSG_NO_ENCONTRADO =
  "Si el correo está registrado, recibirás tus códigos en breve.";
const MSG_MENOS_30_MIN =
  "Han pasado menos de 30 minutos desde tu compra. Por favor espera e intenta de nuevo.";
const MSG_ERROR_SERVIDOR =
  "No pudimos procesar tu solicitud. Intenta de nuevo más tarde.";

function emailBasicoValido(s) {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: MSG_ERROR_SERVIDOR }, { status: 400 });
    }

    const raw = body?.email;
    const emailNorm =
      typeof raw === "string" ? raw.trim().toLowerCase() : "";

    if (!emailNorm || !emailBasicoValido(emailNorm)) {
      return NextResponse.json({ error: MSG_NO_ENCONTRADO }, { status: 400 });
    }

    const { data: participante, error: errParticipante } = await supabaseAdmin
      .from("participantes")
      .select("*")
      .eq("email", emailNorm)
      .eq("estado_pago", "aprobado")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (errParticipante) {
      console.error("[reenviar-codigos] participante:", errParticipante.message);
      return NextResponse.json({ error: MSG_ERROR_SERVIDOR }, { status: 500 });
    }

    if (!participante) {
      return NextResponse.json({ error: MSG_NO_ENCONTRADO }, { status: 400 });
    }

    const creado = participante.created_at
      ? new Date(participante.created_at).getTime()
      : 0;
    if (creado && Date.now() - creado < MS_30_MIN) {
      return NextResponse.json({ error: MSG_MENOS_30_MIN }, { status: 400 });
    }

    const { data: filasBoletos, error: errBoletos } = await supabaseAdmin
      .from("boletos")
      .select("numero, created_at")
      .eq("participante_id", participante.id)
      .order("created_at", { ascending: true });

    if (errBoletos) {
      console.error("[reenviar-codigos] boletos:", errBoletos.message);
      return NextResponse.json({ error: MSG_ERROR_SERVIDOR }, { status: 500 });
    }

    const numerosArray = (filasBoletos || [])
      .map((b) => String(b?.numero ?? "").trim())
      .filter(Boolean);

    if (!participante.rifa_id) {
      console.error("[reenviar-codigos] participante sin rifa_id");
      return NextResponse.json({ error: MSG_ERROR_SERVIDOR }, { status: 500 });
    }

    const { data: rifa, error: errRifa } = await supabaseAdmin
      .from("rifas")
      .select("id, nombre, precio_boleto")
      .eq("id", participante.rifa_id)
      .maybeSingle();

    if (errRifa) {
      console.error("[reenviar-codigos] rifa:", errRifa.message);
      return NextResponse.json({ error: MSG_ERROR_SERVIDOR }, { status: 500 });
    }

    if (!rifa) {
      return NextResponse.json({ error: MSG_ERROR_SERVIDOR }, { status: 500 });
    }

    await enviarTicketCompra(participante, rifa, numerosArray, {
      useParticipantEmail: true,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[reenviar-codigos]", e?.message || e);
    return NextResponse.json({ error: MSG_ERROR_SERVIDOR }, { status: 500 });
  }
}
