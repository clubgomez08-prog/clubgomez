"use client";

export default function Hero({ rifa, stats, onParticipar, paquetesRef }) {
  if (!rifa) return null;

  const precio = rifa.precio_boleto ?? 0;
  const total = rifa.total_numeros ?? 10000;
  const vendidos = stats?.vendidos ?? 0;
  const disponibles = total - vendidos;
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

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-4 py-16 overflow-hidden">
      <div className="max-w-4xl w-full mx-auto text-center">
        <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-widest text-amber-500 border border-amber-500/50 rounded-full">
          SORTEO OFICIAL 100% DIGITAL
        </span>

        {rifa.imagen_url && (
          <div className="relative w-full max-w-md mx-auto mb-8 aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-800">
            <img
              src={rifa.imagen_url}
              alt={rifa.nombre}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-white tracking-tight mb-4">
          {rifa.nombre}
        </h1>

        <p className="text-2xl md:text-3xl text-amber-500 font-semibold mb-8">
          {formatPrecio(precio)} por boleto
        </p>

        <div className="w-full max-w-md mx-auto mb-4">
          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(Number(porcentaje), 100)}%` }}
            />
          </div>
        </div>

        <p className="text-zinc-400 text-sm mb-2">
          {formatNum(vendidos)} vendidos · {formatNum(disponibles)} disponibles
        </p>
        <p className="text-zinc-500 text-sm mb-10">
          El sorteo se activa al alcanzar el {pctSorteo}% vendido
        </p>

        <button
          onClick={() => paquetesRef?.current?.scrollIntoView({ behavior: "smooth" })}
          className="px-12 py-4 text-lg font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors"
        >
          PARTICIPAR AHORA
        </button>
      </div>
    </section>
  );
}
