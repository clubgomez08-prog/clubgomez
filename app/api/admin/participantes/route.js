import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const PAGE_SIZE = 20;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const buscar = searchParams.get("buscar")?.trim() || "";
  const estado = searchParams.get("estado")?.trim() || "";
  const rifaId = searchParams.get("rifa_id")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const exportar = searchParams.get("export") === "1";

  let query = supabaseAdmin
    .from("participantes")
    .select("*, rifas(nombre)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (estado && estado !== "todos") {
    query = query.eq("estado_pago", estado);
  }

  if (rifaId) {
    query = query.eq("rifa_id", rifaId);
  }

  if (buscar) {
    const term = `%${buscar}%`;
    query = query.or(
      `nombre.ilike.${term},email.ilike.${term},cedula.ilike.${term}`
    );
  }

  if (exportar) {
    const { data: participantes, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      participantes: participantes || [],
      total: (participantes || []).length,
      export: true,
    });
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: participantes, error, count } = await query.range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = count ?? 0;
  const paginas = Math.ceil(total / PAGE_SIZE);

  const items = (participantes || []).map((p) => ({
    ...p,
    rifa_nombre: p.rifas?.nombre || "—",
  }));

  return NextResponse.json({
    participantes: items,
    total,
    paginas,
  });
}
