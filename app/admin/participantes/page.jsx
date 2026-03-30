"use client";

import { useEffect, useState, Fragment } from "react";
import * as XLSX from "xlsx";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { getAdminAuthHeaders } from "@/lib/auth";

const PAGE_SIZE = 20;

export default function ParticipantesPage() {
  const [participantes, setParticipantes] = useState([]);
  const [filaExpandida, setFilaExpandida] = useState(null);
  const [boletosParticipante, setBoletosParticipante] = useState({});
  const [rifas, setRifas] = useState([]);
  const [total, setTotal] = useState(0);
  const [paginas, setPaginas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [notificando, setNotificando] = useState(null);
  const [modalConfirmacion, setModalConfirmacion] = useState(null);
  const [mensajeNotificacion, setMensajeNotificacion] = useState("");
  const [modalAprobar, setModalAprobar] = useState(null);
  const [aprobandoId, setAprobandoId] = useState(null);
  const [mensajeAprobar, setMensajeAprobar] = useState("");

  const [filtros, setFiltros] = useState({
    buscar: "",
    estado: "",
    rifa_id: "",
    page: 1,
  });

  useEffect(() => {
    fetch("/api/rifas")
      .then((res) => res.json())
      .then((data) => setRifas(Array.isArray(data) ? data : []))
      .catch(() => setRifas([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      buscar: filtros.buscar,
      estado: filtros.estado,
      rifa_id: filtros.rifa_id,
      page: String(filtros.page),
    });

    (async () => {
      const auth = await getAdminAuthHeaders();
      fetch(`/api/admin/participantes?${params}`, { headers: { ...auth } })
        .then((res) => res.json())
        .then((data) => {
          setParticipantes(data.participantes || []);
          setTotal(data.total ?? 0);
          setPaginas(data.paginas ?? 0);
        })
        .catch(() => {
          setParticipantes([]);
          setTotal(0);
          setPaginas(0);
        })
        .finally(() => setLoading(false));
    })();
  }, [filtros]);

  function formatPrecio(n) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n ?? 0);
  }

  function formatFecha(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function badgeEstado(estado) {
    const clases = {
      aprobado: "bg-green-500/20 text-green-400",
      pendiente: "bg-amber-500/20 text-amber-400",
      rechazado: "bg-red-500/20 text-red-400",
    };
    const label = estado || "pendiente";
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          clases[label] || clases.pendiente
        }`}
      >
        {label}
      </span>
    );
  }

  const verBoletos = async (participanteId) => {
    if (filaExpandida === participanteId) {
      setFilaExpandida(null);
      return;
    }
    if (!boletosParticipante[participanteId]) {
      const { data } = await supabaseBrowser
        .from("boletos")
        .select("numero, estado")
        .eq("participante_id", participanteId)
        .order("numero", { ascending: true });
      setBoletosParticipante((prev) => ({
        ...prev,
        [participanteId]: data || [],
      }));
    }
    setFilaExpandida(participanteId);
  };

  const confirmarAprobarPago = async (participante) => {
    setAprobandoId(participante.id);
    setMensajeAprobar("");
    try {
      const auth = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/aprobar-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({
          participante_id: participante.id,
          metodo_pago: "manual",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMensajeAprobar(data.error || "No se pudo aprobar el pago");
        return;
      }
      setParticipantes((prev) =>
        prev.map((x) =>
          x.id === participante.id
            ? { ...x, estado_pago: "aprobado" }
            : x
        )
      );
      setBoletosParticipante((prev) => {
        const next = { ...prev };
        delete next[participante.id];
        return next;
      });
      setModalAprobar(null);
    } catch (e) {
      setMensajeAprobar("Error de conexión al aprobar");
    } finally {
      setAprobandoId(null);
    }
  };

  const notificarGanador = async (participante) => {
    setNotificando(participante.id);
    setMensajeNotificacion("");
    try {
      const auth = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/notificar-ganador", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({
          participante_id: participante.id,
          rifa_id: participante.rifa_id || participante.rifas?.id,
        }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setMensajeNotificacion("✅ Ganador notificado correctamente");
      } else {
        setMensajeNotificacion("❌ Error: " + (data.error || "Intenta de nuevo"));
      }
    } catch (err) {
      setMensajeNotificacion("❌ Error de conexión");
    } finally {
      setNotificando(null);
      setModalConfirmacion(null);
    }
  };

  async function handleExportar() {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        buscar: filtros.buscar,
        estado: filtros.estado,
        rifa_id: filtros.rifa_id,
        export: "1",
      });

      const auth = await getAdminAuthHeaders();
      const res = await fetch(`/api/admin/participantes?${params}`, {
        headers: { ...auth },
      });
      const data = await res.json();
      const lista = data.participantes || [];

      const rows = lista.map((p) => ({
        Nombre: p.nombre || "",
        Email: p.email || "",
        Teléfono: p.telefono || "",
        Ciudad: p.ciudad || "",
        Cédula: p.cedula || "",
        Rifa: p.rifas?.nombre || "-",
        Boletos: p.cantidad_boletos ?? 0,
        Total: p.total_pagado ?? 0,
        Estado: p.estado_pago || "pendiente",
        Fecha: p.created_at ? formatFecha(p.created_at) : "",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Participantes");
      XLSX.writeFile(wb, `participantes_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("Error exportando:", err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-white">Participantes</h1>
        <button
          onClick={handleExportar}
          disabled={exporting}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-medium rounded-lg disabled:opacity-50"
        >
          {exporting ? "Exportando..." : "Exportar Excel"}
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Buscar por nombre, email, cédula o número de ticket..."
          value={filtros.buscar}
          onChange={(e) =>
            setFiltros((f) => ({ ...f, buscar: e.target.value, page: 1 }))
          }
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 w-64 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        />
        <select
          value={filtros.estado}
          onChange={(e) =>
            setFiltros((f) => ({ ...f, estado: e.target.value, page: 1 }))
          }
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        >
          <option value="">Todos los estados</option>
          <option value="aprobado">Aprobado</option>
          <option value="pendiente">Pendiente</option>
          <option value="rechazado">Rechazado</option>
        </select>
        <select
          value={filtros.rifa_id}
          onChange={(e) =>
            setFiltros((f) => ({ ...f, rifa_id: e.target.value, page: 1 }))
          }
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 min-w-[180px]"
        >
          <option value="">Todas las rifas</option>
          {rifas.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : participantes.length === 0 ? (
          <div className="py-16 text-center text-zinc-400">
            No hay participantes que coincidan con los filtros
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              borderRadius: "12px",
            }}
          >
            <table className="w-full" style={{ minWidth: "800px" }}>
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Teléfono
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Ciudad
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Rifa
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Boletos
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Ver tickets
                  </th>
                </tr>
              </thead>
              <tbody>
                {participantes.map((p) => (
                  <Fragment key={p.id}>
                    <tr
                      className="border-b border-zinc-800 hover:bg-zinc-800/50"
                    >
                      <td className="px-6 py-4 text-white">{p.nombre || "-"}</td>
                      <td className="px-6 py-4 text-zinc-300">{p.email || "-"}</td>
                      <td className="px-6 py-4 text-zinc-300">
                        {p.telefono || "-"}
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        {p.ciudad || "-"}
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        {p.rifas?.nombre || "-"}
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        {p.cantidad_boletos ?? 0}
                      </td>
                      <td className="px-6 py-4 text-amber-400">
                        {formatPrecio(p.total_pagado)}
                      </td>
                      <td className="px-6 py-4">
                        {badgeEstado(p.estado_pago)}
                      </td>
                      <td className="px-6 py-4 text-zinc-400 text-sm">
                        {formatFecha(p.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => verBoletos(p.id)}
                          style={{
                            backgroundColor: "transparent",
                            border: "1px solid rgba(242,178,51,0.4)",
                            borderRadius: "6px",
                            color: "#F2B233",
                            fontSize: "11px",
                            padding: "4px 8px",
                            cursor: "pointer",
                            fontFamily: "Poppins, sans-serif",
                          }}
                        >
                          {filaExpandida === p.id ? "▲ Ocultar" : "🎟 Ver tickets"}
                        </button>
                        {p.estado_pago === "pendiente" && (
                          <button
                            type="button"
                            onClick={() => {
                              setModalAprobar(p);
                              setMensajeAprobar("");
                            }}
                            style={{
                              backgroundColor: "rgba(34,197,94,0.12)",
                              border: "1px solid rgba(34,197,94,0.5)",
                              borderRadius: "6px",
                              color: "#22C55E",
                              fontSize: "11px",
                              padding: "4px 8px",
                              cursor: "pointer",
                              fontFamily: "Poppins, sans-serif",
                              marginLeft: "6px",
                              fontWeight: "600",
                            }}
                          >
                            Aprobar pago manual ✅
                          </button>
                        )}
                        <button
                          onClick={() => setModalConfirmacion(p)}
                          style={{
                            backgroundColor: "transparent",
                            border: "1px solid rgba(34,197,94,0.4)",
                            borderRadius: "6px",
                            color: "#22C55E",
                            fontSize: "11px",
                            padding: "4px 8px",
                            cursor: "pointer",
                            fontFamily: "Poppins, sans-serif",
                            marginLeft: "6px",
                          }}
                        >
                          🏆 Notificar ganador
                        </button>
                      </td>
                    </tr>
                    {filaExpandida === p.id && (
                      <tr>
                        <td
                          colSpan={10}
                          style={{
                            backgroundColor: "rgba(242,178,51,0.05)",
                            padding: "12px 16px",
                            borderTop: "1px solid rgba(242,178,51,0.1)",
                          }}
                        >
                          {boletosParticipante[p.id]?.length > 0 ? (
                            <div>
                              <p
                                style={{
                                  color: "rgba(248,250,252,0.6)",
                                  fontSize: "12px",
                                  margin: "0 0 8px",
                                  fontWeight: "600",
                                }}
                              >
                                Números asignados ({boletosParticipante[p.id].length}):
                              </p>
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "6px",
                                }}
                              >
                                {boletosParticipante[p.id].map((b, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      backgroundColor: "#0B1F33",
                                      border: "1.5px solid rgba(242,178,51,0.5)",
                                      borderRadius: "6px",
                                      padding: "3px 8px",
                                      color: "#F2B233",
                                      fontSize: "13px",
                                      fontWeight: "700",
                                    }}
                                  >
                                    {b.numero}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p
                              style={{
                                color: "rgba(248,250,252,0.4)",
                                fontSize: "12px",
                                margin: 0,
                                fontStyle: "italic",
                              }}
                            >
                              Sin números asignados aún
                            </p>
                          )}
                          <div
                            style={{
                              marginTop: "12px",
                              borderTop: "1px solid rgba(242,178,51,0.1)",
                              paddingTop: "10px",
                            }}
                          >
                            <button
                              onClick={() => setModalConfirmacion(p)}
                              style={{
                                backgroundColor: "rgba(34,197,94,0.1)",
                                border: "1px solid rgba(34,197,94,0.4)",
                                borderRadius: "8px",
                                color: "#22C55E",
                                fontSize: "13px",
                                fontWeight: "600",
                                padding: "8px 16px",
                                cursor: "pointer",
                                fontFamily: "Poppins, sans-serif",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              🏆 Notificar como ganador
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {paginas > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-zinc-800">
            <p className="text-sm text-zinc-400">
              {total} participante{total !== 1 ? "s" : ""} en total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setFiltros((f) => ({ ...f, page: Math.max(1, f.page - 1) }))
                }
                disabled={filtros.page <= 1}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Anterior
              </button>
              <span className="px-3 py-1.5 text-zinc-400 text-sm">
                Página {filtros.page} de {paginas}
              </span>
              <button
                onClick={() =>
                  setFiltros((f) => ({
                    ...f,
                    page: Math.min(paginas, f.page + 1),
                  }))
                }
                disabled={filtros.page >= paginas}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {modalAprobar && (
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
              backgroundColor: "#1a1a1a",
              border: "1.5px solid rgba(34,197,94,0.35)",
              borderRadius: "20px",
              padding: "28px 24px",
              width: "100%",
              maxWidth: "420px",
            }}
          >
            <h2
              style={{
                color: "#F8FAFC",
                fontSize: "18px",
                fontWeight: "800",
                textAlign: "center",
                margin: "0 0 12px",
              }}
            >
              Confirmar aprobación manual
            </h2>
            <p
              style={{
                color: "rgba(248,250,252,0.75)",
                fontSize: "14px",
                textAlign: "center",
                lineHeight: 1.5,
                margin: "0 0 20px",
              }}
            >
              ¿Confirmas aprobar el pago de{" "}
              <strong style={{ color: "#22C55E" }}>
                {modalAprobar.nombre || "este participante"}
              </strong>
              ? Se asignarán sus números y se enviará el correo.
            </p>
            {mensajeAprobar && (
              <p
                style={{
                  color: "#f87171",
                  fontSize: "13px",
                  textAlign: "center",
                  margin: "0 0 12px",
                  fontWeight: "600",
                }}
              >
                {mensajeAprobar}
              </p>
            )}
            <button
              type="button"
              onClick={() => confirmarAprobarPago(modalAprobar)}
              disabled={aprobandoId === modalAprobar.id}
              style={{
                width: "100%",
                background:
                  aprobandoId === modalAprobar.id
                    ? "rgba(34,197,94,0.45)"
                    : "#22C55E",
                color: "#052e16",
                fontWeight: "800",
                fontSize: "15px",
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                cursor:
                  aprobandoId === modalAprobar.id ? "not-allowed" : "pointer",
                marginBottom: "10px",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              {aprobandoId === modalAprobar.id ? "Procesando..." : "Confirmar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setModalAprobar(null);
                setMensajeAprobar("");
              }}
              disabled={aprobandoId === modalAprobar.id}
              style={{
                width: "100%",
                backgroundColor: "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "12px",
                color: "rgba(248,250,252,0.55)",
                fontSize: "14px",
                padding: "12px",
                cursor:
                  aprobandoId === modalAprobar.id ? "not-allowed" : "pointer",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {modalConfirmacion && (
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
              backgroundColor: "#1a1a1a",
              border: "1.5px solid rgba(34,197,94,0.4)",
              borderRadius: "20px",
              padding: "28px 24px",
              width: "100%",
              maxWidth: "420px",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "48px" }}>🏆</span>
            </div>

            <h2
              style={{
                color: "#F8FAFC",
                fontSize: "20px",
                fontWeight: "800",
                textAlign: "center",
                margin: "0 0 8px",
              }}
            >
              ¿Confirmar ganador?
            </h2>

            <div
              style={{
                backgroundColor: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: "12px",
                padding: "14px",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  color: "#22C55E",
                  fontWeight: "700",
                  fontSize: "18px",
                  margin: "0 0 4px",
                }}
              >
                {modalConfirmacion.nombre}
              </p>
              <p
                style={{
                  color: "rgba(248,250,252,0.6)",
                  fontSize: "13px",
                  margin: "0 0 2px",
                }}
              >
                {modalConfirmacion.email}
              </p>
              <p
                style={{
                  color: "rgba(248,250,252,0.5)",
                  fontSize: "12px",
                  margin: 0,
                }}
              >
                {modalConfirmacion.rifas?.nombre || "Sorteo RIFEX"}
              </p>
            </div>

            <p
              style={{
                color: "rgba(248,250,252,0.5)",
                fontSize: "13px",
                textAlign: "center",
                margin: "0 0 20px",
              }}
            >
              Se enviará un email de notificación al ganador. Esta acción no se
              puede deshacer.
            </p>

            {mensajeNotificacion && (
              <p
                style={{
                  color: mensajeNotificacion.includes("✅") ? "#22C55E" : "#f87171",
                  fontSize: "13px",
                  textAlign: "center",
                  margin: "0 0 12px",
                  fontWeight: "600",
                }}
              >
                {mensajeNotificacion}
              </p>
            )}

            <button
              onClick={() => notificarGanador(modalConfirmacion)}
              disabled={notificando === modalConfirmacion.id}
              style={{
                width: "100%",
                background:
                  notificando === modalConfirmacion.id
                    ? "rgba(34,197,94,0.4)"
                    : "linear-gradient(135deg, #22C55E, #16a34a)",
                color: "white",
                fontWeight: "800",
                fontSize: "16px",
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                cursor: notificando ? "not-allowed" : "pointer",
                marginBottom: "10px",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              {notificando === modalConfirmacion.id
                ? "Enviando..."
                : "✅ Sí, notificar ganador"}
            </button>

            <button
              onClick={() => {
                setModalConfirmacion(null);
                setMensajeNotificacion("");
              }}
              style={{
                width: "100%",
                backgroundColor: "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "12px",
                color: "rgba(248,250,252,0.5)",
                fontSize: "14px",
                padding: "12px",
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
