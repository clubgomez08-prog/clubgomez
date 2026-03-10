"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function RifasPage() {
  const [rifas, setRifas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [emailPrueba, setEmailPrueba] = useState("");
  const [enviandoPrueba, setEnviandoPrueba] = useState(false);
  const [mensajePrueba, setMensajePrueba] = useState("");
  const [mostrarFormPrueba, setMostrarFormPrueba] = useState(false);
  const [rifaPrueba, setRifaPrueba] = useState(null);

  function loadRifas() {
    setLoading(true);
    fetch("/api/rifas")
      .then((res) => res.json())
      .then((data) => {
        setRifas(Array.isArray(data) ? data : []);
      })
      .catch(() => setRifas([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRifas();
  }, []);

  async function handleDelete(rifa) {
    if (!confirm("¿Estás seguro de eliminar esta rifa?")) return;

    setDeleting(rifa.id);
    try {
      const res = await fetch(`/api/rifas/${rifa.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar");
      }
      loadRifas();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  }

  function formatPrecio(n) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(n);
  }

  function pctVendido(rifa) {
    const vendidos = rifa.boletos_vendidos ?? 0;
    const total = rifa.total_numeros ?? 10000;
    if (total === 0) return 0;
    return ((vendidos / total) * 100).toFixed(1);
  }

  const enviarEmailPrueba = async () => {
    if (!emailPrueba || !emailPrueba.includes("@")) {
      setMensajePrueba("Ingresa un email válido");
      return;
    }
    setEnviandoPrueba(true);
    setMensajePrueba("");
    try {
      const res = await fetch("/api/admin/email-prueba", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailDestino: emailPrueba,
          nombreRifa: rifaPrueba?.nombre,
          precioRifa: rifaPrueba?.precio_boleto,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMensajePrueba("✅ Email enviado correctamente");
        setEmailPrueba("");
      } else {
        setMensajePrueba("❌ " + (data.error || "Error al enviar"));
      }
    } catch {
      setMensajePrueba("❌ Error de conexión");
    } finally {
      setEnviandoPrueba(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-white">Lista de rifas</h1>
        <Link
          href="/admin/rifas/nueva"
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-medium rounded-lg"
        >
          Nueva Rifa
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rifas.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-zinc-400 mb-4">No hay rifas creadas aún</p>
          <Link
            href="/admin/rifas/nueva"
            className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-medium rounded-lg"
          >
            Crear primera rifa
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rifas.map((rifa) => (
            <div
              key={rifa.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex gap-4 items-start">
                {rifa.imagen_url && (
                  <img
                    src={rifa.imagen_url}
                    alt=""
                    className="w-16 h-16 object-cover rounded-lg border border-zinc-700"
                  />
                )}
                <div>
                  <h2 className="text-lg font-medium text-white">{rifa.nombre}</h2>
                  <p className="text-amber-400 font-medium">
                    {formatPrecio(rifa.precio_boleto)} / boleto
                  </p>
                  <div className="flex gap-3 mt-2 text-sm text-zinc-400">
                    <span
                      className={`px-2 py-0.5 rounded ${
                        rifa.estado === "activa"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-zinc-700 text-zinc-500"
                      }`}
                    >
                      {rifa.estado || "activa"}
                    </span>
                    <span>{pctVendido(rifa)}% vendido</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link
                  href={`/admin/rifas/${rifa.id}`}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg"
                >
                  Editar
                </Link>
                <a
                  href={`/?rifa=${rifa.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm rounded-lg"
                >
                  Ver página
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(rifa)}
                  disabled={deleting === rifa.id}
                  className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting === rifa.id ? "..." : "Eliminar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRifaPrueba(rifa);
                    setMostrarFormPrueba(true);
                    setMensajePrueba("");
                  }}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid rgba(242,178,51,0.4)",
                    borderRadius: "8px",
                    color: "#F2B233",
                    fontSize: "13px",
                    padding: "6px 14px",
                    cursor: "pointer",
                    fontFamily: "Poppins, sans-serif",
                    marginTop: "8px",
                  }}
                >
                  📧 Enviar email de prueba
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mostrarFormPrueba && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#0B1F33",
              border: "1.5px solid rgba(242,178,51,0.4)",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "400px",
            }}
          >
            <h3
              style={{
                color: "#F2B233",
                margin: "0 0 4px",
                fontSize: "18px",
              }}
            >
              📧 Email de prueba
            </h3>
            <p
              style={{
                color: "rgba(248,250,252,0.6)",
                fontSize: "13px",
                margin: "0 0 4px",
              }}
            >
              Recibirás el mismo email que el ganador real.
            </p>
            <p
              style={{
                color: "#F8FAFC",
                fontSize: "13px",
                fontWeight: "600",
                margin: "0 0 16px",
              }}
            >
              Sorteo: {rifaPrueba?.nombre}
            </p>

            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={emailPrueba}
              onChange={(e) => setEmailPrueba(e.target.value)}
              style={{
                width: "100%",
                backgroundColor: "#071521",
                border: "1.5px solid rgba(242,178,51,0.3)",
                borderRadius: "10px",
                color: "#F8FAFC",
                fontSize: "15px",
                padding: "12px 14px",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: "12px",
                fontFamily: "Poppins, sans-serif",
              }}
            />

            {mensajePrueba && (
              <p
                style={{
                  color: mensajePrueba.includes("✅") ? "#22C55E" : "#f87171",
                  fontSize: "13px",
                  margin: "0 0 12px",
                  textAlign: "center",
                }}
              >
                {mensajePrueba}
              </p>
            )}

            <button
              type="button"
              onClick={enviarEmailPrueba}
              disabled={enviandoPrueba}
              style={{
                width: "100%",
                backgroundColor: enviandoPrueba
                  ? "rgba(242,178,51,0.4)"
                  : "#F2B233",
                color: "#071521",
                fontWeight: "700",
                fontSize: "15px",
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                cursor: enviandoPrueba ? "not-allowed" : "pointer",
                marginBottom: "8px",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              {enviandoPrueba ? "Enviando..." : "Enviar email de prueba"}
            </button>

            <button
              type="button"
              onClick={() => {
                setMostrarFormPrueba(false);
                setMensajePrueba("");
                setEmailPrueba("");
              }}
              style={{
                width: "100%",
                backgroundColor: "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "10px",
                color: "rgba(248,250,252,0.5)",
                fontSize: "14px",
                padding: "10px",
                cursor: "pointer",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
