"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/Toast";
import { getLanding, updateLanding } from "@/lib/mock-admin/store";

export default function MockLandingPage() {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    whatsapp_numero: "",
    whatsapp_activo: true,
    banner_izquierda: "",
    banner_derecha: "",
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cfg = getLanding();
    setForm(cfg);
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    updateLanding(form);
    addToast("Configuración guardada", "success");
    setGuardando(false);
  }

  const inputCls =
    "w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50";

  return (
    <div className="py-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Landing</h1>
      <p className="text-sm text-zinc-500 mb-6">Configuración global del sitio (demo local)</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300">WhatsApp</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="whatsapp_activo"
              checked={form.whatsapp_activo}
              onChange={handleChange}
              className="w-4 h-4 accent-amber-500"
            />
            <span className="text-sm text-zinc-300">Mostrar botón de WhatsApp</span>
          </label>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Número (con código país)</label>
            <input
              name="whatsapp_numero"
              value={form.whatsapp_numero}
              onChange={handleChange}
              className={inputCls}
              placeholder="573001234567"
            />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300">Banners laterales</h2>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Banner izquierda (URL)</label>
            <input name="banner_izquierda" value={form.banner_izquierda} onChange={handleChange} className={inputCls} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Banner derecha (URL)</label>
            <input name="banner_derecha" value={form.banner_derecha} onChange={handleChange} className={inputCls} placeholder="https://..." />
          </div>
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg"
        >
          {guardando ? "Guardando..." : "Guardar configuración"}
        </button>
      </form>
    </div>
  );
}
