import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { activarMembresiaManual } from "@/lib/club-gomez/activar-membresia";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (supabaseMissingEnv) {
      return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Falta id" }, { status: 400 });
    }

    const { data: solicitud, error } = await supabaseAdmin
      .from("solicitudes_membresia")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !solicitud) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    if (solicitud.estado === "convertida") {
      return NextResponse.json(
        { error: "Esta solicitud ya fue convertida / aprobada." },
        { status: 409 }
      );
    }

    const resultado = await activarMembresiaManual(supabaseAdmin, {
      planId: solicitud.plan_id,
      nombre: solicitud.nombre,
      cedula: solicitud.cedula,
      email: solicitud.email,
      telefono: solicitud.telefono,
      ciudad: solicitud.ciudad,
      origen: "whatsapp",
      solicitudId: solicitud.id,
    });

    return NextResponse.json({
      ok: true,
      miembroId: resultado.miembro.id,
      membresiaId: resultado.membresia.id,
      claves: resultado.claves,
      emailOk: resultado.emailOk,
    });
  } catch (err) {
    console.error("[admin/solicitudes/aprobar]", err);
    return NextResponse.json(
      { error: err.message || "Error al aprobar" },
      { status: 500 }
    );
  }
}
