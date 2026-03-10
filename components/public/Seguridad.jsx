// COMPONENTE LEGACY — No se usa actualmente
// Conservado por compatibilidad. No importar en nuevas páginas.
"use client";

const ITEMS = [
  { icon: "🔒", titulo: "Pagos verificados", desc: "Pasarela oficial de pagos" },
  { icon: "🎯", titulo: "Numeración única", desc: "Garantizada y verificable" },
  { icon: "📊", titulo: "Sorteo en vivo", desc: "Transmitido públicamente" },
  { icon: "🏆", titulo: "Ganadores públicos", desc: "Publicados oficialmente" },
];

export default function Seguridad() {
  return (
    <section className="py-16 px-4 bg-[#071521]">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-white font-extrabold text-3xl text-center mb-2">
          Seguridad y Transparencia
        </h2>
        <p className="text-zinc-400 text-center mb-10">
          Tu confianza es nuestra prioridad
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ITEMS.map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center p-6 bg-[#0B1F33] border border-[#1E3A8A] rounded-2xl"
            >
              <span className="text-[#22C55E] text-3xl mb-3">{item.icon}</span>
              <h3 className="font-semibold text-white">{item.titulo}</h3>
              <p className="text-sm text-zinc-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          {["💳 MercadoPago", "🏦 PSE", "📱 Nequi"].map((m) => (
            <span
              key={m}
              className="bg-[#0B1F33] border border-[#1E3A8A] rounded-lg px-4 py-2 text-zinc-300 text-sm"
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
