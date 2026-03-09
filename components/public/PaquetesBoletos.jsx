"use client";

import Image from "next/image";

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
    <section ref={refProp} className="py-16 px-4 bg-[#0B1F33] scroll-mt-20 overflow-visible">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-4">
          <h2 className="text-white font-extrabold text-3xl md:text-4xl">
            Elige tu paquete
          </h2>
          <Image src="/rifex-cubes.png" alt="" width={100} height={100} className="object-contain" />
        </div>
        <p className="text-zinc-400 text-center mb-10">
          Selecciona la cantidad de boletos que deseas participar
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-visible pt-5">
          {PAQUETES.map((cantidad) => {
            const total = cantidad * precioUnit;
            const popular = cantidad === 100;
            const selected = selectedPackage === cantidad;

            return (
              <div key={cantidad} className="relative min-w-0 w-full overflow-visible">
                <button
                  type="button"
                  onClick={() => onSelect(cantidad)}
                  className={`relative w-full min-w-0 bg-[#071521] border rounded-2xl p-6 text-left hover:border-[#F2B233] hover:shadow-lg hover:shadow-[#F2B233]/20 transition-all overflow-visible ${
                    selected
                      ? "border-[#F2B233] shadow-lg shadow-[#F2B233]/20"
                      : "border-[#F2B233]/40"
                  }`}
                >
                  {popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#22C55E] text-black font-bold text-xs px-3 py-1 rounded-full">
                      MÁS POPULAR
                    </span>
                  )}
                  <p className="text-base font-bold text-white">{cantidad} boletos</p>
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl font-extrabold text-[#FFD166] mt-2 min-w-0 overflow-hidden">
                    {formatPrecio(total)}
                  </p>
                  <p className="text-zinc-400 text-sm mt-1">{formatPrecio(precioUnit)} c/u</p>
                  <span className="inline-block mt-4 w-full bg-[#22C55E] hover:bg-[#4ADE80] text-black font-bold text-sm rounded-xl py-2 text-center transition-all">
                    COMPRAR AHORA
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
