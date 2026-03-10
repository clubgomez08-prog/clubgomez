"use client";

import { useState } from "react";

export default function FormRegistro({ rifa, cantidadBoletos, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    ciudad: "",
    cedula: "",
  });

  if (!rifa || !cantidadBoletos) return null;

  const precioUnit = rifa.precio_boleto ?? 0;
  const total = cantidadBoletos * precioUnit;

  function formatPrecio(n) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/participantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          telefono: form.telefono.trim(),
          ciudad: form.ciudad.trim(),
          cedula: form.cedula.trim(),
          rifa_id: rifa.id,
          cantidad_boletos: cantidadBoletos,
          total_pagado: cantidadBoletos * (rifa.precio_boleto ?? 0),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrar");

      if (data.init_point) {
        window.location.href = data.init_point;
        return;
      }

      onSuccess?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-4 py-3 bg-white border border-[#334155]/30 rounded-lg text-[#071521] placeholder-[#334155]/60 focus:outline-none focus:ring-2 focus:ring-[#F2B233]/50 focus:border-[#F2B233]";

  return (
    <section className="py-10 px-4 bg-[#F1F5F9]" id="formulario">
      <div className="max-w-lg mx-auto">
        <h2 className="font-display text-3xl md:text-4xl text-[#071521] text-center mb-10">
          Completa tu registro
        </h2>

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-lg border border-[#F2B233]/40 rounded-xl p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-2">
              Nombre completo *
            </label>
            <input
              type="text"
              required
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className={inputClass}
              placeholder="Tu nombre completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#334155] mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={inputClass}
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#334155] mb-2">
              Teléfono *
            </label>
            <input
              type="tel"
              required
              value={form.telefono}
              onChange={(e) =>
                setForm((f) => ({ ...f, telefono: e.target.value }))
              }
              className={inputClass}
              placeholder="300 123 4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#334155] mb-2">
              Ciudad *
            </label>
            <input
              type="text"
              required
              value={form.ciudad}
              onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))}
              className={inputClass}
              placeholder="Tu ciudad"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#334155] mb-2">
              Cédula *
            </label>
            <input
              type="text"
              required
              value={form.cedula}
              onChange={(e) => setForm((f) => ({ ...f, cedula: e.target.value }))}
              className={inputClass}
              placeholder="Número de documento"
            />
          </div>

          <div className="p-4 bg-[#F1F5F9] rounded-lg border border-[#334155]/20">
            <p className="text-[#334155] text-sm">Resumen del pedido</p>
            <p className="text-[#071521] font-medium mt-1">
              {cantidadBoletos} boletos × {formatPrecio(precioUnit)} ={" "}
              <span className="text-[#22C55E]">{formatPrecio(total)}</span>
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-lg font-semibold text-black bg-[#22C55E] hover:bg-[#4ADE80] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Procesando..." : "Confirmar y pagar"}
          </button>
        </form>
      </div>
    </section>
  );
}
