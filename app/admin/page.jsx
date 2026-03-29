"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatsCard from "@/components/admin/StatsCard";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { getAdminAuthHeaders } from "@/lib/auth";

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
  const [finanzasVisibles, setFinanzasVisibles] = useState(false);
  const [modalFinanzas, setModalFinanzas] = useState(false);
  const [passwordFinanzas, setPasswordFinanzas] = useState("");
  const [errorFinanzas, setErrorFinanzas] = useState("");
  const [cargandoFinanzas, setCargandoFinanzas] = useState(false);

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

  async function confirmarUnlockFinanzas() {
    setCargandoFinanzas(true);
    setErrorFinanzas("");
    try {
      const auth = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/unlock-finanzas", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ password: passwordFinanzas }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorFinanzas(data.error || "Contraseña incorrecta");
        return;
      }
      if (data.success) {
        setFinanzasVisibles(true);
        setModalFinanzas(false);
        setPasswordFinanzas("");
      }
    } catch {
      setErrorFinanzas("Error de conexión");
    } finally {
      setCargandoFinanzas(false);
    }
  }

  return (
    <div className="py-6">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-4">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          {finanzasVisibles ? (
            <button
              type="button"
              onClick={() => setFinanzasVisibles(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-zinc-800 border border-zinc-600 text-zinc-200 hover:bg-zinc-700"
            >
              🔓 Ocultar finanzas
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setErrorFinanzas("");
                setPasswordFinanzas("");
                setModalFinanzas(true);
              }}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-zinc-800 border border-amber-500/40 text-amber-400 hover:bg-zinc-700"
            >
              🔒 Ver finanzas
            </button>
          )}
        </div>
      </div>

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
              value={
                finanzasVisibles
                  ? "$ " + stats.ventasTotales.toLocaleString("es-CO")
                  : "$ ***"
              }
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
                      {finanzasVisibles
                        ? `$ ${r.total.toLocaleString("es-CO")}`
                        : "$ ***"}
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
                            {finanzasVisibles ? (
                              <>
                                ${" "}
                                {Number(p.total_pagado || 0).toLocaleString(
                                  "es-CO"
                                )}
                              </>
                            ) : (
                              "$ ***"
                            )}
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

      {modalFinanzas && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#1a1a1a",
              border: "1.5px solid rgba(242,178,51,0.35)",
              borderRadius: "20px",
              padding: "28px 24px",
              width: "100%",
              maxWidth: "420px",
            }}
          >
            <h2
              style={{
                color: "#F8FAFC",
                fontSize: "20px",
                fontWeight: "800",
                textAlign: "center",
                margin: "0 0 8px",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              Acceso a finanzas
            </h2>
            <p
              style={{
                color: "rgba(248,250,252,0.5)",
                fontSize: "13px",
                textAlign: "center",
                margin: "0 0 20px",
                lineHeight: 1.5,
              }}
            >
              Ingresa la contraseña secundaria para ver montos y recaudación.
            </p>
            <input
              type="password"
              value={passwordFinanzas}
              onChange={(e) => setPasswordFinanzas(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmarUnlockFinanzas();
              }}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 mb-3"
              placeholder="Contraseña"
              autoComplete="current-password"
            />
            {errorFinanzas ? (
              <p className="text-sm text-red-400 mb-3 text-center">
                {errorFinanzas}
              </p>
            ) : null}
            <button
              type="button"
              onClick={confirmarUnlockFinanzas}
              disabled={cargandoFinanzas}
              style={{
                width: "100%",
                backgroundColor: cargandoFinanzas ? "#52525b" : "#F2B233",
                color: "#0a0a0a",
                fontWeight: "700",
                fontSize: "15px",
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                cursor: cargandoFinanzas ? "not-allowed" : "pointer",
                marginBottom: "8px",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              {cargandoFinanzas ? "…" : "Confirmar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setModalFinanzas(false);
                setPasswordFinanzas("");
                setErrorFinanzas("");
              }}
              className="w-full bg-transparent border border-zinc-600 rounded-xl text-zinc-400 text-sm py-3 cursor-pointer hover:bg-zinc-800/50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
