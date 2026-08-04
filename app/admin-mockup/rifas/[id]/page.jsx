"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/components/admin/Toast";
import { getRifa, updateRifa } from "@/lib/mock-admin/store";

const BASE = "/admin-mockup";

export default function MockEditarRifaPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [form, setForm] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const rifa = getRifa(id);
    if (!rifa) {
      router.replace(`${BASE}/rifas`);
      return;
    }
    setForm({
      nombre: rifa.nombre,
      precio_boleto: String(rifa.precio_boleto),
      total_numeros: String(rifa.total_numeros),
      descripcion: rifa.descripcion || "",
      estado: rifa.estado,
    });
  }, [id, router]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    updateRifa(id, {
      nombre: form.nombre.trim(),
      precio_boleto: Number(form.precio_boleto),
      total_numeros: Number(form.total_numeros),
      descripcion: form.descripcion,
      estado: form.estado,
    });
    addToast("Rifa actualizada", "success");
    router.push(`${BASE}/rifas`);
  }

  const inputCls =
    "w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50";

  if (!form) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-white mb-6">Editar rifa</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Nombre</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} required className={inputCls} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Precio boleto</label>
            <input name="precio_boleto" type="number" value={form.precio_boleto} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Total números</label>
            <input name="total_numeros" type="number" value={form.total_numeros} onChange={handleChange} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Estado</label>
          <select name="estado" value={form.estado} onChange={handleChange} className={inputCls}>
            <option value="activa">Activa</option>
            <option value="finalizada">Finalizada</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Descripción</label>
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} className={inputCls} />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={guardando} className="px-6 py-3 bg-amber-500 text-zinc-950 font-semibold rounded-lg">
            Guardar cambios
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-3 border border-zinc-600 text-zinc-400 rounded-lg">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
