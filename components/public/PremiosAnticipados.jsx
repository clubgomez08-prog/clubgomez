"use client";

import { esUrlVideo } from "@/lib/esUrlVideo";

export default function PremiosAnticipados({ premios }) {
  if (!premios || !Array.isArray(premios) || premios.length === 0) return null;

  function parsePremio(premio) {
    if (typeof premio === "string") {
      return { monto: premio, desc: "", imagen_url: "" };
    }
    return {
      monto: premio.monto ?? premio.monto_cop ?? premio.nombre ?? "",
      desc: premio.desc ?? premio.descripcion ?? "",
      imagen_url: premio.imagen_url ?? "",
    };
  }

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {premios.map((premio, i) => {
            const parsed = parsePremio(premio);
            const { monto, desc, imagen_url } = parsed;
            return (
              <div
                key={i}
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
                  padding: "10px 14px",
                  color: "#F8FAFC",
                  fontWeight: "600",
                  fontSize: "15px",
                }}
              >
                {imagen_url &&
                  (esUrlVideo(imagen_url) ? (
                    <video
                      src={imagen_url}
                      muted
                      playsInline
                      loop
                      autoPlay
                      style={{
                        width: "56px",
                        height: "56px",
                        objectFit: "cover",
                        borderRadius: "10px",
                        border: "1.5px solid rgba(242,178,51,0.4)",
                        display: "block",
                        margin: "0 auto 8px",
                        backgroundColor: "#0a0a0a",
                      }}
                    />
                  ) : (
                    <img
                      src={imagen_url}
                      alt={monto}
                      style={{
                        width: "56px",
                        height: "56px",
                        objectFit: "cover",
                        borderRadius: "10px",
                        border: "1.5px solid rgba(242,178,51,0.4)",
                        display: "block",
                        margin: "0 auto 8px",
                      }}
                    />
                  ))}
                <p style={{ textAlign: "center" }}>{monto}</p>
                {desc && (
                  <p style={{ fontSize: "13px", marginTop: "4px", textAlign: "center" }}>
                    {desc}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
