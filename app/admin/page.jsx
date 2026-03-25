"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatsCard from "@/components/admin/StatsCard";
import { supabaseBrowser } from "@/lib/supabase-browser";

function formatFecha(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function badgeEstadoClases(estado) {
  if (estado === "aprobado") return "bg-green-500/20 text-green-400";
  if (estado === "pendiente") return "bg-amber-500/20 text-amber-400";
  if (estado === "rechazado") return "bg-red-500/20 text-red-400";
  return "bg-zinc-700 text-zinc-400";
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    rifasActivas: 0,
    participantes: 0,
    ventasTotales: 0,
    boletosVendidos: 0,
    pendientes: 0,
    rechazados: 0,
  });
  const [recaudacionPorRifa, setRecaudacionPorRifa] = useState([]);
  const [ultimosParticipantes, setUltimosParticipantes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarStats = async () => {
      setCargando(true);
      try {
        const [
          rRifasActivas,
          rAprobados,
          rVentas,
          rPendientes,
          rRechazados,
          rBoletos,
          rUltimos,
          rActivas,
          rPagosAprobados,
        ] = await Promise.all([
          supabaseBrowser
            .from("rifas")
            .select("*", { count: "exact", head: true })
            .eq("estado", "activa"),
          supabaseBrowser
            .from("participantes")
            .select("*", { count: "exact", head: true })
            .eq("estado_pago", "aprobado"),
          supabaseBrowser
            .from("participantes")
            .select("total_pagado")
            .eq("estado_pago", "aprobado"),
          supabaseBrowser
            .from("participantes")
            .select("*", { count: "exact", head: true })
            .eq("estado_pago", "pendiente"),
          supabaseBrowser
            .from("participantes")
            .select("*", { count: "exact", head: true })
            .eq("estado_pago", "rechazado"),
          supabaseBrowser
            .from("boletos")
            .select("*", { count: "exact", head: true }),
          supabaseBrowser
            .from("participantes")
            .select(
              `
              id,
              nombre,
              email,
              cantidad_boletos,
              total_pagado,
              created_at,
              estado_pago,
              rifas (nombre)
            `
            )
            .order("created_at", { ascending: false })
            .limit(5),
          supabaseBrowser
            .from("rifas")
            .select("id, nombre")
            .eq("estado", "activa"),
          supabaseBrowser
            .from("participantes")
            .select("rifa_id, total_pagado")
            .eq("estado_pago", "aprobado"),
        ]);

        const ventasTotales =
          rVentas.error || !rVentas.data
            ? 0
            : rVentas.data.reduce(
                (acc, p) => acc + (Number(p.total_pagado) || 0),
                0
              );

        setStats({
          rifasActivas: rRifasActivas.error ? 0 : rRifasActivas.count ?? 0,
          participantes: rAprobados.error ? 0 : rAprobados.count ?? 0,
          ventasTotales,
          boletosVendidos: rBoletos.error ? 0 : rBoletos.count ?? 0,
          pendientes: rPendientes.error ? 0 : rPendientes.count ?? 0,
          rechazados: rRechazados.error ? 0 : rRechazados.count ?? 0,
        });

        setUltimosParticipantes(
          rUltimos.error || !rUltimos.data ? [] : rUltimos.data
        );

        const activas =
          rActivas.error || !rActivas.data ? [] : rActivas.data;
        const pagos =
          rPagosAprobados.error || !rPagosAprobados.data
            ? []
            : rPagosAprobados.data;
        const porRifa = {};
        pagos.forEach((p) => {
          if (!p.rifa_id) return;
          porRifa[p.rifa_id] =
            (porRifa[p.rifa_id] || 0) + (Number(p.total_pagado) || 0);
        });
        setRecaudacionPorRifa(
          activas.map((r) => ({
            id: r.id,
            nombre: r.nombre || "—",
            total: porRifa[r.id] || 0,
          }))
        );
      } catch {
        setStats({
          rifasActivas: 0,
          participantes: 0,
          ventasTotales: 0,
          boletosVendidos: 0,
          pendientes: 0,
          rechazados: 0,
        });
        setUltimosParticipantes([]);
        setRecaudacionPorRifa([]);
      } finally {
        setCargando(false);
      }
    };
    cargarStats();
  }, []);

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold text-white mb-4">Dashboard</h1>

      {cargando ? (
        <div className="flex justify-center py-6 mb-4">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div
            className="grid gap-3 mb-4"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            }}
          >
            <StatsCard
              title="Rifas activas"
              value={stats.rifasActivas}
            />
            <StatsCard
              title="Participantes con pago aprobado"
              value={stats.participantes}
            />
            <StatsCard
              title="Ventas totales"
              value={"$ " + stats.ventasTotales.toLocaleString("es-CO")}
            />
            <StatsCard
              title="Boletos vendidos"
              value={stats.boletosVendidos}
            />
            <StatsCard
              title="Pendientes de pago"
              value={stats.pendientes}
            />
            <StatsCard title="Pagos rechazados" value={stats.rechazados} />
          </div>

          <div className="mb-4">
            <p
              className="text-xs font-semibold tracking-wide mb-3"
              style={{ color: "rgba(248,250,252,0.5)" }}
            >
              RECAUDACIÓN POR RIFA ACTIVA
            </p>
            {recaudacionPorRifa.length === 0 ? (
              <p className="text-sm text-zinc-500 py-3">
                No hay rifas activas
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {recaudacionPorRifa.map((r) => (
                  <div
                    key={r.id}
                    className="bg-zinc-900 rounded-xl border border-zinc-800 px-3 py-3 sm:px-4"
                  >
                    <p className="text-sm font-medium text-white truncate">
                      {r.nombre}
                    </p>
                    <p className="text-lg font-bold text-amber-400 mt-1">
                      $ {r.total.toLocaleString("es-CO")}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Suma de pagos aprobados
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4">
            <p
              className="text-xs font-semibold tracking-wide mb-3"
              style={{ color: "rgba(248,250,252,0.5)" }}
            >
              ÚLTIMOS PARTICIPANTES
            </p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              {ultimosParticipantes.length === 0 ? (
                <div className="py-6 text-center text-zinc-400 text-sm">
                  Sin registros recientes
                </div>
              ) : (
                <div
                  className="overflow-x-auto"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <table className="w-full" style={{ minWidth: "520px" }}>
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                          Nombre
                        </th>
                        <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                          Email
                        </th>
                        <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                          Rifa
                        </th>
                        <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                          Boletos
                        </th>
                        <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                          Total
                        </th>
                        <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                          Estado
                        </th>
                        <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                          Fecha
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ultimosParticipantes.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-zinc-800 hover:bg-zinc-800/50"
                        >
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-white text-sm">
                            {p.nombre || "—"}
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-zinc-300 text-sm max-w-[140px] truncate">
                            {p.email || "—"}
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-zinc-300 text-sm">
                            {p.rifas?.nombre || "—"}
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-zinc-300 text-sm">
                            {p.cantidad_boletos ?? 0}
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-amber-400 text-sm font-medium">
                            ${" "}
                            {Number(p.total_pagado || 0).toLocaleString("es-CO")}
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${badgeEstadoClases(
                                p.estado_pago
                              )}`}
                            >
                              {p.estado_pago || "pendiente"}
                            </span>
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-zinc-400 text-xs sm:text-sm whitespace-nowrap">
                            {formatFecha(p.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="py-6">
        <p
          className="text-xs font-semibold tracking-wide mb-3"
          style={{ color: "rgba(248,250,252,0.5)" }}
        >
          ACCESOS RÁPIDOS
        </p>
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
        >
          {[
            {
              href: "/admin/rifas/nueva",
              icon: "🎯",
              label: "Nueva rifa",
              color: "#F2B233",
            },
            {
              href: "/admin/participantes",
              icon: "👥",
              label: "Participantes",
              color: "#22C55E",
            },
            {
              href: "/admin/sorteo",
              icon: "🏆",
              label: "Ejecutar sorteo",
              color: "#a78bfa",
            },
            {
              href: "/admin/rifas",
              icon: "📋",
              label: "Ver rifas",
              color: "#60a5fa",
            },
          ].map((item, i) => (
            <Link
              key={i}
              href={item.href}
              style={{
                backgroundColor: "#1a1a1a",
                border: `1px solid ${item.color}30`,
                borderRadius: "14px",
                padding: "16px",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "8px",
                transition: "all 0.2s ease",
              }}
            >
              <span
                style={{
                  fontSize: "24px",
                  backgroundColor: `${item.color}15`,
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </span>
              <span
                style={{
                  color: "#F8FAFC",
                  fontSize: "13px",
                  fontWeight: "600",
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
