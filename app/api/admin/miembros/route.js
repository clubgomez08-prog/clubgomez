import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";
import { PLANES_MEMBRESIA } from "@/lib/club-gomez/planes";
import { periodoDe } from "@/lib/club-gomez/claves-pool";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabaseAdmin
      .from("miembros")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (estado) {
      query = query.eq("estado", estado);
    }

    if (buscar) {
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
    let clavesByMembresia = {};

    if (ids.length > 0) {
      const { data: membresias } = await supabaseAdmin
        .from("membresias")
        .select("id, miembro_id, plan_id, estado, inicia_en, vence_en, origen")
        .in("miembro_id", ids)
        .order("created_at", { ascending: false });

      for (const mem of membresias || []) {
        if (!membresiasByMiembro[mem.miembro_id]) {
          membresiasByMiembro[mem.miembro_id] = mem;
        }
      }

      const memIds = Object.values(membresiasByMiembro).map((m) => m.id);
      if (memIds.length > 0) {
        const periodo = periodoDe();
        const { data: claves } = await supabaseAdmin
          .from("claves")
          .select("id, membresia_id, numero, periodo")
          .in("membresia_id", memIds)
          .eq("periodo", periodo);

        for (const c of claves || []) {
          if (!clavesByMembresia[c.membresia_id]) {
            clavesByMembresia[c.membresia_id] = [];
          }
          clavesByMembresia[c.membresia_id].push(c.numero);
        }
      }
    }

    const items = (miembros || []).map((m) => {
      const mem = membresiasByMiembro[m.id] || null;
      const plan = mem?.plan_id
        ? PLANES_MEMBRESIA[mem.plan_id] || { id: mem.plan_id, nombre: mem.plan_id }
        : null;
      const claves = mem ? clavesByMembresia[mem.id] || [] : [];
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
      periodo: periodoDe(),
    });
  } catch (err) {
    console.error("[admin/miembros GET]", err);
    return NextResponse.json(
      { error: err.message || "Error al listar miembros" },
      { status: 500 }
    );
  }
}
