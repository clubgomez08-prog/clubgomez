import HomePage from "@/components/club-gomez/HomePage";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";
import {
  CAMPANA_LANDING_DEFAULT,
  campanaParaLanding,
} from "@/lib/club-gomez/campana-landing";

export const revalidate = 30;

async function cargarCampanaActiva() {
  if (supabaseMissingEnv) return CAMPANA_LANDING_DEFAULT;
  try {
    const consulta = supabaseAdmin
      .from("campanas")
      .select("*")
      .eq("activa", true)
      .maybeSingle();
    const limite = new Promise((resolve) =>
      setTimeout(() => resolve({ data: null, error: "timeout" }), 3000)
    );
    const { data, error } = await Promise.race([consulta, limite]);
    if (error || !data) return CAMPANA_LANDING_DEFAULT;
    return campanaParaLanding(data);
  } catch {
    return CAMPANA_LANDING_DEFAULT;
  }
}

export default async function ClubGomezHome() {
  const campana = await cargarCampanaActiva();
  return <HomePage campana={campana} />;
}
