"use client";

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
    <section className="py-4 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-white font-bold text-xl text-center mb-2 drop-shadow-sm">
          🏆 Premios anticipados
        </h2>
        <p className="text-[#E2E8F0] text-center mb-3 drop-shadow-sm">⭐ Más chances de ganar</p>
        <img
          src="/rifex-chest.png"
          alt=""
          className="object-contain mx-auto mb-3 w-20 h-20"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {premios.map((premio, i) => {
            const { monto, desc } = parsePremio(premio);
            return (
              <div
                key={i}
                className="bg-white shadow-lg border border-[#F2B233]/40 rounded-2xl p-4 hover:border-[#F2B233] transition-all"
              >
                <p className="text-[#22C55E] font-extrabold text-2xl">{monto}</p>
                {desc && <p className="text-[#334155] text-sm mt-1">{desc}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
