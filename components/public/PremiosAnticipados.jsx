"use client";

import Image from "next/image";

export default function PremiosAnticipados({ premios }) {
  if (!premios || !Array.isArray(premios) || premios.length === 0) return null;

  function parsePremio(premio) {
    if (typeof premio === "string") return { monto: premio, desc: "" };
    if (typeof premio === "object" && premio !== null) {
      return {
        monto: premio.monto ?? premio.monto_cop ?? premio.nombre ?? JSON.stringify(premio),
        desc: premio.desc ?? premio.descripcion ?? "",
      };
    }
    return { monto: String(premio), desc: "" };
  }

  return (
    <section className="py-16 px-4 bg-[#071521]">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-white font-extrabold text-3xl text-center mb-2">
          🏆 Premios Anticipados
        </h2>
        <p className="text-[#FFD166] text-center mb-6">⭐ Más chances de ganar</p>
        <Image
          src="/rifex-chest.png"
          alt=""
          width={120}
          height={120}
          className="object-contain mx-auto mb-6"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {premios.map((premio, i) => {
            const { monto, desc } = parsePremio(premio);
            return (
              <div
                key={i}
                className="bg-[#0B1F33] border border-[#F2B233]/40 rounded-2xl p-6 hover:border-[#F2B233] transition-all"
              >
                <p className="text-[#FFD166] font-extrabold text-2xl">{monto}</p>
                {desc && <p className="text-zinc-400 text-sm mt-1">{desc}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
