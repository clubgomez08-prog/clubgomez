"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export const PAQUETES = [50, 100, 150, 200, 250, 500, 600, 850, 1000];
const MIN_TICKETS = 1;
const MAX_MANUAL = 10000;

export default function PaquetesBoletos({ rifa, selectedPackage, onSelect, refProp, divisa, setDivisa, convertirPrecio, cargandoTasas }) {
  const router = useRouter();

  const total = rifa?.total_numeros ?? 0;
  const vendidos = rifa?.boletos_vendidos ?? 0;
  const maxTickets = total > 0 ? Math.max(MIN_TICKETS, total - vendidos) : 10000;
  const maxManual = Math.min(maxTickets, MAX_MANUAL);

  const precioUnit = rifa?.precio_boleto ?? 0;
  const cantidadActual = Math.max(MIN_TICKETS, Math.min(maxManual, selectedPackage ?? PAQUETES[0]));
  const montoTotal = cantidadActual * precioUnit;

  const [inputValue, setInputValue] = useState(String(cantidadActual));

  useEffect(() => {
    setInputValue(String(cantidadActual));
  }, [cantidadActual]);

  function handleInputChange(e) {
    const val = e.target.value.replace(/\D/g, "");
    setInputValue(val === "" ? "" : val);
    if (val === "") {
      onSelect(MIN_TICKETS);
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      onSelect(Math.max(MIN_TICKETS, Math.min(maxManual, num)));
    }
  }

  function handleInputBlur() {
    const val = inputValue.replace(/\D/g, "");
    if (val === "") {
      onSelect(MIN_TICKETS);
      setInputValue(String(MIN_TICKETS));
      return;
    }
    const num = parseInt(val, 10);
    if (isNaN(num) || num < MIN_TICKETS) {
      onSelect(MIN_TICKETS);
      setInputValue(String(MIN_TICKETS));
    } else {
      const clamped = Math.min(maxManual, num);
      onSelect(clamped);
      setInputValue(String(clamped));
    }
  }

  if (!rifa) return null;

  return (
    <section ref={refProp} className="py-4 px-4 scroll-mt-20 overflow-visible rounded-2xl">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-white font-bold text-lg text-center mb-3 drop-shadow-sm">
          Elige la cantidad de tickets
        </h2>

        {/* Grid de cantidades */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {PAQUETES.filter((c) => c <= maxManual).map((cantidad) => {
            const selected = selectedPackage === cantidad;
            return (
              <div
                key={cantidad}
                style={{
                  position: "relative",
                }}
              >
                {cantidad === 200 && 200 <= maxManual && (
                  <div
                    style={{
                      position: "absolute",
                      top: "0px",
                      right: "-4px",
                      background: "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 35%, transparent 65%), #ef4444",
                      borderRadius: "999px",
                      padding: "4px 12px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      whiteSpace: "nowrap",
                      boxShadow: "0 -2px 6px rgba(255,180,100,0.45), 0 3px 12px rgba(232,93,44,0.5)",
                      zIndex: 10,
                    }}
                  >
                    <span style={{ fontSize: "10px" }}>🔥</span>
                    <span
                      style={{
                        color: "white",
                        fontSize: "10px",
                        fontWeight: "800",
                        letterSpacing: "0.5px",
                      }}
                    >
                      POPULAR
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onSelect(cantidad)}
                  className="w-full aspect-square rounded-xl text-2xl shadow-md transition-all"
                  style={{
                    backgroundColor: selected ? "#F2B233" : "rgba(0,0,0,0.5)",
                    border: selected ? "2px solid #F2B233" : "2px solid rgba(242,178,51,0.5)",
                    color: selected ? "#0a0a0a" : "#F8FAFC",
                    fontWeight: 800,
                  }}
                >
                  {cantidad}
                </button>
              </div>
            );
          })}
        </div>

        {/* Fila de controles: input manual, más */}
        <div className="flex items-center justify-center gap-3 mt-2 mb-3">
          <div
            style={{
              backgroundColor: "rgba(0,0,0,0.5)",
              border: "2px solid rgba(242,178,51,0.5)",
              borderRadius: "12px",
              width: "80px",
              height: "64px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <input
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "#F2B233",
                fontSize: "26px",
                fontWeight: "800",
                textAlign: "center",
                width: "100%",
                outline: "none",
              }}
            />
            <span style={{ color: "rgba(248,250,252,0.5)", fontSize: "10px", marginTop: "2px" }}>
              tickets
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelect(Math.min(maxManual, cantidadActual + 1))}
            disabled={cantidadActual >= maxManual}
            className="w-14 h-14 rounded-xl bg-[#22C55E] text-[#071521] font-bold text-2xl flex items-center justify-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>

        {/* Barra blanca: selector + Total */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 mt-2 flex justify-between items-center gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <select
              value={divisa}
              onChange={(e) => setDivisa(e.target.value)}
              style={{
                backgroundColor: "#0a0a0a",
                border: "1px solid rgba(242,178,51,0.5)",
                borderRadius: "8px",
                color: "#F2B233",
                fontSize: "13px",
                fontWeight: "700",
                padding: "6px 28px 6px 10px",
                cursor: "pointer",
                outline: "none",
                appearance: "none",
                WebkitAppearance: "none",
                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'%23F2B233\'%3E%3Cpath d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")',
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
              }}
            >
              <option value="COP">🇨🇴 COP</option>
              <option value="USD">🇺🇸 USD</option>
              <option value="EUR">🇪🇺 EUR</option>
              <option value="MXN">🇲🇽 MXN</option>
              <option value="VES">🇻🇪 VES</option>
            </select>
            {cargandoTasas && (
              <span className="text-[#334155]/60 text-xs">Actualizando...</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#334155] text-sm">Total</span>
            <span className="text-[#22C55E] font-bold text-lg">{convertirPrecio(montoTotal)}</span>
          </div>
        </div>

        {/* Botón final */}
        <button
          type="button"
          onClick={() => {
            onSelect(cantidadActual);
            router.push(`/formulario?cantidad=${cantidadActual}&monto=${montoTotal}&divisa=${divisa}`);
          }}
          style={{
            display: "block",
            width: "100%",
            background: "linear-gradient(135deg, #22C55E 0%, #16a34a 100%)",
            color: "white",
            fontWeight: "800",
            fontSize: "20px",
            padding: "20px 16px",
            borderRadius: "14px",
            textAlign: "center",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(34,197,94,0.4)",
            letterSpacing: "0.3px",
            marginTop: "12px",
            animation: "pulse-glow-green 2s ease-in-out infinite",
          }}
        >
          Comprar tickets
        </button>

        {/* Top compradores */}
        <div
          style={{
            margin: "16px 0",
            backgroundColor: "rgba(10,10,10,0.6)",
            border: "1px solid rgba(242,178,51,0.2)",
            borderRadius: "16px",
            padding: "14px",
          }}
        >
          <p
            style={{
              color: "#F2B233",
              fontWeight: "700",
              fontSize: "14px",
              margin: "0 0 12px",
              textAlign: "center",
            }}
          >
            🏆 Top compradores
          </p>

          {[
            { nombre: "Valentina R.", tickets: 500, emoji: "🥇" },
            { nombre: "Andrés G.", tickets: 250, emoji: "🥈" },
            { nombre: "María L.", tickets: 150, emoji: "🥉" },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                marginBottom: i < 2 ? "6px" : "0",
                backgroundColor:
                  i === 0 ? "rgba(242,178,51,0.08)" : "rgba(255,255,255,0.03)",
                borderRadius: "10px",
                border:
                  i === 0
                    ? "1px solid rgba(242,178,51,0.25)"
                    : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px" }}>{c.emoji}</span>
                <span
                  style={{
                    color: "#F8FAFC",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  {c.nombre}
                </span>
              </div>
              <span
                style={{
                  color: "#22C55E",
                  fontSize: "13px",
                  fontWeight: "700",
                }}
              >
                {c.tickets} tickets
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
