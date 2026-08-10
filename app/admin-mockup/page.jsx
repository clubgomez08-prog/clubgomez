"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatsCard from "@/components/admin/StatsCard";
import MiniBarChart from "@/components/admin-mockup/MiniBarChart";
import ActivityFeed from "@/components/admin-mockup/ActivityFeed";
import { getStats } from "@/lib/mock-admin/store";

const BASE = "/admin-mockup";

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

export default function AdminMockDashboardPage() {
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [finanzasVisibles, setFinanzasVisibles] = useState(false);
  const [modalFinanzas, setModalFinanzas] = useState(false);
  const [passwordFinanzas, setPasswordFinanzas] = useState("");
  const [errorFinanzas, setErrorFinanzas] = useState("");

  function cargar() {
    setStats(getStats());
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    window.addEventListener("mock-admin-update", cargar);
    return () => window.removeEventListener("mock-admin-update", cargar);
  }, []);

  function confirmarUnlockFinanzas() {
    if (passwordFinanzas === "demo123" || passwordFinanzas === "clubgomez") {
      setFinanzasVisibles(true);
      setModalFinanzas(false);
      setPasswordFinanzas("");
      setErrorFinanzas("");
    } else {
      setErrorFinanzas("Contraseña incorrecta (prueba: demo123)");
    }
  }

  const tasaConversion = stats
    ? stats.participantes + stats.pendientes + stats.rechazados > 0
      ? (
          (stats.participantes /
            (stats.participantes + stats.pendientes + stats.rechazados)) *
          100
        ).toFixed(1)
      : "0"
    : "0";

  return (
    <div className="py-6">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Club Gómez — KPIs, actividad y membresías (demo)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
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
              className="px-3 py-2 rounded-lg text-sm font-medium bg-zinc-900 border text-zinc-200 hover:bg-zinc-800"
              style={{ borderColor: "rgba(184,227,81,0.45)", color: "#B8E351" }}
            >
              🔒 Ver finanzas
            </button>
          )}
        </div>
      </div>

      {cargando || !stats ? (
        <div className="flex justify-center py-6 mb-4">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "#B8E351", borderTopColor: "transparent" }}
          />
        </div>
      ) : (
        <>
          <div
            className="grid gap-3 mb-4"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}
          >
            <StatsCard title="Planes activos" value={stats.rifasActivas} />
            <StatsCard title="Miembros activos" value={stats.participantes} />
            <StatsCard
              title="Ingresos membresías"
              value={
                finanzasVisibles
                  ? "$ " + stats.ventasTotales.toLocaleString("es-CO")
                  : "$ ***"
              }
            />
            <StatsCard title="Claves emitidas" value={stats.boletosVendidos} />
            <StatsCard title="Pagos pendientes" value={stats.pendientes} />
            <StatsCard title="Pagos rechazados" value={stats.rechazados} />
            <StatsCard title="Tasa conversión" value={`${tasaConversion}%`} />
            <StatsCard
              title="Alertas"
              value={stats.notificacionesNoLeidas}
            />
          </div>

          <div className="grid gap-4 mb-4 lg:grid-cols-2">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <p className="text-xs font-semibold tracking-wide mb-3 text-zinc-500">
                VENTAS ÚLTIMOS 7 DÍAS
              </p>
              <MiniBarChart data={stats.ventasDiarias} height={140} />
              <p className="text-xs text-zinc-600 mt-3">
                Total semanal:{" "}
                <span className="font-semibold" style={{ color: "#B8E351" }}>
                  {finanzasVisibles
                    ? `$ ${stats.ventasDiarias.reduce((a, d) => a + d.ventas, 0).toLocaleString("es-CO")}`
                    : "$ ***"}
                </span>
              </p>
            </div>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold tracking-wide text-zinc-500">
                  ACTIVIDAD RECIENTE
                </p>
                <Link
                  href={`${BASE}/actividad`}
                  className="text-xs hover:opacity-80"
                  style={{ color: "#B8E351" }}
                >
                  Ver todo →
                </Link>
              </div>
              <ActivityFeed items={stats.actividad} limit={5} />
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold tracking-wide mb-3 text-zinc-500">
              RECAUDACIÓN POR PLAN
            </p>
            {stats.recaudacionPorRifa.length === 0 ? (
              <p className="text-sm text-zinc-500 py-3">No hay planes activos</p>
            ) : (
              <div className="flex flex-col gap-3">
                {stats.recaudacionPorRifa.map((r) => (
                  <div
                    key={r.id}
                    className="bg-zinc-900 rounded-xl border border-zinc-800 px-3 py-3 sm:px-4"
                  >
                    <p className="text-sm font-medium text-white truncate">{r.nombre}</p>
                    <p className="text-lg font-bold mt-1" style={{ color: "#B8E351" }}>
                      {finanzasVisibles
                        ? `$ ${r.total.toLocaleString("es-CO")}`
                        : "$ ***"}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">Suma de pagos aprobados</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold tracking-wide mb-3 text-zinc-500">
              ÚLTIMOS MIEMBROS
            </p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              {stats.ultimosParticipantes.length === 0 ? (
                <div className="py-6 text-center text-zinc-400 text-sm">
                  Sin registros recientes
                </div>
              ) : (
                <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                  <table className="w-full" style={{ minWidth: "520px" }}>
                    <thead>
                      <tr className="border-b border-zinc-800">
                        {["Nombre", "Email", "Plan", "Claves", "Total", "Estado", "Fecha"].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-medium text-zinc-400 uppercase"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.ultimosParticipantes.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-zinc-800 hover:bg-zinc-800/50"
                        >
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-white text-sm">
                            {p.nombre}
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-zinc-300 text-sm max-w-[140px] truncate">
                            {p.email}
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-zinc-300 text-sm">
                            {p.rifas?.nombre || "—"}
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-zinc-300 text-sm">
                            {p.cantidad_boletos}
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm font-medium" style={{ color: "#B8E351" }}>
                            {finanzasVisibles
                              ? `$ ${Number(p.total_pagado).toLocaleString("es-CO")}`
                              : "$ ***"}
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${badgeEstadoClases(p.estado_pago)}`}
                            >
                              {p.estado_pago}
                            </span>
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-4 text-zinc-400 text-xs whitespace-nowrap">
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
        <p className="text-xs font-semibold tracking-wide mb-3 text-zinc-500">
          ACCESOS RÁPIDOS
        </p>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          {[
            { href: `${BASE}/rifas`, icon: "⭐", label: "Membresías", color: "#B8E351" },
            { href: `${BASE}/participantes`, icon: "👥", label: "Miembros", color: "#B8E351" },
            { href: `${BASE}/sorteo`, icon: "🎁", label: "Beneficios del mes", color: "#B8E351" },
            { href: `${BASE}/venta-fisica`, icon: "🧾", label: "Alta presencial", color: "#9bcf2e" },
            { href: `${BASE}/campanas`, icon: "📣", label: "Campañas", color: "#23430C" },
            { href: `${BASE}/reportes`, icon: "📑", label: "Reportes", color: "#B8E351" },
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
            <h2 className="text-white text-xl font-extrabold text-center mb-2">
              Acceso a finanzas
            </h2>
            <p className="text-zinc-500 text-sm text-center mb-5">
              Demo: contraseña <code style={{ color: "#B8E351" }}>demo123</code>
            </p>
            <input
              type="password"
              value={passwordFinanzas}
              onChange={(e) => setPasswordFinanzas(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmarUnlockFinanzas()}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white mb-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              placeholder="Contraseña"
            />
            {errorFinanzas && (
              <p className="text-sm text-red-400 mb-3 text-center">{errorFinanzas}</p>
            )}
            <button
              type="button"
              onClick={confirmarUnlockFinanzas}
              className="w-full py-3.5 rounded-xl font-bold mb-2"
              style={{ backgroundColor: "#B8E351", color: "#050607" }}
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => {
                setModalFinanzas(false);
                setPasswordFinanzas("");
                setErrorFinanzas("");
              }}
              className="w-full py-3 rounded-xl border border-zinc-600 text-zinc-400 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
