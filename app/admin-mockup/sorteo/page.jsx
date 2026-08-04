"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useToast } from "@/components/admin/Toast";
import { getRifas, ejecutarSorteo, getSorteos, getParticipantes } from "@/lib/mock-admin/store";

function formatFecha(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

export default function MockSorteoPage() {
  const { addToast } = useToast();
  const [rifas, setRifas] = useState([]);
  const [rifaId, setRifaId] = useState("");
  const [historial, setHistorial] = useState([]);
  const [sorteando, setSorteando] = useState(false);
  const [ganador, setGanador] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [numeroBuscar, setNumeroBuscar] = useState("");
  const [resultadoBusqueda, setResultadoBusqueda] = useState(null);

  function cargar() {
    const list = getRifas();
    setRifas(list);
    if (!rifaId && list.length > 0) {
      const activa = list.find((r) => r.estado === "activa") || list[0];
      setRifaId(activa.id);
    }
    setHistorial(getSorteos());
  }

  useEffect(() => {
    cargar();
    window.addEventListener("mock-admin-update", cargar);
    return () => window.removeEventListener("mock-admin-update", cargar);
  }, [rifaId]);

  const rifaSel = rifas.find((r) => r.id === rifaId);

  function handleSortear() {
    setSorteando(true);
    setTimeout(() => {
      const res = ejecutarSorteo(rifaId);
      if (!res) {
        addToast("No hay participantes aprobados para sortear", "error");
        setSorteando(false);
        return;
      }
      setGanador(res);
      setShowModal(true);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      addToast("¡Sorteo ejecutado!", "success");
      setSorteando(false);
      cargar();
    }, 1200);
  }

  function buscarNumero() {
    if (!numeroBuscar.trim()) return;
    const num = Number(numeroBuscar);
    const participantes = getParticipantes({ rifa_id: rifaId, estado: "aprobado" }).participantes;
    for (const p of participantes) {
      if ((p.boletos || []).includes(num)) {
        setResultadoBusqueda({ participante: p, numero: num });
        return;
      }
    }
    setResultadoBusqueda({ error: "Número no encontrado o no aprobado" });
  }

  return (
    <div className="py-6 max-w-3xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Sorteo</h1>
      <p className="text-sm text-zinc-500 mb-6">Ejecutar sorteo y buscar ganador por número (demo)</p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6 space-y-4">
        <div>
          <label className="block text-sm text-zinc-300 mb-2">Seleccionar rifa</label>
          <select
            value={rifaId}
            onChange={(e) => setRifaId(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
          >
            {rifas.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre} ({r.estado})
              </option>
            ))}
          </select>
        </div>

        {rifaSel && (
          <div className="grid sm:grid-cols-3 gap-3 text-center">
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <p className="text-xs text-zinc-500">Vendidos</p>
              <p className="text-lg font-bold text-white">{rifaSel.boletos_vendidos?.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <p className="text-xs text-zinc-500">Total</p>
              <p className="text-lg font-bold text-white">{rifaSel.total_numeros?.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <p className="text-xs text-zinc-500">Estado</p>
              <p className="text-lg font-bold text-amber-400">{rifaSel.estado}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleSortear}
          disabled={sorteando || rifaSel?.estado === "finalizada"}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 font-extrabold rounded-xl text-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sorteando ? "Sorteando..." : "🏆 EJECUTAR SORTEO"}
        </button>
        {rifaSel?.estado === "finalizada" && (
          <p className="text-xs text-zinc-500 text-center">Esta rifa ya fue finalizada</p>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Buscar ganador por número</h2>
        <div className="flex gap-2">
          <input
            value={numeroBuscar}
            onChange={(e) => setNumeroBuscar(e.target.value)}
            placeholder="Ej: 4521"
            className="flex-1 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
          />
          <button onClick={buscarNumero} className="px-4 py-2.5 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600">
            Buscar
          </button>
        </div>
        {resultadoBusqueda && (
          <div className="mt-3 p-3 rounded-lg bg-zinc-800/50">
            {resultadoBusqueda.error ? (
              <p className="text-red-400 text-sm">{resultadoBusqueda.error}</p>
            ) : (
              <p className="text-sm text-zinc-200">
                #{resultadoBusqueda.numero} →{" "}
                <strong>{resultadoBusqueda.participante.nombre}</strong> (
                {resultadoBusqueda.participante.email})
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xs font-semibold tracking-wide text-zinc-500 mb-3">HISTORIAL DE SORTEOS</h2>
        {historial.length === 0 ? (
          <p className="text-zinc-500 text-sm">Sin sorteos registrados</p>
        ) : (
          <div className="space-y-2">
            {historial.map((s) => {
              const rifa = rifas.find((r) => r.id === s.rifa_id);
              return (
                <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="text-white font-medium">{rifa?.nombre || "Rifa"}</p>
                    <p className="text-sm text-zinc-400">
                      #{s.numero_ganador} — {s.ganador_nombre}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500">{formatFecha(s.created_at)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && ganador && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.9)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div className="bg-zinc-900 border-2 border-amber-500/50 rounded-2xl p-8 max-w-md w-full text-center">
            <p className="text-5xl mb-4">🏆</p>
            <h2 className="text-2xl font-extrabold text-amber-400 mb-2">¡Tenemos ganador!</h2>
            <p className="text-4xl font-black text-white my-4">#{ganador.numero_ganador}</p>
            <p className="text-lg text-zinc-200">{ganador.ganador_nombre}</p>
            <p className="text-sm text-zinc-500 mt-1">{ganador.ganador_email}</p>
            <button
              onClick={() => { setShowModal(false); setGanador(null); }}
              className="mt-6 w-full py-3 bg-amber-500 text-zinc-950 font-bold rounded-xl"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
