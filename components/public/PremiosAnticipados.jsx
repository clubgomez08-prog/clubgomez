"use client";

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
      <div className="max-w-4xl mx-auto">
        <h2 className="text-white font-bold text-xl text-center mb-2 drop-shadow-sm">
          🏆 Premios anticipados
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {premios.map((premio, i) => {
            const parsed = parsePremio(premio);
            const { monto, desc, imagen_url } = parsed;
            return (
              <div
                key={i}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid rgba(242,178,51,0.3)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  color: "#F8FAFC",
                  fontWeight: "600",
                  fontSize: "15px",
                }}
              >
                {imagen_url && (
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
                )}
                <p>{monto}</p>
                {desc && <p style={{ fontSize: "13px", marginTop: "4px" }}>{desc}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
