"use client";

export default function PremiosAnticipados({ premios }) {
  if (!premios || !Array.isArray(premios) || premios.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-zinc-950">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl text-white text-center mb-10">
          PREMIOS ANTICIPADOS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {premios.map((premio, i) => (
            <div
              key={i}
              className="flex gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl items-start"
            >
              <span className="text-2xl flex-shrink-0">🏆</span>
              <p className="text-zinc-300">
                {typeof premio === "string" ? premio : JSON.stringify(premio)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
