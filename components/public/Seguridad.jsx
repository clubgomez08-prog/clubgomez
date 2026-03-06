"use client";

const ITEMS = [
  { icon: "🔒", titulo: "Pagos verificados", desc: "Pasarela oficial de pagos" },
  { icon: "🎯", titulo: "Numeración única", desc: "Garantizada y verificable" },
  { icon: "📊", titulo: "Sorteo en vivo", desc: "Transmitido públicamente" },
  { icon: "🏆", titulo: "Ganadores públicos", desc: "Publicados oficialmente" },
];

export default function Seguridad() {
  return (
    <section className="py-16 px-4 bg-zinc-950">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl text-white text-center mb-10">
          SEGURIDAD Y TRANSPARENCIA
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ITEMS.map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center p-6 bg-zinc-900 border border-zinc-800 rounded-xl"
            >
              <span className="text-3xl mb-3">{item.icon}</span>
              <h3 className="font-semibold text-white">{item.titulo}</h3>
              <p className="text-sm text-zinc-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
