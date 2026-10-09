import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { activarMembresiaManual } from "@/lib/club-gomez/activar-membresia";
import {
  asignarClavesDelPool,
  inventarioClavesPeriodo,
  parseClavesInput,
  periodoDe,
} from "@/lib/club-gomez/claves-pool";
import { rangoPeriodoBogota } from "@/lib/club-gomez/periodo-rango";
import { obtenerPlan } from "@/lib/club-gomez/planes-db";
import { registrarActividad } from "@/lib/admin-actividad";

export const dynamic = "force-dynamic";

function bad(msg, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

function hoyBogota() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

async function ventasFisicasPeriodo(periodo) {
  const { desde, hasta } = rangoPeriodoBogota(periodo);
  const { data, error } = await supabaseAdmin
    .from("pagos")
    .select(
      "id, monto_cop, estado, pagado_en, membresia_id, miembros(nombre, telefono, email), membresias(plan_id, estado, claves(numero))"
    )
    .eq("metodo", "efectivo")
    .gte("pagado_en", desde)
    .lt("pagado_en", hasta)
    .order("pagado_en", { ascending: false });
  if (error) throw new Error(error.message);

  const hoy = hoyBogota();
  const fechaBogota = (d) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date(d));

  const ventas = (data || []).map((p) => ({
    id: p.id,
    membresiaId: p.membresia_id,
    nombre: p.miembros?.nombre || "—",
    telefono: p.miembros?.telefono || "",
    planId: p.membresias?.plan_id || null,
    numeros: (p.membresias?.claves || []).map((c) => c.numero).sort(),
    monto: Number(p.monto_cop) || 0,
    estado: p.estado,
    fecha: p.pagado_en,
    esHoy: fechaBogota(p.pagado_en) === hoy,
  }));

  const aprobadas = ventas.filter((v) => v.estado === "aprobado");
  const deHoy = aprobadas.filter((v) => v.esHoy);
  return {
    ventas: ventas.slice(0, 50),
    caja: {
      hoyVentas: deHoy.length,
      hoyTotal: deHoy.reduce((a, v) => a + v.monto, 0),
      mesVentas: aprobadas.length,
      mesTotal: aprobadas.reduce((a, v) => a + v.monto, 0),
    },
  };
}

export async function GET(request) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) return bad("No autorizado", 401);
    if (supabaseMissingEnv) return bad("Supabase no configurado", 503);

    const { searchParams } = new URL(request.url);
    const sugerir = Number(searchParams.get("sugerir") || 0);
    if (sugerir > 0) {
      // Solo propone números libres del rango físico; no los reserva.
      const numeros = await asignarClavesDelPool(supabaseAdmin, {
        count: Math.min(20, Math.floor(sugerir)),
        canal: "fisico",
      });
      return NextResponse.json({ ok: true, numeros: numeros.sort() });
    }

    const periodo = periodoDe();
    const [inventario, resumen] = await Promise.all([
      inventarioClavesPeriodo(supabaseAdmin, periodo),
      ventasFisicasPeriodo(periodo).catch((err) => {
        console.error("[admin/venta-fisica] ventas:", err);
        return { ventas: [], caja: null };
      }),
    ]);
    return NextResponse.json({ ok: true, inventario, ...resumen });
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
    const plan = await obtenerPlan(supabaseAdmin, body.planId || body.plan_id);

    if (!nombre) return bad("El nombre es obligatorio.");
    if (!telefono) return bad("El WhatsApp / teléfono es obligatorio.");
    if (cedula.replace(/\D/g, "").length < 5) {
      return bad("La cédula es obligatoria para que el cliente pueda consultar sus números.");
    }

    const clavesManuales = parseClavesInput(body.claves || body.clavesTexto || "");
    if (!clavesManuales.length) {
      return bad(
        `Ingresa las ${plan.claves} claves impresas (000–700) que le entregaste.`
      );
    }

    const resultado = await activarMembresiaManual(supabaseAdmin, {
      planId: plan.id,
      plan,
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

    await registrarActividad(supabaseAdmin, user, "venta_fisica", {
      nombre,
      telefono,
      plan: plan.nombre,
      monto: plan.precio,
      numeros: resultado.claves || [],
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
    return bad(
      String(err?.message || "").includes("idx_") || err?.code === "23505"
        ? "Esa cédula, email o clave ya está registrada este mes."
        : err.message || "No se pudo registrar la venta física.",
      500
    );
  }
}
