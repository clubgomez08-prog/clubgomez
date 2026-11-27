import { notFound } from "next/navigation";
import HomePage from "@/components/club-gomez/HomePage";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import { leerSorteoPor, planesDeSorteo, propsDeSorteo } from "@/lib/club-gomez/sorteos";
import { numerosBendecidosVendidos } from "@/lib/club-gomez/bendecidos";

export const revalidate = 30;

const TITULO = "Club Gómez — Llévate 3 motos";
const DESCRIPCION =
  "3 motos 0 km para un solo ganador. El 26 de diciembre, con la Lotería de Boyacá.";
const IMAGEN = "/club-gomez/hero-navidad-ultima.jpg";

export const metadata = {
  title: TITULO,
  description: DESCRIPCION,
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    url: "https://clubgomez.co/navidad",
    siteName: "Club Gómez",
    type: "website",
    locale: "es_CO",
    images: [
      {
        url: IMAGEN,
        width: 1024,
        height: 576,
        alt: "Llévate 3 motos 0 km",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRIPCION,
    images: [IMAGEN],
  },
};

export default async function PaginaNavidad() {
  if (supabaseMissingEnv) notFound();
  const { sorteo } = await leerSorteoPor(supabaseAdmin, { slug: "navidad" });
  if (!sorteo || sorteo.estado === "borrador") notFound();
  const planes = await planesDeSorteo(supabaseAdmin, sorteo.id);
  let bendecidosVendidos = [];
  try {
    bendecidosVendidos = await numerosBendecidosVendidos(supabaseAdmin, sorteo.id);
  } catch {
    bendecidosVendidos = [];
  }
  return (
    <HomePage
      {...propsDeSorteo(sorteo, planes)}
      bendecidosVendidos={bendecidosVendidos}
    />
  );
}
