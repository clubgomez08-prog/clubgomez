"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/Toast";
import { getCampanas, crearCampana, lanzarCampana } from "@/lib/mock-admin/store";

function formatFecha(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

const estadoBadge = {
  activa: "bg-green-500/20 text-green-400",
  completada: "bg-blue-500/20 text-blue-400",
  borrador: "bg-zinc-700 text-zinc-400",
};

export default function MockCampanasPage() {
  const { addToast } = useToast();
  const [campanas, setCampanas] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: "", canal: "whatsapp" });
  const [lanzando, setLanzando] = useState(null);

  function cargar() {
    setCampanas(getCampanas());
  }

  useEffect(() => {
    cargar();
    window.addEventListener("mock-admin-update", cargar);
    return () => window.removeEventListener("mock-admin-update", cargar);
  }, []);

  function handleCrear(e) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      addToast("Nombre requerido", "error");
      return;
    }
    crearCampana(form);
    addToast("Campaña creada en borrador", "success");
    setModal(false);
    setForm({ nombre: "", canal: "whatsapp" });
  }

  function handleLanzar(id) {
    setLanzando(id);
    setTimeout(() => {
      const c = lanzarCampana(id);
      addToast(`Campaña enviada a ${c?.enviados || 0} contactos`, "success");
      setLanzando(null);
    }, 800);
  }

  const inputCls =
    "w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50";

  return (
    <div className="py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Campañas</h1>
          <p className="text-sm text-zinc-500 mt-1">Email y WhatsApp marketing (demo)</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="px-4 py-2.5 bg-amber-500 text-zinc-950 font-semibold rounded-lg text-sm"
        >
          + Nueva campaña
        </button>
      </div>

      <div className="grid gap-4">
        {campanas.map((c) => (
          <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-white">{c.nombre}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${estadoBadge[c.estado]}`}>
                    {c.estado}
                  </span>
                  <span className="text-xs text-zinc-500 capitalize">{c.canal}</span>
                </div>
                <p className="text-xs text-zinc-600 mt-1">Creada: {formatFecha(c.created_at)}</p>
              </div>
              {c.estado === "borrador" && (
                <button
                  onClick={() => handleLanzar(c.id)}
                  disabled={lanzando === c.id}
                  className="px-4 py-2 bg-green-500/20 border border-green-500/40 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 disabled:opacity-50"
                >
                  {lanzando === c.id ? "Enviando..." : "🚀 Lanzar campaña"}
                </button>
              )}
            </div>

            {c.enviados > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-zinc-800">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{c.enviados}</p>
                  <p className="text-xs text-zinc-500">Enviados</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{c.abiertos}</p>
                  <p className="text-xs text-zinc-500">Abiertos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-400">{c.conversiones}</p>
                  <p className="text-xs text-zinc-500">Conversiones</p>
                </div>
              </div>
            )}

            {c.enviados > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span>Tasa apertura</span>
                  <span>{((c.abiertos / c.enviados) * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(c.abiertos / c.enviados) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Nueva campaña</h2>
            <form onSubmit={handleCrear} className="space-y-4">
              <input
                placeholder="Nombre de la campaña"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className={inputCls}
              />
              <select
                value={form.canal}
                onChange={(e) => setForm((f) => ({ ...f, canal: e.target.value }))}
                className={inputCls}
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-3 bg-amber-500 text-zinc-950 font-bold rounded-xl">
                  Crear borrador
                </button>
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-3 border border-zinc-600 text-zinc-400 rounded-xl">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
