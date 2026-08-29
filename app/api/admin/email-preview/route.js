import { NextResponse } from "next/server";
import { buildEmailPreview } from "@/lib/email";
import { verificarSesionAdmin } from "@/lib/auth-admin";

export const dynamic = "force-dynamic";

const TIPOS = new Set(["claves", "cumpleanos", "bienvenida", "ganador"]);

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

    const built = await buildEmailPreview(tipo, { nombre, email });
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
