import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { cerrarVencidos, faltaTablaSorteo, planesDeSorteo, planPublico } from "@/lib/club-gomez/sorteos";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    if (supabaseMissingEnv) {
      return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
    }
    const { slug } = await params;
    const { data, error } = await supabaseAdmin
      .from("sorteos_rifa")
      .select("id, nombre, slug, estado, fecha_sorteo, loteria, premio, premio_extra")
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      if (faltaTablaSorteo(error)) {
        return NextResponse.json({ error: "Sorteo no disponible" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!data || data.estado === "borrador") {
      return NextResponse.json({ error: "Sorteo no encontrado" }, { status: 404 });
    }
    const [sorteo] = await cerrarVencidos(supabaseAdmin, [data]);
    const planes = (await planesDeSorteo(supabaseAdmin, sorteo.id))
      .filter((p) => p.activo)
      .map(planPublico);
    return NextResponse.json({ ok: true, sorteo, planes });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Error" }, { status: 500 });
  }
}
