'use client'
import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function MisTickets() {
  const [cedula, setCedula] = useState('')
  const [email, setEmail] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState('')
  const [resultados, setResultados] = useState(null)

  const buscarTickets = async (e) => {
    e.preventDefault()
    if (!cedula.trim() || !email.trim()) {
      setError('Ingresa tu cédula y email')
      return
    }
    setBuscando(true)
    setError('')
    setResultados(null)

    try {
      // Buscar participante por cédula y email
      const { data: participantes, error: err } = await supabaseBrowser
        .from('participantes')
        .select(`
          id,
          nombre,
          cedula,
          email,
          cantidad_boletos,
          total_pagado,
          estado_pago,
          created_at,
          rifa_id,
          rifas (
            id,
            nombre,
            precio_boleto,
            estado
          )
        `)
        .eq('cedula', cedula.trim())
        .eq('email', email.trim().toLowerCase())
        .order('created_at', { ascending: false })

      if (err) throw new Error('Error al buscar tickets')

      if (!participantes || participantes.length === 0) {
        setError('No encontramos tickets con esos datos. Verifica tu cédula y email.')
        setBuscando(false)
        return
      }

      // Por cada participante buscar sus boletos
      const resultadosConBoletos = await Promise.all(
        participantes.map(async (p) => {
          const { data: boletos } = await supabaseBrowser
            .from('boletos')
            .select('numero')
            .eq('participante_id', p.id)
            .order('numero', { ascending: true })

          return { ...p, boletos: boletos || [] }
        })
      )

      setResultados(resultadosConBoletos)
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

            {resultados.map((p) => (
              <div key={p.id} style={{
                backgroundColor: 'rgba(10,10,10,0.85)',
                border: '1.5px solid rgba(242,178,51,0.3)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '12px'
              }}>

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
                      marginBottom: '8px'
                    }}>
                      Tus números asignados:
                    </p>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px'
                    }}>
                      {p.boletos.map((b, i) => (
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
                      ))}
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
            ))}
          </div>
        )}

        {/* Volver y logo */}
        <div style={{ textAlign: 'center', marginTop: '16px', paddingBottom: '32px' }}>
          <a href="/" style={{
            color: 'rgba(248,250,252,0.4)',
            fontSize: '13px',
            textDecoration: 'none'
          }}>
            ← Volver al inicio
          </a>
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
