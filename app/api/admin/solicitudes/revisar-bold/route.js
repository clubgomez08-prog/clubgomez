import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { boldConfigured } from "@/lib/club-gomez/bold";
import { activarSolicitudSiBoldCobro } from "@/lib/club-gomez/activar-pago-bold";
import { registrarActividad } from "@/lib/admin-actividad";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DIAS_ATRAS = 7;
const MAX_REVISAR = 40;

/**
 * Revisa con la API de Bold los intentos web sin confirmar de los últimos días
 * y activa solo los que Bold reporta como cobrados.
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
    if (!boldConfigured()) {
      return NextResponse.json({ error: "Bold no está configurado" }, { status: 503 });
    }

    const desde = new Date(Date.now() - DIAS_ATRAS * 24 * 60 * 60 * 1000).toISOString();
    const { data: solicitudes, error } = await supabaseAdmin
      .from("solicitudes_membresia")
      .select("*")
      .eq("estado", "nueva")
      .gte("created_at", desde)
      .order("created_at", { ascending: true })
      .limit(MAX_REVISAR);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const activadas = [];
    const pendientes = [];
    const errores = [];
    let sinCobro = 0;

    // Una por una para no asignar números en paralelo.
    for (const s of solicitudes || []) {
      try {
        const r = await activarSolicitudSiBoldCobro(supabaseAdmin, s);
        if (r.estado === "activada") {
          activadas.push({
            nombre: s.nombre,
            plan: s.plan_id,
            numeros: r.resultado?.claves || [],
            emailOk: Boolean(r.resultado?.emailOk),
          });
        } else if (r.estado === "pendiente") {
          pendientes.push(s.nombre);
        } else if (r.estado === "sin_cobro") {
          sinCobro += 1;
        }
      } catch (err) {
        // "NO_TRANSACTION_FOUND" y similares: la persona nunca pagó.
        const msg = String(err?.message || err);
        if (/not.?found|no.?transaction/i.test(msg)) sinCobro += 1;
        else errores.push({ nombre: s.nombre, error: msg });
      }
    }

    if (activadas.length) {
      await registrarActividad(supabaseAdmin, user, "pagos_revisados_bold", {
        revisados: (solicitudes || []).length,
        activadas: activadas.map((a) => `${a.nombre} (${a.numeros.join(", ")})`),
      });
    }

    return NextResponse.json({
      ok: true,
      revisados: (solicitudes || []).length,
      activadas,
      pendientes,
      sinCobro,
      errores,
    });
  } catch (err) {
    console.error("[admin/solicitudes/revisar-bold]", err);
    return NextResponse.json(
      { error: err.message || "Error al revisar con Bold" },
      { status: 500 }
    );
  }
}
