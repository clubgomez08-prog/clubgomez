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
    <div>
      <div className="admin-dash__head">
        <div>
          <p className="admin-dash__kicker">Club Gómez</p>
          <h1 className="admin-dash__title">Dashboard</h1>
          {periodo ? (
            <p className="admin-dash__meta">
              Periodo {periodo} · Web 0000–6000 · Físico 6001–9999
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {finanzasVisibles ? (
            <button
              type="button"
              onClick={() => setFinanzasVisibles(false)}
              className="admin-btn admin-btn--ghost"
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
              className="admin-btn admin-btn--lime"
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
            className="grid gap-3 mb-6"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))",
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
              title="Claves web (0000–6000)"
              value={
                stats.clavesWebLibres != null
                  ? `${stats.clavesWebEmitidas || 0} / ${stats.clavesWebLibres} libres`
                  : stats.clavesEmitidas
              }
            />
            <StatsCard
              title="Claves físico (6001–9999)"
              value={
                stats.clavesFisicoLibres != null
                  ? `${stats.clavesFisicoEmitidas || 0} / ${stats.clavesFisicoLibres} libres`
                  : stats.clavesLibres
              }
            />
            <StatsCard
              title="Premios programados"
              value={stats.premiosProgramados}
            />
          </div>

          <div className="mb-6">
            <p className="admin-section-label">Últimos miembros</p>
            <div className="admin-panel">
              {ultimosMiembros.length === 0 ? (
                <div className="admin-empty">Sin registros recientes</div>
              ) : (
                ultimosMiembros.map((m) => (
                  <div key={m.id} className="admin-member-row">
                    <div className="min-w-0">
                      <div className="admin-member-row__name">
                        {m.nombre || "—"}
                      </div>
                      <div className="admin-member-row__email">
                        {m.email || "—"}
                      </div>
                    </div>
                    <div className="admin-member-row__meta">
                      <span className="admin-chip">{m.estado || "—"}</span>
                      <div style={{ marginTop: 6 }}>
                        {formatFecha(m.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <div className="py-2">
        <p className="admin-section-label">Accesos rápidos</p>
        <div className="admin-quick">
          {[
            {
              href: "/admin/solicitudes",
              icon: "✓",
              label: "Solicitudes Bold",
              color: LIME,
            },
            {
              href: "/admin/venta-fisica",
              icon: "▣",
              label: "Venta física",
              color: "#fbbf24",
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
            <Link key={item.href} href={item.href} className="admin-quick__item">
              <span
                className="admin-quick__icon"
                style={{
                  backgroundColor: `${item.color}18`,
                  color: item.color,
                }}
              >
                {item.icon}
              </span>
              <span className="admin-quick__label">{item.label}</span>
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
