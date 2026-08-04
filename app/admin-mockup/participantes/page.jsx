"use client";

import { useEffect, useState, Fragment } from "react";
import { useToast } from "@/components/admin/Toast";
import {
  getParticipantes,
  getRifas,
  aprobarParticipante,
  rechazarParticipante,
} from "@/lib/mock-admin/store";

function formatPrecio(n) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(n ?? 0);
}

function formatFecha(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
}

function badgeEstado(estado) {
  const clases = {
    aprobado: "bg-green-500/20 text-green-400",
    pendiente: "bg-amber-500/20 text-amber-400",
    rechazado: "bg-red-500/20 text-red-400",
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${clases[estado] || clases.pendiente}`}>
      {estado}
    </span>
  );
}

export default function MockParticipantesPage() {
  const { addToast } = useToast();
  const [participantes, setParticipantes] = useState([]);
  const [rifas, setRifas] = useState([]);
  const [total, setTotal] = useState(0);
  const [paginas, setPaginas] = useState(0);
  const [filaExpandida, setFilaExpandida] = useState(null);
  const [filtros, setFiltros] = useState({ buscar: "", estado: "", rifa_id: "", page: 1 });

  function cargar() {
    const rifasList = getRifas();
    setRifas(rifasList);
    const res = getParticipantes({ ...filtros, pageSize: 20 });
    setParticipantes(res.participantes);
    setTotal(res.total);
    setPaginas(res.paginas);
  }

  useEffect(() => {
    cargar();
    window.addEventListener("mock-admin-update", cargar);
    return () => window.removeEventListener("mock-admin-update", cargar);
  }, [filtros]);

  function handleAprobar(id) {
    aprobarParticipante(id);
    addToast("Pago aprobado", "success");
  }

  function handleRechazar(id) {
    rechazarParticipante(id);
    addToast("Pago rechazado", "warning");
  }

  const inputCls =
    "px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50";

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold text-white mb-1">Participantes</h1>
      <p className="text-sm text-zinc-500 mb-6">
        {total} registros · Aprobar/rechazar funcional en demo
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          placeholder="Buscar nombre, email, teléfono..."
          value={filtros.buscar}
          onChange={(e) => setFiltros((f) => ({ ...f, buscar: e.target.value, page: 1 }))}
          className={`${inputCls} flex-1 min-w-[200px]`}
        />
        <select
          value={filtros.estado}
          onChange={(e) => setFiltros((f) => ({ ...f, estado: e.target.value, page: 1 }))}
          className={inputCls}
        >
          <option value="">Todos los estados</option>
          <option value="aprobado">Aprobado</option>
          <option value="pendiente">Pendiente</option>
          <option value="rechazado">Rechazado</option>
        </select>
        <select
          value={filtros.rifa_id}
          onChange={(e) => setFiltros((f) => ({ ...f, rifa_id: e.target.value, page: 1 }))}
          className={inputCls}
        >
          <option value="">Todas las rifas</option>
          {rifas.map((r) => (
            <option key={r.id} value={r.id}>{r.nombre}</option>
          ))}
        </select>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "700px" }}>
            <thead>
              <tr className="border-b border-zinc-800">
                {["Nombre", "Email", "Rifa", "Boletos", "Total", "Canal", "Estado", "Fecha", "Acciones"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {participantes.map((p) => {
                const rifa = rifas.find((r) => r.id === p.rifa_id);
                return (
                  <Fragment key={p.id}>
                    <tr className="border-b border-zinc-800 hover:bg-zinc-800/40">
                      <td className="px-4 py-3 text-white text-sm">{p.nombre}</td>
                      <td className="px-4 py-3 text-zinc-400 text-sm truncate max-w-[140px]">{p.email}</td>
                      <td className="px-4 py-3 text-zinc-300 text-sm">{rifa?.nombre || "—"}</td>
                      <td className="px-4 py-3 text-zinc-300 text-sm">
                        <button
                          onClick={() => setFilaExpandida(filaExpandida === p.id ? null : p.id)}
                          className="text-amber-400 hover:underline"
                        >
                          {p.cantidad_boletos} ▾
                        </button>
                      </td>
                      <td className="px-4 py-3 text-amber-400 text-sm font-medium">{formatPrecio(p.total_pagado)}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{p.canal}</td>
                      <td className="px-4 py-3">{badgeEstado(p.estado_pago)}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{formatFecha(p.created_at)}</td>
                      <td className="px-4 py-3">
                        {p.estado_pago === "pendiente" && (
                          <div className="flex gap-1">
                            <button onClick={() => handleAprobar(p.id)} className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">✓</button>
                            <button onClick={() => handleRechazar(p.id)} className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">✕</button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {filaExpandida === p.id && (
                      <tr key={`${p.id}-boletos`} className="bg-zinc-800/30">
                        <td colSpan={9} className="px-4 py-3">
                          <p className="text-xs text-zinc-500 mb-2">Números asignados:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(p.boletos || []).map((n) => (
                              <span key={n} className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300">{n}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {participantes.length === 0 && (
          <p className="text-center py-10 text-zinc-500">No hay participantes con estos filtros</p>
        )}
      </div>

      {paginas > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: paginas }, (_, i) => i + 1).map((pg) => (
            <button
              key={pg}
              onClick={() => setFiltros((f) => ({ ...f, page: pg }))}
              className={`px-3 py-1.5 rounded text-sm ${
                filtros.page === pg ? "bg-amber-500 text-zinc-950" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {pg}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
