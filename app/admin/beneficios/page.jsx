"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminAuthHeaders } from "@/lib/auth";
import { useToast } from "@/components/admin/Toast";
import PeriodoPicker from "@/components/admin/PeriodoPicker";
import { LOTERIA_INTERNA } from "@/lib/club-gomez/claves-whatsapp";
import { periodoDe } from "@/lib/club-gomez/claves-pool";

const LIME = "#B8E351";

function badgeEstado(estado) {
  const map = {
    programado: { bg: "rgba(184,227,81,0.15)", color: LIME, label: "Programado" },
    jugado: { bg: "rgba(96,165,250,0.15)", color: "#60a5fa", label: "Jugado" },
    entregado: { bg: "rgba(34,197,94,0.15)", color: "#22c55e", label: "Entregado" },
    sin_ganador: { bg: "rgba(161,161,170,0.15)", color: "#a1a1aa", label: "Sin ganador" },
  };
  return map[estado] || map.programado;
}

export default function AdminBeneficiosPage() {
  const { addToast } = useToast();
  const [periodo, setPeriodo] = useState(periodoDe());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState({
    premio: "",
    fecha_sorteo: "",
    descripcion: "",
  });
  const [resultadoDraft, setResultadoDraft] = useState({});
  const [busyId, setBusyId] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`/api/admin/beneficios?periodo=${periodo}`, {
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar");
      setItems(data.beneficios || []);
    } catch (err) {
      addToast(err.message || "Error al cargar", "error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [periodo, addToast]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crearBeneficio(e) {
    e.preventDefault();
    setCreando(true);
    try {
      const headers = {
        ...(await getAdminAuthHeaders()),
        "Content-Type": "application/json",
      };
      const res = await fetch("/api/admin/beneficios", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...form, periodo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo crear");
      addToast("Fecha de premio creada", "success");
      setForm({ premio: "", fecha_sorteo: "", descripcion: "" });
      await cargar();
    } catch (err) {
      addToast(err.message || "Error al crear", "error");
    } finally {
      setCreando(false);
    }
  }

  async function registrarResultado(id) {
    const raw = resultadoDraft[id] || "";
    setBusyId(id);
    try {
      const headers = {
        ...(await getAdminAuthHeaders()),
        "Content-Type": "application/json",
      };
      const res = await fetch(`/api/admin/beneficios/${id}/resultado`, {
        method: "POST",
        headers,
        body: JSON.stringify({ resultado: raw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo registrar");
      if (data.hayGanador) {
        addToast(
          data.emailOk
            ? `Ganador: ${data.ganador?.nombre || "miembro"} (${data.beneficio?.resultado}). Correo enviado.`
            : `Ganador encontrado (${data.beneficio?.resultado}). Revisa el correo.`,
          "success"
        );
      } else {
          addToast(
            `Resultado ${data.beneficio?.resultado}: ninguna clave coincidió.`,
            "info"
          );
      }
      await cargar();
    } catch (err) {
      addToast(err.message || "Error", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function marcarEntrega(id) {
    if (!confirm("¿Marcar premio como entregado?")) return;
    setBusyId(id);
    try {
      const headers = {
        ...(await getAdminAuthHeaders()),
        "Content-Type": "application/json",
      };
      const res = await fetch(`/api/admin/beneficios/${id}/entregar`, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo marcar");
      addToast("Premio marcado como entregado", "success");
      await cargar();
    } catch (err) {
      addToast(err.message || "Error", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="py-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-white mb-1">
        Fechas de premio
      </h1>
      <p className="text-sm text-zinc-500 mb-6">
        Estas fechas son las mismas que ve el público en la homepage. Cada
        premio va ligado a un día: el número de {LOTERIA_INTERNA} (4 dígitos)
        decide el ganador entre las claves del mes.
      </p>

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <PeriodoPicker value={periodo} onChange={setPeriodo} />
        <span
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg mb-0.5"
          style={{ background: "rgba(184,227,81,0.12)", color: LIME }}
        >
          {LOTERIA_INTERNA}
        </span>
      </div>

      <form
        onSubmit={crearBeneficio}
        className="bg-zinc-900 rounded-xl p-5 mb-8"
        style={{ border: "1px solid rgba(184,227,81,0.2)" }}
      >
        <p className="text-xs font-semibold tracking-wide text-zinc-500 mb-3">
          NUEVA FECHA (DANIEL)
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm text-zinc-400">
            Premio
            <input
              required
              value={form.premio}
              onChange={(e) =>
                setForm((f) => ({ ...f, premio: e.target.value }))
              }
              placeholder="Ej. TV 55&quot;"
              className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white"
            />
          </label>
          <label className="grid gap-1 text-sm text-zinc-400">
            Fecha de sorteo
            <input
              required
              type="date"
              value={form.fecha_sorteo}
              onChange={(e) =>
                setForm((f) => ({ ...f, fecha_sorteo: e.target.value }))
              }
              className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white"
            />
          </label>
          <label className="grid gap-1 text-sm text-zinc-400 sm:col-span-2">
            Descripción (opcional)
            <input
              value={form.descripcion}
              onChange={(e) =>
                setForm((f) => ({ ...f, descripcion: e.target.value }))
              }
              placeholder="Detalle del beneficio"
              className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={creando}
          className="mt-4 px-4 py-2.5 rounded-lg text-sm font-bold"
          style={{
            background: LIME,
            color: "#050607",
            opacity: creando ? 0.7 : 1,
          }}
        >
          {creando ? "Guardando…" : "Agregar fecha"}
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-10">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: LIME, borderTopColor: "transparent" }}
          />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-zinc-500 py-6">
          No hay fechas de premio en este periodo. Usa el formulario de arriba o
          cambia el periodo (ej. octubre 2026).
        </p>
      ) : (
        <div className="grid gap-4">
          {items.map((b) => {
            const badge = badgeEstado(b.estado);
            return (
              <div
                key={b.id}
                className="bg-zinc-900 rounded-xl p-5"
                style={{ border: "1px solid rgba(184,227,81,0.18)" }}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {b.premio}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: LIME }}>
                      {b.fecha_sorteo}
                      {b.slug ? ` · ${b.slug}` : ""}
                      {b.destacado ? " · destacado" : ""}
                      {b.descripcion ? ` · ${b.descripcion}` : ""}
                    </p>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                </div>

                {b.resultado ? (
                  <p className="text-sm text-zinc-300 mt-3 font-mono">
                    Resultado Motilón:{" "}
                    <strong style={{ color: LIME }}>{b.resultado}</strong>
                    {b.ganador ? (
                      <>
                        {" "}
                        · Ganador: {b.ganador.nombre} ({b.ganador.email})
                      </>
                    ) : b.estado === "sin_ganador" ? (
                      " · Sin clave coincidente"
                    ) : null}
                  </p>
                ) : null}

                {b.estado === "programado" ? (
                  <div className="mt-4 flex flex-wrap items-end gap-2">
                    <label className="grid gap-1 text-xs text-zinc-400">
                      Resultado (4 dígitos)
                      <input
                        value={resultadoDraft[b.id] || ""}
                        onChange={(e) =>
                          setResultadoDraft((d) => ({
                            ...d,
                            [b.id]: e.target.value.replace(/\D/g, "").slice(0, 4),
                          }))
                        }
                        placeholder="0000"
                        maxLength={4}
                        className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white font-mono w-28"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => registrarResultado(b.id)}
                      className="px-4 py-2 rounded-lg text-sm font-bold"
                      style={{ background: LIME, color: "#050607" }}
                    >
                      {busyId === b.id ? "…" : "Cruzar resultado"}
                    </button>
                  </div>
                ) : null}

                {b.estado === "jugado" ? (
                  <button
                    type="button"
                    disabled={busyId === b.id}
                    onClick={() => marcarEntrega(b.id)}
                    className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold border border-zinc-600 text-zinc-200 hover:bg-zinc-800"
                  >
                    {busyId === b.id ? "…" : "Marcar entregado"}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
