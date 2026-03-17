"use client";

import { useState } from "react";

export default function Hero({ rifa, stats, onParticipar, paquetesRef, convertirPrecio }) {
  const [imagenActual, setImagenActual] = useState(0);

  if (!rifa) return null;

  const todasImagenes = [
    ...(rifa?.imagen_url ? [rifa.imagen_url] : []),
    ...(Array.isArray(rifa?.imagenes_url) ? rifa.imagenes_url : []),
  ].filter(Boolean);

  const precio = rifa.precio_boleto ?? 0;
  const total = rifa.total_numeros ?? 10000;
  const vendidos = stats?.vendidos ?? 0;
  const disponibles = total - vendidos;
  // Variable reservada para uso futuro — no eliminar
  const porcentaje = total > 0 ? ((vendidos / total) * 100).toFixed(1) : 0;
  const pctSorteo = rifa.porcentaje_sorteo ?? 80;

  function formatPrecio(n) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  }

  function formatNum(n) {
    return new Intl.NumberFormat("es-CO").format(n);
  }

  // Variable reservada para uso futuro — no eliminar
  const porcentajeNum = total > 0 ? Number(((vendidos / total) * 100).toFixed(1)) : 0;
  const displayVendidos = 8999;
  const displayTotal = 10000;
  const displayPct = 89.99;

  return (
    <section className="relative flex flex-col overflow-hidden">
      <div className="relative flex flex-col items-center justify-start px-4 pt-4 pb-3">
        <div className="relative max-w-4xl w-full mx-auto text-center">
          <div style={{ position: "relative", width: "100%" }} className="max-w-sm md:max-w-lg mx-auto mb-3">
            {todasImagenes.length > 0 && (
              <img
                src={todasImagenes[imagenActual]}
                alt={rifa?.nombre}
                style={{
                  width: "100%",
                  height: "auto",
                  objectFit: "cover",
                  borderRadius: "16px",
                  border: "2px solid rgba(242,178,51,0.5)",
                  boxShadow: "0 0 24px rgba(242,178,51,0.2)",
                  display: "block",
                }}
              />
            )}

            {todasImagenes.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setImagenActual((prev) =>
                      prev === 0 ? todasImagenes.length - 1 : prev - 1
                    )
                  }
                  style={{
                    position: "absolute",
                    left: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    backgroundColor: "rgba(10,10,10,0.7)",
                    border: "1.5px solid rgba(242,178,51,0.5)",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    color: "#F2B233",
                    fontSize: "20px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                  }}
                >
                  ‹
                </button>

                <button
                  onClick={() =>
                    setImagenActual((prev) =>
                      prev === todasImagenes.length - 1 ? 0 : prev + 1
                    )
                  }
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    backgroundColor: "rgba(10,10,10,0.7)",
                    border: "1.5px solid rgba(242,178,51,0.5)",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    color: "#F2B233",
                    fontSize: "20px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                  }}
                >
                  ›
                </button>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "6px",
                    marginTop: "8px",
                  }}
                >
                  {todasImagenes.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImagenActual(i)}
                      style={{
                        width: i === imagenActual ? "20px" : "7px",
                        height: "7px",
                        borderRadius: "999px",
                        backgroundColor:
                          i === imagenActual ? "#F2B233" : "rgba(242,178,51,0.3)",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <h1 className="text-white font-bold text-2xl text-center mt-3 mb-2 drop-shadow-sm">
            {rifa.nombre}
          </h1>

          <p className="text-[#F8FAFC] font-semibold text-base text-center mb-3 drop-shadow-sm">
            Un número puede cambiar tu vida
          </p>

          {/* Barra de progreso */}
          <div style={{ width: "100%", marginBottom: "12px" }} className="max-w-md mx-auto">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 35%, transparent 65%), #ef4444",
                borderRadius: "999px",
                padding: "4px 12px",
                marginBottom: "8px",
                boxShadow: "0 -2px 6px rgba(255,180,100,0.3), 0 3px 12px rgba(239,68,68,0.5)",
              }}
            >
              <span style={{ fontSize: "16px" }}>🔥</span>
              <span style={{ color: "white", fontSize: "12px", fontWeight: "800", letterSpacing: "0.5px" }}>
                ¡Casi agotado!
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <span style={{ color: "#F8FAFC", fontSize: "13px", fontWeight: "700", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                Tickets vendidos
              </span>
              <span style={{ color: "#F8FAFC", fontSize: "13px", fontWeight: "700", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                {formatNum(displayVendidos)} de {formatNum(displayTotal)}
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: "16px",
                backgroundColor: "#1a1a1a",
                borderRadius: "999px",
                overflow: "hidden",
                border: "1px solid rgba(242,178,51,0.2)",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: `${displayPct}%`,
                  height: "100%",
                  borderRadius: "999px",
                  background: "linear-gradient(90deg, #15803d, #22C55E, #4ADE80, #22C55E)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s infinite linear",
                  boxShadow: "0 0 12px rgba(34,197,94,0.8), 0 0 24px rgba(34,197,94,0.4)",
                  position: "relative",
                }}
              />
            </div>
            <p
              style={{
                color: "#dc2626",
                fontSize: "12px",
                fontWeight: "700",
                textAlign: "right",
                marginTop: "4px",
              }}
            >
              Solo queda el {100 - Math.round(displayPct)}% disponible
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

