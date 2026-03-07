"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

const PAGE_SIZE = 20;

export default function ParticipantesPage() {
  const [participantes, setParticipantes] = useState([]);
  const [rifas, setRifas] = useState([]);
  const [total, setTotal] = useState(0);
  const [paginas, setPaginas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [filtros, setFiltros] = useState({
    buscar: "",
    estado: "",
    rifa_id: "",
    page: 1,
  });

  useEffect(() => {
    fetch("/api/rifas")
      .then((res) => res.json())
      .then((data) => setRifas(Array.isArray(data) ? data : []))
      .catch(() => setRifas([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      buscar: filtros.buscar,
      estado: filtros.estado,
      rifa_id: filtros.rifa_id,
      page: String(filtros.page),
    });

    fetch(`/api/admin/participantes?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setParticipantes(data.participantes || []);
        setTotal(data.total ?? 0);
        setPaginas(data.paginas ?? 0);
      })
      .catch(() => {
        setParticipantes([]);
        setTotal(0);
        setPaginas(0);
      })
      .finally(() => setLoading(false));
  }, [filtros]);

  function formatPrecio(n) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n ?? 0);
  }

  function formatFecha(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function badgeEstado(estado) {
    const clases = {
      aprobado: "bg-green-500/20 text-green-400",
      pendiente: "bg-amber-500/20 text-amber-400",
      rechazado: "bg-red-500/20 text-red-400",
    };
    const label = estado || "pendiente";
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          clases[label] || clases.pendiente
        }`}
      >
        {label}
      </span>
    );
  }

  async function handleExportar() {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        buscar: filtros.buscar,
        estado: filtros.estado,
        rifa_id: filtros.rifa_id,
        export: "1",
      });

      const res = await fetch(`/api/admin/participantes?${params}`);
      const data = await res.json();
      const lista = data.participantes || [];

      const rows = lista.map((p) => ({
        Nombre: p.nombre || "",
        Email: p.email || "",
        Teléfono: p.telefono || "",
        Ciudad: p.ciudad || "",
        Cédula: p.cedula || "",
        Rifa: p.rifas?.nombre || "-",
        Boletos: p.cantidad_boletos ?? 0,
        Total: p.total_pagado ?? 0,
        Estado: p.estado_pago || "pendiente",
        Fecha: p.created_at ? formatFecha(p.created_at) : "",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Participantes");
      XLSX.writeFile(wb, `participantes_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("Error exportando:", err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-white">Participantes</h1>
        <button
          onClick={handleExportar}
          disabled={exporting}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-medium rounded-lg disabled:opacity-50"
        >
          {exporting ? "Exportando..." : "Exportar Excel"}
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Buscar por nombre, email o cédula..."
          value={filtros.buscar}
          onChange={(e) =>
            setFiltros((f) => ({ ...f, buscar: e.target.value, page: 1 }))
          }
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 w-64 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        />
        <select
          value={filtros.estado}
          onChange={(e) =>
            setFiltros((f) => ({ ...f, estado: e.target.value, page: 1 }))
          }
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        >
          <option value="">Todos los estados</option>
          <option value="aprobado">Aprobado</option>
          <option value="pendiente">Pendiente</option>
          <option value="rechazado">Rechazado</option>
        </select>
        <select
          value={filtros.rifa_id}
          onChange={(e) =>
            setFiltros((f) => ({ ...f, rifa_id: e.target.value, page: 1 }))
          }
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 min-w-[180px]"
        >
          <option value="">Todas las rifas</option>
          {rifas.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : participantes.length === 0 ? (
          <div className="py-16 text-center text-zinc-400">
            No hay participantes que coincidan con los filtros
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Teléfono
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Ciudad
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Rifa
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Boletos
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody>
                {participantes.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-zinc-800 hover:bg-zinc-800/50"
                  >
                    <td className="px-6 py-4 text-white">{p.nombre || "-"}</td>
                    <td className="px-6 py-4 text-zinc-300">{p.email || "-"}</td>
                    <td className="px-6 py-4 text-zinc-300">
                      {p.telefono || "-"}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {p.ciudad || "-"}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {p.rifas?.nombre || "-"}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {p.cantidad_boletos ?? 0}
                    </td>
                    <td className="px-6 py-4 text-amber-400">
                      {formatPrecio(p.total_pagado)}
                    </td>
                    <td className="px-6 py-4">
                      {badgeEstado(p.estado_pago)}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">
                      {formatFecha(p.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {paginas > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-zinc-800">
            <p className="text-sm text-zinc-400">
              {total} participante{total !== 1 ? "s" : ""} en total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setFiltros((f) => ({ ...f, page: Math.max(1, f.page - 1) }))
                }
                disabled={filtros.page <= 1}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Anterior
              </button>
              <span className="px-3 py-1.5 text-zinc-400 text-sm">
                Página {filtros.page} de {paginas}
              </span>
              <button
                onClick={() =>
                  setFiltros((f) => ({
                    ...f,
                    page: Math.min(paginas, f.page + 1),
                  }))
                }
                disabled={filtros.page >= paginas}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
