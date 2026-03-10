// COMPONENTE LEGACY — No se usa actualmente
// Conservado por compatibilidad. No importar en nuevas páginas.
"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function Contador({ rifa, initialStats }) {
  const [stats, setStats] = useState(initialStats ?? { vendidos: 0, disponibles: 10000, porcentaje: 0 });

  useEffect(() => {
    if (!rifa?.id) return;

    async function fetchStats() {
      try {
        const res = await fetch(`/api/rifas/${rifa.id}/stats`);
        const data = await res.json();
        if (res.ok) setStats(data);
      } catch {
        // keep current stats
      }
    }

    const channel = supabaseBrowser
      .channel(`boletos-${rifa.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "boletos",
          filter: `rifa_id=eq.${rifa.id}`,
        },
        () => fetchStats()
      )
      .subscribe();

    fetchStats();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [rifa?.id]);

  const total = rifa?.total_numeros ?? 10000;

  return (
    <section className="py-10 px-4 bg-[#F1F5F9]">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-[#071521] font-extrabold text-3xl md:text-4xl text-center mb-10">
          En tiempo real
        </h2>
        <div className="grid grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white shadow-lg border border-[#F2B233]/40 rounded-2xl p-4 md:p-6 text-center min-w-0 overflow-hidden">
            <p className="text-[#334155] text-sm mb-1">Boletos vendidos</p>
            <p className="text-xl sm:text-2xl md:text-4xl text-[#22C55E] tabular-nums font-extrabold min-w-0">
              {new Intl.NumberFormat("es-CO").format(stats.vendidos)}
            </p>
          </div>
          <div className="bg-white shadow-lg border border-[#F2B233]/40 rounded-2xl p-4 md:p-6 text-center min-w-0 overflow-hidden">
            <p className="text-[#334155] text-sm mb-1">Disponibles</p>
            <p className="text-xl sm:text-2xl md:text-4xl text-[#F2B233] tabular-nums font-extrabold min-w-0">
              {new Intl.NumberFormat("es-CO").format(stats.disponibles)}
            </p>
          </div>
          <div className="bg-white shadow-lg border border-[#F2B233]/40 rounded-2xl p-4 md:p-6 text-center min-w-0 overflow-hidden">
            <p className="text-[#334155] text-sm mb-1">% completado</p>
            <p className="text-xl sm:text-2xl md:text-4xl text-[#F2B233] tabular-nums font-extrabold min-w-0">
              {stats.porcentaje}%
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
