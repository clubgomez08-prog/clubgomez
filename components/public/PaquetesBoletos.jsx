"use client";

const PAQUETES = [10, 50, 100, 500, 1000];

export default function PaquetesBoletos({ rifa, selectedPackage, onSelect, refProp }) {
  if (!rifa) return null;

  const precioUnit = rifa.precio_boleto ?? 0;

  function formatPrecio(n) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  }

  return (
    <section ref={refProp} className="py-16 px-4 bg-zinc-950 scroll-mt-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl text-white text-center mb-10">
          PAQUETES DE BOLETOS
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PAQUETES.map((cantidad) => {
            const total = cantidad * precioUnit;
            const popular = cantidad === 100;
            const selected = selectedPackage === cantidad;

            return (
              <button
                key={cantidad}
                type="button"
                onClick={() => onSelect(cantidad)}
                className={`relative p-6 rounded-xl border text-left transition-all ${
                  selected
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                {popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-semibold text-zinc-950 bg-amber-500 rounded-full">
                    MÁS POPULAR
                  </span>
                )}
                <p className="text-zinc-400 text-sm">{cantidad} boletos</p>
                <p className="text-xl font-semibold text-white mt-2">
                  {formatPrecio(total)}
                </p>
                <p className="text-amber-500 text-sm mt-1">
                  {formatPrecio(precioUnit)} c/u
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
