import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { fechaLegible } from "@/lib/club-gomez/sorteos";
import { padClave } from "@/lib/club-gomez/claves-pool";

export const dynamic = "force-dynamic";

function tamano(min, max) {
  const a = Number(min);
  const b = Number(max);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
  return b - a + 1;
}

function enRango(numero, min, max) {
  const n = Number(padClave(numero));
  return n >= Number(min) && n <= Number(max);
}

function estadoPagina(sorteo) {
  if (sorteo.estado === "cerrado") return "Terminada";
  if (sorteo.estado === "en_venta") return "Publicada";
  return "Oculta";
}

function notasDe(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function GET(request) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (supabaseMissingEnv) {
      return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
    }

    const pedido = new URL(request.url).searchParams.get("sorteo");
    const { data: sorteos, error: errorSorteos } = await supabaseAdmin
      .from("sorteos_rifa")
      .select("id, nombre, premio, slug, estado, fecha_sorteo, loteria, trabajando, es_principal, fisico_min, fisico_max, web_min, web_max")
      .order("created_at", { ascending: false });

    if (errorSorteos) {
      return NextResponse.json({ ok: true, sorteo: null, otros: [], stats: null, ventas: [] });
    }

    const lista = sorteos || [];
    const activo =
      lista.find((s) => pedido && s.id === pedido) ||
      lista.find((s) => s.es_principal) ||
      lista[0] ||
      null;

    if (!activo) {
      return NextResponse.json({ ok: true, sorteo: null, otros: [], stats: null, ventas: [] });
    }

    const ids = lista.map((s) => s.id);
    const [{ data: claves }, { data: membresias }, { data: solicitudes }] = await Promise.all([
      supabaseAdmin.from("claves").select("numero, sorteo_id, membresia_id").in("sorteo_id", ids),
      supabaseAdmin
        .from("membresias")
        .select("id, plan_id, origen, created_at, miembro_id, sorteo_id, miembros(nombre)")
        .eq("sorteo_id", activo.id)
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("solicitudes_membresia").select("id, notas, estado").eq("estado", "nueva"),
    ]);

    const clavesTodas = claves || [];
    const delSorteo = clavesTodas.filter((c) => c.sorteo_id === activo.id);
    const dadasFisico = delSorteo.filter((c) => enRango(c.numero, activo.fisico_min, activo.fisico_max)).length;
    const dadasWeb = delSorteo.filter((c) => enRango(c.numero, activo.web_min, activo.web_max)).length;
    const totalFisico = tamano(activo.fisico_min, activo.fisico_max);
    const totalWeb = tamano(activo.web_min, activo.web_max);
    const dadas = dadasFisico + dadasWeb;
    const total = totalFisico + totalWeb;

    const mems = membresias || [];
    const memIds = mems.map((m) => m.id);
    let pagos = [];
    if (memIds.length) {
      const { data } = await supabaseAdmin
        .from("pagos")
        .select("id, monto_cop, pagado_en, metodo, membresia_id, estado")
        .in("membresia_id", memIds)
        .eq("estado", "aprobado")
        .order("pagado_en", { ascending: false });
      pagos = data || [];
    }

    const planIds = [...new Set(mems.map((m) => m.plan_id).filter(Boolean))];
    const planes = {};
    if (planIds.length) {
      const { data } = await supabaseAdmin.from("planes").select("id, nombre").in("id", planIds);
      for (const p of data || []) planes[p.id] = p.nombre;
    }

    const numerosPorMem = {};
    for (const c of delSorteo) {
      if (!c.membresia_id) continue;
      if (!numerosPorMem[c.membresia_id]) numerosPorMem[c.membresia_id] = [];
      numerosPorMem[c.membresia_id].push(padClave(c.numero));
    }

    const memPorId = Object.fromEntries(mems.map((m) => [m.id, m]));
    const conPago = new Set(pagos.map((p) => p.membresia_id));
    const ventas = pagos.slice(0, 8).map((p) => {
      const mem = memPorId[p.membresia_id] || {};
      const nums = (numerosPorMem[p.membresia_id] || []).sort();
      return {
        id: p.id,
        nombre: mem.miembros?.nombre || "—",
        planNombre: planes[mem.plan_id] || "Plan",
        numeros: nums,
        monto: p.monto_cop,
        fecha: p.pagado_en,
        canal: p.metodo === "efectivo" ? "local" : "web",
      };
    });

    const ventasLocal = pagos.filter((p) => p.metodo === "efectivo").length;
    const ventasWeb = pagos.length - ventasLocal;
    const ingresos = pagos.reduce((suma, p) => suma + (Number(p.monto_cop) || 0), 0);
    const sinPago = mems.filter((m) => !conPago.has(m.id)).length;
    const sinConfirmar = (solicitudes || []).filter((s) => {
      const notas = notasDe(s.notas);
      return notas.sorteo_id === activo.id || notas.sorteo_slug === activo.slug;
    }).length;

    const cuentas = {};
    for (const c of clavesTodas) {
      cuentas[c.sorteo_id] = (cuentas[c.sorteo_id] || 0) + 1;
    }

    const ficha = (s) => ({
      id: s.id,
      nombre: s.premio || s.nombre,
      slug: s.slug,
      fecha: fechaLegible(s.fecha_sorteo),
      loteria: s.loteria || "",
      pagina: estadoPagina(s),
      enInicio: Boolean(s.es_principal),
      dadas: cuentas[s.id] || 0,
      total: tamano(s.fisico_min, s.fisico_max) + tamano(s.web_min, s.web_max),
    });

    return NextResponse.json({
      ok: true,
      sorteo: ficha(activo),
      otros: lista.filter((s) => s.id !== activo.id).map(ficha),
      stats: {
        dadas,
        libres: Math.max(0, total - dadas),
        total,
        dadasFisico,
        libresFisico: Math.max(0, totalFisico - dadasFisico),
        dadasWeb,
        libresWeb: Math.max(0, totalWeb - dadasWeb),
        ventasLocal,
        ventasWeb,
        ingresos,
        sinConfirmar,
        sinPago,
      },
      ventas,
    });
  } catch (err) {
    console.error("[admin/dashboard]", err);
    return NextResponse.json(
      { error: err.message || "Error al cargar dashboard" },
      { status: 500 }
    );
  }
}
