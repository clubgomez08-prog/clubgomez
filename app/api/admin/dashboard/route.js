import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import {
  inventarioClavesPeriodo,
  periodoDe,
} from "@/lib/club-gomez/claves-pool";
import { getPlanById } from "@/lib/club-gomez/planes";
import { rangoPeriodoBogota } from "@/lib/club-gomez/periodo-rango";

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
    const { desde, hasta } = rangoPeriodoBogota(periodo);
    const ahora = new Date().toISOString();

    const [
      rVigentes,
      rSolicitudes,
      rPagos,
      inventario,
      rBeneficios,
      rUltimos,
      rPagosRecientes,
      rMembresiasMes,
    ] = await Promise.all([
      supabaseAdmin
        .from("membresias")
        .select("miembro_id")
        .eq("estado", "activa")
        .gt("vence_en", ahora),
      supabaseAdmin
        .from("solicitudes_membresia")
        .select("*", { count: "exact", head: true })
        .eq("estado", "nueva"),
      supabaseAdmin
        .from("pagos")
        .select("monto_cop, pagado_en, membresia_id")
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
      supabaseAdmin
        .from("membresias")
        .select("id")
        .gte("created_at", desde)
        .lt("created_at", hasta),
    ]);

    const vigentes = rVigentes.error ? [] : rVigentes.data || [];
    const miembrosActivos = new Set(
      vigentes.map((m) => m.miembro_id).filter(Boolean)
    ).size;

    const pagos = rPagos.error ? [] : rPagos.data || [];
    const desdeMs = Date.parse(desde);
    const hastaMs = Date.parse(hasta);
    let ingresos = 0;
    let ingresosTotal = 0;
    for (const p of pagos) {
      const monto = Number(p.monto_cop) || 0;
      ingresosTotal += monto;
      const t = Date.parse(p.pagado_en);
      if (t >= desdeMs && t < hastaMs) ingresos += monto;
    }

    const conPago = new Set(pagos.map((p) => p.membresia_id).filter(Boolean));
    const ventasSinPago = (rMembresiasMes.error ? [] : rMembresiasMes.data || [])
      .filter((m) => !conPago.has(m.id)).length;

    const pagosRecientes = rPagosRecientes.error ? [] : rPagosRecientes.data || [];
    const miembroIds = [
      ...new Set(pagosRecientes.map((p) => p.miembro_id).filter(Boolean)),
    ];
    const membresiaIds = [
      ...new Set(pagosRecientes.map((p) => p.membresia_id).filter(Boolean)),
    ];
    let miembrosMap = {};
    let planesMap = {};
    const clavesCount = {};
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
        .select("id, plan_id, claves(numero)")
        .in("id", membresiaIds);
      for (const m of mems || []) {
        planesMap[m.id] = m.plan_id;
        clavesCount[m.id] = (m.claves || []).length;
      }
    }
    const ultimasVentas = pagosRecientes.map((p) => {
      const plan = getPlanById(planesMap[p.membresia_id]);
      const persona = miembrosMap[p.miembro_id] || {};
      return {
        id: p.id,
        nombre: persona.nombre || "—",
        email: persona.email || "—",
        planNombre: plan.nombre,
        oportunidades: clavesCount[p.membresia_id] ?? plan.claves,
        monto: p.monto_cop,
        fecha: p.pagado_en,
        canal: p.metodo === "efectivo" ? "físico" : "web",
      };
    });

    return NextResponse.json({
      ok: true,
      periodo,
      stats: {
        miembrosActivos,
        membresiasActivas: vigentes.length,
        solicitudesNuevas: rSolicitudes.error ? 0 : rSolicitudes.count ?? 0,
        ingresos,
        ingresosTotal,
        ventasSinPago,
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
