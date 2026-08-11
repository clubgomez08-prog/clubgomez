import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { periodoDe } from "@/lib/club-gomez/claves-pool";
import {
  agruparPremiosDesdeFilas,
  beneficiosFallbackDesdeCatalogo,
  labelPeriodoEs,
} from "@/lib/club-gomez/beneficios-catalog";

export const dynamic = "force-dynamic";

async function periodoConDatos(preferido) {
  if (preferido) {
    const { count } = await supabaseAdmin
      .from("sorteos_beneficio")
      .select("id", { count: "exact", head: true })
      .eq("periodo", preferido);
    if ((count || 0) > 0) return preferido;
  }

  const actual = periodoDe();
  const { count: countActual } = await supabaseAdmin
    .from("sorteos_beneficio")
    .select("id", { count: "exact", head: true })
    .eq("periodo", actual);
  if ((countActual || 0) > 0) return actual;

  // Campaña cargada en panel (octubre)
  const { count: countOct } = await supabaseAdmin
    .from("sorteos_beneficio")
    .select("id", { count: "exact", head: true })
    .eq("periodo", "2026-10");
  if ((countOct || 0) > 0) return "2026-10";

  return actual;
}

/** Premios públicos alineados con fechas del panel admin. */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodoParam = searchParams.get("periodo");

    if (supabaseMissingEnv) {
      const periodo = periodoParam || "2026-10";
      const grouped = beneficiosFallbackDesdeCatalogo(periodo);
      return NextResponse.json({
        ok: true,
        periodo,
        periodoLabel: labelPeriodoEs(periodo),
        fuente: "catalogo",
        ...grouped,
      });
    }

    const periodo = await periodoConDatos(periodoParam);

    const { data: filas, error } = await supabaseAdmin
      .from("sorteos_beneficio")
      .select(
        "id, periodo, fecha_sorteo, premio, descripcion, slug, imagen_key, destacado, estado, loteria"
      )
      .eq("periodo", periodo)
      .order("fecha_sorteo", { ascending: true });

    if (error) {
      console.error("[beneficios-publicos]", error);
      const grouped = beneficiosFallbackDesdeCatalogo(periodo || "2026-10");
      return NextResponse.json({
        ok: true,
        periodo: periodo || "2026-10",
        periodoLabel: labelPeriodoEs(periodo || "2026-10"),
        fuente: "catalogo",
        aviso: error.message,
        ...grouped,
      });
    }

    if (!filas?.length) {
      const periodoFb = periodoParam || "2026-10";
      const grouped = beneficiosFallbackDesdeCatalogo(periodoFb);
      return NextResponse.json({
        ok: true,
        periodo: periodoFb,
        periodoLabel: labelPeriodoEs(periodoFb),
        fuente: "catalogo",
        ...grouped,
      });
    }

    const grouped = agruparPremiosDesdeFilas(filas);
    return NextResponse.json({
      ok: true,
      periodo,
      periodoLabel: labelPeriodoEs(periodo),
      fuente: "panel",
      ...grouped,
    });
  } catch (err) {
    console.error("[beneficios-publicos]", err);
    const grouped = beneficiosFallbackDesdeCatalogo("2026-10");
    return NextResponse.json({
      ok: true,
      periodo: "2026-10",
      periodoLabel: labelPeriodoEs("2026-10"),
      fuente: "catalogo",
      ...grouped,
    });
  }
}
