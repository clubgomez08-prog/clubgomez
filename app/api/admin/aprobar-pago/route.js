import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { ejecutarAprobacionBoletosYCorreos } from "@/lib/aprobar-participante";

export const dynamic = "force-dynamic";

const SKIP_REASON_MESSAGES = {
  ya_aprobado_otro_pago:
    "Este participante ya fue aprobado con otro pago. No se puede aprobar de nuevo.",
  race_otro_pago:
    "Otro proceso aprobó este participante. Actualice la lista e intente de nuevo.",
  no_claim_pendiente:
    "El participante ya no está en estado pendiente o hubo un conflicto al actualizar.",
};

export async function POST(request) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const participanteId =
      typeof body.participante_id === "string"
        ? body.participante_id.trim()
        : "";
    const metodo_pago =
      typeof body.metodo_pago === "string" && body.metodo_pago.trim()
        ? body.metodo_pago.trim()
        : "manual";

    if (!participanteId) {
      return NextResponse.json(
        { error: "Falta participante_id" },
        { status: 400 }
      );
    }

    const { data: participante, error: partError } = await supabaseAdmin
      .from("participantes")
      .select("id, rifa_id, estado_pago")
      .eq("id", participanteId)
      .single();

    if (partError || !participante) {
      return NextResponse.json(
        { error: "Participante no encontrado" },
        { status: 404 }
      );
    }

    if (participante.estado_pago !== "pendiente") {
      return NextResponse.json(
        {
          error:
            "Solo se pueden aprobar participantes con pago pendiente. Este registro ya fue procesado.",
        },
        { status: 400 }
      );
    }

    const { data: rifa, error: rifaError } = await supabaseAdmin
      .from("rifas")
      .select("id")
      .eq("id", participante.rifa_id)
      .maybeSingle();

    if (rifaError || !rifa) {
      return NextResponse.json(
        { error: "Rifa del participante no encontrada" },
        { status: 404 }
      );
    }

    const referenciaPago = `MANUAL-${Date.now()}`;

    const resultado = await ejecutarAprobacionBoletosYCorreos({
      participanteId,
      referenciaPago,
      metodo_pago,
    });

    if (!resultado.success && resultado.skipped) {
      const msg =
        SKIP_REASON_MESSAGES[resultado.reason] ||
        "No se pudo completar la aprobación. Actualice la lista.";
      return NextResponse.json(
        { error: msg, reason: resultado.reason },
        { status: 409 }
      );
    }

    if (!resultado.success) {
      return NextResponse.json(
        { error: "Error desconocido al aprobar" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      numeros: resultado.numeros,
      referencia_pago: referenciaPago,
    });
  } catch (err) {
    console.error("[admin/aprobar-pago]", err?.message || err);
    return NextResponse.json(
      { error: err.message || "Error al aprobar el pago" },
      { status: 500 }
    );
  }
}
