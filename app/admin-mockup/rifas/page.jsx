"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ModalConfirm from "@/components/admin/ModalConfirm";
import { useToast } from "@/components/admin/Toast";
import { getRifas, updateRifa, deleteRifa } from "@/lib/mock-admin/store";

const BASE = "/admin-mockup";

export default function MockRifasPage() {
  const { addToast } = useToast();
  const [rifas, setRifas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalToggle, setModalToggle] = useState(null);

  function load() {
    setRifas(getRifas());
    setLoading(false);
  }

  useEffect(() => {
    load();
    window.addEventListener("mock-admin-update", load);
    return () => window.removeEventListener("mock-admin-update", load);
  }, []);

  function formatPrecio(n) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(n);
  }

  function pctVendido(rifa) {
    const total = rifa.total_numeros || 1;
    return (((rifa.boletos_vendidos || 0) / total) * 100).toFixed(1);
  }

  function handleToggle(rifa) {
    const nuevo = rifa.estado === "activa" ? "finalizada" : "activa";
    updateRifa(rifa.id, { estado: nuevo });
    addToast(`Rifa ${nuevo}`, "success");
    setModalToggle(null);
  }

  function handleDelete(rifa) {
    deleteRifa(rifa.id);
    addToast("Rifa eliminada", "success");
    setModalEliminar(null);
  }

  return (
    <div className="py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Rifas</h1>
          <p className="text-sm text-zinc-500 mt-1">Gestión de rifas (datos demo locales)</p>
        </div>
        <Link
          href={`${BASE}/rifas/nueva`}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg text-sm"
        >
          + Nueva rifa
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rifas.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-4xl mb-3">🎯</p>
          <p>No hay rifas. Crea la primera.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {rifas.map((rifa) => (
            <div
              key={rifa.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-white">{rifa.nombre}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        rifa.estado === "activa"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-zinc-700 text-zinc-400"
                      }`}
                    >
                      {rifa.estado}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">
                    {formatPrecio(rifa.precio_boleto)} · {rifa.total_numeros?.toLocaleString()} números
                  </p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>{rifa.boletos_vendidos?.toLocaleString()} vendidos</span>
                      <span>{pctVendido(rifa)}%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${Math.min(parseFloat(pctVendido(rifa)), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`${BASE}/rifas/${rifa.id}`}
                    className="px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-700"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => setModalToggle(rifa)}
                    className="px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-700"
                  >
                    {rifa.estado === "activa" ? "Finalizar" : "Activar"}
                  </button>
                  <button
                    onClick={() => setModalEliminar(rifa)}
                    className="px-3 py-2 text-sm bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalConfirm
        visible={!!modalEliminar}
        titulo="Eliminar rifa"
        mensaje={`¿Eliminar "${modalEliminar?.nombre}"? Esta acción es irreversible en el demo.`}
        onConfirmar={() => handleDelete(modalEliminar)}
        onCancelar={() => setModalEliminar(null)}
      />
      <ModalConfirm
        visible={!!modalToggle}
        titulo="Cambiar estado"
        mensaje={`¿Cambiar estado de "${modalToggle?.nombre}"?`}
        tipo="warning"
        labelConfirmar="Confirmar"
        onConfirmar={() => handleToggle(modalToggle)}
        onCancelar={() => setModalToggle(null)}
      />
    </div>
  );
}
