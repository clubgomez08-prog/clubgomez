"use client";

import { useState } from "react";
import CtaButton from "./CtaButton";
import BeneficioMedia from "./BeneficioMedia";
import { BENEFICIOS_MES, DESTACADO_MES } from "@/lib/club-gomez/beneficios-data";
import { scrollToId, useReveal } from "./hooks";

export default function BeneficiosDelMes() {
  const { ref, className } = useReveal();
  const [activo, setActivo] = useState(0);
  const item = BENEFICIOS_MES[activo];

  return (
    <section
      id="beneficios-mes"
      ref={ref}
      className={className}
      style={{
        background: "linear-gradient(180deg, rgba(5,6,7,0.35) 0%, rgba(10,18,6,0.5) 45%, rgba(5,6,7,0.4) 100%)",
        padding: "80px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-bebas), Impact, sans-serif",
              fontSize: "clamp(2.4rem, 7vw, 3.6rem)",
              fontStyle: "italic",
              letterSpacing: "0.03em",
              color: "#fff",
            }}
          >
            Beneficios <span style={{ color: "#B8E351" }}>del mes</span>
          </h2>
          <CtaButton onClick={() => scrollToId("membresias")}>¡Quiero mi membresía!</CtaButton>
        </div>

        {/* Cápsula destacada PC / móvil */}
        <div className="cg-capsula-motos">
          <picture>
            <source media="(max-width: 767px)" srcSet={DESTACADO_MES.imagenMovil} />
            <img
              src={DESTACADO_MES.imagenPc}
              alt={DESTACADO_MES.titulo}
              className="cg-capsula-motos__img"
            />
          </picture>

          <div className="cg-capsula-motos__overlay" />

          <div className="cg-capsula-motos__copy">
            <span className="cg-capsula-motos__pill">DESTACADO DEL MES</span>
            <p className="cg-capsula-motos__fecha">{DESTACADO_MES.fechas[0]}</p>
            <h3 className="cg-capsula-motos__title">{DESTACADO_MES.titulo}</h3>
            <p className="cg-capsula-motos__sub">{DESTACADO_MES.subtitulo}</p>
            <button
              type="button"
              className="cg-capsula-motos__cta"
              onClick={() => scrollToId("membresias")}
            >
              ¡Participar ya!
            </button>
          </div>
        </div>

        <p
          style={{
            margin: "28px 0 16px",
            fontFamily: "var(--font-oswald), sans-serif",
            fontSize: 14,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          Más beneficios de octubre
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}
        >
          {BENEFICIOS_MES.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setActivo(i)}
              style={{
                textAlign: "left",
                background: activo === i ? "rgba(184,227,81,0.1)" : "rgba(255,255,255,0.03)",
                border:
                  activo === i
                    ? "1.5px solid rgba(184,227,81,0.55)"
                    : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 18,
                padding: 12,
                cursor: "pointer",
                transition: "transform 0.2s ease, border-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <BeneficioMedia
                imagenKey={b.imagenKey}
                label={b.labelPlaceholder}
                aspect="4/3"
                rounded="12px"
              />
              <p
                style={{
                  margin: "10px 0 4px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  lineHeight: 1.3,
                  fontFamily: "var(--font-oswald), sans-serif",
                }}
              >
                {b.nombre}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "#B8E351", lineHeight: 1.4 }}>
                {b.fechas.join(" · ")}
              </p>
            </button>
          ))}
        </div>

        <div
          style={{
            background: "rgba(184,227,81,0.06)",
            border: "1px solid rgba(184,227,81,0.25)",
            borderRadius: 16,
            padding: "16px 18px",
          }}
        >
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 12,
              color: "rgba(255,255,255,0.45)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Seleccionado
          </p>
          <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#fff", fontSize: 15 }}>
            {item.nombre}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "#B8E351" }}>
            Fechas: {item.fechas.join(" · ")}
          </p>
        </div>
      </div>
    </section>
  );
}
