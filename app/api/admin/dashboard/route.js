import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import {
  inventarioClavesPeriodo,
  periodoDe,
} from "@/lib/club-gomez/claves-pool";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (supabaseMissingEnv) {
      return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
    }

    const periodo = periodoDe();

    const [
      rMiembros,
      rMembresias,
      rSolicitudes,
      rPagos,
      inventario,
      rBeneficios,
      rUltimos,
    ] = await Promise.all([
      supabaseAdmin
        .from("miembros")
        .select("*", { count: "exact", head: true })
        .eq("estado", "activo"),
      supabaseAdmin
        .from("membresias")
        .select("*", { count: "exact", head: true })
        .eq("estado", "activa"),
      supabaseAdmin
        .from("solicitudes_membresia")
        .select("*", { count: "exact", head: true })
        .eq("estado", "nueva"),
      supabaseAdmin
        .from("pagos")
        .select("monto_cop")
        .eq("estado", "aprobado"),
      inventarioClavesPeriodo(supabaseAdmin, periodo).catch(() => ({
        periodo,
        emitidas: 0,
        libres: 10000,
        total: 10000,
      })),
      supabaseAdmin
        .from("sorteos_beneficio")
        .select("*", { count: "exact", head: true })
        .eq("periodo", periodo)
        .eq("estado", "programado"),
      supabaseAdmin
        .from("miembros")
        .select("id, nombre, email, estado, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const ingresos =
      rPagos.error || !rPagos.data
        ? 0
        : rPagos.data.reduce((acc, p) => acc + (Number(p.monto_cop) || 0), 0);

    return NextResponse.json({
      ok: true,
      periodo,
      stats: {
        miembrosActivos: rMiembros.error ? 0 : rMiembros.count ?? 0,
        membresiasActivas: rMembresias.error ? 0 : rMembresias.count ?? 0,
        solicitudesNuevas: rSolicitudes.error ? 0 : rSolicitudes.count ?? 0,
        ingresos,
        clavesEmitidas: inventario.emitidas,
        clavesLibres: inventario.libres,
        premiosProgramados: rBeneficios.error ? 0 : rBeneficios.count ?? 0,
      },
      inventario,
      ultimosMiembros: rUltimos.error ? [] : rUltimos.data || [],
    });
  } catch (err) {
    console.error("[admin/dashboard]", err);
    return NextResponse.json(
      { error: err.message || "Error al cargar dashboard" },
      { status: 500 }
    );
  }
}
