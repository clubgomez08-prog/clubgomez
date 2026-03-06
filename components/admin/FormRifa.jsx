"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function FormRifa({ rifaId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!rifaId);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    precio_boleto: "",
    total_numeros: 10000,
    porcentaje_sorteo: 80,
    imagen_url: "",
    premios_anticipados: [],
  });
  const [premioInput, setPremioInput] = useState("");

  useEffect(() => {
    if (rifaId) {
      fetch(`/api/rifas/${rifaId}`)
        .then((res) => res.json())
        .then((data) => {
          setForm({
            nombre: data.nombre || "",
            descripcion: data.descripcion || "",
            precio_boleto: data.precio_boleto ?? "",
            total_numeros: data.total_numeros ?? 10000,
            porcentaje_sorteo: data.porcentaje_sorteo ?? 80,
            imagen_url: data.imagen_url || "",
            premios_anticipados: Array.isArray(data.premios_anticipados)
              ? data.premios_anticipados
              : [],
          });
        })
        .catch(() => setError("Error al cargar rifa"))
        .finally(() => setLoadingData(false));
    }
  }, [rifaId]);

  function addPremio() {
    const texto = premioInput.trim();
    if (texto) {
      setForm((f) => ({
        ...f,
        premios_anticipados: [...f.premios_anticipados, texto],
      }));
      setPremioInput("");
    }
  }

  function removePremio(index) {
    setForm((f) => ({
      ...f,
      premios_anticipados: f.premios_anticipados.filter((_, i) => i !== index),
    }));
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/rifa", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir");
      setForm((f) => ({ ...f, imagen_url: data.url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      precio_boleto: Number(form.precio_boleto),
      total_numeros: Number(form.total_numeros) || 10000,
      porcentaje_sorteo: Number(form.porcentaje_sorteo) || 80,
      imagen_url: form.imagen_url || null,
      premios_anticipados: form.premios_anticipados,
    };

    if (!payload.nombre || !payload.precio_boleto) {
      setError("Nombre y precio son requeridos");
      setLoading(false);
      return;
    }

    try {
      const url = rifaId ? `/api/rifas/${rifaId}` : "/api/rifas";
      const method = rifaId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      router.push("/admin/rifas");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/rifas"
          className="text-zinc-400 hover:text-white text-sm"
        >
          ← Volver
        </Link>
        <h1 className="text-2xl font-semibold text-white">
          {rifaId ? "Editar rifa" : "Crear nueva rifa"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Nombre de la rifa *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) =>
                setForm((f) => ({ ...f, nombre: e.target.value }))
              }
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              placeholder="Ej: Rifa navideña 2025"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Descripción
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) =>
                setForm((f) => ({ ...f, descripcion: e.target.value }))
              }
              rows={3}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-none"
              placeholder="Describe el premio o propósito de la rifa"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Precio por boleto (COP) *
              </label>
              <input
                type="number"
                min={1}
                value={form.precio_boleto}
                onChange={(e) =>
                  setForm((f) => ({ ...f, precio_boleto: e.target.value }))
                }
                required
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                placeholder="10000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Total de números
              </label>
              <input
                type="number"
                min={1}
                value={form.total_numeros}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    total_numeros: Number(e.target.value) || 10000,
                  }))
                }
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Porcentaje para activar sorteo (%)
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={form.porcentaje_sorteo}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  porcentaje_sorteo: Number(e.target.value) || 80,
                }))
              }
              className="w-full max-w-[120px] px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Imagen del premio
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-zinc-900 file:bg-amber-500 file:cursor-pointer hover:file:bg-amber-400"
            />
            {form.imagen_url && (
              <div className="mt-2">
                <img
                  src={form.imagen_url}
                  alt="Preview"
                  className="h-24 object-cover rounded-lg border border-zinc-700"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Premios anticipados
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={premioInput}
                onChange={(e) => setPremioInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addPremio())
                }
                placeholder="Ej: 1er lugar: iPhone"
                className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
              <button
                type="button"
                onClick={addPremio}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-medium rounded-lg"
              >
                Agregar
              </button>
            </div>
            {form.premios_anticipados.length > 0 && (
              <ul className="space-y-2">
                {form.premios_anticipados.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between py-2 px-3 bg-zinc-800 rounded-lg text-zinc-300"
                  >
                    <span>{p}</span>
                    <button
                      type="button"
                      onClick={() => removePremio(i)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? rifaId
              ? "Guardando..."
              : "Publicando..."
            : rifaId
              ? "Guardar cambios"
              : "Publicar Rifa"}
        </button>
      </form>
    </div>
  );
}
