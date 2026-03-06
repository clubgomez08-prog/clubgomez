"use client";

const PASOS = [
  { numero: 1, titulo: "Elige tu paquete", desc: "Selecciona la cantidad de boletos que deseas" },
  { numero: 2, titulo: "Regístrate y paga", desc: "Completa tus datos y paga de forma segura" },
  { numero: 3, titulo: "Recibe tu numeración", desc: "Te enviaremos tus números asignados por email" },
  { numero: 4, titulo: "Espera el sorteo en vivo", desc: "Transmisión transparente con verificación" },
];

export default function ComoFunciona() {
  return (
    <section className="py-16 px-4 bg-zinc-950">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl text-white text-center mb-10">
          CÓMO FUNCIONA
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {PASOS.map((paso) => (
            <div
              key={paso.numero}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center"
            >
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500 text-zinc-950 font-display text-2xl">
                {paso.numero}
              </span>
              <h3 className="font-semibold text-white mt-4">{paso.titulo}</h3>
              <p className="text-sm text-zinc-400 mt-2">{paso.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
