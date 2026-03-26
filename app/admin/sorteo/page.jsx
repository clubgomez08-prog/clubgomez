"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { getAdminAuthHeaders } from "@/lib/auth";
import { useToast } from "@/components/admin/Toast";
import { parseNumerosBendecidos } from "@/lib/numeros-bendecidos";

function formatPrecio(n) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function formatFecha(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function SorteoPage() {
  const { addToast } = useToast();
  const [rifas, setRifas] = useState([]);
  const [rifaId, setRifaId] = useState("");
  const [stats, setStats] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sorteando, setSorteando] = useState(false);
  const [ganador, setGanador] = useState(null);
  const [emailSorteoEnviado, setEmailSorteoEnviado] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [notificando, setNotificando] = useState(false);
  const [notificados, setNotificados] = useState({});
  const [error, setError] = useState("");
  const [numeroGanador, setNumeroGanador] = useState("");
  const [buscandoGanador, setBuscandoGanador] = useState(false);
  const [ganadorEncontrado, setGanadorEncontrado] = useState(null);
  const [errorBusqueda, setErrorBusqueda] = useState("");
  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [mensajeNotificacion, setMensajeNotificacion] = useState("");
  const [boletosGanador, setBoletosGanador] = useState([]);
  const [premiosAnticipados, setPremiosAnticipados] = useState([]);
  const [busquedasPremios, setBusquedasPremios] = useState({});
  const [ganadoresPremios, setGanadoresPremios] = useState({});
  const [notificandoPremio, setNotificandoPremio] = useState(null);
  const [mensajesPremios, setMensajesPremios] = useState({});
  const [numerosBendecidosLocal, setNumerosBendecidosLocal] = useState([]);
  const [savingBendecidoIdx, setSavingBendecidoIdx] = useState(null);

  useEffect(() => {
    if (!rifaId) {
      setNumerosBendecidosLocal([]);
      return;
    }
    const r = rifas.find((x) => x.id === rifaId);
    if (!r) {
      setNumerosBendecidosLocal([]);
      return;
    }
    setNumerosBendecidosLocal(parseNumerosBendecidos(r.numeros_bendecidos));
  }, [rifaId, rifas]);

  useEffect(() => {
    fetch("/api/rifas")
      .then((res) => res.json())
      .then((data) => {
        const lista = Array.isArray(data) ? data : [];
        setRifas(lista);
        if (lista.length > 0 && !rifaId) {
          const activa = lista.find((r) => r.estado === "activa") || lista[0];
          setRifaId(activa.id);
        }
      })
      .catch(() => setRifas([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!rifaId) {
      setStats(null);
      setHistorial([]);
      setPremiosAnticipados([]);
      setBusquedasPremios({});
      setGanadoresPremios({});
      setMensajesPremios({});
      return;
    }

    const rifa = rifas.find((r) => r.id === rifaId);
    if (!rifa) return;

    // Cargar premios anticipados de la rifa
    supabaseBrowser
      .from("rifas")
      .select("premios_anticipados")
      .eq("id", rifaId)
      .single()
      .then(({ data: rifaData }) => {
        if (rifaData?.premios_anticipados?.length > 0) {
          setPremiosAnticipados(
            rifaData.premios_anticipados.map((p, i) => ({
              index: i,
              monto: typeof p === "string" ? p : (p.monto || p.nombre || ""),
              desc: typeof p === "string" ? "" : (p.desc || p.descripcion || ""),
              imagen_url: typeof p === "string" ? "" : (p.imagen_url || ""),
            }))
          );
        } else {
          setPremiosAnticipados([]);
        }
        setBusquedasPremios({});
        setGanadoresPremios({});
        setMensajesPremios({});
      })
      .catch(() => {
        setPremiosAnticipados([]);
        setBusquedasPremios({});
        setGanadoresPremios({});
        setMensajesPremios({});
      });

    // Obtener stats reales desde el API
    fetch(`/api/rifas/${rifaId}/stats`)
      .then((res) => res.json())
      .then((s) => {
        const vendidos = s.vendidos ?? 0;
        const total = rifa.total_numeros ?? 10000;
        const pct = total > 0 ? (vendidos / total) * 100 : 0;
        setStats({
          vendidos,
          total,
          porcentaje: pct.toFixed(1),
          recaudado: (rifa.precio_boleto ?? 0) * vendidos,
          listo: pct >= (rifa.porcentaje_sorteo ?? 80),
        });
      })
      .catch(() => setStats(null));

    (async () => {
      const auth = await getAdminAuthHeaders();
      fetch(`/api/admin/sorteo?rifa_id=${rifaId}`, { headers: { ...auth } })
        .then((res) => res.json())
        .then((data) => setHistorial(data.sorteos || []))
        .catch(() => setHistorial([]));
    })();
  }, [rifaId, rifas]);

  function handleRealizarSorteo() {
    setShowModal(true);
  }

  async function confirmarSorteo() {
    setShowModal(false);
    setSorteando(true);
    setError("");
    setGanador(null);
    setEmailSorteoEnviado(false);

    const auth = await getAdminAuthHeaders();
    fetch("/api/admin/sorteo", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ rifa_id: rifaId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error en el sorteo");
        return data;
      })
      .then((data) => {
        setGanador({ ...data.ganador, sorteo_id: data.sorteo_id });
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        setRifas((prev) =>
          prev.map((r) =>
            r.id === rifaId ? { ...r, estado: "finalizada" } : r
          )
        );
        setHistorial((prev) => [
          {
            id: data.sorteo_id,
            participante_nombre: data.ganador.nombre,
            participante_email: data.ganador.email,
            participante_telefono: data.ganador.telefono,
            numero_boleto: data.ganador.numero_boleto,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setStats(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setSorteando(false));
  }

  const notificarGanadorSorteo = async () => {
    if (!ganador?.sorteo_id) {
      addToast("No hay sorteo para notificar", "error");
      return;
    }
    setNotificando(true);
    try {
      const auth = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/notificar-ganador", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ sorteo_id: ganador.sorteo_id }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Error al enviar el email", "error");
        return;
      }
      addToast("Email enviado al ganador correctamente", "success");
      setEmailSorteoEnviado(true);
    } catch (err) {
      addToast(err.message || "Error de conexión", "error");
    } finally {
      setNotificando(false);
    }
  };

  async function notificarDesdeHistorial(sorteoId) {
    setNotificados((prev) => ({ ...prev, [sorteoId]: { status: "loading" } }));
    const auth = await getAdminAuthHeaders();
    fetch("/api/admin/notificar-ganador", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ sorteo_id: sorteoId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error enviando email");
        return data;
      })
      .then(() => {
        setNotificados((prev) => ({ ...prev, [sorteoId]: { status: "success" } }));
      })
      .catch((err) => {
        setNotificados((prev) => ({
          ...prev,
          [sorteoId]: { status: "error", error: err.message },
        }));
      });
  }

  const buscarNumeroGanador = async (e) => {
    e.preventDefault();
    if (!numeroGanador.trim()) return;
    setBuscandoGanador(true);
    setErrorBusqueda("");
    setGanadorEncontrado(null);
    setBoletosGanador([]);
    setMensajeNotificacion("");

    try {
      const { data: boletos, error: err } = await supabaseBrowser
        .from("boletos")
        .select(
          `
          numero,
          estado,
          participante_id,
          participantes (
            id,
            nombre,
            cedula,
            email,
            telefono,
            ciudad,
            cantidad_boletos,
            total_pagado,
            estado_pago,
            rifa_id
          )
        `
        )
        .eq("numero", numeroGanador.trim())
        .eq("rifa_id", rifaId);

      if (err) throw new Error(err.message);

      if (!boletos || boletos.length === 0) {
        setErrorBusqueda(
          `No se encontró ningún participante con el número ${numeroGanador} en esta rifa.`
        );
        return;
      }

      const participante = boletos[0].participantes;

      const { data: todosLosBoletos } = await supabaseBrowser
        .from("boletos")
        .select("numero, estado")
        .eq("participante_id", participante.id)
        .order("numero", { ascending: true });

      setGanadorEncontrado(participante);
      setBoletosGanador(todosLosBoletos || []);
    } catch (err) {
      setErrorBusqueda(err.message || "Error al buscar. Intenta de nuevo.");
    } finally {
      setBuscandoGanador(false);
    }
  };

  const notificarGanador = async () => {
    if (!ganadorEncontrado) return;
    setNotificando(true);
    setMensajeNotificacion("");
    try {
      const auth = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/notificar-ganador", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({
          participante_id: ganadorEncontrado.id,
          rifa_id: rifaId,
        }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setMensajeNotificacion("✅ Ganador notificado correctamente por email");
      } else {
        setMensajeNotificacion("❌ Error: " + (data.error || "Intenta de nuevo"));
      }
    } catch (err) {
      setMensajeNotificacion("❌ Error de conexión");
    } finally {
      setNotificando(false);
      setModalConfirmacion(false);
    }
  };

  const buscarGanadorPremio = async (e, premioIndex) => {
    e.preventDefault();
    const numero = busquedasPremios[premioIndex]?.trim();
    if (!numero) return;

    setBusquedasPremios((prev) => ({
      ...prev,
      [`buscando_${premioIndex}`]: true,
    }));
    setGanadoresPremios((prev) => ({ ...prev, [premioIndex]: null }));
    setMensajesPremios((prev) => ({ ...prev, [premioIndex]: "" }));

    try {
      const { data: boletos } = await supabaseBrowser
        .from("boletos")
        .select(
          `
          numero, estado, participante_id,
          participantes (
            id, nombre, cedula, email,
            telefono, ciudad, rifa_id
          )
        `
        )
        .eq("numero", numero)
        .eq("rifa_id", rifaId);

      if (!boletos || boletos.length === 0) {
        setMensajesPremios((prev) => ({
          ...prev,
          [premioIndex]: `❌ No se encontró el número ${numero}`,
        }));
        return;
      }

      setGanadoresPremios((prev) => ({
        ...prev,
        [premioIndex]: boletos[0].participantes,
      }));
    } catch (err) {
      setMensajesPremios((prev) => ({
        ...prev,
        [premioIndex]: "❌ Error al buscar",
      }));
    } finally {
      setBusquedasPremios((prev) => ({
        ...prev,
        [`buscando_${premioIndex}`]: false,
      }));
    }
  };

  const toggleBendecidoBloqueo = async (index) => {
    if (savingBendecidoIdx !== null || !rifaId) return;
    const prevList = numerosBendecidosLocal.map((x) => ({ ...x }));
    const nextList = prevList.map((item, i) =>
      i === index ? { ...item, bloqueado: !item.bloqueado } : item
    );
    setNumerosBendecidosLocal(nextList);
    setSavingBendecidoIdx(index);
    try {
      const auth = await getAdminAuthHeaders();
      const res = await fetch(`/api/rifas/${rifaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ numeros_bendecidos: nextList }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNumerosBendecidosLocal(prevList);
        addToast(data.error || "Error al actualizar el número", "error");
        return;
      }
      setRifas((prev) =>
        prev.map((r) =>
          r.id === rifaId
            ? { ...r, numeros_bendecidos: data.numeros_bendecidos ?? nextList }
            : r
        )
      );
      addToast("✅ Número actualizado", "success");
    } catch (err) {
      setNumerosBendecidosLocal(prevList);
      addToast(err.message || "Error de conexión", "error");
    } finally {
      setSavingBendecidoIdx(null);
    }
  };

  const notificarGanadorPremio = async (premioIndex) => {
    const ganador = ganadoresPremios[premioIndex];
    if (!ganador) return;

    setNotificandoPremio(premioIndex);
    try {
      const auth = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/notificar-ganador", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({
          participante_id: ganador.id,
          rifa_id: rifaId,
        }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setMensajesPremios((prev) => ({
          ...prev,
          [premioIndex]: "✅ Ganador notificado por email",
        }));
      } else {
        setMensajesPremios((prev) => ({
          ...prev,
          [premioIndex]: "❌ Error: " + (data.error || "Intenta de nuevo"),
        }));
      }
    } catch {
      setMensajesPremios((prev) => ({
        ...prev,
        [premioIndex]: "❌ Error de conexión",
      }));
    } finally {
      setNotificandoPremio(null);
    }
  };

  const rifa = rifas.find((r) => r.id === rifaId);
  const listo = stats?.listo ?? false;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-white">Ejecutar sorteo</h1>

      <div className="flex flex-wrap gap-4 items-center">
        <label className="text-zinc-400 text-sm">Rifa:</label>
        <select
          value={rifaId}
          onChange={(e) => setRifaId(e.target.value)}
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500/50"
        >
          <option value="">Seleccionar rifa</option>
          {rifas.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
      </div>

      {rifa && stats && (
        <>
          <div
            className="grid grid-cols-2 md:grid-cols-4"
            style={{ gap: "10px" }}
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <p className="text-zinc-400 text-sm">Boletos vendidos</p>
              <p className="text-xl font-semibold text-white mt-1">
                {stats.vendidos.toLocaleString()} / {stats.total.toLocaleString()}
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <p className="text-zinc-400 text-sm">Porcentaje completado</p>
              <p className="text-xl font-semibold text-amber-400 mt-1">
                {stats.porcentaje}%
              </p>
              <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, parseFloat(stats.porcentaje))}%` }}
                />
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <p className="text-zinc-400 text-sm">Total recaudado</p>
              <p className="text-xl font-semibold text-white mt-1">
                {formatPrecio(stats.recaudado)}
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <p className="text-zinc-400 text-sm">Estado</p>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-lg text-sm font-medium ${
                  listo
                    ? "bg-green-500/20 text-green-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {listo ? "Listo para sortear" : "En progreso"}
              </span>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid rgba(242,178,51,0.2)",
              borderRadius: "16px",
              padding: "24px",
              marginTop: "24px",
            }}
          >
            <h2
              style={{
                color: "#F8FAFC",
                fontSize: "18px",
                fontWeight: "700",
                margin: "0 0 6px",
              }}
            >
              🌟 Números bendecidos
            </h2>
            <p
              style={{
                color: "rgba(248,250,252,0.5)",
                fontSize: "13px",
                margin: "0 0 20px",
              }}
            >
              Activa o bloquea cada número individualmente
            </p>

            {numerosBendecidosLocal.length === 0 ? (
              <p
                style={{
                  color: "rgba(248,250,252,0.55)",
                  fontSize: "14px",
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                Esta rifa no tiene números bendecidos configurados.
                Agrégalos desde Rifas → Editar.
              </p>
            ) : (
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                style={{ marginTop: "4px" }}
              >
                {numerosBendecidosLocal.map((item, index) => {
                  const bloqueado = Boolean(item.bloqueado);
                  const disabled = savingBendecidoIdx !== null;
                  return (
                    <div
                      key={`${item.numero}-${index}`}
                      style={{
                        backgroundColor: "rgba(10,10,10,0.6)",
                        border: "1.5px solid rgba(242,178,51,0.25)",
                        borderRadius: "14px",
                        padding: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap",
                        minHeight: "52px",
                      }}
                    >
                      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                        <p
                          style={{
                            margin: "0 0 8px",
                            fontFamily:
                              "ui-monospace, Consolas, 'Courier New', monospace",
                            fontSize: "22px",
                            fontWeight: "800",
                            color: "#F2B233",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {item.numero}
                        </p>
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            border: bloqueado
                              ? "1px solid rgba(239,68,68,0.45)"
                              : "1px solid rgba(34,197,94,0.45)",
                            backgroundColor: bloqueado
                              ? "rgba(239,68,68,0.12)"
                              : "rgba(34,197,94,0.12)",
                            color: bloqueado ? "#fca5a5" : "#86efac",
                          }}
                        >
                          {bloqueado ? "🔴 Bloqueado" : "🟢 Activo"}
                        </span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!bloqueado}
                        aria-label={
                          bloqueado
                            ? `Activar número ${item.numero}`
                            : `Bloquear número ${item.numero}`
                        }
                        disabled={disabled}
                        onClick={() => toggleBendecidoBloqueo(index)}
                        style={{
                          flexShrink: 0,
                          width: "52px",
                          height: "30px",
                          borderRadius: "999px",
                          border: "2px solid rgba(242,178,51,0.35)",
                          backgroundColor: bloqueado ? "#3f1d1d" : "#14532d",
                          position: "relative",
                          cursor: disabled ? "not-allowed" : "pointer",
                          opacity: disabled ? 0.55 : 1,
                          transition: "background-color 0.2s ease",
                          padding: 0,
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: "3px",
                            left: bloqueado ? "4px" : "26px",
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            backgroundColor: bloqueado ? "#f87171" : "#4ade80",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
                            transition: "left 0.2s ease",
                          }}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid rgba(242,178,51,0.2)',
            borderRadius: '16px',
            padding: '24px',
            marginTop: '24px'
          }}>
            <h2 style={{
              color: '#F8FAFC',
              fontSize: '18px',
              fontWeight: '700',
              margin: '0 0 6px'
            }}>
              🎯 Buscar número ganador
            </h2>
            <p style={{
              color: 'rgba(248,250,252,0.5)',
              fontSize: '13px',
              margin: '0 0 20px'
            }}>
              Ingresa el número que salió en la lotería
              para encontrar al participante ganador
            </p>

            {/* Formulario de búsqueda */}
            <form onSubmit={buscarNumeroGanador} style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <input
                type="text"
                placeholder="Ej: 0042, 1234, 9876..."
                value={numeroGanador}
                onChange={e => setNumeroGanador(e.target.value)}
                style={{
                  flex: 1,
                  backgroundColor: '#0a0a0a',
                  border: '1.5px solid rgba(242,178,51,0.3)',
                  borderRadius: '12px',
                  color: '#F8FAFC',
                  fontSize: '16px',
                  padding: '12px 16px',
                  outline: 'none',
                  fontFamily: 'Poppins, sans-serif'
                }}
              />
              <button
                type="submit"
                disabled={buscandoGanador}
                style={{
                  backgroundColor: '#F2B233',
                  color: '#071521',
                  fontWeight: '700',
                  fontSize: '15px',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: buscandoGanador ? 'not-allowed' : 'pointer',
                  opacity: buscandoGanador ? 0.6 : 1,
                  fontFamily: 'Poppins, sans-serif',
                  whiteSpace: 'nowrap'
                }}
              >
                {buscandoGanador ? 'Buscando...' : '🔍 Buscar'}
              </button>
            </form>

            {/* Error de búsqueda */}
            {errorBusqueda && (
              <div style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#fca5a5',
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                {errorBusqueda}
              </div>
            )}

            {/* Resultado — Ganador encontrado */}
            {ganadorEncontrado && (
              <div style={{
                backgroundColor: 'rgba(34,197,94,0.05)',
                border: '1.5px solid rgba(34,197,94,0.3)',
                borderRadius: '16px',
                padding: '20px'
              }}>

                {/* Header ganador */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <span style={{ fontSize: '36px' }}>🏆</span>
                  <div>
                    <p style={{
                      color: '#22C55E',
                      fontWeight: '800',
                      fontSize: '20px',
                      margin: '0 0 2px'
                    }}>
                      {ganadorEncontrado.nombre}
                    </p>
                    <p style={{
                      color: 'rgba(248,250,252,0.6)',
                      fontSize: '13px',
                      margin: 0
                    }}>
                      Número ganador:
                      <strong style={{ color: '#F2B233', marginLeft: '6px' }}>
                        {numeroGanador}
                      </strong>
                    </p>
                  </div>
                </div>

                {/* Datos del ganador */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  {[
                    { label: 'Cédula', value: ganadorEncontrado.cedula },
                    { label: 'Email', value: ganadorEncontrado.email },
                    { label: 'Teléfono', value: ganadorEncontrado.telefono },
                    { label: 'Ciudad', value: ganadorEncontrado.ciudad },
                    { label: 'Tickets comprados', value: ganadorEncontrado.cantidad_boletos },
                    { label: 'Total pagado', value: '$ ' + Number(ganadorEncontrado.total_pagado).toLocaleString('es-CO') }
                  ].map((item, i) => (
                    <div key={i} style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderRadius: '8px',
                      padding: '8px 12px'
                    }}>
                      <p style={{
                        color: 'rgba(248,250,252,0.4)',
                        fontSize: '11px',
                        margin: '0 0 2px',
                        fontWeight: '600'
                      }}>
                        {item.label}
                      </p>
                      <p style={{
                        color: '#F8FAFC',
                        fontSize: '13px',
                        fontWeight: '600',
                        margin: 0
                      }}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Todos los números del ganador */}
                {boletosGanador.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{
                      color: 'rgba(248,250,252,0.5)',
                      fontSize: '12px',
                      fontWeight: '600',
                      margin: '0 0 8px'
                    }}>
                      Todos sus números ({boletosGanador.length}):
                    </p>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px'
                    }}>
                      {boletosGanador.map((b, i) => (
                        <span key={i} style={{
                          backgroundColor: b.numero === numeroGanador
                            ? '#F2B233'
                            : '#0B1F33',
                          border: b.numero === numeroGanador
                            ? '2px solid #F2B233'
                            : '1.5px solid rgba(242,178,51,0.3)',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          color: b.numero === numeroGanador
                            ? '#071521'
                            : '#F2B233',
                          fontSize: '13px',
                          fontWeight: '700'
                        }}>
                          {b.numero}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mensaje resultado notificación */}
                {mensajeNotificacion && (
                  <div style={{
                    backgroundColor: mensajeNotificacion.includes('✅')
                      ? 'rgba(34,197,94,0.1)'
                      : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${mensajeNotificacion.includes('✅') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: mensajeNotificacion.includes('✅') ? '#22C55E' : '#f87171',
                    fontSize: '13px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '12px'
                  }}>
                    {mensajeNotificacion}
                  </div>
                )}

                {/* Botón notificar */}
                <button
                  onClick={() => setModalConfirmacion(true)}
                  disabled={notificando || mensajeNotificacion.includes('✅')}
                  style={{
                    width: '100%',
                    background: mensajeNotificacion.includes('✅')
                      ? 'rgba(34,197,94,0.3)'
                      : 'linear-gradient(135deg, #22C55E, #16a34a)',
                    color: 'white',
                    fontWeight: '800',
                    fontSize: '16px',
                    padding: '16px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: mensajeNotificacion.includes('✅') || notificando
                      ? 'not-allowed'
                      : 'pointer',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  {mensajeNotificacion.includes('✅')
                    ? '✅ Ganador notificado'
                    : '🏆 Notificar ganador por email'}
                </button>
              </div>
            )}

            {premiosAnticipados.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>🎁</span>
                  <div>
                    <p
                      style={{
                        color: "#F8FAFC",
                        fontWeight: "700",
                        fontSize: "16px",
                        margin: 0,
                      }}
                    >
                      Premios anticipados
                    </p>
                    <p
                      style={{
                        color: "rgba(248,250,252,0.4)",
                        fontSize: "12px",
                        margin: 0,
                      }}
                    >
                      Busca el número ganador de cada premio
                    </p>
                  </div>
                </div>

                {premiosAnticipados.map((premio, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid rgba(242,178,51,0.2)",
                      borderRadius: "14px",
                      padding: "16px",
                      marginBottom: "12px",
                    }}
                  >
                    {/* Header del premio */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "12px",
                      }}
                    >
                      {premio.imagen_url ? (
                        <img
                          src={premio.imagen_url}
                          alt={premio.monto}
                          style={{
                            width: "48px",
                            height: "48px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            border: "1.5px solid rgba(242,178,51,0.3)",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            backgroundColor: "rgba(242,178,51,0.08)",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "24px",
                            flexShrink: 0,
                          }}
                        >
                          🏆
                        </div>
                      )}
                      <div>
                        <p
                          style={{
                            color: "#F2B233",
                            fontWeight: "700",
                            fontSize: "15px",
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
                              margin: 0,
                            }}
                          >
                            {premio.desc}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Buscador del premio */}
                    <form
                      onSubmit={(e) => buscarGanadorPremio(e, i)}
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "10px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Número ganador..."
                        value={busquedasPremios[i] || ""}
                        onChange={(e) =>
                          setBusquedasPremios((prev) => ({
                            ...prev,
                            [i]: e.target.value,
                          }))
                        }
                        style={{
                          flex: 1,
                          backgroundColor: "#0a0a0a",
                          border: "1.5px solid rgba(242,178,51,0.3)",
                          borderRadius: "10px",
                          color: "#F8FAFC",
                          fontSize: "14px",
                          padding: "10px 14px",
                          outline: "none",
                          fontFamily: "Poppins, sans-serif",
                        }}
                      />
                      <button
                        type="submit"
                        disabled={busquedasPremios[`buscando_${i}`]}
                        style={{
                          backgroundColor: "#F2B233",
                          color: "#071521",
                          fontWeight: "700",
                          fontSize: "13px",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "Poppins, sans-serif",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {busquedasPremios[`buscando_${i}`] ? "..." : "🔍 Buscar"}
                      </button>
                    </form>

                    {/* Mensaje error/éxito */}
                    {mensajesPremios[i] && (
                      <p
                        style={{
                          color: mensajesPremios[i].includes("✅")
                            ? "#22C55E"
                            : "#f87171",
                          fontSize: "13px",
                          fontWeight: "600",
                          margin: "0 0 10px",
                          textAlign: "center",
                        }}
                      >
                        {mensajesPremios[i]}
                      </p>
                    )}

                    {/* Ganador encontrado */}
                    {ganadoresPremios[i] && (
                      <div
                        style={{
                          backgroundColor: "rgba(34,197,94,0.05)",
                          border: "1px solid rgba(34,197,94,0.25)",
                          borderRadius: "10px",
                          padding: "12px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "8px",
                          }}
                        >
                          <div>
                            <p
                              style={{
                                color: "#22C55E",
                                fontWeight: "700",
                                fontSize: "15px",
                                margin: "0 0 2px",
                              }}
                            >
                              🏆 {ganadoresPremios[i].nombre}
                            </p>
                            <p
                              style={{
                                color: "rgba(248,250,252,0.5)",
                                fontSize: "12px",
                                margin: "0 0 2px",
                              }}
                            >
                              {ganadoresPremios[i].email}
                            </p>
                            <p
                              style={{
                                color: "rgba(248,250,252,0.4)",
                                fontSize: "11px",
                                margin: 0,
                              }}
                            >
                              CC: {ganadoresPremios[i].cedula} · 📱{" "}
                              {ganadoresPremios[i].telefono}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => notificarGanadorPremio(i)}
                          disabled={
                            notificandoPremio === i ||
                            mensajesPremios[i]?.includes("✅")
                          }
                          style={{
                            width: "100%",
                            background: mensajesPremios[i]?.includes("✅")
                              ? "rgba(34,197,94,0.3)"
                              : "linear-gradient(135deg, #22C55E, #16a34a)",
                            color: "white",
                            fontWeight: "700",
                            fontSize: "14px",
                            padding: "10px",
                            borderRadius: "10px",
                            border: "none",
                            cursor:
                              mensajesPremios[i]?.includes("✅") ||
                              notificandoPremio === i
                                ? "not-allowed"
                                : "pointer",
                            fontFamily: "Poppins, sans-serif",
                          }}
                        >
                          {notificandoPremio === i
                            ? "Enviando..."
                            : mensajesPremios[i]?.includes("✅")
                              ? "✅ Notificado"
                              : "📧 Notificar ganador"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de confirmación */}
      {modalConfirmacion && ganadorEncontrado && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            border: '1.5px solid rgba(34,197,94,0.4)',
            borderRadius: '20px',
            padding: '28px 24px',
            width: '100%',
            maxWidth: '420px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '48px' }}>🏆</span>
            </div>
            <h2 style={{
              color: '#F8FAFC',
              fontSize: '20px',
              fontWeight: '800',
              textAlign: 'center',
              margin: '0 0 16px'
            }}>
              ¿Confirmar ganador?
            </h2>
            <div style={{
              backgroundColor: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <p style={{
                color: '#22C55E',
                fontWeight: '700',
                fontSize: '18px',
                margin: '0 0 4px'
              }}>
                {ganadorEncontrado.nombre}
              </p>
              <p style={{
                color: 'rgba(248,250,252,0.6)',
                fontSize: '13px',
                margin: '0 0 2px'
              }}>
                {ganadorEncontrado.email}
              </p>
              <p style={{
                color: '#F2B233',
                fontSize: '14px',
                fontWeight: '700',
                margin: 0
              }}>
                Número ganador: {numeroGanador}
              </p>
            </div>
            <p style={{
              color: 'rgba(248,250,252,0.5)',
              fontSize: '13px',
              textAlign: 'center',
              margin: '0 0 20px'
            }}>
              Se enviará un email de notificación al ganador.
              Esta acción no se puede deshacer.
            </p>
            <button
              onClick={notificarGanador}
              disabled={notificando}
              style={{
                width: '100%',
                background: notificando
                  ? 'rgba(34,197,94,0.4)'
                  : 'linear-gradient(135deg, #22C55E, #16a34a)',
                color: 'white',
                fontWeight: '800',
                fontSize: '16px',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                cursor: notificando ? 'not-allowed' : 'pointer',
                marginBottom: '10px',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              {notificando ? 'Enviando...' : '✅ Sí, notificar ganador'}
            </button>
            <button
              onClick={() => setModalConfirmacion(false)}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                color: 'rgba(248,250,252,0.5)',
                fontSize: '14px',
                padding: '12px',
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {sorteando && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 text-center">
            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xl text-white">Sorteando...</p>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">
              Confirmar sorteo
            </h3>
            <p className="text-zinc-400 mb-6">
              ¿Confirmas realizar el sorteo? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarSorteo}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {ganador && !sorteando && (
        <div className="bg-zinc-900 border-2 border-amber-500 rounded-xl p-8">
          <h2 className="text-2xl font-semibold text-amber-400 mb-6 text-center">
            🏆 ¡Ganador del sorteo!
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div>
              <p className="text-zinc-400 text-sm">Nombre</p>
              <p className="text-lg text-white font-medium">{ganador.nombre}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Número ganador</p>
              <p className="text-lg text-amber-400 font-mono font-bold">
                {ganador.numero_boleto}
              </p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Email</p>
              <p className="text-lg text-white">{ganador.email}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Teléfono</p>
              <p className="text-lg text-white">{ganador.telefono}</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <button
              onClick={notificarGanadorSorteo}
              disabled={notificando || emailSorteoEnviado}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {emailSorteoEnviado
                ? "✓ Email enviado"
                : notificando
                ? "Enviando..."
                : "Notificar ganador por email"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {historial.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <h2 className="text-lg font-semibold text-white p-6 border-b border-zinc-800">
            Historial de sorteos
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Ganador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {historial.map((s) => {
                  const estado = notificados[s.id];
                  const loading = estado === "loading";
                  const success = estado === "success";
                  const errorSorteo = typeof estado === "object" && estado?.error;
                  const isError = estado === "error" || errorSorteo;
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                    >
                      <td className="px-6 py-4 text-white">
                        {s.participante_nombre || "—"}
                      </td>
                      <td className="px-6 py-4 text-amber-400 font-mono">
                        {s.numero_boleto || "—"}
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        {s.participante_email || "—"}
                      </td>
                      <td className="px-6 py-4 text-zinc-400 text-sm">
                        {formatFecha(s.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={async () => {
                            setNotificados((prev) => ({
                              ...prev,
                              [s.id]: "loading",
                            }));
                            const auth = await getAdminAuthHeaders();
                            fetch("/api/admin/notificar-ganador", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                ...auth,
                              },
                              body: JSON.stringify({ sorteo_id: s.id }),
                            })
                              .then(async (res) => {
                                const data = await res.json();
                                if (!res.ok)
                                  throw new Error(data.error || "Error enviando email");
                                return data;
                              })
                              .then(() => {
                                setNotificados((prev) => ({
                                  ...prev,
                                  [s.id]: "success",
                                }));
                              })
                              .catch((err) => {
                                setNotificados((prev) => ({
                                  ...prev,
                                  [s.id]: { error: err.message },
                                }));
                              });
                          }}
                          disabled={loading || success}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium disabled:cursor-not-allowed ${
                            success
                              ? "bg-green-500/20 text-green-400"
                              : isError
                              ? "bg-red-500/20 text-red-400"
                              : loading
                              ? "bg-zinc-600 text-zinc-400"
                              : "bg-amber-500 hover:bg-amber-400 text-zinc-950"
                          }`}
                        >
                          {success
                            ? "✓ Enviado"
                            : loading
                            ? "Enviando..."
                            : isError
                            ? errorSorteo || "Error"
                            : "Notificar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
