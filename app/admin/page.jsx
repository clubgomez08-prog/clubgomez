"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatsCard from "@/components/admin/StatsCard";
import { getAdminAuthHeaders } from "@/lib/auth";

const LIME = "#B8E351";

function formatFecha(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    miembrosActivos: 0,
    membresiasActivas: 0,
    solicitudesNuevas: 0,
    ingresos: 0,
    clavesEmitidas: 0,
    clavesLibres: 10000,
    premiosProgramados: 0,
  });
  const [periodo, setPeriodo] = useState("");
  const [ultimosMiembros, setUltimosMiembros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [finanzasVisibles, setFinanzasVisibles] = useState(false);
  const [modalFinanzas, setModalFinanzas] = useState(false);
  const [passwordFinanzas, setPasswordFinanzas] = useState("");
  const [errorFinanzas, setErrorFinanzas] = useState("");
  const [cargandoFinanzas, setCargandoFinanzas] = useState(false);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      try {
        const headers = await getAdminAuthHeaders();
        const res = await fetch("/api/admin/dashboard", { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error");
        setStats(data.stats || {});
        setPeriodo(data.periodo || "");
        setUltimosMiembros(data.ultimosMiembros || []);
      } catch {
        setStats({
          miembrosActivos: 0,
          membresiasActivas: 0,
          solicitudesNuevas: 0,
          ingresos: 0,
          clavesEmitidas: 0,
          clavesLibres: 10000,
          premiosProgramados: 0,
        });
        setUltimosMiembros([]);
      } finally {
        setCargando(false);
      }
    }
    cargar();
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
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          {periodo ? (
            <p className="text-xs text-zinc-500 mt-1">
              Periodo de claves: {periodo} · Pool 0000–9999
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {finanzasVisibles ? (
            <button
              type="button"
              onClick={() => setFinanzasVisibles(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-zinc-800 border border-zinc-600 text-zinc-200 hover:bg-zinc-700"
            >
              Ocultar finanzas
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setErrorFinanzas("");
                setPasswordFinanzas("");
                setModalFinanzas(true);
              }}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-zinc-800 border border-[#B8E351]/40 text-[#B8E351] hover:bg-zinc-700"
            >
              Ver finanzas
            </button>
          )}
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center py-6 mb-4">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: LIME, borderTopColor: "transparent" }}
          />
        </div>
      ) : (
        <>
          <div
            className="grid gap-3 mb-4"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            }}
          >
            <StatsCard title="Miembros activos" value={stats.miembrosActivos} />
            <StatsCard
              title="Membresías activas"
              value={stats.membresiasActivas}
            />
            <StatsCard
              title="Solicitudes Bold nuevas"
              value={stats.solicitudesNuevas}
            />
            <StatsCard
              title="Ingresos (pagos)"
              value={
                finanzasVisibles
                  ? "$ " + Number(stats.ingresos || 0).toLocaleString("es-CO")
                  : "$ ***"
              }
            />
            <StatsCard
              title="Claves emitidas (mes)"
              value={stats.clavesEmitidas}
            />
            <StatsCard title="Claves libres (mes)" value={stats.clavesLibres} />
            <StatsCard
              title="Premios programados"
              value={stats.premiosProgramados}
            />
          </div>

          <div className="mb-4">
            <p
              className="text-xs font-semibold tracking-wide mb-3"
              style={{ color: "rgba(248,250,252,0.5)" }}
            >
              ÚLTIMOS MIEMBROS
            </p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              {ultimosMiembros.length === 0 ? (
                <div className="py-6 text-center text-zinc-400 text-sm">
                  Sin registros recientes
                </div>
              ) : (
                <div
                  className="overflow-x-auto"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <table className="w-full" style={{ minWidth: "420px" }}>
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="px-3 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                          Nombre
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                          Email
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                          Estado
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                          Fecha
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ultimosMiembros.map((m) => (
                        <tr
                          key={m.id}
                          className="border-b border-zinc-800 hover:bg-zinc-800/50"
                        >
                          <td className="px-3 py-3 text-white text-sm">
                            {m.nombre || "—"}
                          </td>
                          <td className="px-3 py-3 text-zinc-300 text-sm max-w-[160px] truncate">
                            {m.email || "—"}
                          </td>
                          <td className="px-3 py-3 text-zinc-300 text-sm">
                            {m.estado || "—"}
                          </td>
                          <td className="px-3 py-3 text-zinc-400 text-xs whitespace-nowrap">
                            {formatFecha(m.created_at)}
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
              href: "/admin/solicitudes",
              icon: "✓",
              label: "Solicitudes Bold",
              color: LIME,
            },
            {
              href: "/admin/beneficios",
              icon: "★",
              label: "Fechas de premio",
              color: "#60a5fa",
            },
            {
              href: "/admin/miembros",
              icon: "○",
              label: "Clientes",
              color: "#22C55E",
            },
            {
              href: "/admin/correos",
              icon: "✉",
              label: "Correos prueba",
              color: "#fbbf24",
            },
          ].map((item) => (
            <Link
              key={item.href}
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
                  fontSize: "20px",
                  backgroundColor: `${item.color}15`,
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: item.color,
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

      {modalFinanzas ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
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
              border: "1.5px solid rgba(184,227,81,0.35)",
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
              }}
            >
              Ingresa la contraseña secundaria para ver montos.
            </p>
            <input
              type="password"
              value={passwordFinanzas}
              onChange={(e) => setPasswordFinanzas(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmarUnlockFinanzas();
              }}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#B8E351]/50 mb-3"
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
                backgroundColor: cargandoFinanzas ? "#52525b" : LIME,
                color: "#0a0a0a",
                fontWeight: "700",
                fontSize: "15px",
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                cursor: cargandoFinanzas ? "not-allowed" : "pointer",
                marginBottom: "8px",
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
      ) : null}
    </div>
  );
}
