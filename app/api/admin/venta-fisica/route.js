import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { getPlanById } from "@/lib/club-gomez/planes";
import { activarMembresiaManual } from "@/lib/club-gomez/activar-membresia";
import {
  inventarioClavesPeriodo,
  parseClavesInput,
} from "@/lib/club-gomez/claves-pool";

export const dynamic = "force-dynamic";

function bad(msg, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function GET(request) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) return bad("No autorizado", 401);
    if (supabaseMissingEnv) return bad("Supabase no configurado", 503);

    const inventario = await inventarioClavesPeriodo(supabaseAdmin);
    return NextResponse.json({ ok: true, inventario });
  } catch (err) {
    return bad(err.message || "Error al cargar inventario", 500);
  }
}

export async function POST(request) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) return bad("No autorizado", 401);
    if (supabaseMissingEnv) return bad("Supabase no configurado", 503);

    const body = await request.json().catch(() => ({}));
    const nombre = String(body.nombre || "").trim();
    const telefono = String(body.telefono || "").trim();
    const email = String(body.email || "").trim();
    const cedula = String(body.cedula || "").trim();
    const ciudad = String(body.ciudad || "").trim();
    const plan = getPlanById(body.planId || body.plan_id);

    if (!nombre) return bad("El nombre es obligatorio.");
    if (!telefono) return bad("El WhatsApp / teléfono es obligatorio.");

    const clavesManuales = parseClavesInput(body.claves || body.clavesTexto || "");
    if (!clavesManuales.length) {
      return bad(
        `Ingresa las ${plan.claves} claves impresas (6001–9999) que le entregaste.`
      );
    }

    const resultado = await activarMembresiaManual(supabaseAdmin, {
      planId: plan.id,
      nombre,
      cedula: cedula || null,
      email: email || null,
      telefono,
      ciudad: ciudad || null,
      fechaNacimiento: body.fecha_nacimiento || null,
      origen: "manual",
      montoCop: plan.precio,
      clavesManuales,
    });

    return NextResponse.json({
      ok: true,
      miembro: {
        id: resultado.miembro?.id,
        nombre: resultado.miembro?.nombre,
        telefono: resultado.miembro?.telefono,
        email: resultado.miembro?.email,
      },
      plan: { id: plan.id, nombre: plan.nombre, precio: plan.precio },
      claves: resultado.claves || [],
      emailOk: resultado.emailOk,
      alreadyActive: Boolean(resultado.alreadyActive),
    });
  } catch (err) {
    console.error("[admin/venta-fisica]", err);
    return bad(err.message || "No se pudo registrar la venta física.", 500);
  }
}
