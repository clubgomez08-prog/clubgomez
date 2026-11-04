import { notFound } from "next/navigation";
import HomePage from "@/components/club-gomez/HomePage";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { leerSorteoPor, planesDeSorteo, propsDeSorteo } from "@/lib/club-gomez/sorteos";

export const revalidate = 30;

export default async function PaginaSorteo({ params }) {
  const { slug } = await params;
  if (supabaseMissingEnv) notFound();
  const { sorteo } = await leerSorteoPor(supabaseAdmin, { slug });
  if (!sorteo || sorteo.estado === "borrador") notFound();
  const planes = await planesDeSorteo(supabaseAdmin, sorteo.id);
  return <HomePage {...propsDeSorteo(sorteo, planes)} />;
}
