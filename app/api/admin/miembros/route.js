import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { PLANES_MEMBRESIA } from "@/lib/club-gomez/planes";
import { padClave, periodoDe } from "@/lib/club-gomez/claves-pool";

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
          busquedaClave: padClave(buscar),
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
          const numero = padClave(c.numero);
          if (!clavesByMiembro[miembroId].includes(numero)) {
            clavesByMiembro[miembroId].push(numero);
          }
        }

        if (porClave) {
          const padded = padClave(buscar);
          const { data: extra } = await supabaseAdmin
            .from("claves")
            .select("membresia_id, numero, periodo")
            .in("membresia_id", memIds)
            .eq("numero", padded);
          for (const c of extra || []) {
            const mem = memPorId[c.membresia_id];
            if (!mem) continue;
            if (!clavesByMiembro[mem.miembro_id]) clavesByMiembro[mem.miembro_id] = [];
            const numero = padClave(c.numero);
            if (!clavesByMiembro[mem.miembro_id].includes(numero)) {
              clavesByMiembro[mem.miembro_id].push(numero);
            }
          }
        }
      }
    }

    const items = (miembros || []).map((m) => {
      const mem = membresiasByMiembro[m.id] || null;
      const plan = !mem?.plan_id
        ? null
        : mem.plan_id === "varios"
          ? { id: "varios", nombre: "Varios números" }
          : PLANES_MEMBRESIA[mem.plan_id] || { id: mem.plan_id, nombre: mem.plan_id };
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
      busquedaClave: porClave ? padClave(buscar) : null,
    });
  } catch (err) {
    console.error("[admin/miembros GET]", err);
    return NextResponse.json(
      { error: err.message || "Error al listar miembros" },
      { status: 500 }
    );
  }
}
