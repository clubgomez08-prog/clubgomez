"use client";

import Image from "next/image";

const PASOS = [
  { numero: 1, titulo: "Elige tu paquete", desc: "Selecciona la cantidad de boletos que deseas" },
  { numero: 2, titulo: "Regístrate y paga", desc: "Completa tus datos y paga de forma segura" },
  { numero: 3, titulo: "Recibe tu numeración", desc: "Te enviaremos tus números asignados por email" },
  { numero: 4, titulo: "Espera el sorteo en vivo", desc: "Transmisión transparente con verificación" },
];

export default function ComoFunciona() {
  return (
    <section className="py-16 px-4 bg-[#0B1F33]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-white font-extrabold text-3xl md:text-4xl mb-2">
            ¿Cómo Funciona?
          </h2>
          <p className="text-[#FFD166] text-lg mb-10">Es fácil ganar en grande</p>
          <div className="space-y-6">
            {PASOS.map((paso) => (
              <div key={paso.numero} className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#F2B233] text-black font-extrabold flex items-center justify-center">
                  {paso.numero}
                </span>
                <div>
                  <h3 className="font-semibold text-white">{paso.titulo}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{paso.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden lg:flex items-center justify-center min-h-[600px]">
          <Image
            src="/rifex-phone.png"
            alt="App RIFEX"
            width={560}
            height={1050}
            className="object-contain drop-shadow-2xl mx-auto w-full max-w-[560px]"
          />
        </div>
      </div>
    </section>
  );
}
