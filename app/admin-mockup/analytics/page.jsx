"use client";

import { useEffect, useState } from "react";
import StatsCard from "@/components/admin/StatsCard";
import MiniBarChart from "@/components/admin-mockup/MiniBarChart";
import { getStats, getRifas, getParticipantes } from "@/lib/mock-admin/store";

export default function MockAnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [porCanal, setPorCanal] = useState([]);
  const [porRifa, setPorRifa] = useState([]);

  useEffect(() => {
    function cargar() {
      const s = getStats();
      setStats(s);
      const participantes = getParticipantes({ pageSize: 9999 }).participantes;
      const canales = {};
      participantes.forEach((p) => {
        canales[p.canal] = (canales[p.canal] || 0) + 1;
      });
      setPorCanal(
        Object.entries(canales).map(([label, value]) => ({ label, value }))
      );
      const rifas = getRifas();
      setPorRifa(
        rifas.map((r) => ({
          label: r.nombre.slice(0, 12),
          value: r.boletos_vendidos || 0,
        }))
      );
    }
    cargar();
    window.addEventListener("mock-admin-update", cargar);
    return () => window.removeEventListener("mock-admin-update", cargar);
  }, []);

  if (!stats) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const ticketPromedio =
    stats.participantes > 0
      ? Math.round(stats.ventasTotales / stats.participantes)
      : 0;

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold text-white mb-1">Analytics</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Métricas avanzadas y tendencias (solo mockup)
      </p>

      <div
        className="grid gap-3 mb-6"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}
      >
        <StatsCard title="Ticket promedio" value={`$ ${ticketPromedio.toLocaleString("es-CO")}`} />
        <StatsCard title="Conversión" value={`${((stats.participantes / Math.max(stats.participantes + stats.pendientes, 1)) * 100).toFixed(1)}%`} />
        <StatsCard title="Canal online" value={porCanal.find((c) => c.label === "online")?.value || 0} />
        <StatsCard title="Canal físico" value={porCanal.find((c) => c.label === "fisico")?.value || 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-zinc-500 mb-4">VENTAS SEMANALES</p>
          <MiniBarChart data={stats.ventasDiarias} height={160} />
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-zinc-500 mb-4">BOLETOS VENDIDOS POR RIFA</p>
          <MiniBarChart data={porRifa} height={160} color="#60a5fa" />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <p className="text-xs font-semibold text-zinc-500 mb-4">DISTRIBUCIÓN POR CANAL</p>
        <div className="space-y-3">
          {porCanal.map((c) => {
            const total = porCanal.reduce((a, x) => a + x.value, 0) || 1;
            const pct = ((c.value / total) * 100).toFixed(0);
            return (
              <div key={c.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-300 capitalize">{c.label}</span>
                  <span className="text-zinc-500">{c.value} ({pct}%)</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
