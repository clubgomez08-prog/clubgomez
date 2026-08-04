"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toast";
import { createRifa } from "@/lib/mock-admin/store";

const BASE = "/admin-mockup";

export default function MockNuevaRifaPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    nombre: "",
    precio_boleto: "",
    total_numeros: "10000",
    descripcion: "",
  });
  const [guardando, setGuardando] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      addToast("El nombre es obligatorio", "error");
      return;
    }
    setGuardando(true);
    createRifa({
      nombre: form.nombre.trim(),
      precio_boleto: Number(form.precio_boleto) || 0,
      total_numeros: Number(form.total_numeros) || 10000,
      descripcion: form.descripcion,
    });
    addToast("Rifa creada correctamente", "success");
    router.push(`${BASE}/rifas`);
  }

  const inputCls =
    "w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50";

  return (
    <div className="py-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Nueva rifa</h1>
      <p className="text-sm text-zinc-500 mb-6">Formulario simplificado para el mockup</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Nombre *</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} required className={inputCls} placeholder="Ej: Carro 0 km 2025" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Precio boleto (COP)</label>
            <input name="precio_boleto" type="number" value={form.precio_boleto} onChange={handleChange} className={inputCls} placeholder="15000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Total números</label>
            <input name="total_numeros" type="number" value={form.total_numeros} onChange={handleChange} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Descripción</label>
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} className={inputCls} placeholder="Detalles del premio..." />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={guardando}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Crear rifa"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-zinc-600 text-zinc-400 rounded-lg hover:bg-zinc-800"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
