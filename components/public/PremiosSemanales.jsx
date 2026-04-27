"use client";

/**
 * Bloque fijo de premios semanales para la landing.
 */
export default function PremiosSemanales() {
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
          Gana cada sábado con la Lotería Boyacá
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
            lineHeight: 1.45,
          }}
        >
          <p style={{ fontWeight: 700, color: "#F2B233", margin: 0 }}>
            💰 $3.000.000 cada sábado
          </p>

          <p
            style={{
              fontSize: "13px",
              color: "rgba(248,250,252,0.7)",
              margin: "10px 0 0",
            }}
          >
            Si tu clave coincide con el premio mayor de la
            <br />
            Lotería Boyacá ese sábado, ganas $3.000.000
          </p>

          <div
            style={{
              width: "100%",
              height: "1px",
              backgroundColor: "rgba(242,178,51,0.2)",
              margin: "12px 0",
            }}
          />

          <div
            style={{
              width: "100%",
              textAlign: "left",
            }}
          >
            <p
              style={{
                color: "#F8FAFC",
                fontWeight: 500,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 0",
                borderBottom: "1px solid rgba(242,178,51,0.1)",
              }}
            >
              📅 25 de abril
            </p>
            <p
              style={{
                color: "#F8FAFC",
                fontWeight: 500,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 0",
                borderBottom: "1px solid rgba(242,178,51,0.1)",
              }}
            >
              📅 2 de mayo
            </p>
            <p
              style={{
                color: "#F8FAFC",
                fontWeight: 500,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 0",
                borderBottom: "1px solid rgba(242,178,51,0.1)",
              }}
            >
              📅 9 de mayo
            </p>
            <p
              style={{
                color: "#F8FAFC",
                fontWeight: 500,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 0",
                borderBottom: "1px solid rgba(242,178,51,0.1)",
              }}
            >
              📅 16 de mayo
            </p>
            <p
              style={{
                color: "#F8FAFC",
                fontWeight: 500,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 0",
                borderBottom: "1px solid rgba(242,178,51,0.1)",
              }}
            >
              📅 23 de mayo
            </p>
            <p
              style={{
                color: "#F8FAFC",
                fontWeight: 500,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 0",
                borderBottom: "1px solid rgba(242,178,51,0.1)",
              }}
            >
              📅 30 de mayo
            </p>
            <p
              style={{
                color: "#F8FAFC",
                fontWeight: 500,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 0",
                borderBottom: "1px solid rgba(242,178,51,0.1)",
              }}
            >
              📅 6 de junio
            </p>
            <p
              style={{
                color: "#F8FAFC",
                fontWeight: 500,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 0",
                borderBottom: "1px solid rgba(242,178,51,0.1)",
              }}
            >
              📅 13 de junio
            </p>
            <p
              style={{
                color: "#F2B233",
                fontWeight: 700,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 0",
              }}
            >
              📅 20 de junio · 🏆 Sorteo final
            </p>
          </div>

          <div
            style={{
              width: "100%",
              height: "1px",
              backgroundColor: "rgba(242,178,51,0.2)",
              margin: "12px 0",
            }}
          />

          <p
            style={{
              fontSize: "12px",
              color: "#F2B233",
              fontWeight: 600,
              textAlign: "center",
              margin: 0,
            }}
          >
            🏆 El 20 de junio es el sorteo del gran premio:
            Kia Picanto GT 2022 + Gixxer Fi ABS 2027
          </p>
        </div>
      </div>
    </section>
  );
}
