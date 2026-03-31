'use client'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

/** Si es true, tras el registro se ofrece pago por WhatsApp en lugar de Mercado Pago */
const PAGO_WHATSAPP_ACTIVO = true

function construirUrlWhatsappPago({
  participanteId,
  nombre,
  email,
  cedula,
  cantidad,
  total,
}) {
  const lineas = [
    'Hola RIFEX! Quiero pagar mis tickets.',
    `Nombre: ${nombre}`,
    `Email: ${email}`,
    `Cédula: ${cedula}`,
    `Cantidad: ${cantidad} tickets`,
    `Total: $${Number(total).toLocaleString('es-CO')} COP`,
    `ID de reserva: ${participanteId}`,
  ]
  const text = lineas.join('\n')
  return `https://wa.me/573114405488?text=${encodeURIComponent(text)}`
}

function FormularioContent() {
  const router = useRouter()
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
  const [confirmoMayorEdad, setConfirmoMayorEdad] = useState(false)
  const [initPoint, setInitPoint] = useState('')
  const [reservaWhatsapp, setReservaWhatsapp] = useState(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function abrirWhatsappPago() {
    if (!reservaWhatsapp) return
    const url = construirUrlWhatsappPago({
      participanteId: reservaWhatsapp.participanteId,
      nombre: reservaWhatsapp.nombre,
      email: reservaWhatsapp.email,
      cedula: reservaWhatsapp.cedula,
      cantidad: reservaWhatsapp.cantidad,
      total: reservaWhatsapp.total,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const regRes = await fetch('/api/registro-participante', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          cedula: form.cedula,
          email: form.email,
          telefono: form.telefono,
          ciudad: form.ciudad,
          cantidad: parseInt(cantidad, 10),
          monto: parseInt(String(monto).replace(/\D/g, ''), 10),
        }),
      })
      const regData = await regRes.json().catch(() => ({}))
      if (!regRes.ok) {
        throw new Error(regData.error || 'Error al guardar datos')
      }
      const participante = regData.participante
      if (!participante?.id) {
        throw new Error('Error al guardar datos')
      }

      if (PAGO_WHATSAPP_ACTIVO) {
        setReservaWhatsapp({
          participanteId: participante.id,
          nombre: String(form.nombre || '').trim(),
          email: participante.email,
          cedula: String(form.cedula || '').trim(),
          cantidad: parseInt(cantidad, 10),
          total: parseInt(String(monto).replace(/\D/g, ''), 10),
        })
        setLoading(false)
        return
      }

      const res = await fetch('/api/crear-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participante_id: participante.id,
          cantidad: parseInt(cantidad, 10),
          monto: parseInt(String(monto).replace(/\D/g, ''), 10),
          nombre: form.nombre,
          email: participante.email,
          rifa_id: participante.rifa_id,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Error al procesar el pago')
      }

      const { init_point, error: mpError } = await res.json()
      if (mpError) throw new Error(mpError)
      if (!init_point) throw new Error('No se recibió enlace de pago')

      setInitPoint(init_point)
      setMostrarTerminos(true)
      setLoading(false)

    } catch (err) {
      setError(err.message || 'Ocurrió un error. Intenta de nuevo.')
      setLoading(false)
    }
  }

  const handleAceptar = () => {
    if (confirmoMayorEdad) {
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
      <style>{`
        @keyframes bounceDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
        .formulario-activar-acceso-flecha {
          display: inline-block;
          animation: bounceDown 1s ease-in-out infinite;
        }
      `}</style>
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
                Los tickets son personales e intransferibles. Los números asignados
                serán enviados al correo electrónico registrado una vez confirmado el pago.
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
                El número ganador se determina usando el resultado de una lotería oficial,
                la cual será anunciada previamente a los participantes. Se toman los 4 dígitos
                principales del número ganador y los 2 últimos dígitos del serial, formando
                así el número ganador RIFEX en formato 0000-00. El resultado es definitivo,
                público y verificable.
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

            {/* Checkbox mayoría de edad */}
            <div style={{ marginBottom: '20px' }}>
              <div
                role="checkbox"
                tabIndex={0}
                aria-checked={confirmoMayorEdad}
                onClick={() => setConfirmoMayorEdad((v) => !v)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setConfirmoMayorEdad((v) => !v)
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: confirmoMayorEdad
                    ? 'rgba(34,197,94,0.1)'
                    : 'rgba(255,255,255,0.04)',
                  border: confirmoMayorEdad
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
                  backgroundColor: confirmoMayorEdad ? '#22C55E' : 'transparent',
                  border: confirmoMayorEdad
                    ? '2px solid #22C55E'
                    : '2px solid rgba(248,250,252,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '1px'
                }}>
                  {confirmoMayorEdad && (
                    <span style={{ color: 'white', fontSize: '14px', fontWeight: '800' }}>✓</span>
                  )}
                </div>
                <span style={{
                  color: confirmoMayorEdad ? '#F8FAFC' : 'rgba(248,250,252,0.6)',
                  fontSize: '13px',
                  lineHeight: '1.4'
                }}>
                  Confirmo que soy mayor de 18 años
                </span>
              </div>
            </div>

            {/* Botones */}
            <button
              onClick={handleAceptar}
              disabled={!confirmoMayorEdad}
              style={{
                width: '100%',
                background: confirmoMayorEdad
                  ? 'linear-gradient(135deg, #22C55E 0%, #16a34a 100%)'
                  : 'rgba(255,255,255,0.1)',
                color: confirmoMayorEdad ? 'white' : 'rgba(255,255,255,0.3)',
                fontWeight: '800',
                fontSize: '17px',
                padding: '18px',
                borderRadius: '14px',
                border: 'none',
                cursor: confirmoMayorEdad ? 'pointer' : 'not-allowed',
                boxShadow: confirmoMayorEdad
                  ? '0 4px 20px rgba(34,197,94,0.4)'
                  : 'none',
                marginBottom: '10px',
                fontFamily: 'Poppins, sans-serif',
                transition: 'all 0.3s ease'
              }}
            >
              {confirmoMayorEdad ? 'Aceptar e ir a pagar →' : 'Acepta todas las condiciones'}
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
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            color: 'rgba(248,250,252,0.6)',
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '8px 0',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          ← Volver
        </button>
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
              background: PAGO_WHATSAPP_ACTIVO
                ? loading
                  ? 'rgba(242,178,51,0.5)'
                  : '#F2B233'
                : loading
                  ? 'rgba(34,197,94,0.5)'
                  : 'linear-gradient(135deg, #22C55E 0%, #16a34a 100%)',
              color: PAGO_WHATSAPP_ACTIVO ? '#071521' : 'white',
              fontWeight: '800',
              fontSize: '18px',
              padding: '18px 16px',
              borderRadius: '14px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: PAGO_WHATSAPP_ACTIVO
                ? '0 4px 20px rgba(242,178,51,0.4)'
                : '0 4px 20px rgba(34,197,94,0.4)',
              fontFamily: 'Poppins, sans-serif',
              marginTop: '4px'
            }}
          >
            {loading
              ? PAGO_WHATSAPP_ACTIVO
                ? 'Abriendo WhatsApp...'
                : 'Procesando...'
              : PAGO_WHATSAPP_ACTIVO ? (
                <>
                  Activar acceso{' '}
                  <span className="formulario-activar-acceso-flecha">▼</span>
                </>
              ) : (
                'Ir a pagar →'
              )}
          </button>
        </form>
        {PAGO_WHATSAPP_ACTIVO && reservaWhatsapp && (
          <div
            style={{
              marginTop: '16px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                color: 'rgba(248,250,252,0.7)',
                fontSize: '13px',
                marginBottom: '12px',
                lineHeight: 1.5,
              }}
            >
              Tu reserva quedó guardada.
              Toca el botón para pagar por WhatsApp 👇
            </p>
            <button
              type="button"
              onClick={abrirWhatsappPago}
              style={{
                width: '100%',
                backgroundColor: '#22C55E',
                color: '#fff',
                fontWeight: '800',
                fontSize: '17px',
                padding: '18px 16px',
                borderRadius: '14px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                boxShadow: '0 4px 18px rgba(34,197,94,0.35)',
              }}
            >
              Entrar ahora 💬
            </button>
          </div>
        )}
      </div>

      {/* Sello de seguridad */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <span style={{ 
          color: 'rgba(248,250,252,0.4)', 
          fontSize: '12px' 
        }}>
          {PAGO_WHATSAPP_ACTIVO
            ? '🔒 Completa tu pago con el equipo por WhatsApp'
            : '🔒 Pago 100% seguro · MercadoPago oficial'}
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
