"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

function formatPrecio(n) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function formatFecha(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function SorteoPage() {
  const [rifas, setRifas] = useState([]);
  const [rifaId, setRifaId] = useState("");
  const [stats, setStats] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sorteando, setSorteando] = useState(false);
  const [ganador, setGanador] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [notificando, setNotificando] = useState(false);
  const [notificados, setNotificados] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/rifas")
      .then((res) => res.json())
      .then((data) => {
        const lista = Array.isArray(data) ? data : [];
        setRifas(lista);
        if (lista.length > 0 && !rifaId) {
          const activa = lista.find((r) => r.estado === "activa") || lista[0];
          setRifaId(activa.id);
        }
      })
      .catch(() => setRifas([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!rifaId) {
      setStats(null);
      setHistorial([]);
      return;
    }

    const rifa = rifas.find((r) => r.id === rifaId);
    if (!rifa) return;

    // Obtener stats reales desde el API
    fetch(`/api/rifas/${rifaId}/stats`)
      .then((res) => res.json())
      .then((s) => {
        const vendidos = s.vendidos ?? 0;
        const total = rifa.total_numeros ?? 10000;
        const pct = total > 0 ? (vendidos / total) * 100 : 0;
        setStats({
          vendidos,
          total,
          porcentaje: pct.toFixed(1),
          recaudado: (rifa.precio_boleto ?? 0) * vendidos,
          listo: pct >= (rifa.porcentaje_sorteo ?? 80),
        });
      })
      .catch(() => setStats(null));

    fetch(`/api/admin/sorteo?rifa_id=${rifaId}`)
      .then((res) => res.json())
      .then((data) => setHistorial(data.sorteos || []))
      .catch(() => setHistorial([]));
  }, [rifaId, rifas]);

  function handleRealizarSorteo() {
    setShowModal(true);
  }

  function confirmarSorteo() {
    setShowModal(false);
    setSorteando(true);
    setError("");
    setGanador(null);

    fetch("/api/admin/sorteo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rifa_id: rifaId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error en el sorteo");
        return data;
      })
      .then((data) => {
        setGanador({ ...data.ganador, sorteo_id: data.sorteo_id });
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        setRifas((prev) =>
          prev.map((r) =>
            r.id === rifaId ? { ...r, estado: "finalizada" } : r
          )
        );
        setHistorial((prev) => [
          {
            id: data.sorteo_id,
            participante_nombre: data.ganador.nombre,
            participante_email: data.ganador.email,
            participante_telefono: data.ganador.telefono,
            numero_boleto: data.ganador.numero_boleto,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setStats(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setSorteando(false));
  }

  function notificarDesdeHistorial(sorteoId) {
    setNotificados((prev) => ({ ...prev, [sorteoId]: { status: "loading" } }));
    fetch("/api/admin/notificar-ganador", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sorteo_id: sorteoId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error enviando email");
        return data;
      })
      .then(() => {
        setNotificados((prev) => ({ ...prev, [sorteoId]: { status: "success" } }));
      })
      .catch((err) => {
        setNotificados((prev) => ({
          ...prev,
          [sorteoId]: { status: "error", error: err.message },
        }));
      });
  }

  function notificarGanador() {
    // console.log("Ganador state:", ganador) — deshabilitado en producción
    if (!ganador?.sorteo_id) return;
    setNotificando(true);
    fetch("/api/admin/notificar-ganador", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sorteo_id: ganador.sorteo_id }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error enviando email");
        return data;
      })
      .then(() => {
        setGanador((g) => ({ ...g, email_enviado: true }));
      })
      .catch((err) => setError(err.message))
      .finally(() => setNotificando(false));
  }

  const rifa = rifas.find((r) => r.id === rifaId);
  const listo = stats?.listo ?? false;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-white">Ejecutar sorteo</h1>

      <div className="flex flex-wrap gap-4 items-center">
        <label className="text-zinc-400 text-sm">Rifa:</label>
        <select
          value={rifaId}
          onChange={(e) => setRifaId(e.target.value)}
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500/50"
        >
          <option value="">Seleccionar rifa</option>
          {rifas.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
      </div>

      {rifa && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <p className="text-zinc-400 text-sm">Boletos vendidos</p>
              <p className="text-xl font-semibold text-white mt-1">
                {stats.vendidos.toLocaleString()} / {stats.total.toLocaleString()}
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <p className="text-zinc-400 text-sm">Porcentaje completado</p>
              <p className="text-xl font-semibold text-amber-400 mt-1">
                {stats.porcentaje}%
              </p>
              <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, parseFloat(stats.porcentaje))}%` }}
                />
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <p className="text-zinc-400 text-sm">Total recaudado</p>
              <p className="text-xl font-semibold text-white mt-1">
                {formatPrecio(stats.recaudado)}
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <p className="text-zinc-400 text-sm">Estado</p>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-lg text-sm font-medium ${
                  listo
                    ? "bg-green-500/20 text-green-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {listo ? "Listo para sortear" : "En progreso"}
              </span>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
            <h2 className="text-lg font-semibold text-white mb-4">
              Ejecutar sorteo
            </h2>
            {rifa.estado === "finalizada" ? (
              <div className="flex flex-col gap-4">
                <p className="text-green-400">
                  Esta rifa ya fue sorteada. Revisa el historial más abajo.
                </p>
                <button
                  disabled
                  className="px-6 py-3 bg-zinc-700 text-zinc-500 rounded-lg cursor-not-allowed"
                >
                  🎰 RIFA FINALIZADA
                </button>
              </div>
            ) : !listo ? (
              <div className="flex flex-col gap-4">
                <p className="text-amber-400">
                  Aún no se alcanza el 80% requerido para realizar el sorteo.
                </p>
                <button
                  disabled
                  className="px-6 py-3 bg-zinc-700 text-zinc-500 rounded-lg cursor-not-allowed"
                >
                  🎰 REALIZAR SORTEO
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleRealizarSorteo}
                  disabled={sorteando}
                  className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sorteando ? "Sorteando..." : "🎰 REALIZAR SORTEO"}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {sorteando && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 text-center">
            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xl text-white">Sorteando...</p>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">
              Confirmar sorteo
            </h3>
            <p className="text-zinc-400 mb-6">
              ¿Confirmas realizar el sorteo? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarSorteo}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {ganador && !sorteando && (
        <div className="bg-zinc-900 border-2 border-amber-500 rounded-xl p-8">
          <h2 className="text-2xl font-semibold text-amber-400 mb-6 text-center">
            🏆 ¡Ganador del sorteo!
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div>
              <p className="text-zinc-400 text-sm">Nombre</p>
              <p className="text-lg text-white font-medium">{ganador.nombre}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Número ganador</p>
              <p className="text-lg text-amber-400 font-mono font-bold">
                {ganador.numero_boleto}
              </p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Email</p>
              <p className="text-lg text-white">{ganador.email}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Teléfono</p>
              <p className="text-lg text-white">{ganador.telefono}</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <button
              onClick={notificarGanador}
              disabled={notificando || ganador.email_enviado}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ganador.email_enviado
                ? "✓ Email enviado"
                : notificando
                ? "Enviando..."
                : "Notificar ganador por email"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {historial.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <h2 className="text-lg font-semibold text-white p-6 border-b border-zinc-800">
            Historial de sorteos
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Ganador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {historial.map((s) => {
                  const estado = notificados[s.id];
                  const loading = estado === "loading";
                  const success = estado === "success";
                  const errorSorteo = typeof estado === "object" && estado?.error;
                  const isError = estado === "error" || errorSorteo;
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                    >
                      <td className="px-6 py-4 text-white">
                        {s.participante_nombre || "—"}
                      </td>
                      <td className="px-6 py-4 text-amber-400 font-mono">
                        {s.numero_boleto || "—"}
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        {s.participante_email || "—"}
                      </td>
                      <td className="px-6 py-4 text-zinc-400 text-sm">
                        {formatFecha(s.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setNotificados((prev) => ({
                              ...prev,
                              [s.id]: "loading",
                            }));
                            fetch("/api/admin/notificar-ganador", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({ sorteo_id: s.id }),
                            })
                              .then(async (res) => {
                                const data = await res.json();
                                if (!res.ok)
                                  throw new Error(data.error || "Error enviando email");
                                return data;
                              })
                              .then(() => {
                                setNotificados((prev) => ({
                                  ...prev,
                                  [s.id]: "success",
                                }));
                              })
                              .catch((err) => {
                                setNotificados((prev) => ({
                                  ...prev,
                                  [s.id]: { error: err.message },
                                }));
                              });
                          }}
                          disabled={loading || success}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium disabled:cursor-not-allowed ${
                            success
                              ? "bg-green-500/20 text-green-400"
                              : isError
                              ? "bg-red-500/20 text-red-400"
                              : loading
                              ? "bg-zinc-600 text-zinc-400"
                              : "bg-amber-500 hover:bg-amber-400 text-zinc-950"
                          }`}
                        >
                          {success
                            ? "✓ Enviado"
                            : loading
                            ? "Enviando..."
                            : isError
                            ? errorSorteo || "Error"
                            : "Notificar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
