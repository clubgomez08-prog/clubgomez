"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ModalConfirm from "@/components/admin/ModalConfirm";
import { useToast } from "@/components/admin/Toast";

export default function RifasPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [rifas, setRifas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [emailPrueba, setEmailPrueba] = useState("");
  const [enviandoPrueba, setEnviandoPrueba] = useState(false);
  const [mensajePrueba, setMensajePrueba] = useState("");
  const [mostrarFormPrueba, setMostrarFormPrueba] = useState(false);
  const [rifaPrueba, setRifaPrueba] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalToggle, setModalToggle] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(null);

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
    if (!rifa) return;
    setDeleting(rifa.id);
    try {
      const res = await fetch(`/api/rifas/${rifa.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar");
      }
      addToast("Rifa eliminada correctamente", "success");
      loadRifas();
    } catch (err) {
      addToast(err.message || "Error al eliminar", "error");
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

  const toggleEstadoRifa = async (rifa) => {
    if (!rifa) return;
    const nuevoEstado = rifa.estado === "activa" ? "finalizada" : "activa";
    try {
      const res = await fetch(`/api/rifas/${rifa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (res.ok) {
        addToast(`Rifa ${nuevoEstado} correctamente`, "success");
        loadRifas();
      } else {
        const data = await res.json();
        addToast(data.error || "Error al cambiar estado", "error");
      }
    } catch (err) {
      addToast(err?.message || "Error al cambiar estado", "error");
    }
  };

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
      <style>{`
        @media (max-width: 767px) {
          .admin-botones-desktop { display: none !important; }
          .admin-botones-movil { display: block !important; }
        }
      `}</style>
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
                  </div>
                  <div style={{ marginTop: "8px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          color: "rgba(248,250,252,0.5)",
                          fontSize: "11px",
                        }}
                      >
                        Vendido
                      </span>
                      <span
                        style={{
                          color: "#F2B233",
                          fontSize: "11px",
                          fontWeight: "700",
                        }}
                      >
                        {pctVendido(rifa)}%
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "6px",
                        backgroundColor: "rgba(255,255,255,0.08)",
                        borderRadius: "999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(parseFloat(pctVendido(rifa)), 100)}%`,
                          height: "100%",
                          background:
                            parseFloat(pctVendido(rifa)) >= 80
                              ? "linear-gradient(to right, #22C55E, #4ADE80)"
                              : parseFloat(pctVendido(rifa)) >= 50
                                ? "linear-gradient(to right, #F2B233, #FFD166)"
                                : "linear-gradient(to right, #60a5fa, #93c5fd)",
                          borderRadius: "999px",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ position: "relative" }} className="flex-shrink-0">
                <div
                  className="admin-botones-desktop"
                  style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}
                >
                  <Link
                    href={`/admin/rifas/${rifa.id}`}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg"
                    style={{
                      fontSize: "12px",
                      padding: "6px 10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Editar
                  </Link>
                  <a
                    href={`/?rifa=${rifa.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg"
                    style={{
                      fontSize: "12px",
                      padding: "6px 10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Ver página
                  </a>
                  <button
                    type="button"
                    onClick={() => setModalEliminar(rifa)}
                    disabled={deleting === rifa.id}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      fontSize: "12px",
                      padding: "6px 10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {deleting === rifa.id ? "..." : "Eliminar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalToggle(rifa)}
                    style={{
                      backgroundColor:
                        rifa.estado === "activa"
                          ? "rgba(239,68,68,0.15)"
                          : "rgba(34,197,94,0.15)",
                      border:
                        rifa.estado === "activa"
                          ? "1px solid rgba(239,68,68,0.4)"
                          : "1px solid rgba(34,197,94,0.4)",
                      borderRadius: "6px",
                      color: rifa.estado === "activa" ? "#f87171" : "#22C55E",
                      fontSize: "12px",
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontFamily: "Poppins, sans-serif",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {rifa.estado === "activa" ? "⏸ Desactivar" : "▶ Activar"}
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
                      fontSize: "12px",
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontFamily: "Poppins, sans-serif",
                      whiteSpace: "nowrap",
                    }}
                  >
                    📧 Email prueba
                  </button>
                </div>

                <div
                  className="admin-botones-movil"
                  style={{ position: "relative", display: "none" }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setMenuAbierto(menuAbierto === rifa.id ? null : rifa.id)
                    }
                    style={{
                      backgroundColor: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "8px",
                      color: "#F8FAFC",
                      width: "36px",
                      height: "36px",
                      fontSize: "18px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ⋮
                  </button>

                  {menuAbierto === rifa.id && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "40px",
                        backgroundColor: "#1a1a1a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        padding: "6px",
                        zIndex: 50,
                        minWidth: "160px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                      }}
                    >
                      {[
                        {
                          label: "✏️ Editar",
                          action: () => router.push(`/admin/rifas/${rifa.id}`),
                        },
                        {
                          label: "👁 Ver página",
                          action: () => window.open(`/?rifa=${rifa.id}`),
                        },
                        {
                          label:
                            rifa.estado === "activa"
                              ? "⏸ Desactivar"
                              : "▶ Activar",
                          action: () => setModalToggle(rifa),
                        },
                        {
                          label: "📧 Email prueba",
                          action: () => {
                            setRifaPrueba(rifa);
                            setMostrarFormPrueba(true);
                          },
                        },
                        {
                          label: "🗑️ Eliminar",
                          action: () => {
                            setModalEliminar(rifa);
                          },
                          color: "#f87171",
                        },
                      ].map((item, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            item.action();
                            setMenuAbierto(null);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            width: "100%",
                            backgroundColor: "transparent",
                            border: "none",
                            borderRadius: "8px",
                            padding: "10px 12px",
                            color: item.color || "#F8FAFC",
                            fontSize: "13px",
                            cursor: "pointer",
                            fontFamily: "Poppins, sans-serif",
                            textAlign: "left",
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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

      <ModalConfirm
        visible={!!modalEliminar}
        titulo="¿Eliminar rifa?"
        mensaje={`¿Estás seguro de eliminar "${modalEliminar?.nombre}"? Esta acción no se puede deshacer.`}
        labelConfirmar="Sí, eliminar"
        labelCancelar="Cancelar"
        tipo="danger"
        onConfirmar={() => {
          const r = modalEliminar;
          setModalEliminar(null);
          if (r) handleDelete(r);
        }}
        onCancelar={() => setModalEliminar(null)}
      />

      <ModalConfirm
        visible={!!modalToggle}
        titulo={`¿${modalToggle?.estado === "activa" ? "Desactivar" : "Activar"} rifa?`}
        mensaje={`¿Cambiar estado de "${modalToggle?.nombre}" a ${modalToggle?.estado === "activa" ? "finalizada" : "activa"}?`}
        labelConfirmar="Sí, cambiar"
        labelCancelar="Cancelar"
        tipo="warning"
        onConfirmar={() => {
          const r = modalToggle;
          setModalToggle(null);
          if (r) toggleEstadoRifa(r);
        }}
        onCancelar={() => setModalToggle(null)}
      />
    </div>
  );
}
