import { NextResponse } from "next/server";
import { buildEmailPreview } from "@/lib/email";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { supabaseAdmin } from "@/lib/supabase";
import { leerSorteoPor } from "@/lib/club-gomez/sorteos";

export const dynamic = "force-dynamic";

const TIPOS = new Set(["claves", "cumpleanos", "bienvenida", "ganador"]);

function aplicarBorrador(sorteo, body) {
  const next = { ...sorteo };
  if (typeof body.mensaje_whatsapp === "string") next.mensaje_whatsapp = body.mensaje_whatsapp;
  if (typeof body.mensaje_correo_asunto === "string") next.mensaje_correo_asunto = body.mensaje_correo_asunto;
  if (typeof body.mensaje_correo_cuerpo === "string") next.mensaje_correo_cuerpo = body.mensaje_correo_cuerpo;
  return next;
}

/** Preview HTML de plantillas (no envía correo). */
export async function POST(request) {
  const user = await verificarSesionAdmin(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const tipo = String(body.tipo || "").trim().toLowerCase();
    const nombre = String(body.nombre || "Miembro Prueba").trim();
    const email = String(body.email || body.emailDestino || "preview@clubgomez.co")
      .trim()
      .toLowerCase();

    if (!TIPOS.has(tipo)) {
      return NextResponse.json(
        {
          error:
            "tipo inválido. Usa: claves | cumpleanos | bienvenida | ganador",
        },
        { status: 400 }
      );
    }

    let sorteo = null;
    if (tipo === "claves" && body.sorteoId) {
      sorteo = (await leerSorteoPor(supabaseAdmin, { id: String(body.sorteoId) })).sorteo;
      if (sorteo) sorteo = aplicarBorrador(sorteo, body);
    }

    const built = await buildEmailPreview(tipo, { nombre, email, sorteo });
    return NextResponse.json({
      ok: true,
      tipo,
      subject: built.subject,
      html: built.html,
      periodoLabel: built.periodoLabel || null,
    });
  } catch (err) {
    console.error("[email-preview]", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Error al generar preview" },
      { status: 500 }
    );
  }
}
