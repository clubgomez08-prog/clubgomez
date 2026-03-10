"use client";

const PAQUETES = [5, 10, 25, 50, 100, 500];

export default function PaquetesBoletos({ rifa, selectedPackage, onSelect, refProp, divisa, setDivisa, convertirPrecio, cargandoTasas }) {
  if (!rifa) return null;

  const precioUnit = rifa.precio_boleto ?? 0;
  const cantidadActual = selectedPackage ?? PAQUETES[0];
  const idxActual = PAQUETES.indexOf(cantidadActual);
  const montoTotal = cantidadActual * precioUnit;

  return (
    <section ref={refProp} className="py-4 px-4 scroll-mt-20 overflow-visible rounded-2xl">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-white font-bold text-lg text-center mb-3 drop-shadow-sm">
          Elige la cantidad de tickets
        </h2>

        {/* Grid de cantidades */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {PAQUETES.map((cantidad) => {
            const selected = selectedPackage === cantidad;
            return (
              <button
                key={cantidad}
                type="button"
                onClick={() => onSelect(cantidad)}
                className="w-full aspect-square rounded-xl text-2xl shadow-md transition-all"
                style={{
                  backgroundColor: selected ? "#F2B233" : "#0a0a0a",
                  border: selected ? "2px solid #F2B233" : "2px solid rgba(242,178,51,0.5)",
                  color: selected ? "#0a0a0a" : "#F8FAFC",
                  fontWeight: 800,
                }}
              >
                {cantidad}
              </button>
            );
          })}
        </div>

        {/* Fila de controles: menos, cantidad, más */}
        <div className="flex items-center justify-center gap-3 mt-2 mb-3">
          <button
            type="button"
            onClick={() => onSelect(PAQUETES[Math.max(0, idxActual - 1)])}
            className="w-14 h-14 rounded-xl bg-red-500 text-white font-bold text-2xl flex items-center justify-center shadow-md"
          >
            −
          </button>
          <div
            style={{
              backgroundColor: "#0a0a0a",
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
            <span
              style={{
                color: "#F2B233",
                fontSize: "26px",
                fontWeight: "800",
                lineHeight: 1,
              }}
            >
              {cantidadActual}
            </span>
            <span style={{ color: "rgba(248,250,252,0.5)", fontSize: "10px", marginTop: "2px" }}>
              tickets
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelect((selectedPackage ?? PAQUETES[0]) + 1)}
            className="w-14 h-14 rounded-xl bg-[#22C55E] text-[#071521] font-bold text-2xl flex items-center justify-center shadow-md"
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
          onClick={() => onSelect(cantidadActual)}
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
      </div>
    </section>
  );
}
