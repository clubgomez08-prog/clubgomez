"use client";

import { useEffect, useState } from "react";
import { getNotificaciones, marcarNotificacionLeida } from "@/lib/mock-admin/store";

function formatFecha(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
}

const tipoIcon = {
  warning: { icon: "⚠️", color: "#F2B233" },
  info: { icon: "ℹ️", color: "#60a5fa" },
  success: { icon: "✅", color: "#22C55E" },
  error: { icon: "❌", color: "#ef4444" },
};

export default function MockNotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [filtro, setFiltro] = useState("todas");

  function cargar() {
    setNotificaciones(getNotificaciones());
  }

  useEffect(() => {
    cargar();
    window.addEventListener("mock-admin-update", cargar);
    return () => window.removeEventListener("mock-admin-update", cargar);
  }, []);

  function marcarLeida(id) {
    marcarNotificacionLeida(id);
  }

  function marcarTodas() {
    notificaciones.filter((n) => !n.leida).forEach((n) => marcarNotificacionLeida(n.id));
  }

  const lista =
    filtro === "no-leidas"
      ? notificaciones.filter((n) => !n.leida)
      : notificaciones;

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <div className="py-6 max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Notificaciones</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {noLeidas > 0 ? `${noLeidas} sin leer` : "Todo al día"}
          </p>
        </div>
        {noLeidas > 0 && (
          <button
            onClick={marcarTodas}
            className="text-sm text-amber-400 hover:text-amber-300"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { id: "todas", label: "Todas" },
          { id: "no-leidas", label: "No leídas" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              filtro === f.id ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {lista.map((n) => {
          const t = tipoIcon[n.tipo] || tipoIcon.info;
          return (
            <div
              key={n.id}
              onClick={() => !n.leida && marcarLeida(n.id)}
              className={`rounded-xl p-4 border cursor-pointer transition-colors ${
                n.leida
                  ? "bg-zinc-900/50 border-zinc-800 opacity-60"
                  : "bg-zinc-900 border-zinc-700 hover:border-amber-500/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{t.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium text-sm">{n.titulo}</p>
                    {!n.leida && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 mt-0.5">{n.mensaje}</p>
                  <p className="text-xs text-zinc-600 mt-1">{formatFecha(n.created_at)}</p>
                </div>
              </div>
            </div>
          );
        })}
        {lista.length === 0 && (
          <p className="text-center py-12 text-zinc-500">No hay notificaciones</p>
        )}
      </div>
    </div>
  );
}
