"use client";

export default function ModalConfirm({
  visible,
  titulo,
  mensaje,
  labelConfirmar = 'Confirmar',
  labelCancelar = 'Cancelar',
  tipo = 'danger',
  onConfirmar,
  onCancelar
}) {
  if (!visible) return null

  const colores = {
    danger:  { btn: '#ef4444', hover: '#dc2626', icon: '🗑️' },
    warning: { btn: '#F2B233', hover: '#d97706', icon: '⚠️' },
    success: { btn: '#22C55E', hover: '#16a34a', icon: '✅' }
  }
  const c = colores[tipo] || colores.danger

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000,
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1.5px solid rgba(255,255,255,0.1)',
        borderRadius: '20px', padding: '28px 24px',
        width: '100%', maxWidth: '380px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '40px' }}>{c.icon}</span>
        </div>
        <h3 style={{
          color: '#F8FAFC', fontSize: '18px', fontWeight: '800',
          textAlign: 'center', margin: '0 0 8px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          {titulo}
        </h3>
        <p style={{
          color: 'rgba(248,250,252,0.5)', fontSize: '14px',
          textAlign: 'center', margin: '0 0 24px',
          fontFamily: 'Poppins, sans-serif', lineHeight: '1.5'
        }}>
          {mensaje}
        </p>
        <button onClick={onConfirmar} style={{
          width: '100%', backgroundColor: c.btn,
          color: 'white', fontWeight: '700', fontSize: '15px',
          padding: '14px', borderRadius: '12px', border: 'none',
          cursor: 'pointer', marginBottom: '8px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          {labelConfirmar}
        </button>
        <button onClick={onCancelar} style={{
          width: '100%', backgroundColor: 'transparent',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '12px', color: 'rgba(248,250,252,0.5)',
          fontSize: '14px', padding: '12px', cursor: 'pointer',
          fontFamily: 'Poppins, sans-serif'
        }}>
          {labelCancelar}
        </button>
      </div>
    </div>
  )
}
