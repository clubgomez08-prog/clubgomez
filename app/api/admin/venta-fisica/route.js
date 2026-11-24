import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { activarMembresiaManual } from "@/lib/club-gomez/activar-membresia";
import {
  asignarClavesDelPool,
  digitosDeTopes,
  formatearNumero,
  inventarioClavesPeriodo,
  parseClavesInput,
  periodoDe,
} from "@/lib/club-gomez/claves-pool";
import { rangoPeriodoBogota } from "@/lib/club-gomez/periodo-rango";
import { obtenerPlan } from "@/lib/club-gomez/planes-db";
import { registrarActividad } from "@/lib/admin-actividad";
import { leerSorteoPor, espejarPlan } from "@/lib/club-gomez/sorteos";

export const dynamic = "force-dynamic";

function bad(msg, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

function hoyBogota() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

function padDe(n, sorteo) {
  return formatearNumero(n, digitosDeTopes(sorteo?.fisico_max, sorteo?.web_max));
}

function rangoFisicoDe(sorteo) {
  const min = Number(sorteo?.fisico_min);
  const max = Number(sorteo?.fisico_max);
  return {
    min: Number.isFinite(min) ? min : 0,
    max: Number.isFinite(max) ? max : 700,
  };
}

async function inventarioDeSorteo(sorteo) {
  const rango = rangoFisicoDe(sorteo);
  const data = [];
  for (let from = 0; from < 20000; from += 1000) {
    const { data: page, error } = await supabaseAdmin
      .from("claves")
      .select("numero")
      .eq("sorteo_id", sorteo.id)
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    data.push(...(page || []));
    if (!page || page.length < 1000) break;
  }
  const usados = new Set(
    (data || [])
      .map((r) => Number(r.numero))
      .filter((n) => n >= rango.min && n <= rango.max)
  );
  const total = rango.max - rango.min + 1;
  return {
    fisico: {
      emitidas: usados.size,
      libres: Math.max(0, total - usados.size),
      total,
      min: rango.min,
      max: rango.max,
    },
  };
}

async function ventasDeSorteo(sorteoId) {
  const { data: mems, error: memErr } = await supabaseAdmin
    .from("membresias")
    .select("id, plan_id, sorteo_id, claves(numero)")
    .eq("sorteo_id", sorteoId);
  if (memErr) throw new Error(memErr.message);
  const porMembresia = Object.fromEntries((mems || []).map((m) => [m.id, m]));
  const ids = Object.keys(porMembresia);
  if (!ids.length) {
    return {
      ventas: [],
      caja: { hoyVentas: 0, hoyTotal: 0, sorteoVentas: 0, sorteoTotal: 0 },
    };
  }

  const { data, error } = await supabaseAdmin
    .from("pagos")
    .select("id, monto_cop, estado, pagado_en, membresia_id, metodo, miembros(nombre, telefono, email)")
    .in("membresia_id", ids)
    .eq("metodo", "efectivo")
    .order("pagado_en", { ascending: false });
  if (error) throw new Error(error.message);

  const hoy = hoyBogota();
  const fechaBogota = (d) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date(d));

  const ventas = (data || []).map((p) => {
    const mem = porMembresia[p.membresia_id] || {};
    return {
      id: p.id,
      membresiaId: p.membresia_id,
      nombre: p.miembros?.nombre || "—",
      telefono: p.miembros?.telefono || "",
      planId: mem.plan_id || null,
      sorteoId: mem.sorteo_id || sorteoId,
      numeros: (mem.claves || []).map((c) => c.numero).sort(),
      monto: Number(p.monto_cop) || 0,
      estado: p.estado,
      fecha: p.pagado_en,
      esHoy: fechaBogota(p.pagado_en) === hoy,
    };
  });

  const aprobadas = ventas.filter((v) => v.estado === "aprobado");
  const deHoy = aprobadas.filter((v) => v.esHoy);
  return {
    ventas: ventas.slice(0, 50),
    caja: {
      hoyVentas: deHoy.length,
      hoyTotal: deHoy.reduce((a, v) => a + v.monto, 0),
      sorteoVentas: aprobadas.length,
      sorteoTotal: aprobadas.reduce((a, v) => a + v.monto, 0),
    },
  };
}

async function ventasFisicasPeriodo(periodo) {
  const { desde, hasta } = rangoPeriodoBogota(periodo);
  let { data, error } = await supabaseAdmin
    .from("pagos")
    .select(
      "id, monto_cop, estado, pagado_en, membresia_id, miembros(nombre, telefono, email), membresias(plan_id, estado, sorteo_id, claves(numero))"
    )
    .eq("metodo", "efectivo")
    .gte("pagado_en", desde)
    .lt("pagado_en", hasta)
    .order("pagado_en", { ascending: false });
  if (error) {
    const retry = await supabaseAdmin
      .from("pagos")
      .select(
        "id, monto_cop, estado, pagado_en, membresia_id, miembros(nombre, telefono, email), membresias(plan_id, estado, claves(numero))"
      )
      .eq("metodo", "efectivo")
      .gte("pagado_en", desde)
      .lt("pagado_en", hasta)
      .order("pagado_en", { ascending: false });
    data = retry.data;
    error = retry.error;
  }
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
    sorteoId: p.membresias?.sorteo_id || null,
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
    const sorteoPedido = String(searchParams.get("sorteo") || "").trim();
    const { sorteo } = await leerSorteoPor(
      supabaseAdmin,
      /^[0-9a-f-]{36}$/i.test(sorteoPedido) ? { id: sorteoPedido } : { principal: true }
    );
    const sugerir = Number(searchParams.get("sugerir") || 0);
    if (sugerir > 0) {
      const rango = sorteo ? rangoFisicoDe(sorteo) : null;
      const numeros = await asignarClavesDelPool(supabaseAdmin, {
        count: Math.min(100, Math.floor(sugerir)),
        canal: "fisico",
        sorteoId: sorteo?.id || null,
        rango,
      });
      return NextResponse.json({ ok: true, numeros: numeros.sort() });
    }

    if (sorteo) {
      const [inventario, resumen] = await Promise.all([
        inventarioDeSorteo(sorteo),
        ventasDeSorteo(sorteo.id).catch((err) => {
          console.error("[admin/venta-fisica] ventas:", err);
          return { ventas: [], caja: null };
        }),
      ]);
      return NextResponse.json({
        ok: true,
        sorteoId: sorteo.id,
        inventario,
        ...resumen,
      });
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
    const planPedido = String(body.planId || body.plan_id || "").trim().toLowerCase();

    if (!nombre) return bad("El nombre es obligatorio.");
    if (!telefono) return bad("El WhatsApp / teléfono es obligatorio.");
    if (cedula.replace(/\D/g, "").length < 5) {
      return bad("La cédula es obligatoria para que el cliente pueda consultar sus números.");
    }

    const varios = planPedido === "varios";
    const sorteoPedido = String(body.sorteoId || "").trim();
    const { sorteo } = await leerSorteoPor(
      supabaseAdmin,
      /^[0-9a-f-]{36}$/i.test(sorteoPedido) ? { id: sorteoPedido } : { principal: true }
    );
    if (sorteoPedido && !sorteo) return bad("Ese sorteo no existe.");
    if (sorteo?.estado === "cerrado") {
      return bad("Este sorteo ya terminó. Llegó la fecha y ya no se vende.");
    }
    const clavesManuales = parseClavesInput(
      body.claves || body.clavesTexto || "",
      digitosDeTopes(sorteo?.fisico_max, sorteo?.web_max)
    );
    const rangoFisico = sorteo ? rangoFisicoDe(sorteo) : null;
    const textoRango = rangoFisico
      ? `${padDe(rangoFisico.min, sorteo)} al ${padDe(rangoFisico.max, sorteo)}`
      : "000 al 700";
    if (varios && (clavesManuales.length < 1 || clavesManuales.length > 100)) {
      return bad(`Escribe entre 1 y 100 números del ${textoRango}.`);
    }
    if (body.soloFisico && rangoFisico) {
      const fuera = clavesManuales.filter((n) => {
        const v = Number(n);
        return v < rangoFisico.min || v > rangoFisico.max;
      });
      if (fuera.length) {
        return bad(
          `La boletería física de este sorteo va del ${textoRango}. Estos no entran: ${fuera.join(", ")}.`
        );
      }
    }
    const rangoWeb = sorteo ? { min: sorteo.web_min, max: sorteo.web_max } : null;
    const esPlanSorteo = /^[0-9a-f-]{36}$/i.test(planPedido);

    let plan;
    if (esPlanSorteo) {
      const { data: fila } = await supabaseAdmin
        .from("sorteo_planes")
        .select("*")
        .eq("id", planPedido)
        .maybeSingle();
      if (!fila) return bad("Ese plan no existe en el sorteo.");
      if (sorteo && fila.sorteo_id !== sorteo.id) {
        return bad("Ese plan es de otro sorteo. Arriba dice en cuál estás vendiendo.");
      }
      await espejarPlan(supabaseAdmin, fila);
      plan = {
        id: fila.id,
        nombre: fila.nombre,
        precio: fila.precio_cop,
        precioLabel: String(fila.precio_cop),
        claves: fila.claves,
      };
    } else {
      plan = await obtenerPlan(supabaseAdmin, varios ? "esencial" : planPedido);
      if (varios) {
        let unit = Number(plan.precio) || 20000;
        if (sorteo) {
          const { data: filas } = await supabaseAdmin
            .from("sorteo_planes")
            .select("precio_cop, claves, activo")
            .eq("sorteo_id", sorteo.id);
          const activos = (filas || []).filter((p) => p.activo !== false);
          const uno = activos.find((p) => Number(p.claves) === 1) || activos[0];
          if (uno) {
            const claves = Math.max(1, Number(uno.claves) || 1);
            unit = Math.round(Number(uno.precio_cop) / claves) || unit;
          }
        }
        const montoTexto = String(body.monto ?? "").replace(/\D/g, "");
        const precio = montoTexto === "" ? unit * clavesManuales.length : Number(montoTexto);
        const { error: planErr } = await supabaseAdmin.from("planes").upsert(
          {
            id: "varios",
            nombre: "Varios números",
            precio_cop: unit,
            claves: 1,
            tag: "Venta física, cantidad libre",
            activo: false,
          },
          { onConflict: "id" }
        );
        if (planErr) return bad(planErr.message);
        plan = {
          id: "varios",
          nombre: "Varios números",
          precio,
          precioLabel: String(precio),
          claves: clavesManuales.length,
          clavesLibre: true,
        };
      }
    }
    if (!clavesManuales.length) {
      return bad(
        varios
          ? `Escribe los números que le entregaste (${textoRango}).`
          : `Ingresa las ${plan.claves} claves impresas (${textoRango}) que le entregaste.`
      );
    }

    const valores = clavesManuales.map((n) => Number(n));
    const cabe = (rango) =>
      rango && valores.every((n) => n >= rango.min && n <= rango.max);
    const rangoDeEstas = cabe(rangoFisico) ? rangoFisico : cabe(rangoWeb) ? rangoWeb : rangoFisico;

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
      sorteoId: sorteo?.id || null,
      rangoFisico: rangoDeEstas,
      rangoWeb,
      // El correo se arma y se envía en la pantalla, después de registrar.
      enviarCorreo: false,
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
      membresiaId: resultado.membresia?.id || null,
      plan: { id: plan.id, nombre: plan.nombre, precio: plan.precio },
      claves: resultado.claves || [],
      sorteoId: sorteo?.id || null,
      emailOk: false,
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
