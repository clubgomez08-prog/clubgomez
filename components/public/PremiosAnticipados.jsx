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
          En esta experiencia tienes 3 formas de ganar
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
          <p style={{ fontWeight: 700, color: "#F2B233", margin: 0 }}>
            🌟 10 claves bendecidas — $3.000.000 cada una
          </p>

          <p
            style={{
              fontWeight: 500,
              fontSize: "13px",
              color: "rgba(248,250,252,0.7)",
              margin: "12px 0 0",
            }}
          >
            Si tienes una de estas claves especiales,
            <br />
            ganas antes del sorteo final.
          </p>

          <div
            style={{
              width: "100%",
              height: "1px",
              backgroundColor: "rgba(242,178,51,0.2)",
              margin: "12px 0",
            }}
          />

          <p style={{ fontWeight: 700, color: "#F2B233", margin: 0 }}>
            💰 Premios semanales — $3.000.000 cada sábado
          </p>

          <p
            style={{
              fontWeight: 500,
              fontSize: "13px",
              color: "rgba(248,250,252,0.7)",
              margin: "12px 0 0",
            }}
          >
            Cada sábado con la Lotería Boyacá.
            <br />
            Si tu clave coincide con el premio mayor, ganas.
          </p>

          <div
            style={{
              width: "100%",
              height: "1px",
              backgroundColor: "rgba(242,178,51,0.2)",
              margin: "12px 0",
            }}
          />

          <p style={{ fontWeight: 700, color: "#F2B233", margin: 0 }}>
            🏆 Gran sorteo final — 20 de junio
          </p>

          <p
            style={{
              fontWeight: 600,
              fontSize: "14px",
              color: "#F8FAFC",
              margin: "12px 0 0",
            }}
          >
            Kia Picanto GT 2022 + Gixxer Fi ABS 2027
          </p>
        </div>
      </div>
    </section>
  );
}
