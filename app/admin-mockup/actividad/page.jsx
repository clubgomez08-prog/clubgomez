"use client";

import { useEffect, useState } from "react";
import ActivityFeed from "@/components/admin-mockup/ActivityFeed";
import { getActividad } from "@/lib/mock-admin/store";

const FILTROS = [
  { id: "", label: "Todos" },
  { id: "pago_aprobado", label: "Pagos" },
  { id: "venta_fisica", label: "Ventas físicas" },
  { id: "sorteo", label: "Sorteos" },
  { id: "campana", label: "Campañas" },
  { id: "rifa_editada", label: "Rifas" },
];

export default function MockActividadPage() {
  const [actividad, setActividad] = useState([]);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    function cargar() {
      setActividad(getActividad());
    }
    cargar();
    window.addEventListener("mock-admin-update", cargar);
    return () => window.removeEventListener("mock-admin-update", cargar);
  }, []);

  const filtrada = filtro
    ? actividad.filter((a) => a.tipo === filtro || a.tipo.startsWith(filtro.replace("_editada", "")))
    : actividad;

  return (
    <div className="py-6 max-w-3xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Actividad</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Registro de auditoría en tiempo real (demo local)
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtro === f.id
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-500 mb-4">{filtrada.length} eventos</p>
        <ActivityFeed items={filtrada} />
      </div>
    </div>
  );
}
