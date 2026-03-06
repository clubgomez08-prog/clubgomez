import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request, { params }) {
  const { id } = await params;

  const { data: rifa, error: rifaError } = await supabaseAdmin
    .from("rifas")
    .select("total_numeros")
    .eq("id", id)
    .single();

  if (rifaError || !rifa) {
    return NextResponse.json({ error: "Rifa no encontrada" }, { status: 404 });
  }

  const { count, error: countError } = await supabaseAdmin
    .from("boletos")
    .select("*", { count: "exact", head: true })
    .eq("rifa_id", id);

  const vendidos = countError ? 0 : count;
  const total = rifa.total_numeros ?? 10000;
  const porcentaje = total > 0 ? ((vendidos / total) * 100).toFixed(1) : 0;

  return NextResponse.json({
    vendidos,
    disponibles: Math.max(0, total - vendidos),
    total,
    porcentaje,
  });
}
