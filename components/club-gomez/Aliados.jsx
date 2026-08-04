"use client";

import CtaButton from "./CtaButton";
import PlaceholderMedia from "./PlaceholderMedia";
import { scrollToId, useReveal } from "./hooks";

const ALIADOS = [
  "Aliado 1 (pendiente)",
  "Aliado 2 (pendiente)",
  "Aliado 3 (confirmado)",
  "Aliado 4 (confirmado)",
  "Aliado 5 (confirmado)",
  "Aliado 6 (pendiente)",
  "Aliado 7 (pendiente)",
];

export default function Aliados() {
  const { ref, className } = useReveal();

  return (
    <section
      id="aliados"
      ref={ref}
      className={className}
      style={{
        background: "#090909",
        padding: "72px 20px",
        borderTop: "1px solid rgba(184,227,81,0.08)",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <h2
          style={{
            fontSize: "clamp(1.6rem, 5vw, 2.4rem)",
            fontWeight: 900,
            color: "#fff",
            margin: "0 0 10px",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          Descuentos con nuestras{" "}
          <span style={{ color: "#B8E351" }}>marcas aliadas</span>
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", margin: "0 0 28px", fontSize: 15 }}>
          Tu membresía te da acceso directo a beneficios en estos comercios
        </p>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(184,227,81,0.1)",
            border: "1px solid rgba(184,227,81,0.35)",
            borderRadius: 999,
            padding: "8px 16px",
            marginBottom: 32,
          }}
        >
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
            Código de descuento
          </span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: "#B8E351",
              letterSpacing: "0.12em",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            TALA
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 14,
            marginBottom: 36,
          }}
        >
          {ALIADOS.map((name, i) => (
            <div
              key={name}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: 12,
                transition: "transform 0.25s ease, border-color 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = "rgba(184,227,81,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              }}
            >
              <PlaceholderMedia label={`Logo aliado ${i + 1}`} aspect="1" rounded="12px" />
              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                {name}
              </p>
            </div>
          ))}
        </div>

        <CtaButton onClick={() => scrollToId("membresias")}>¡Quiero mi membresía!</CtaButton>
      </div>
    </section>
  );
}
