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
    <section className="py-16 px-4 bg-zinc-950">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl text-white text-center mb-10">
          EN TIEMPO REAL
        </h2>
        <div className="grid grid-cols-3 gap-4 md:gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
            <p className="text-zinc-500 text-sm mb-1">Boletos vendidos</p>
            <p className="font-display text-3xl md:text-4xl text-amber-500 tabular-nums">
              {new Intl.NumberFormat("es-CO").format(stats.vendidos)}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
            <p className="text-zinc-500 text-sm mb-1">Disponibles</p>
            <p className="font-display text-3xl md:text-4xl text-white tabular-nums">
              {new Intl.NumberFormat("es-CO").format(stats.disponibles)}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
            <p className="text-zinc-500 text-sm mb-1">% completado</p>
            <p className="font-display text-3xl md:text-4xl text-amber-500 tabular-nums">
              {stats.porcentaje}%
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
