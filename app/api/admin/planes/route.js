import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { PLANES_MEMBRESIA } from "@/lib/club-gomez/planes";
import { cargarPlanes, invalidarPlanes, LIMITES_PLAN } from "@/lib/club-gomez/planes-db";
import { periodoDe } from "@/lib/club-gomez/claves-pool";
import { rangoPeriodoBogota } from "@/lib/club-gomez/periodo-rango";
import { registrarActividad } from "@/lib/admin-actividad";

export const dynamic = "force-dynamic";

async function ventasDelMes() {
  const { desde, hasta } = rangoPeriodoBogota(periodoDe());
  const { data } = await supabaseAdmin
    .from("membresias")
    .select("plan_id")
    .neq("estado", "cancelada")
    .gte("created_at", desde)
    .lt("created_at", hasta);
  const conteo = {};
  for (const m of data || []) conteo[m.plan_id] = (conteo[m.plan_id] || 0) + 1;
  return conteo;
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

    const [planes, ventas, { error: colErr }] = await Promise.all([
      cargarPlanes(supabaseAdmin, { fresco: true }),
      ventasDelMes(),
      supabaseAdmin.from("planes").select("precio_antes, equiv").limit(1),
    ]);

    return NextResponse.json({
      ok: true,
      planes: Object.keys(PLANES_MEMBRESIA).map((id) => planes[id]),
      ventasMes: ventas,
      limites: LIMITES_PLAN,
      faltaMigracion: Boolean(colErr),
    });
  } catch (err) {
    console.error("[admin/planes GET]", err);
    return NextResponse.json(
      { error: err.message || "Error al cargar planes" },
      { status: 500 }
    );
  }
}

function entero(v) {
  const n = Number(String(v ?? "").replace(/\D/g, ""));
  return Number.isInteger(n) ? n : NaN;
}

export async function PUT(request) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (supabaseMissingEnv) {
      return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const id = String(body.id || "");
    if (!PLANES_MEMBRESIA[id]) {
      return NextResponse.json({ error: "Plan no válido" }, { status: 400 });
    }

    const nombre = String(body.nombre || "").trim();
    const precio = entero(body.precio);
    const precioAntes = entero(body.precioAntes);
    const claves = entero(body.claves);
    const tag = String(body.tag || "").trim();
    const equiv = String(body.equiv || "").trim();
    const L = LIMITES_PLAN;

    if (!nombre) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    if (!(precio >= L.precioMin && precio <= L.precioMax)) {
      return NextResponse.json(
        { error: `El precio debe estar entre $${L.precioMin.toLocaleString("es-CO")} y $${L.precioMax.toLocaleString("es-CO")}` },
        { status: 400 }
      );
    }
    if (!(precioAntes > precio && precioAntes <= L.precioMax)) {
      return NextResponse.json(
        { error: "El precio tachado (antes) debe ser mayor que el precio actual" },
        { status: 400 }
      );
    }
    if (!(claves >= L.clavesMin && claves <= L.clavesMax)) {
      return NextResponse.json(
        { error: `Las oportunidades deben estar entre ${L.clavesMin} y ${L.clavesMax}` },
        { status: 400 }
      );
    }

    const antes = (await cargarPlanes(supabaseAdmin, { fresco: true }))[id];

    const { error } = await supabaseAdmin
      .from("planes")
      .update({
        nombre,
        precio_cop: precio,
        precio_antes: precioAntes,
        claves,
        tag: tag || null,
        equiv: equiv || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      const sinColumnas = /precio_antes|equiv|updated_at/.test(error.message || "");
      return NextResponse.json(
        {
          error: sinColumnas
            ? "Falta la migración 019_historial_planes_editables.sql en Supabase."
            : error.message,
        },
        { status: 400 }
      );
    }

    invalidarPlanes();
    const despues = (await cargarPlanes(supabaseAdmin, { fresco: true }))[id];

    await registrarActividad(supabaseAdmin, user, "plan_editado", {
      plan: id,
      antes: `${antes.nombre} $${antes.precioLabel} / ${antes.claves} oport.`,
      ahora: `${despues.nombre} $${despues.precioLabel} / ${despues.claves} oport.`,
    });

    return NextResponse.json({ ok: true, plan: despues });
  } catch (err) {
    console.error("[admin/planes PUT]", err);
    return NextResponse.json(
      { error: err.message || "Error al guardar el plan" },
      { status: 500 }
    );
  }
}
