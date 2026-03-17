"use client";

import { useState, createContext, useContext, useCallback } from "react";

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((mensaje, tipo = 'info', duracion = 3500) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, mensaje, tipo }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duracion)
  }, [])

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const colores = {
    success: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)', text: '#22C55E', icon: '✅' },
    error:   { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#f87171', icon: '❌' },
    warning: { bg: 'rgba(242,178,51,0.15)', border: 'rgba(242,178,51,0.4)', text: '#F2B233', icon: '⚠️' },
    info:    { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.4)', text: '#93c5fd', icon: 'ℹ️' }
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: '24px', right: '16px',
        zIndex: 9999, display: 'flex', flexDirection: 'column',
        gap: '8px', maxWidth: '320px', width: '90vw'
      }}>
        {toasts.map(t => {
          const c = colores[t.tipo] || colores.info
          return (
            <div key={t.id} style={{
              backgroundColor: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: '12px', padding: '12px 14px',
              display: 'flex', alignItems: 'flex-start',
              gap: '8px', backdropFilter: 'blur(8px)',
              animation: 'slideIn 0.3s ease',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{c.icon}</span>
              <p style={{
                color: '#F8FAFC', fontSize: '13px',
                fontWeight: '500', margin: 0, flex: 1,
                fontFamily: 'Poppins, sans-serif', lineHeight: '1.4'
              }}>
                {t.mensaje}
              </p>
              <button onClick={() => removeToast(t.id)} style={{
                backgroundColor: 'transparent', border: 'none',
                color: 'rgba(248,250,252,0.4)', cursor: 'pointer',
                fontSize: '16px', padding: 0, flexShrink: 0
              }}>×</button>
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
