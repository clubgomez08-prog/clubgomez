"use client";

import Image from "next/image";

export default function Footer() {
  return (
    <footer
      style={{
        background: "#050607",
        borderTop: "1px solid rgba(184,227,81,0.12)",
        padding: "56px 20px 32px",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 32,
            marginBottom: 40,
          }}
        >
          <div>
            <Image
              src="/club-gomez/logo-full.png"
              alt="Club Gómez"
              width={160}
              height={80}
              style={{ height: 72, width: "auto", objectFit: "contain", marginBottom: 12 }}
            />
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
              Membresía exclusiva · Descuentos · Beneficios del Club
            </p>
          </div>

          <div>
            <h3
              style={{
                margin: "0 0 12px",
                fontSize: 14,
                fontWeight: 800,
                color: "#B8E351",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Contáctanos
            </h3>
            <p style={{ margin: "0 0 6px", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              Escríbenos a:{" "}
              <span style={{ color: "#fff" }}>soporte@clubgomez.com</span>
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
              Horario: L-V de 9 a 6pm · Sáb. de 9am a 2pm
            </p>
            <p style={{ margin: "12px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              Instagram y WhatsApp — por confirmar
            </p>
          </div>

          <div>
            <h3
              style={{
                margin: "0 0 12px",
                fontSize: 14,
                fontWeight: 800,
                color: "#B8E351",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Información legal
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {["Términos y condiciones", "Políticas de privacidad", "Política de cookies"].map(
                (t) => (
                  <li key={t}>
                    <span
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.5)",
                        borderBottom: "1px dashed rgba(255,255,255,0.2)",
                      }}
                    >
                      {t} (próximamente)
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 20,
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            © {new Date().getFullYear()} Club Gómez. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
