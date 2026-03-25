'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function MisTickets() {
  const [cedula, setCedula] = useState('')
  const [email, setEmail] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState('')
  const [resultados, setResultados] = useState(null)
  const [numerosBendecidos, setNumerosBendecidos] = useState([])
  const [busquedaNumeroInput, setBusquedaNumeroInput] = useState({})
  const [busquedaNumeroEstado, setBusquedaNumeroEstado] = useState({})

  const buscarTickets = async (e) => {
    e.preventDefault()
    if (!cedula.trim() || !email.trim()) {
      setError('Ingresa tu cédula y email')
      return
    }
    setBuscando(true)
    setError('')
    setResultados(null)
    setNumerosBendecidos([])
    setBusquedaNumeroInput({})
    setBusquedaNumeroEstado({})

    try {
      const res = await fetch('/api/mis-tickets/buscar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cedula: cedula.trim(),
          email: email.trim().toLowerCase(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Error al buscar tickets')
      }
      const enriched = Array.isArray(data.resultados) ? data.resultados : []

      if (enriched.length === 0) {
        setError('No encontramos tickets con esos datos. Verifica tu cédula y email.')
        setBuscando(false)
        return
      }

      setNumerosBendecidos(enriched.map((x) => x.numeros_bendecidos || []))
      setResultados(enriched)
    } catch (err) {
      setError(err.message || 'Error al buscar. Intenta de nuevo.')
    } finally {
      setBuscando(false)
    }
  }

  const estadoColor = (estado) => {
    if (estado === 'aprobado') return '#22C55E'
    if (estado === 'pendiente') return '#F2B233'
    if (estado === 'rechazado') return '#ef4444'
    return '#F8FAFC'
  }

  const estadoTexto = (estado) => {
    if (estado === 'aprobado') return '✅ Pago aprobado'
    if (estado === 'pendiente') return '⏳ Pago pendiente'
    if (estado === 'rechazado') return '❌ Pago rechazado'
    return estado
  }

  const inputStyle = {
    width: '100%',
    backgroundColor: '#0a0a0a',
    border: '1.5px solid rgba(242,178,51,0.4)',
    borderRadius: '12px',
    color: '#F8FAFC',
    fontSize: '16px',
    padding: '14px 16px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Poppins, sans-serif',
    marginBottom: '12px'
  }

  const buscarNumeroEnTickets = (p) => {
    const raw = String(busquedaNumeroInput[p.id] ?? '').trim()
    if (!raw) return
    const set = new Set(
      (p.boletos || []).map((b) => String(b.numero ?? '').trim())
    )
    const ok = set.has(raw)
    setBusquedaNumeroEstado((prev) => ({
      ...prev,
      [p.id]: { ok, numero: raw },
    }))
  }

  const bendecidosParaParticipacion = (p, idx) => {
    if (Array.isArray(p.numeros_bendecidos)) return p.numeros_bendecidos
    return numerosBendecidos[idx] || []
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: "url('/fondo_principalino.jpeg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      padding: '16px',
      fontFamily: 'Poppins, sans-serif'
    }}>

      {/* Overlay oscuro */}
      <div style={{
        position: 'fixed', top: 0, left: 0,
        right: 0, bottom: 0,
        backgroundColor: 'rgba(7,21,33,0.75)',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px', paddingTop: '16px' }}>
          <h1 style={{
            color: '#F8FAFC',
            fontSize: '22px',
            fontWeight: '800',
            margin: '0 0 4px'
          }}>
            Mis tickets
          </h1>
          <p style={{
            color: 'rgba(248,250,252,0.5)',
            fontSize: '13px',
            margin: 0
          }}>
            Consulta tus números de participación
          </p>
        </div>

        {/* Formulario de búsqueda */}
        <div style={{
          backgroundColor: 'rgba(10,10,10,0.85)',
          border: '1.5px solid rgba(242,178,51,0.3)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px'
        }}>
          <form onSubmit={buscarTickets}>
            <label style={{
              color: 'rgba(248,250,252,0.7)',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '4px',
              display: 'block'
            }}>
              Número de cédula
            </label>
            <input
              style={inputStyle}
              type="text"
              placeholder="Tu número de cédula"
              value={cedula}
              onChange={e => setCedula(e.target.value)}
              required
            />

            <label style={{
              color: 'rgba(248,250,252,0.7)',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '4px',
              display: 'block'
            }}>
              Email
            </label>
            <input
              style={inputStyle}
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            {error && (
              <div style={{
                backgroundColor: 'rgba(220,38,38,0.15)',
                border: '1px solid rgba(220,38,38,0.4)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#fca5a5',
                fontSize: '13px',
                marginBottom: '12px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={buscando}
              style={{
                width: '100%',
                background: buscando
                  ? 'rgba(242,178,51,0.4)'
                  : 'linear-gradient(135deg, #F2B233 0%, #FFD166 100%)',
                color: '#071521',
                fontWeight: '800',
                fontSize: '17px',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                cursor: buscando ? 'not-allowed' : 'pointer',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              {buscando ? 'Buscando...' : '🔍 Buscar mis tickets'}
            </button>
          </form>
        </div>

        {/* Resultados */}
        {resultados && resultados.length > 0 && (
          <div>
            <p style={{
              color: 'rgba(248,250,252,0.6)',
              fontSize: '13px',
              textAlign: 'center',
              marginBottom: '12px'
            }}>
              Encontramos {resultados.length} participación{resultados.length > 1 ? 'es' : ''}
              {' '}para <strong style={{ color: '#F2B233' }}>{resultados[0].nombre}</strong>
            </p>

            {resultados.map((p, idx) => {
              const bendecidos = bendecidosParaParticipacion(p, idx)
              const tieneBendecido =
                (p.boletos || []).length > 0 &&
                (p.boletos || []).some((b) =>
                  bendecidos.includes(String(b.numero ?? '').trim())
                )
              const busqEstado = busquedaNumeroEstado[p.id]

              return (
              <div key={p.id} style={{
                backgroundColor: 'rgba(10,10,10,0.85)',
                border: '1.5px solid rgba(242,178,51,0.3)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '16px'
              }}>

                {tieneBendecido && (
                  <div style={{
                    backgroundColor: '#F2B233',
                    color: '#071521',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '16px',
                    fontSize: '13px',
                    fontWeight: '700',
                    textAlign: 'center',
                    lineHeight: 1.45,
                    border: '2px solid rgba(255,255,255,0.35)',
                    boxShadow: '0 0 12px rgba(242,178,51,0.45)'
                  }}>
                    🎉 ¡Felicidades! Tienes un número bendecido. Serás contactado por nuestro equipo.
                  </div>
                )}

                {/* Nombre rifa y estado */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div>
                    <p style={{
                      color: '#F2B233',
                      fontWeight: '700',
                      fontSize: '16px',
                      margin: '0 0 2px'
                    }}>
                      {p.rifas?.nombre || 'Sorteo RIFEX'}
                    </p>
                    <p style={{
                      color: 'rgba(248,250,252,0.5)',
                      fontSize: '11px',
                      margin: 0
                    }}>
                      {new Date(p.created_at).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <span style={{
                    backgroundColor: p.estado_pago === 'aprobado'
                      ? 'rgba(34,197,94,0.15)'
                      : p.estado_pago === 'pendiente'
                      ? 'rgba(242,178,51,0.15)'
                      : 'rgba(239,68,68,0.15)',
                    border: `1px solid ${estadoColor(p.estado_pago)}`,
                    borderRadius: '999px',
                    padding: '4px 10px',
                    color: estadoColor(p.estado_pago),
                    fontSize: '11px',
                    fontWeight: '700',
                    whiteSpace: 'nowrap'
                  }}>
                    {estadoTexto(p.estado_pago)}
                  </span>
                </div>

                {/* Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    backgroundColor: 'rgba(242,178,51,0.08)',
                    border: '1px solid rgba(242,178,51,0.2)',
                    borderRadius: '10px',
                    padding: '10px',
                    textAlign: 'center'
                  }}>
                    <p style={{
                      color: '#F2B233',
                      fontSize: '22px',
                      fontWeight: '800',
                      margin: '0 0 2px'
                    }}>
                      {p.cantidad_boletos}
                    </p>
                    <p style={{
                      color: 'rgba(248,250,252,0.5)',
                      fontSize: '11px',
                      margin: 0
                    }}>
                      Tickets
                    </p>
                  </div>
                  <div style={{
                    backgroundColor: 'rgba(34,197,94,0.08)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: '10px',
                    padding: '10px',
                    textAlign: 'center'
                  }}>
                    <p style={{
                      color: '#22C55E',
                      fontSize: '16px',
                      fontWeight: '800',
                      margin: '0 0 2px'
                    }}>
                      ${Number(p.total_pagado).toLocaleString('es-CO')}
                    </p>
                    <p style={{
                      color: 'rgba(248,250,252,0.5)',
                      fontSize: '11px',
                      margin: 0
                    }}>
                      Total pagado
                    </p>
                  </div>
                </div>

                {/* Números asignados */}
                {p.boletos && p.boletos.length > 0 && (
                  <div>
                    <p style={{
                      color: 'rgba(248,250,252,0.6)',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginBottom: '12px'
                    }}>
                      Tus números asignados:
                    </p>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      {p.boletos.map((b, i) => {
                        const numStr = String(b.numero ?? '').trim()
                        const esBendecido = bendecidos.includes(numStr)
                        if (esBendecido) {
                          return (
                            <div
                              key={i}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <span style={{
                                backgroundColor: '#F2B233',
                                border: '2px solid #FFF8E1',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                color: '#071521',
                                fontSize: '15px',
                                fontWeight: '800',
                                fontFamily: 'ui-monospace, Consolas, monospace',
                                boxShadow: '0 0 10px rgba(242,178,51,0.65)'
                              }}>
                                ✨ {numStr}
                              </span>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: '700',
                                color: 'rgba(248,250,252,0.75)'
                              }}>
                                ¡Número bendecido! 🎉
                              </span>
                            </div>
                          )
                        }
                        return (
                          <span key={i} style={{
                            backgroundColor: '#0B1F33',
                            border: '1.5px solid rgba(242,178,51,0.5)',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            color: '#F2B233',
                            fontSize: '14px',
                            fontWeight: '700'
                          }}>
                            {b.numero}
                          </span>
                        )
                      })}
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      <p style={{
                        color: 'rgba(248,250,252,0.55)',
                        fontSize: '11px',
                        fontWeight: '600',
                        marginBottom: '12px'
                      }}>
                        Buscar entre tus números
                      </p>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        alignItems: 'stretch'
                      }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="Busca un número ej: 1234-56"
                          value={busquedaNumeroInput[p.id] ?? ''}
                          onChange={(e) => {
                            const v = e.target.value
                            setBusquedaNumeroInput((prev) => ({
                              ...prev,
                              [p.id]: v
                            }))
                            setBusquedaNumeroEstado((prev) => {
                              const next = { ...prev }
                              delete next[p.id]
                              return next
                            })
                          }}
                          style={{
                            ...inputStyle,
                            flex: '1 1 200px',
                            minWidth: 0,
                            marginBottom: 0
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => buscarNumeroEnTickets(p)}
                          style={{
                            flex: '0 0 auto',
                            padding: '14px 20px',
                            borderRadius: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: '800',
                            fontSize: '15px',
                            background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                            color: '#071521'
                          }}
                        >
                          Buscar
                        </button>
                      </div>
                      {busqEstado && (
                        <p style={{
                          marginTop: '12px',
                          marginBottom: 0,
                          fontSize: '13px',
                          fontWeight: '700',
                          textAlign: 'center',
                          color: busqEstado.ok ? '#22C55E' : '#f87171'
                        }}>
                          {busqEstado.ok
                            ? `✅ El número ${busqEstado.numero} está entre tus tickets`
                            : `❌ El número ${busqEstado.numero} no está entre tus tickets`}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Sin boletos asignados aún */}
                {(!p.boletos || p.boletos.length === 0) && (
                  <p style={{
                    color: 'rgba(248,250,252,0.4)',
                    fontSize: '12px',
                    textAlign: 'center',
                    margin: '8px 0 0',
                    fontStyle: 'italic'
                  }}>
                    Números pendientes de asignación
                  </p>
                )}

              </div>
              )
            })}
          </div>
        )}

        {/* Volver y logo */}
        <div style={{ textAlign: 'center', marginTop: '16px', paddingBottom: '32px' }}>
          <Link href="/" style={{
            color: 'rgba(248,250,252,0.4)',
            fontSize: '13px',
            textDecoration: 'none'
          }}>
            ← Volver al inicio
          </Link>
          <img
            src="/logo_principal.png"
            alt="RIFEX"
            style={{ display: 'block', height: '384px', objectFit: 'contain', margin: '24px auto 0' }}
          />
        </div>

      </div>
    </div>
  )
}
