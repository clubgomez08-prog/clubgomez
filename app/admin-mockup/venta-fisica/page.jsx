"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/Toast";
import { getRifas, crearVentaFisica } from "@/lib/mock-admin/store";

export default function MockVentaFisicaPage() {
  const { addToast } = useToast();
  const [rifas, setRifas] = useState([]);
  const [form, setForm] = useState({
    rifa_id: "",
    nombre: "",
    telefono: "",
    email: "",
    cantidad_boletos: "1",
  });
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    const list = getRifas().filter((r) => r.estado === "activa");
    setRifas(list);
    if (list.length > 0) setForm((f) => ({ ...f, rifa_id: list[0].id }));
  }, []);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function generarBoletos(cantidad, rifa) {
    const max = rifa?.total_numeros || 10000;
    const nums = new Set();
    while (nums.size < cantidad) {
      nums.add(Math.floor(Math.random() * max) + 1);
    }
    return [...nums];
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre || !form.telefono || !form.rifa_id) {
      addToast("Completa los campos obligatorios", "error");
      return;
    }
    setGenerando(true);
    const rifa = rifas.find((r) => r.id === form.rifa_id);
    const cantidad = Number(form.cantidad_boletos) || 1;
    const boletos = generarBoletos(cantidad, rifa);
    crearVentaFisica({ ...form, cantidad_boletos: cantidad, boletos });
    addToast(`Venta registrada — ${cantidad} boleto(s)`, "success");
    setForm((f) => ({ ...f, nombre: "", telefono: "", email: "", cantidad_boletos: "1" }));
    setGenerando(false);
  }

  const rifaSel = rifas.find((r) => r.id === form.rifa_id);
  const total =
    rifaSel && form.cantidad_boletos
      ? Number(form.cantidad_boletos) * rifaSel.precio_boleto
      : 0;

  const inputCls =
    "w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50";

  return (
    <div className="py-6 max-w-xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Venta física</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Registro presencial con generación automática de números (demo)
      </p>

      {rifas.length === 0 ? (
        <p className="text-zinc-500">No hay rifas activas disponibles.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-300 mb-2">Rifa *</label>
            <select name="rifa_id" value={form.rifa_id} onChange={handleChange} className={inputCls}>
              {rifas.map((r) => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-2">Nombre comprador *</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} required className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-2">Teléfono *</label>
            <input name="telefono" value={form.telefono} onChange={handleChange} required className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-2">Email (opcional)</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-2">Cantidad de boletos</label>
            <input name="cantidad_boletos" type="number" min="1" value={form.cantidad_boletos} onChange={handleChange} className={inputCls} />
          </div>

          {total > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-sm text-zinc-400">Total a cobrar</p>
              <p className="text-2xl font-bold text-amber-400">
                $ {total.toLocaleString("es-CO")}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={generando}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl"
          >
            {generando ? "Registrando..." : "Registrar venta física"}
          </button>
        </form>
      )}
    </div>
  );
}
