"use client";

/**
 * Texto de marketing fijo para la landing.
 * (Antes: cada ítem venía de rifa.premios_anticipados en la API.)
 */
export default function PremiosAnticipados() {
  return (
    <section className="py-4 px-4">
      <style>{`
        @keyframes brilloBorde {
          0%   { box-shadow: 0 0 6px rgba(242,178,51,0.3), 0 0 12px rgba(242,178,51,0.1); }
          50%  { box-shadow: 0 0 16px rgba(242,178,51,0.8), 0 0 32px rgba(242,178,51,0.4); }
          100% { box-shadow: 0 0 6px rgba(242,178,51,0.3), 0 0 12px rgba(242,178,51,0.1); }
        }
      `}</style>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-white font-bold text-xl text-center mb-2 drop-shadow-sm">
          🏆 Premios anticipados 🏆
        </h2>
        <div
          className="max-w-md mx-auto"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            backgroundColor: "transparent",
            border: "1.5px solid rgba(242,178,51,0.6)",
            animation: "brilloBorde 2s ease-in-out infinite",
            borderRadius: "10px",
            padding: "14px 16px",
            color: "#F8FAFC",
            fontSize: "15px",
            lineHeight: 1.45,
          }}
        >
          <p style={{ fontWeight: "700", margin: 0 }}>Aquí no hay un solo ganador…</p>
          <p style={{ fontWeight: "600", margin: "12px 0 0", marginBottom: 0 }}>
            Hay 10 oportunidades adicionales de llevarte
            <br />
            $3.000.000 cada una 💰
          </p>
          <p style={{ fontWeight: "500", fontSize: "14px", margin: "12px 0 0", marginBottom: 0 }}>
            Mientras otros esperan… tú puedes ganar desde el inicio 💵
          </p>
        </div>
      </div>
    </section>
  );
}
