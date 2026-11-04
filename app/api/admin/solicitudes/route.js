import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { verificarSesionAdmin } from "@/lib/auth-admin";

export const dynamic = "force-dynamic";

async function conNumerosDePagadas(solicitudes) {
  const pagadas = solicitudes.filter((s) => s.estado === "convertida");
  if (!pagadas.length) return solicitudes;

  const emails = [
    ...new Set(
      pagadas
        .map((s) => String(s.email || "").trim().toLowerCase())
        .filter((e) => e.includes("@"))
    ),
  ];
  if (!emails.length) return solicitudes;

  const { data: miembros } = await supabaseAdmin
    .from("miembros")
    .select("id, email")
    .in("email", emails);
  const ids = (miembros || []).map((m) => m.id);
  if (!ids.length) return solicitudes;

  const { data: membresias } = await supabaseAdmin
    .from("membresias")
    .select("id, miembro_id, plan_id, sorteo_id, created_at, claves(numero)")
    .in("miembro_id", ids)
    .order("created_at", { ascending: false });

  const sorteoIds = [
    ...new Set((membresias || []).map((m) => m.sorteo_id).filter(Boolean)),
  ];
  let sorteos = [];
  if (sorteoIds.length) {
    let res = await supabaseAdmin
      .from("sorteos_rifa")
      .select("id, premio, nombre, fecha_sorteo, loteria, mensaje_whatsapp")
      .in("id", sorteoIds);
    if (res.error) {
      res = await supabaseAdmin
        .from("sorteos_rifa")
        .select("id, premio, nombre, fecha_sorteo, loteria")
        .in("id", sorteoIds);
    }
    sorteos = res.error ? [] : res.data || [];
  }

  const miembroDeEmail = {};
  for (const m of miembros || []) {
    miembroDeEmail[String(m.email || "").trim().toLowerCase()] = m.id;
  }
  const porMiembro = {};
  for (const mem of membresias || []) {
    if (!porMiembro[mem.miembro_id]) porMiembro[mem.miembro_id] = mem;
  }
  const sorteoDe = Object.fromEntries(sorteos.map((s) => [s.id, s]));

  return solicitudes.map((s) => {
    if (s.estado !== "convertida") return s;
    const mem = porMiembro[miembroDeEmail[String(s.email || "").trim().toLowerCase()]];
    if (!mem) return s;
    const sorteo = sorteoDe[mem.sorteo_id] || null;
    return {
      ...s,
      numeros: (mem.claves || []).map((c) => c.numero).filter(Boolean).sort(),
      premio: sorteo?.premio || sorteo?.nombre || "",
      fecha_sorteo: sorteo?.fecha_sorteo || "",
      loteria: sorteo?.loteria || "",
      mensaje_whatsapp: sorteo?.mensaje_whatsapp || "",
    };
  });
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
    const estado = searchParams.get("estado") || "nueva";

    let query = supabaseAdmin
      .from("solicitudes_membresia")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (estado !== "todas") {
      query = query.eq("estado", estado);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    let solicitudes = data || [];
    try {
      solicitudes = await conNumerosDePagadas(solicitudes);
    } catch (err) {
      console.error("[admin/solicitudes] numeros", err);
    }
    return NextResponse.json({ ok: true, solicitudes });
  } catch (err) {
    console.error("[admin/solicitudes GET]", err);
    return NextResponse.json(
      { error: err.message || "Error al listar" },
      { status: 500 }
    );
  }
}
