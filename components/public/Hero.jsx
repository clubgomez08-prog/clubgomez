"use client";

export default function Hero({ rifa, stats, onParticipar, paquetesRef, convertirPrecio }) {
  if (!rifa) return null;

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
          {rifa.imagen_url && (
            <div
              className="relative w-full max-w-sm md:max-w-lg mx-auto mb-3 rounded-2xl overflow-hidden border-2 border-[#F2B233]/50"
              style={{
                boxShadow: "0 4px 24px rgba(242,178,51,0.25), 0 0 20px rgba(242,178,51,0.15)",
                animation: "pulse-glow-gold 3s ease-in-out infinite",
              }}
            >
              <img
                src={rifa.imagen_url}
                alt={rifa.nombre}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          <h1 className="text-white font-bold text-2xl text-center mt-3 mb-2 drop-shadow-sm">
            {rifa.nombre}
          </h1>

          <p className="text-[#F8FAFC] font-semibold text-base text-center mb-3 drop-shadow-sm">
            Un número puede cambiar tu vida
          </p>

          <p className="text-[#F2B233] font-bold text-xl mb-3 drop-shadow-sm">
            Desde {convertirPrecio(precio)}
          </p>

          {/* Barra de progreso */}
          <div style={{ width: "100%", marginBottom: "12px" }} className="max-w-md mx-auto">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#dc2626",
                borderRadius: "999px",
                padding: "4px 12px",
                marginBottom: "8px",
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
