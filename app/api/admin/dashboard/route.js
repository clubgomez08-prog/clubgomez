import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import {
  inventarioClavesPeriodo,
  periodoDe,
} from "@/lib/club-gomez/claves-pool";
import { getPlanById } from "@/lib/club-gomez/planes";

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
      rPagosRecientes,
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
        libres: 1000,
        total: 1000,
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
      supabaseAdmin
        .from("pagos")
        .select("id, monto_cop, pagado_en, metodo, miembro_id, membresia_id")
        .eq("estado", "aprobado")
        .order("pagado_en", { ascending: false })
        .limit(8),
    ]);

    const ingresos =
      rPagos.error || !rPagos.data
        ? 0
        : rPagos.data.reduce((acc, p) => acc + (Number(p.monto_cop) || 0), 0);

    const pagosRecientes = rPagosRecientes.error ? [] : rPagosRecientes.data || [];
    const miembroIds = [
      ...new Set(pagosRecientes.map((p) => p.miembro_id).filter(Boolean)),
    ];
    const membresiaIds = [
      ...new Set(pagosRecientes.map((p) => p.membresia_id).filter(Boolean)),
    ];
    let miembrosMap = {};
    let planesMap = {};
    if (miembroIds.length) {
      const { data: ms } = await supabaseAdmin
        .from("miembros")
        .select("id, nombre, email")
        .in("id", miembroIds);
      for (const m of ms || []) miembrosMap[m.id] = m;
    }
    if (membresiaIds.length) {
      const { data: mems } = await supabaseAdmin
        .from("membresias")
        .select("id, plan_id")
        .in("id", membresiaIds);
      for (const m of mems || []) planesMap[m.id] = m.plan_id;
    }
    const ultimasVentas = pagosRecientes.map((p) => {
      const plan = getPlanById(planesMap[p.membresia_id]);
      const persona = miembrosMap[p.miembro_id] || {};
      return {
        id: p.id,
        nombre: persona.nombre || "—",
        email: persona.email || "—",
        planNombre: plan.nombre,
        oportunidades: plan.claves,
        monto: p.monto_cop,
        fecha: p.pagado_en,
        canal: p.metodo === "efectivo" ? "físico" : "web",
      };
    });

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
        clavesWebEmitidas: inventario.web?.emitidas ?? 0,
        clavesWebLibres: inventario.web?.libres ?? 0,
        clavesFisicoEmitidas: inventario.fisico?.emitidas ?? 0,
        clavesFisicoLibres: inventario.fisico?.libres ?? 0,
        premiosProgramados: rBeneficios.error ? 0 : rBeneficios.count ?? 0,
      },
      inventario,
      ultimosMiembros: rUltimos.error ? [] : rUltimos.data || [],
      ultimasVentas,
    });
  } catch (err) {
    console.error("[admin/dashboard]", err);
    return NextResponse.json(
      { error: err.message || "Error al cargar dashboard" },
      { status: 500 }
    );
  }
}
