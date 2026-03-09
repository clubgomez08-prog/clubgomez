"use client";

import Image from "next/image";

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
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 py-4 bg-[#071521] border-b border-brand-navy">
        <Image
          src="/logo-rifex.png"
          alt="RIFEX"
          width={130}
          height={44}
          className="object-contain"
          priority
        />
        <button
          onClick={() => paquetesRef?.current?.scrollIntoView({ behavior: "smooth" })}
          className="bg-brand-green hover:bg-brand-green2 text-black font-bold rounded-xl px-5 py-2 transition-colors"
        >
          PARTICIPAR AHORA
        </button>
      </nav>

      {/* Hero principal */}
      <div className="relative flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#071521] to-[#0B1F33] px-4 py-16">
        {/* Triángulos decorativos */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute opacity-10"
              style={{
                left: `${(i * 17 + 5) % 100}%`,
                top: `${(i * 23 + 10) % 100}%`,
                width: 0,
                height: 0,
                borderLeft: "20px solid transparent",
                borderRight: "20px solid transparent",
                borderBottom: "35px solid #F2B233",
                transform: `rotate(${i * 30}deg)`,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-4xl w-full mx-auto text-center">
          <span className="inline-block bg-brand-gold/20 text-brand-gold2 border border-brand-gold/30 rounded-full px-4 py-1 text-sm font-medium mb-6">
            ⚡ RIFA OFICIAL
          </span>

          {rifa.imagen_url && (
            <div className="relative w-full max-w-md mx-auto mb-8 aspect-[4/3] rounded-2xl overflow-hidden border border-brand-navy">
              <img
                src={rifa.imagen_url}
                alt={rifa.nombre}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h1 className="text-4xl md:text-6xl font-extrabold text-white uppercase tracking-wide mb-3">
            {rifa.nombre}
          </h1>

          <p className="text-brand-gold2 text-lg mb-4">
            Un número puede cambiar tu vida
          </p>

          <p className="text-brand-gold font-bold text-2xl mb-8">
            Desde {formatPrecio(precio)} COP
          </p>

          <div className="w-full max-w-md mx-auto mb-3">
            <div className="h-3 bg-zinc-800/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-gold to-brand-gold2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(Number(porcentaje), 100)}%` }}
              />
            </div>
          </div>

          <p className="text-brand-light text-sm mb-8">
            {formatNum(vendidos)} / {formatNum(total)} boletos vendidos
          </p>

          <button
            onClick={() => paquetesRef?.current?.scrollIntoView({ behavior: "smooth" })}
            className="bg-brand-green hover:bg-brand-green2 text-black font-extrabold text-lg rounded-xl px-10 py-4 shadow-lg shadow-green-500/30 transition-all mb-4"
          >
            PARTICIPAR AHORA
          </button>

          <p className="text-zinc-400 text-sm">
            🔒 Pago seguro · Boleto digital inmediato
          </p>
        </div>
      </div>
    </section>
  );
}
