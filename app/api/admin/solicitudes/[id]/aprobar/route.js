import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { activarMembresiaManual } from "@/lib/club-gomez/activar-membresia";
import { registrarActividad } from "@/lib/admin-actividad";
import { planDeSolicitud } from "@/lib/club-gomez/planes-db";

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

    let notas = {};
    try {
      notas = solicitud.notas ? JSON.parse(solicitud.notas) : {};
    } catch {
      notas = {};
    }
    let rangoFisico = null;
    let rangoWeb = null;
    if (notas.sorteo_id) {
      const { data: sorteo } = await supabaseAdmin
        .from("sorteos_rifa")
        .select("fisico_min, fisico_max, web_min, web_max")
        .eq("id", notas.sorteo_id)
        .maybeSingle();
      if (sorteo) {
        rangoFisico = { min: sorteo.fisico_min, max: sorteo.fisico_max };
        rangoWeb = { min: sorteo.web_min, max: sorteo.web_max };
      }
    }

    const resultado = await activarMembresiaManual(supabaseAdmin, {
      planId: solicitud.plan_id,
      plan: planDeSolicitud(solicitud.plan_id, notas),
      nombre: solicitud.nombre,
      cedula: solicitud.cedula,
      email: solicitud.email,
      telefono: solicitud.telefono,
      ciudad: solicitud.ciudad,
      fechaNacimiento: notas.fecha_nacimiento || null,
      origen: "whatsapp",
      solicitudId: solicitud.id,
      sorteoId: notas.sorteo_id || null,
      rangoFisico,
      rangoWeb,
    });

    await registrarActividad(supabaseAdmin, user, "pago_web_activado", {
      nombre: solicitud.nombre,
      plan: solicitud.plan_id,
      claves: resultado.claves,
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
