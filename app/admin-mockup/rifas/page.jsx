"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ModalConfirm from "@/components/admin/ModalConfirm";
import { useToast } from "@/components/admin/Toast";
import { getRifas, updateRifa, deleteRifa } from "@/lib/mock-admin/store";

const BASE = "/admin-mockup";
const LIME = "#B8E351";

export default function MockRifasPage() {
  const { addToast } = useToast();
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalToggle, setModalToggle] = useState(null);

  function load() {
    setPlanes(getRifas());
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

  function handleToggle(plan) {
    const nuevo = plan.estado === "activa" ? "finalizada" : "activa";
    updateRifa(plan.id, { estado: nuevo });
    addToast(`Plan ${nuevo}`, "success");
    setModalToggle(null);
  }

  function handleDelete(plan) {
    deleteRifa(plan.id);
    addToast("Plan eliminado", "success");
    setModalEliminar(null);
  }

  return (
    <div className="py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Membresías</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Planes Élite, Selecto y Esencial (demo)
          </p>
        </div>
        <Link
          href={`${BASE}/rifas/nueva`}
          className="px-4 py-2.5 font-semibold rounded-lg text-sm"
          style={{ background: LIME, color: "#050607" }}
        >
          + Nuevo plan
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: LIME, borderTopColor: "transparent" }}
          />
        </div>
      ) : planes.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p>No hay planes. Crea el primero.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {planes.map((plan) => (
            <div
              key={plan.id}
              className="bg-zinc-900 rounded-xl p-5"
              style={{ border: "1px solid rgba(184,227,81,0.2)" }}
            >
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="text-xl font-semibold text-white">{plan.nombre}</h3>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    plan.estado === "activa"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-zinc-700 text-zinc-400"
                  }`}
                >
                  {plan.estado}
                </span>
              </div>
              <p className="text-2xl font-bold mb-1" style={{ color: LIME }}>
                {formatPrecio(plan.precio_boleto)}
                <span className="text-sm font-normal text-zinc-500"> / mes</span>
              </p>
              <p className="text-sm text-zinc-400 mb-4">
                {plan.claves || plan.total_numeros} claves con oportunidades
              </p>
              <p className="text-xs text-zinc-500 mb-4">
                {plan.boletos_vendidos?.toLocaleString("es-CO")} membresías activadas
                (demo)
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`${BASE}/rifas/${plan.id}`}
                  className="px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-700"
                >
                  Ver
                </Link>
                <button
                  type="button"
                  onClick={() => setModalToggle(plan)}
                  className="px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-700"
                >
                  {plan.estado === "activa" ? "Pausar" : "Activar"}
                </button>
                <button
                  type="button"
                  onClick={() => setModalEliminar(plan)}
                  className="px-3 py-2 text-sm bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalConfirm
        visible={!!modalEliminar}
        titulo="Eliminar plan"
        mensaje={`¿Eliminar "${modalEliminar?.nombre}"? Acción irreversible en el demo.`}
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
