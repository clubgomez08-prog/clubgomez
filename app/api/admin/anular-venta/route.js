import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { registrarActividad } from "@/lib/admin-actividad";

export const dynamic = "force-dynamic";

/**
 * Anula una venta FÍSICA mal registrada: libera sus números, cancela la
 * membresía y marca el pago como anulado. Las ventas web (Bold) no se tocan.
 */
export async function POST(request) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (supabaseMissingEnv) {
      return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const membresiaId = String(body.membresiaId || "").trim();
    const motivo = String(body.motivo || "").trim();
    if (!membresiaId) {
      return NextResponse.json({ error: "Falta la membresía" }, { status: 400 });
    }
    if (!motivo) {
      return NextResponse.json({ error: "Escribe el motivo de la anulación" }, { status: 400 });
    }

    const { data: mem, error } = await supabaseAdmin
      .from("membresias")
      .select("id, plan_id, origen, estado, miembros(nombre, telefono), claves(id, numero, periodo)")
      .eq("id", membresiaId)
      .maybeSingle();

    if (error || !mem) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }
    if (mem.origen !== "manual") {
      return NextResponse.json(
        { error: "Solo se pueden anular ventas físicas. Las ventas web no se anulan desde aquí." },
        { status: 400 }
      );
    }
    if (mem.estado === "cancelada") {
      return NextResponse.json({ error: "Esta venta ya estaba anulada." }, { status: 409 });
    }

    const liberados = (mem.claves || []).map((c) => c.numero).sort();
    const ahora = new Date().toISOString();

    const { error: pagoErr } = await supabaseAdmin
      .from("pagos")
      .update({ estado: "anulado" })
      .eq("membresia_id", mem.id);
    if (pagoErr) throw new Error(pagoErr.message);

    const { error: memErr } = await supabaseAdmin
      .from("membresias")
      .update({ estado: "cancelada", updated_at: ahora })
      .eq("id", mem.id);
    if (memErr) throw new Error(memErr.message);

    const { error: clavesErr } = await supabaseAdmin
      .from("claves")
      .delete()
      .eq("membresia_id", mem.id);
    if (clavesErr) throw new Error(clavesErr.message);

    await registrarActividad(supabaseAdmin, user, "venta_anulada", {
      nombre: mem.miembros?.nombre || "",
      telefono: mem.miembros?.telefono || "",
      plan: mem.plan_id,
      numeros: liberados,
      motivo,
    });

    return NextResponse.json({ ok: true, liberados });
  } catch (err) {
    console.error("[admin/anular-venta]", err);
    return NextResponse.json(
      { error: err.message || "No se pudo anular la venta" },
      { status: 500 }
    );
  }
}
