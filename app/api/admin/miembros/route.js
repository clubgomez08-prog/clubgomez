import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { registrarActividad } from "@/lib/admin-actividad";
import { PLANES_MEMBRESIA } from "@/lib/club-gomez/planes";
import { digitosDeTopes, formatearNumero, padClave, periodoDe } from "@/lib/club-gomez/claves-pool";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

/** 1–4 dígitos → búsqueda por clave vendida (ej. 845, 0845). */
function esBusquedaClave(raw) {
  const t = String(raw || "")
    .trim()
    .replace(/\s/g, "");
  return /^\d{1,4}$/.test(t);
}

async function miembroIdsPorClave(buscar, sorteo) {
  const t = String(buscar || "")
    .trim()
    .replace(/\s/g, "");
  const padded = padClave(t);
  const numeros = [...new Set([padded, t, `0${padded}`])];

  let clavesQuery = supabaseAdmin
    .from("claves")
    .select("membresia_id, numero, periodo, sorteo_id")
    .in("numero", numeros);
  if (sorteo && sorteo !== "sin") clavesQuery = clavesQuery.eq("sorteo_id", sorteo);
  let { data: clavesRows, error } = await clavesQuery;
  if (error && /sorteo_id/i.test(error.message || "")) {
    const retry = await supabaseAdmin
      .from("claves")
      .select("membresia_id, numero, periodo")
      .in("numero", numeros);
    clavesRows = retry.data;
    error = retry.error;
  }

  if (error) throw new Error(error.message);
  if (!clavesRows?.length) {
    return { miembroIds: [], matched: [] };
  }

  const memIds = [
    ...new Set(clavesRows.map((c) => c.membresia_id).filter(Boolean)),
  ];
  if (!memIds.length) {
    return { miembroIds: [], matched: clavesRows };
  }

  let { data: mems, error: memErr } = await supabaseAdmin
    .from("membresias")
    .select("id, miembro_id, sorteo_id")
    .in("id", memIds);
  if (memErr && /sorteo_id/i.test(memErr.message || "")) {
    const retry = await supabaseAdmin
      .from("membresias")
      .select("id, miembro_id")
      .in("id", memIds);
    mems = retry.data;
    memErr = retry.error;
  }

  if (memErr) throw new Error(memErr.message);

  const validas = (mems || []).filter((m) => {
    if (!sorteo) return true;
    if (sorteo === "sin") return !m.sorteo_id;
    return m.sorteo_id === sorteo;
  });
  const validasIds = new Set(validas.map((m) => m.id));
  const miembroIds = [...new Set(validas.map((m) => m.miembro_id).filter(Boolean))];
  return {
    miembroIds,
    matched: clavesRows.filter((c) => validasIds.has(c.membresia_id)),
  };
}

async function miembroIdsPorSorteo(sorteo) {
  let { data, error } = await supabaseAdmin
    .from("membresias")
    .select("miembro_id, sorteo_id");
  if (error && /sorteo_id/i.test(error.message || "")) return [];
  if (error) throw new Error(error.message);
  const ids = new Set();
  for (const m of data || []) {
    if (!m.miembro_id) continue;
    if (sorteo === "sin" ? !m.sorteo_id : m.sorteo_id === sorteo) ids.add(m.miembro_id);
  }
  return [...ids];
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

    const { searchParams } = new URL(request.url);
    const buscar = String(searchParams.get("buscar") || "").trim();
    const estado = String(searchParams.get("estado") || "").trim();
    const sorteo = String(searchParams.get("sorteo") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const periodo = periodoDe();
    const porClave = esBusquedaClave(buscar);

    let query = supabaseAdmin
      .from("miembros")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (estado) {
      query = query.eq("estado", estado);
    }

    if (porClave) {
      const { miembroIds } = await miembroIdsPorClave(buscar, sorteo);
      if (!miembroIds.length) {
        return NextResponse.json({
          ok: true,
          miembros: [],
          total: 0,
          paginas: 1,
          page: 1,
          periodo,
          busquedaClave: formatearNumero(buscar, String(buscar).replace(/\D/g, "").length >= 4 ? 4 : 3),
        });
      }
      query = query.in("id", miembroIds);
    } else if (sorteo) {
      const miembroIds = await miembroIdsPorSorteo(sorteo);
      if (!miembroIds.length) {
        return NextResponse.json({
          ok: true,
          miembros: [],
          total: 0,
          paginas: 1,
          page: 1,
          periodo,
          busquedaClave: null,
        });
      }
      query = query.in("id", miembroIds);
    } else if (buscar) {
      const q = `%${buscar}%`;
      query = query.or(
        `nombre.ilike.${q},email.ilike.${q},telefono.ilike.${q},cedula.ilike.${q}`
      );
    }

    const { data: miembros, error, count } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const ids = (miembros || []).map((m) => m.id);
    let membresiasByMiembro = {};
    let clavesByMiembro = {};

    if (ids.length > 0) {
      let { data: membresias, error: memErr } = await supabaseAdmin
        .from("membresias")
        .select("id, miembro_id, plan_id, estado, inicia_en, vence_en, origen, sorteo_id, created_at")
        .in("miembro_id", ids)
        .order("created_at", { ascending: false });
      if (memErr) {
        const retry = await supabaseAdmin
          .from("membresias")
          .select("id, miembro_id, plan_id, estado, inicia_en, vence_en, origen")
          .in("miembro_id", ids)
          .order("created_at", { ascending: false });
        membresias = retry.data;
      }

      const ahora = Date.now();
      const memPorId = {};
      for (const mem of membresias || []) {
        memPorId[mem.id] = mem;
        const esDeEsteSorteo = !sorteo
          || (sorteo === "sin" ? !mem.sorteo_id : mem.sorteo_id === sorteo);
        if (!esDeEsteSorteo) continue;
        if (!membresiasByMiembro[mem.miembro_id]) {
          const vencida =
            mem.estado === "activa" && mem.vence_en && Date.parse(mem.vence_en) < ahora;
          membresiasByMiembro[mem.miembro_id] = vencida
            ? { ...mem, estado: "vencida" }
            : mem;
        }
      }

      const memIds = Object.values(membresiasByMiembro).map((m) => m.id);
      const digitosPorSorteo = {};
      {
        const { data: tops } = await supabaseAdmin
          .from("sorteos_rifa")
          .select("id, fisico_max, web_max");
        for (const s of tops || []) {
          digitosPorSorteo[s.id] = digitosDeTopes(s.fisico_max, s.web_max);
        }
      }
      const verNumero = (n, sorteoId) =>
        formatearNumero(n, digitosPorSorteo[sorteoId] || 3);
      if (memIds.length > 0) {
        let { data: claves, error: clavesErr } = await supabaseAdmin
          .from("claves")
          .select("id, membresia_id, numero, periodo, sorteo_id")
          .in("membresia_id", memIds);
        if (clavesErr && /sorteo_id/i.test(clavesErr.message || "")) {
          const retry = await supabaseAdmin
            .from("claves")
            .select("id, membresia_id, numero, periodo")
            .in("membresia_id", memIds);
          claves = retry.data;
        }

        for (const c of claves || []) {
          const mem = membresiasByMiembro[memPorId[c.membresia_id]?.miembro_id];
          if (!mem || mem.id !== c.membresia_id || mem.estado === "cancelada") continue;
          if (mem.sorteo_id) {
            if (c.sorteo_id && c.sorteo_id !== mem.sorteo_id) continue;
          } else if (c.periodo !== periodo || c.sorteo_id) {
            continue;
          }
          const miembroId = mem.miembro_id;
          if (!clavesByMiembro[miembroId]) clavesByMiembro[miembroId] = [];
          const numero = verNumero(c.numero, c.sorteo_id);
          if (!clavesByMiembro[miembroId].includes(numero)) {
            clavesByMiembro[miembroId].push(numero);
          }
        }

        if (porClave) {
          const padded = verNumero(buscar, sorteo && sorteo !== "sin" ? sorteo : null);
          const { data: extra } = await supabaseAdmin
            .from("claves")
            .select("membresia_id, numero, periodo, sorteo_id")
            .in("membresia_id", memIds)
            .eq("numero", padded);
          for (const c of extra || []) {
            const mem = memPorId[c.membresia_id];
            if (!mem) continue;
            if (!clavesByMiembro[mem.miembro_id]) clavesByMiembro[mem.miembro_id] = [];
            const numero = verNumero(c.numero, c.sorteo_id);
            if (!clavesByMiembro[mem.miembro_id].includes(numero)) {
              clavesByMiembro[mem.miembro_id].push(numero);
            }
          }
        }
      }
    }

    const idsDePlan = [
      ...new Set(
        Object.values(membresiasByMiembro)
          .map((mem) => mem?.plan_id)
          .filter((id) => id && id !== "varios" && !PLANES_MEMBRESIA[id])
      ),
    ];
    const nombrePorPlan = {};
    if (idsDePlan.length) {
      const { data: planes } = await supabaseAdmin
        .from("planes")
        .select("id, nombre")
        .in("id", idsDePlan);
      for (const plan of planes || []) nombrePorPlan[plan.id] = plan.nombre;
    }

    const items = (miembros || []).map((m) => {
      const mem = membresiasByMiembro[m.id] || null;
      const plan = !mem?.plan_id
        ? null
        : mem.plan_id === "varios"
          ? { id: "varios", nombre: "Varios números" }
          : PLANES_MEMBRESIA[mem.plan_id] || {
              id: mem.plan_id,
              nombre: nombrePorPlan[mem.plan_id] || mem.plan_id,
            };
      const claves = (clavesByMiembro[m.id] || []).sort();
      return {
        ...m,
        membresia: mem,
        plan,
        claves,
        clavesCount: claves.length,
      };
    });

    const total = count ?? 0;
    return NextResponse.json({
      ok: true,
      miembros: items,
      total,
      paginas: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      page,
      periodo,
      busquedaClave: porClave
        ? formatearNumero(buscar, String(buscar).replace(/\D/g, "").length >= 4 ? 4 : 3)
        : null,
    });
  } catch (err) {
    console.error("[admin/miembros GET]", err);
    return NextResponse.json(
      { error: err.message || "Error al listar miembros" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const user = await verificarSesionAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (supabaseMissingEnv) {
      return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const id = String(body.id || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    if (!id) {
      return NextResponse.json({ error: "Falta el cliente" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.endsWith("@sin-email.clubgomez.co")) {
      return NextResponse.json({ error: "Escribe un correo válido." }, { status: 400 });
    }

    const { data: actual, error } = await supabaseAdmin
      .from("miembros")
      .select("id, nombre, email, auth_user_id")
      .eq("id", id)
      .maybeSingle();
    if (error || !actual) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }
    if (String(actual.email || "").toLowerCase() === email) {
      return NextResponse.json({ ok: true, email, igual: true });
    }

    const { data: ocupado } = await supabaseAdmin
      .from("miembros")
      .select("id")
      .eq("email", email)
      .neq("id", id)
      .maybeSingle();
    if (ocupado) {
      return NextResponse.json(
        { error: "Ese correo ya está en otro cliente." },
        { status: 409 }
      );
    }

    if (actual.auth_user_id) {
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(
        actual.auth_user_id,
        { email, email_confirm: true }
      );
      if (authErr) {
        return NextResponse.json(
          { error: "No se pudo cambiar el acceso de esa persona. Revisa si el correo ya tiene cuenta." },
          { status: 400 }
        );
      }
    }

    const { error: upErr } = await supabaseAdmin
      .from("miembros")
      .update({ email, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    }

    if (actual.email) {
      await supabaseAdmin.from("solicitudes_membresia").update({ email }).eq("email", actual.email);
    }

    await registrarActividad(supabaseAdmin, user, "correo_corregido", {
      nombre: actual.nombre,
      antes: actual.email,
      ahora: email,
    });

    return NextResponse.json({ ok: true, email });
  } catch (err) {
    console.error("[admin/miembros PATCH]", err);
    return NextResponse.json({ error: err.message || "No se pudo guardar el correo" }, { status: 500 });
  }
}
