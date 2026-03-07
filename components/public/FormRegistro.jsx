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
    "w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500";

  return (
    <section className="py-16 px-4 bg-zinc-950" id="formulario">
      <div className="max-w-lg mx-auto">
        <h2 className="font-display text-3xl md:text-4xl text-white text-center mb-10">
          COMPLETA TU REGISTRO
        </h2>

        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
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
            <label className="block text-sm font-medium text-zinc-400 mb-2">
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
            <label className="block text-sm font-medium text-zinc-400 mb-2">
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
            <label className="block text-sm font-medium text-zinc-400 mb-2">
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
            <label className="block text-sm font-medium text-zinc-400 mb-2">
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

          <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
            <p className="text-zinc-400 text-sm">Resumen del pedido</p>
            <p className="text-white font-medium mt-1">
              {cantidadBoletos} boletos × {formatPrecio(precioUnit)} ={" "}
              <span className="text-amber-500">{formatPrecio(total)}</span>
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
            className="w-full py-4 text-lg font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Procesando..." : "CONFIRMAR Y PAGAR"}
          </button>
        </form>
      </div>
    </section>
  );
}
