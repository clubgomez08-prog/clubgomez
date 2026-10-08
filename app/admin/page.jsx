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
    clavesLibres: 1000,
    premiosProgramados: 0,
  });
  const [periodo, setPeriodo] = useState("");
  const [ultimasVentas, setUltimasVentas] = useState([]);
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
        setUltimasVentas(data.ultimasVentas || []);
      } catch {
        setStats({
          miembrosActivos: 0,
          membresiasActivas: 0,
          solicitudesNuevas: 0,
          ingresos: 0,
          clavesEmitidas: 0,
          clavesLibres: 1000,
          premiosProgramados: 0,
        });
        setUltimasVentas([]);
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
          <p className="admin-dash__meta">
            Yamaha Crypton 0 km más $1.000.000 · 17 de octubre · Boyacá
            {periodo ? ` · ${periodo}` : ""}
          </p>
          <p className="admin-dash__meta" style={{ marginTop: 4, opacity: 0.75 }}>
            Élite $100.000 / 6 · Selecto $50.000 / 3 · Esencial $20.000 / 1 · Web
            701–999 · Físico 000–700
          </p>
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
              title="Intentos web sin pagar"
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
              title="Oportunidades web 701–999"
              value={
                stats.clavesWebLibres != null
                  ? `${stats.clavesWebEmitidas || 0} dadas · ${stats.clavesWebLibres} libres`
                  : stats.clavesEmitidas
              }
            />
            <StatsCard
              title="Oportunidades físico 000–700"
              value={
                stats.clavesFisicoLibres != null
                  ? `${stats.clavesFisicoEmitidas || 0} dadas · ${stats.clavesFisicoLibres} libres`
                  : stats.clavesLibres
              }
            />
            <StatsCard
              title="Premios programados"
              value={stats.premiosProgramados}
            />
          </div>

          <div className="mb-6">
            <p className="admin-section-label">Últimas ventas (pagadas)</p>
            <div className="admin-panel">
              {ultimasVentas.length === 0 ? (
                <div className="admin-empty">
                  Aún no hay pagos aprobados este mes. Los intentos de Bold van
                  en Pagos web.
                </div>
              ) : (
                ultimasVentas.map((v) => (
                  <div key={v.id} className="admin-member-row">
                    <div className="min-w-0">
                      <div className="admin-member-row__name">
                        {v.nombre}
                      </div>
                      <div className="admin-member-row__email">
                        {v.planNombre} · {v.oportunidades} oport. · {v.canal}
                        {v.email ? ` · ${v.email}` : ""}
                      </div>
                    </div>
                    <div className="admin-member-row__meta">
                      <span className="admin-chip">
                        ${Number(v.monto || 0).toLocaleString("es-CO")}
                      </span>
                      <div style={{ marginTop: 6 }}>{formatFecha(v.fecha)}</div>
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
              label: "Pagos web",
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
