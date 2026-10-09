"use client";

import { useEffect, useState } from "react";
import { getAdminAuthHeaders } from "@/lib/auth";
import { ACCIONES_LABEL } from "@/lib/admin-actividad";

const LIME = "#B8E351";

function formatFecha(d) {
  return new Date(d).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function resumen(detalle) {
  if (!detalle || typeof detalle !== "object") return "";
  return Object.entries(detalle)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : v}`)
    .join(" · ");
}

export default function HistorialPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/actividad", {
          headers: await getAdminAuthHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al cargar");
        setItems(data.actividad || []);
      } catch (err) {
        setError(err.message || "Error al cargar");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Historial</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Quién hizo qué en el panel: ventas físicas, anulaciones, activaciones a
        mano, cambios de planes, campañas y premios. Últimos 200 registros.
      </p>

      {loading ? (
        <div className="flex justify-center py-10">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: LIME, borderTopColor: "transparent" }}
          />
        </div>
      ) : error ? (
        <p className="text-sm text-red-300 py-6">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-zinc-500 py-6">Aún no hay movimientos registrados.</p>
      ) : (
        <div className="admin-panel">
          {items.map((a) => (
            <div key={a.id} className="admin-member-row">
              <div className="min-w-0">
                <div className="admin-member-row__name">
                  {ACCIONES_LABEL[a.accion] || a.accion}
                </div>
                <div className="admin-member-row__email" style={{ whiteSpace: "normal" }}>
                  {resumen(a.detalle)}
                </div>
              </div>
              <div className="admin-member-row__meta">
                <span className="admin-chip">{a.admin_email || "—"}</span>
                <div style={{ marginTop: 6 }}>{formatFecha(a.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
