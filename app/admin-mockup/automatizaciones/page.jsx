"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/Toast";
import { getAutomatizaciones, toggleAutomatizacion } from "@/lib/mock-admin/store";

const triggerLabels = {
  pago_confirmado: "Pago confirmado (Mercado Pago)",
  pago_pendiente_24h: "Pago pendiente +24 horas",
  boletos_90pct: "Rifa al 90% vendida",
};

const accionLabels = {
  aprobar_automatico: "Aprobar pago automáticamente",
  enviar_whatsapp: "Enviar recordatorio WhatsApp",
  notificar_admin: "Notificar al administrador",
};

export default function MockAutomatizacionesPage() {
  const { addToast } = useToast();
  const [autos, setAutos] = useState([]);

  function cargar() {
    setAutos(getAutomatizaciones());
  }

  useEffect(() => {
    cargar();
    window.addEventListener("mock-admin-update", cargar);
    return () => window.removeEventListener("mock-admin-update", cargar);
  }, []);

  function handleToggle(id) {
    const a = toggleAutomatizacion(id);
    addToast(`${a?.nombre}: ${a?.activa ? "activada" : "desactivada"}`, "info");
  }

  return (
    <div className="py-6 max-w-3xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Automatizaciones</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Flujos automáticos configurables (demo — no conecta a servicios reales)
      </p>

      <div className="space-y-4">
        {autos.map((a) => (
          <div
            key={a.id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <h3 className="text-lg font-semibold text-white">{a.nombre}</h3>
                </div>
                <div className="mt-3 space-y-1.5 text-sm">
                  <p className="text-zinc-400">
                    <span className="text-zinc-500">Cuando:</span>{" "}
                    {triggerLabels[a.trigger] || a.trigger}
                  </p>
                  <p className="text-zinc-400">
                    <span className="text-zinc-500">Entonces:</span>{" "}
                    {accionLabels[a.accion] || a.accion}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(a.id)}
                className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
                  a.activa ? "bg-amber-500" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                    a.activa ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
            <p className={`text-xs mt-3 font-medium ${a.activa ? "text-green-400" : "text-zinc-500"}`}>
              {a.activa ? "● Activa" : "○ Inactiva"}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-500 leading-relaxed">
          En producción, estas automatizaciones se conectarían a webhooks de Mercado Pago,
          cron jobs y la API de WhatsApp. Aquí solo simulan el toggle y registran actividad.
        </p>
      </div>
    </div>
  );
}
