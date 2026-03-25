"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { esUrlVideo } from "@/lib/esUrlVideo";
import { getAdminAuthHeaders } from "@/lib/auth";

const ACCEPT_IMAGEN_Y_VIDEO =
  "image/*,video/*,video/quicktime,.mov,.MOV,.mp4,.webm,.m4v";

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
    video_url: "",
    imagenes_url: [],
    premios_anticipados: [],
  });
  const [subiendoImagenAdicional, setSubiendoImagenAdicional] = useState(false);
  const [subiendoImagenPremio, setSubiendoImagenPremio] = useState(null);
  const [nuevoPremioMonto, setNuevoPremioMonto] = useState("");
  const [nuevoPremioDesc, setNuevoPremioDesc] = useState("");

  useEffect(() => {
    if (rifaId) {
      fetch(`/api/rifas/${rifaId}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          setForm({
            nombre: data.nombre || "",
            descripcion: data.descripcion || "",
            precio_boleto: data.precio_boleto ?? "",
            total_numeros: data.total_numeros ?? 10000,
            porcentaje_sorteo: data.porcentaje_sorteo ?? 80,
            imagen_url: data.imagen_url || "",
            video_url: data.video_url || "",
            imagenes_url: data.imagenes_url || [],
            premios_anticipados: (data.premios_anticipados || []).map((p) =>
              typeof p === "string"
                ? { monto: p, desc: "", imagen_url: "" }
                : { monto: p.monto ?? "", desc: p.desc ?? "", imagen_url: p.imagen_url ?? "" }
            ),
          });
        })
        .catch(() => setError("Error al cargar rifa"))
        .finally(() => setLoadingData(false));
    }
  }, [rifaId]);

  const subirImagenAdicional = async (file) => {
    if (!file) return;
    setSubiendoImagenAdicional(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const auth = await getAdminAuthHeaders();
      const res = await fetch("/api/upload/rifa", {
        method: "POST",
        headers: { ...auth },
        body: formData,
      });
      const { url } = await res.json();
      if (url) {
        setForm((prev) => ({
          ...prev,
          imagenes_url: [...(prev.imagenes_url || []), url],
        }));
      }
    } catch (err) {
      console.error("Error subiendo imagen:", err.message);
    } finally {
      setSubiendoImagenAdicional(false);
    }
  };

  const eliminarImagenAdicional = (index) => {
    setForm((prev) => ({
      ...prev,
      imagenes_url: prev.imagenes_url.filter((_, i) => i !== index),
    }));
  };

  const subirImagenPremio = async (file, index) => {
    if (!file) return;
    setSubiendoImagenPremio(index);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const auth = await getAdminAuthHeaders();
      const res = await fetch("/api/upload/rifa", {
        method: "POST",
        headers: { ...auth },
        body: formData,
      });
      const { url } = await res.json();
      if (url) {
        const nuevos = [...form.premios_anticipados];
        nuevos[index] = { ...nuevos[index], imagen_url: url };
        setForm((prev) => ({ ...prev, premios_anticipados: nuevos }));
      }
    } catch (err) {
      console.error("Error subiendo imagen premio:", err.message);
    } finally {
      setSubiendoImagenPremio(null);
    }
  };

  const agregarPremio = () => {
    if (!nuevoPremioMonto.trim()) return;
    setForm((prev) => ({
      ...prev,
      premios_anticipados: [
        ...prev.premios_anticipados,
        {
          monto: nuevoPremioMonto.trim(),
          desc: nuevoPremioDesc.trim(),
          imagen_url: "",
        },
      ],
    }));
    setNuevoPremioMonto("");
    setNuevoPremioDesc("");
  };

  const eliminarPremio = (index) => {
    setForm((prev) => ({
      ...prev,
      premios_anticipados: prev.premios_anticipados.filter((_, i) => i !== index),
    }));
  };

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const auth = await getAdminAuthHeaders();
      const res = await fetch("/api/upload/rifa", {
        method: "POST",
        headers: { ...auth },
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
      video_url: form.video_url || "",
      imagenes_url: form.imagenes_url || [],
      premios_anticipados: form.premios_anticipados || [],
    };

    if (!payload.nombre || !payload.precio_boleto) {
      setError("Nombre y precio son requeridos");
      setLoading(false);
      return;
    }

    try {
      const url = rifaId ? `/api/rifas/${rifaId}` : "/api/rifas";
      const method = rifaId ? "PATCH" : "POST";
      const auth = await getAdminAuthHeaders();
      const res = await fetch(url, {
        method,
        cache: "no-store",
        headers: { "Content-Type": "application/json", ...auth },
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
              Imagen o video principal
            </label>
            <input
              type="file"
              accept={ACCEPT_IMAGEN_Y_VIDEO}
              onChange={handleImageChange}
              className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-zinc-900 file:bg-amber-500 file:cursor-pointer hover:file:bg-amber-400"
            />
            {form.imagen_url && (
              <div className="mt-2">
                {esUrlVideo(form.imagen_url) ? (
                  <video
                    src={form.imagen_url}
                    controls
                    playsInline
                    className="h-24 w-auto max-w-full object-cover rounded-lg border border-zinc-700 bg-black"
                  />
                ) : (
                  <img
                    src={form.imagen_url}
                    alt="Preview"
                    className="h-24 object-cover rounded-lg border border-zinc-700"
                  />
                )}
              </div>
            )}
          </div>

          <div style={{ marginTop: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "10px",
              }}
            >
              <span style={{ fontSize: "18px" }}>🎬</span>
              <div>
                <p
                  style={{
                    color: "#F8FAFC",
                    fontWeight: "700",
                    fontSize: "14px",
                    margin: 0,
                  }}
                >
                  Video del premio
                </p>
                <p
                  style={{
                    color: "rgba(248,250,252,0.4)",
                    fontSize: "11px",
                    margin: 0,
                  }}
                >
                  Pega el link de YouTube (No listado). Se reproducirá
                  automáticamente en la landing.
                </p>
              </div>
            </div>
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={form.video_url}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, video_url: e.target.value }))
              }
              style={{
                width: "100%",
                backgroundColor: "#1a1a1a",
                border: "1.5px solid rgba(242,178,51,0.25)",
                borderRadius: "10px",
                color: "#F8FAFC",
                fontSize: "14px",
                padding: "10px 14px",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "Poppins, sans-serif",
              }}
            />
          </div>

          <div style={{ marginTop: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "10px",
              }}
            >
              <span style={{ fontSize: "18px" }}>🖼️</span>
              <div>
                <p
                  style={{
                    color: "#F8FAFC",
                    fontWeight: "700",
                    fontSize: "14px",
                    margin: 0,
                  }}
                >
                  Imágenes o videos adicionales
                </p>
                <p
                  style={{
                    color: "rgba(248,250,252,0.4)",
                    fontSize: "11px",
                    margin: 0,
                  }}
                >
                  Carrusel junto al medio principal (incluye MOV, MP4, WEBM…)
                </p>
              </div>
            </div>

            {form.imagenes_url?.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                {form.imagenes_url.map((url, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    {esUrlVideo(url) ? (
                      <video
                        src={url}
                        muted
                        playsInline
                        loop
                        autoPlay
                        style={{
                          width: "72px",
                          height: "72px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "2px solid rgba(242,178,51,0.4)",
                          backgroundColor: "#0a0a0a",
                        }}
                      />
                    ) : (
                      <img
                        src={url}
                        alt={`Imagen ${i + 1}`}
                        style={{
                          width: "72px",
                          height: "72px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "2px solid rgba(242,178,51,0.4)",
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => eliminarImagenAdicional(i)}
                      style={{
                        position: "absolute",
                        top: "-6px",
                        right: "-6px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        cursor: "pointer",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "rgba(242,178,51,0.08)",
                border: "1.5px dashed rgba(242,178,51,0.4)",
                borderRadius: "12px",
                padding: "12px 16px",
                cursor: "pointer",
                marginTop: "8px",
              }}
            >
              <span style={{ fontSize: "24px" }}>📷</span>
              <div>
                <p
                  style={{
                    color: "#F2B233",
                    fontWeight: "600",
                    fontSize: "14px",
                    margin: "0 0 2px",
                  }}
                >
                  {subiendoImagenAdicional
                    ? "Subiendo..."
                    : "+ Agregar imagen o video"}
                </p>
                <p
                  style={{
                    color: "rgba(248,250,252,0.4)",
                    fontSize: "11px",
                    margin: 0,
                  }}
                >
                  Imagen (JPG, PNG, WEBP) o video (MOV, MP4…)
                </p>
              </div>
              <input
                type="file"
                accept={ACCEPT_IMAGEN_Y_VIDEO}
                disabled={subiendoImagenAdicional}
                onChange={(e) => subirImagenAdicional(e.target.files?.[0])}
                style={{ display: "none" }}
              />
            </label>
          </div>

          <div style={{ marginTop: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "10px",
              }}
            >
              <span style={{ fontSize: "18px" }}>🏆</span>
              <div>
                <p
                  style={{
                    color: "#F8FAFC",
                    fontWeight: "700",
                    fontSize: "14px",
                    margin: 0,
                  }}
                >
                  Premios anticipados
                </p>
                <p
                  style={{
                    color: "rgba(248,250,252,0.4)",
                    fontSize: "11px",
                    margin: 0,
                  }}
                >
                  Agrega premios con imagen opcional para cada lugar
                </p>
              </div>
            </div>

            {form.premios_anticipados.map((premio, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  backgroundColor: "rgba(242,178,51,0.05)",
                  border: "1px solid rgba(242,178,51,0.2)",
                  borderRadius: "10px",
                  padding: "10px",
                  marginBottom: "8px",
                }}
              >
                {premio.imagen_url ? (
                  esUrlVideo(premio.imagen_url) ? (
                    <video
                      src={premio.imagen_url}
                      muted
                      playsInline
                      loop
                      autoPlay
                      style={{
                        width: "52px",
                        height: "52px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid rgba(242,178,51,0.3)",
                        flexShrink: 0,
                        backgroundColor: "#0a0a0a",
                      }}
                    />
                  ) : (
                    <img
                      src={premio.imagen_url}
                      alt={premio.monto}
                      style={{
                        width: "52px",
                        height: "52px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid rgba(242,178,51,0.3)",
                        flexShrink: 0,
                      }}
                    />
                  )
                ) : (
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      backgroundColor: "rgba(242,178,51,0.08)",
                      border: "1px dashed rgba(242,178,51,0.3)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "20px",
                    }}
                  >
                    🏆
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      color: "#F8FAFC",
                      fontWeight: "600",
                      fontSize: "14px",
                      margin: "0 0 2px",
                    }}
                  >
                    {premio.monto}
                  </p>
                  {premio.desc && (
                    <p
                      style={{
                        color: "rgba(248,250,252,0.5)",
                        fontSize: "12px",
                        margin: "0 0 6px",
                      }}
                    >
                      {premio.desc}
                    </p>
                  )}
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor: "rgba(242,178,51,0.08)",
                      border: "1px solid rgba(242,178,51,0.3)",
                      borderRadius: "8px",
                      padding: "4px 10px",
                      cursor: "pointer",
                      marginTop: "4px",
                    }}
                  >
                    <span style={{ fontSize: "12px" }}>📷</span>
                    <span
                      style={{
                        color: "#F2B233",
                        fontSize: "11px",
                        fontWeight: "600",
                      }}
                    >
                      {subiendoImagenPremio === i
                        ? "Subiendo..."
                        : premio.imagen_url
                          ? "Cambiar archivo"
                          : "Agregar imagen o video"}
                    </span>
                    <input
                      type="file"
                      accept={ACCEPT_IMAGEN_Y_VIDEO}
                      disabled={subiendoImagenPremio === i}
                      onChange={(e) =>
                        subirImagenPremio(e.target.files?.[0], i)
                      }
                      style={{ display: "none" }}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => eliminarPremio(i)}
                  style={{
                    backgroundColor: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "6px",
                    color: "#f87171",
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontSize: "12px",
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(242,178,51,0.15)",
                borderRadius: "12px",
                padding: "14px",
                marginTop: "8px",
              }}
            >
              <p
                style={{
                  color: "#F2B233",
                  fontSize: "13px",
                  fontWeight: "700",
                  margin: "0 0 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                🏆 Agregar nuevo premio
              </p>

              <input
                type="text"
                placeholder="Ej: 1er lugar: iPhone 17 Pro"
                value={nuevoPremioMonto}
                onChange={(e) => setNuevoPremioMonto(e.target.value)}
                style={{
                  width: "100%",
                  backgroundColor: "#1a1a1a",
                  border: "1.5px solid rgba(242,178,51,0.25)",
                  borderRadius: "10px",
                  color: "#F8FAFC",
                  fontSize: "14px",
                  padding: "10px 14px",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: "8px",
                  fontFamily: "Poppins, sans-serif",
                }}
              />

              <input
                type="text"
                placeholder="Descripción opcional (ej: Incluye accesorios)"
                value={nuevoPremioDesc}
                onChange={(e) => setNuevoPremioDesc(e.target.value)}
                style={{
                  width: "100%",
                  backgroundColor: "#1a1a1a",
                  border: "1.5px solid rgba(242,178,51,0.25)",
                  borderRadius: "10px",
                  color: "#F8FAFC",
                  fontSize: "14px",
                  padding: "10px 14px",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: "10px",
                  fontFamily: "Poppins, sans-serif",
                }}
              />

              <button
                type="button"
                onClick={agregarPremio}
                style={{
                  width: "100%",
                  backgroundColor: "#F2B233",
                  color: "#071521",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: "14px",
                  fontFamily: "Poppins, sans-serif",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                + Agregar premio
              </button>
            </div>
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
