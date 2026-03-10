'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

function FormularioContent() {
  const searchParams = useSearchParams()

  const cantidad = searchParams.get('cantidad') || '1'
  const monto = searchParams.get('monto') || '0'
  const divisa = searchParams.get('divisa') || 'COP'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nombre: '',
    cedula: '',
    email: '',
    telefono: '',
    ciudad: ''
  })
  const [mostrarTerminos, setMostrarTerminos] = useState(false)
  const [checks, setChecks] = useState({
    mayorEdad: false,
    terminos: false,
    sorteoLegal: false,
    noReembolso: false
  })
  const [initPoint, setInitPoint] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Buscar la rifa activa
      const { data: rifa, error: rifaError } = await supabase
        .from('rifas')
        .select('*')
        .eq('estado', 'activa')
        .single()

      if (rifaError || !rifa) throw new Error('No hay rifa activa')

      // Guardar participante
      const { data: participante, error: partError } = await supabase
        .from('participantes')
        .insert({
          nombre: form.nombre,
          cedula: form.cedula,
          email: form.email,
          telefono: form.telefono,
          ciudad: form.ciudad,
          cantidad_boletos: parseInt(cantidad),
          total_pagado: parseInt(String(monto).replace(/\D/g, '')),
          rifa_id: rifa.id,
          estado_pago: 'pendiente'
        })
        .select()
        .single()

      if (partError) throw new Error('Error al guardar datos')

      // Crear preferencia MercadoPago
      const res = await fetch('/api/crear-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participante_id: participante.id,
          cantidad: parseInt(cantidad),
          monto: parseInt(String(monto).replace(/\D/g, '')),
          nombre: form.nombre,
          email: form.email,
          rifa_id: rifa.id
        })
      })

      const { init_point, error: mpError } = await res.json()
      if (mpError) throw new Error(mpError)

      setInitPoint(init_point)
      setMostrarTerminos(true)
      setLoading(false)

    } catch (err) {
      setError(err.message || 'Ocurrió un error. Intenta de nuevo.')
      setLoading(false)
    }
  }

  const handleCheck = (key) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const todosAceptados = Object.values(checks).every(v => v === true)

  const handleAceptar = () => {
    if (todosAceptados) {
      window.location.href = initPoint
    }
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

  const labelStyle = {
    color: 'rgba(248,250,252,0.7)',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '4px',
    display: 'block'
  }

  return (
    <>
      {mostrarTerminos && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '0'
        }}>
          <div style={{
            backgroundColor: '#0a0a0a',
            border: '1.5px solid rgba(242,178,51,0.4)',
            borderRadius: '20px 20px 0 0',
            padding: '24px 16px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>

            {/* Header modal */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '32px' }}>📋</span>
              <h2 style={{
                color: '#F2B233',
                fontSize: '20px',
                fontWeight: '800',
                margin: '8px 0 4px'
              }}>
                Términos y Condiciones
              </h2>
              <p style={{
                color: 'rgba(248,250,252,0.5)',
                fontSize: '13px'
              }}>
                Lee y acepta antes de continuar al pago
              </p>
            </div>

            {/* Texto de T&C */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(242,178,51,0.15)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '20px',
              fontSize: '13px',
              color: 'rgba(248,250,252,0.7)',
              lineHeight: '1.6'
            }}>
              <p style={{ fontWeight: '700', color: '#F2B233', marginBottom: '8px' }}>
                1. Participación y elegibilidad
              </p>
              <p style={{ marginBottom: '10px' }}>
                La participación en los sorteos de RIFEX está abierta a personas mayores
                de 18 años. Al adquirir tickets, el participante confirma que cumple con
                este requisito y que la información proporcionada es veraz y verificable.
              </p>

              <p style={{ fontWeight: '700', color: '#F2B233', marginBottom: '8px' }}>
                2. Adquisición de tickets
              </p>
              <p style={{ marginBottom: '10px' }}>
                Cada ticket otorga una oportunidad de participación en el sorteo.
                Los tickets son personales e intransferibles. El número asignado
                será enviado al correo electrónico registrado una vez confirmado el pago.
              </p>

              <p style={{ fontWeight: '700', color: '#F2B233', marginBottom: '8px' }}>
                3. Proceso de pago
              </p>
              <p style={{ marginBottom: '10px' }}>
                Los pagos se procesan a través de MercadoPago, plataforma oficial
                y certificada. RIFEX no almacena información de tarjetas ni datos
                bancarios. El ticket se activa únicamente tras confirmación exitosa
                del pago.
              </p>

              <p style={{ fontWeight: '700', color: '#F2B233', marginBottom: '8px' }}>
                4. Política de no reembolso
              </p>
              <p style={{ marginBottom: '10px' }}>
                Una vez procesado el pago y asignados los números, no se realizan
                reembolsos bajo ninguna circunstancia. El participante acepta esta
                condición de forma expresa al completar la compra.
              </p>

              <p style={{ fontWeight: '700', color: '#F2B233', marginBottom: '8px' }}>
                5. Realización del sorteo
              </p>
              <p style={{ marginBottom: '10px' }}>
                El sorteo se realizará en transmisión en vivo a través de los canales
                oficiales de RIFEX en la fecha anunciada. El resultado es definitivo,
                público y verificable. RIFEX se reserva el derecho de modificar la
                fecha del sorteo por causas de fuerza mayor.
              </p>

              <p style={{ fontWeight: '700', color: '#F2B233', marginBottom: '8px' }}>
                6. Premio
              </p>
              <p style={{ marginBottom: '10px' }}>
                El premio será entregado al ganador previa verificación de identidad
                mediante documento oficial. Los gastos de trámites, impuestos o
                transferencia del premio corren por cuenta del ganador salvo
                indicación expresa de RIFEX.
              </p>

              <p style={{ fontWeight: '700', color: '#F2B233', marginBottom: '8px' }}>
                7. Privacidad de datos
              </p>
              <p>
                Los datos personales recopilados serán utilizados exclusivamente
                para gestionar la participación y contactar al ganador. RIFEX no
                compartirá ni venderá información personal a terceros.
              </p>
            </div>

            {/* Checkboxes */}
            <div style={{ marginBottom: '20px' }}>
              {[
                { key: 'mayorEdad', texto: 'Confirmo que soy mayor de 18 años' },
                { key: 'terminos', texto: 'He leído y acepto los Términos y Condiciones de RIFEX' },
                { key: 'sorteoLegal', texto: 'Entiendo que el sorteo es en vivo y el resultado es definitivo' },
                { key: 'noReembolso', texto: 'Acepto que no aplican reembolsos una vez procesado el pago' }
              ].map(({ key, texto }) => (
                <div
                  key={key}
                  onClick={() => handleCheck(key)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: checks[key]
                      ? 'rgba(34,197,94,0.1)'
                      : 'rgba(255,255,255,0.04)',
                    border: checks[key]
                      ? '1.5px solid rgba(34,197,94,0.5)'
                      : '1.5px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '22px',
                    height: '22px',
                    minWidth: '22px',
                    borderRadius: '6px',
                    backgroundColor: checks[key] ? '#22C55E' : 'transparent',
                    border: checks[key]
                      ? '2px solid #22C55E'
                      : '2px solid rgba(248,250,252,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '1px'
                  }}>
                    {checks[key] && (
                      <span style={{ color: 'white', fontSize: '14px', fontWeight: '800' }}>✓</span>
                    )}
                  </div>
                  <span style={{
                    color: checks[key] ? '#F8FAFC' : 'rgba(248,250,252,0.6)',
                    fontSize: '13px',
                    lineHeight: '1.4'
                  }}>
                    {texto}
                  </span>
                </div>
              ))}
            </div>

            {/* Botones */}
            <button
              onClick={handleAceptar}
              disabled={!todosAceptados}
              style={{
                width: '100%',
                background: todosAceptados
                  ? 'linear-gradient(135deg, #22C55E 0%, #16a34a 100%)'
                  : 'rgba(255,255,255,0.1)',
                color: todosAceptados ? 'white' : 'rgba(255,255,255,0.3)',
                fontWeight: '800',
                fontSize: '17px',
                padding: '18px',
                borderRadius: '14px',
                border: 'none',
                cursor: todosAceptados ? 'pointer' : 'not-allowed',
                boxShadow: todosAceptados
                  ? '0 4px 20px rgba(34,197,94,0.4)'
                  : 'none',
                marginBottom: '10px',
                fontFamily: 'Poppins, sans-serif',
                transition: 'all 0.3s ease'
              }}
            >
              {todosAceptados ? 'Aceptar e ir a pagar →' : 'Acepta todas las condiciones'}
            </button>

            <button
              onClick={() => setMostrarTerminos(false)}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                color: 'rgba(248,250,252,0.4)',
                fontSize: '14px',
                padding: '12px',
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              Volver al formulario
            </button>

          </div>
        </div>
      )}

    <div style={{
      minHeight: '100vh',
      backgroundImage: "url('/fondo_principalino.jpeg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      padding: '16px',
      fontFamily: 'Poppins, sans-serif'
    }}>

      {/* Header con logo */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <img 
          src="/logo_principal.png" 
          alt="RIFEX" 
          style={{ height: '48px', objectFit: 'contain' }} 
        />
      </div>

      {/* Resumen del pedido */}
      <div style={{
        backgroundColor: 'rgba(10,10,10,0.85)',
        border: '1.5px solid rgba(242,178,51,0.4)',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <h2 style={{ 
          color: '#F2B233', 
          fontSize: '16px', 
          fontWeight: '700',
          marginBottom: '12px',
          textAlign: 'center'
        }}>
          Resumen de tu pedido
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: 'rgba(248,250,252,0.6)', fontSize: '14px' }}>Tickets</span>
          <span style={{ color: '#F8FAFC', fontWeight: '700', fontSize: '14px' }}>{cantidad}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: 'rgba(248,250,252,0.6)', fontSize: '14px' }}>Divisa</span>
          <span style={{ color: '#F2B233', fontWeight: '700', fontSize: '14px' }}>{divisa}</span>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(242,178,51,0.2)',
          paddingTop: '10px'
        }}>
          <span style={{ color: 'rgba(248,250,252,0.6)', fontSize: '14px' }}>Total</span>
          <span style={{ color: '#22C55E', fontWeight: '800', fontSize: '18px' }}>{monto}</span>
        </div>
      </div>

      {/* Formulario */}
      <div style={{
        backgroundColor: 'rgba(10,10,10,0.85)',
        border: '1.5px solid rgba(242,178,51,0.2)',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <h2 style={{
          color: '#F8FAFC',
          fontSize: '18px',
          fontWeight: '700',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          Tus datos
        </h2>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Nombre completo</label>
          <input
            style={inputStyle}
            type="text"
            name="nombre"
            placeholder="Tu nombre completo"
            value={form.nombre}
            onChange={handleChange}
            required
          />

          <label style={labelStyle}>Cédula / Documento</label>
          <input
            style={inputStyle}
            type="text"
            name="cedula"
            placeholder="Número de documento"
            value={form.cedula}
            onChange={handleChange}
            required
          />

          <label style={labelStyle}>Email</label>
          <input
            style={inputStyle}
            type="email"
            name="email"
            placeholder="tu@email.com"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label style={labelStyle}>Teléfono / WhatsApp</label>
          <input
            style={inputStyle}
            type="tel"
            name="telefono"
            placeholder="Tu número de WhatsApp"
            value={form.telefono}
            onChange={handleChange}
            required
          />

          <label style={labelStyle}>Ciudad / Departamento</label>
          <input
            style={inputStyle}
            type="text"
            name="ciudad"
            placeholder="Tu ciudad"
            value={form.ciudad}
            onChange={handleChange}
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
            disabled={loading}
            style={{
              width: '100%',
              background: loading 
                ? 'rgba(34,197,94,0.5)' 
                : 'linear-gradient(135deg, #22C55E 0%, #16a34a 100%)',
              color: 'white',
              fontWeight: '800',
              fontSize: '18px',
              padding: '18px 16px',
              borderRadius: '14px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px rgba(34,197,94,0.4)',
              fontFamily: 'Poppins, sans-serif',
              marginTop: '4px'
            }}
          >
            {loading ? 'Procesando...' : 'Ir a pagar →'}
          </button>
        </form>
      </div>

      {/* Sello de seguridad */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <span style={{ 
          color: 'rgba(248,250,252,0.4)', 
          fontSize: '12px' 
        }}>
          🔒 Pago 100% seguro · MercadoPago oficial
        </span>
      </div>

    </div>
    </>
  )
}

export default function Formulario() {
  return (
    <Suspense fallback={
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#071521',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <span style={{ color: '#F2B233', fontSize: '16px' }}>Cargando...</span>
      </div>
    }>
      <FormularioContent />
    </Suspense>
  )
}
