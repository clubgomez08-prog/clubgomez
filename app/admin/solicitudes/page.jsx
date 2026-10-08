"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminAuthHeaders } from "@/lib/auth";
import { useToast } from "@/components/admin/Toast";
import { getPlanById, labelOportunidades } from "@/lib/club-gomez/planes";

function parseNotas(notas) {
  try {
    return notas ? JSON.parse(notas) : {};
  } catch {
    return {};
  }
}

export default function AdminSolicitudesPage() {
  const { addToast } = useToast();
  const [filtro, setFiltro] = useState("nueva");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aprobando, setAprobando] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`/api/admin/solicitudes?estado=${filtro}`, {
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar");
      setItems(data.solicitudes || []);
    } catch (err) {
      addToast(err.message || "Error al cargar solicitudes", "error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filtro, addToast]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function aprobar(id) {
    if (
      !confirm(
        "¿Activar membresía manualmente? Úsalo solo si Bold ya cobró y no se activó sola."
      )
    ) {
      return;
    }
    setAprobando(id);
    try {
      const headers = {
        ...(await getAdminAuthHeaders()),
        "Content-Type": "application/json",
      };
      const res = await fetch(`/api/admin/solicitudes/${id}/aprobar`, {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo aprobar");
      addToast(
        data.emailOk
          ? `Venta activada. ${data.claves?.length || 0} oportunidades + correo.`
          : `Venta activada (${data.claves?.length || 0} oportunidades). Revisa el correo.`,
        "success"
      );
      await cargar();
    } catch (err) {
      addToast(err.message || "Error al aprobar", "error");
    } finally {
      setAprobando(null);
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Pagos web</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Campaña Crypton 0 km más $1.000.000 · planes $20.000 / $50.000 / $100.000.
          Aquí ves quién <strong className="text-zinc-200">abrió Bold</strong>, no
          quién ya pagó. La venta real está en{" "}
          <strong className="text-zinc-200">Pagadas</strong>.
        </p>
        <p className="text-xs text-zinc-500 mt-2">
          “Sin confirmar” = recargó, canceló o Bold aún no avisó. No pulses Activar
          a menos que el dinero ya esté en Bold.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { id: "nueva", label: "Sin confirmar" },
          { id: "convertida", label: "Pagadas" },
          { id: "todas", label: "Todas" },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtro === f.id
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200"
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          type="button"
          onClick={cargar}
          className="ml-auto px-3 py-1.5 rounded-lg text-sm text-zinc-300 border border-zinc-700 hover:bg-zinc-800"
        >
          Actualizar
        </button>
      </div>

      {loading ? (
        <p className="text-zinc-500 py-10 text-center">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-zinc-500 py-10 text-center">
          No hay registros en este filtro.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((s) => {
            const meta = parseNotas(s.notas);
            const plan = getPlanById(s.plan_id);
            const monto = Number(meta.amount) || plan.precio;
            const pagada = s.estado === "convertida";
            return (
              <article
                key={s.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-white font-semibold truncate">{s.nombre}</h2>
                    <span className="text-xs uppercase tracking-wide px-2 py-0.5 rounded-full bg-lime-500/15 text-lime-400 border border-lime-500/30">
                      {plan.nombre} · ${plan.precioLabel} ·{" "}
                      {labelOportunidades(plan.claves)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        pagada
                          ? "bg-lime-500/15 text-lime-400 border-lime-500/30"
                          : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                      }`}
                    >
                      {pagada ? "Pagada" : "Sin confirmar"}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 truncate">
                    {s.email} · {s.telefono}
                    {s.ciudad ? ` · ${s.ciudad}` : ""}
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Cédula {s.cedula}
                    {` · $${Number(monto).toLocaleString("es-CO")}`}
                    {" · "}
                    {s.created_at
                      ? new Date(s.created_at).toLocaleString("es-CO")
                      : "—"}
                  </p>
                </div>
                {pagada ? (
                  <span className="text-sm text-lime-400/80 shrink-0">
                    ✓ Membresía activa
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={aprobando === s.id}
                    onClick={() => aprobar(s.id)}
                    className="shrink-0 px-4 py-2 rounded-lg bg-zinc-800 text-amber-200 font-semibold text-sm border border-amber-500/40 hover:bg-amber-500 hover:text-zinc-950 disabled:opacity-60"
                  >
                    {aprobando === s.id ? "Activando…" : "Activar solo si ya cobró"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
