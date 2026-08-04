"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useToast } from "@/components/admin/Toast";
import { getParticipantes, getRifas, getStats } from "@/lib/mock-admin/store";

export default function MockReportesPage() {
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [exportando, setExportando] = useState(null);

  useEffect(() => {
    function cargar() {
      setStats(getStats());
    }
    cargar();
    window.addEventListener("mock-admin-update", cargar);
    return () => window.removeEventListener("mock-admin-update", cargar);
  }, []);

  function exportarParticipantes() {
    setExportando("participantes");
    const { participantes } = getParticipantes({ pageSize: 9999 });
    const rifas = getRifas();
    const rows = participantes.map((p) => ({
      Nombre: p.nombre,
      Email: p.email,
      Teléfono: p.telefono,
      Rifa: rifas.find((r) => r.id === p.rifa_id)?.nombre || "",
      Boletos: p.cantidad_boletos,
      Total: p.total_pagado,
      Estado: p.estado_pago,
      Canal: p.canal,
      Fecha: new Date(p.created_at).toLocaleString("es-CO"),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participantes");
    XLSX.writeFile(wb, "reporte-participantes-demo.xlsx");
    addToast("Excel descargado", "success");
    setExportando(null);
  }

  function exportarResumen() {
    setExportando("resumen");
    const rifas = getRifas();
    const rows = rifas.map((r) => ({
      Rifa: r.nombre,
      Estado: r.estado,
      Precio: r.precio_boleto,
      Total_numeros: r.total_numeros,
      Vendidos: r.boletos_vendidos,
      Porcentaje: `${(((r.boletos_vendidos || 0) / (r.total_numeros || 1)) * 100).toFixed(1)}%`,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rifas");
    XLSX.writeFile(wb, "reporte-rifas-demo.xlsx");
    addToast("Resumen descargado", "success");
    setExportando(null);
  }

  const reportes = [
    {
      id: "participantes",
      titulo: "Participantes completos",
      desc: "Todos los registros con estado, canal y montos",
      icon: "👥",
      accion: exportarParticipantes,
    },
    {
      id: "resumen",
      titulo: "Resumen por rifa",
      desc: "Estado, ventas y porcentaje vendido",
      icon: "🎯",
      accion: exportarResumen,
    },
  ];

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold text-white mb-1">Reportes</h1>
      <p className="text-sm text-zinc-500 mb-6">Exportación Excel funcional (datos demo)</p>

      {stats && (
        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          {[
            { label: "Ventas totales", val: `$ ${stats.ventasTotales.toLocaleString("es-CO")}` },
            { label: "Participantes", val: stats.participantes },
            { label: "Boletos", val: stats.boletosVendidos },
          ].map((k) => (
            <div key={k.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500">{k.label}</p>
              <p className="text-xl font-bold text-white mt-1">{k.val}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {reportes.map((r) => (
          <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <span className="text-3xl">{r.icon}</span>
            <h3 className="text-lg font-semibold text-white mt-3">{r.titulo}</h3>
            <p className="text-sm text-zinc-500 mt-1 mb-4">{r.desc}</p>
            <button
              onClick={r.accion}
              disabled={exportando === r.id}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg text-sm disabled:opacity-50"
            >
              {exportando === r.id ? "Generando..." : "Descargar Excel"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
