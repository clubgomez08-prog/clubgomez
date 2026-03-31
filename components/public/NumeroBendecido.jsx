"use client";

const NUMEROS = [
  "2794-09",
  "7305-21",
  "1105-98",
  "0047-85",
  "1695-70",
  "3254-65",
  "4374-58",
  "8569-45",
  "0873-37",
  "5136-00",
];

export default function NumeroBendecido() {
  return (
    <section className="px-4 py-6">
      <style>{`
        @keyframes brilloNumeroBendecido {
          0%   { box-shadow: 0 0 6px rgba(242,178,51,0.25), 0 0 12px rgba(242,178,51,0.08); }
          50%  { box-shadow: 0 0 14px rgba(242,178,51,0.55), 0 0 24px rgba(242,178,51,0.2); }
          100% { box-shadow: 0 0 6px rgba(242,178,51,0.25), 0 0 12px rgba(242,178,51,0.08); }
        }
      `}</style>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-white font-bold text-lg text-center mb-2 drop-shadow-sm">
          ✨ Claves activas dentro de la experiencia ✨
        </h2>
        <p className="text-[#F8FAFC]/90 text-center text-xs font-semibold mb-4 px-1">
          Cada una de estas claves representa $3.000.000
          <br />
          para quien la tenga.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {NUMEROS.map((num) => (
            <div
              key={num}
              className="rounded-xl flex items-center justify-center aspect-[4/3] sm:aspect-auto sm:min-h-[72px]"
              style={{
                backgroundColor: "rgba(0,0,0,0.5)",
                border: "2px solid rgba(242,178,51,0.5)",
                animation: "brilloNumeroBendecido 2.5s ease-in-out infinite",
              }}
            >
              <span
                className="text-lg sm:text-xl font-extrabold tracking-wide"
                style={{ color: "#F2B233" }}
              >
                {num}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[#F8FAFC] text-center text-sm font-semibold leading-snug px-2">
          Revisa tus claves… una de estas puede ser tuya.
        </p>
      </div>
    </section>
  );
}
