"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/Toast";
import { getRifas, crearVentaFisica } from "@/lib/mock-admin/store";

const LIME = "#B8E351";

export default function MockVentaFisicaPage() {
  const { addToast } = useToast();
  const [planes, setPlanes] = useState([]);
  const [form, setForm] = useState({
    rifa_id: "",
    nombre: "",
    telefono: "",
    email: "",
  });
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    const list = getRifas().filter((r) => r.estado === "activa");
    setPlanes(list);
    if (list.length > 0) setForm((f) => ({ ...f, rifa_id: list[0].id }));
  }, []);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function generarClaves(cantidad) {
    const nums = new Set();
    while (nums.size < cantidad) {
      nums.add(String(Math.floor(Math.random() * 9000) + 1000));
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
    const plan = planes.find((r) => r.id === form.rifa_id);
    const cantidad = plan?.claves || plan?.total_numeros || 3;
    const boletos = generarClaves(cantidad);
    crearVentaFisica({ ...form, cantidad_boletos: cantidad, boletos });
    addToast(`Membresía registrada — ${cantidad} claves`, "success");
    setForm((f) => ({ ...f, nombre: "", telefono: "", email: "" }));
    setGenerando(false);
  }

  const planSel = planes.find((r) => r.id === form.rifa_id);
  const claves = planSel?.claves || planSel?.total_numeros || 0;
  const total = planSel ? planSel.precio_boleto : 0;

  const inputCls =
    "w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#B8E351]/40";

  return (
    <div className="py-6 max-w-xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Alta presencial</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Activa una membresía en persona y genera las claves del plan (demo)
      </p>

      {planes.length === 0 ? (
        <p className="text-zinc-500">No hay planes activos disponibles.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-300 mb-2">Plan *</label>
            <select name="rifa_id" value={form.rifa_id} onChange={handleChange} className={inputCls}>
              {planes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre} — {r.claves || r.total_numeros} claves
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-2">Nombre del miembro *</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} required className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-2">Teléfono / WhatsApp *</label>
            <input name="telefono" value={form.telefono} onChange={handleChange} required className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-2">Email (opcional)</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className={inputCls} />
          </div>

          {total > 0 && (
            <div
              className="rounded-xl p-4"
              style={{
                background: "rgba(184,227,81,0.1)",
                border: "1px solid rgba(184,227,81,0.3)",
              }}
            >
              <p className="text-sm text-zinc-400">Total a cobrar</p>
              <p className="text-2xl font-bold" style={{ color: LIME }}>
                $ {total.toLocaleString("es-CO")}
              </p>
              <p className="text-xs text-zinc-500 mt-1">{claves} claves del plan</p>
            </div>
          )}

          <button
            type="submit"
            disabled={generando}
            className="w-full py-3.5 font-bold rounded-xl"
            style={{ background: LIME, color: "#050607" }}
          >
            {generando ? "Registrando..." : "Activar membresía"}
          </button>
        </form>
      )}
    </div>
  );
}
