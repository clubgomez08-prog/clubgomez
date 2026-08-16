"use client";

import { useEffect, useState } from "react";
import CtaButton from "./CtaButton";
import BeneficioMedia from "./BeneficioMedia";
import {
  beneficiosFallbackDesdeCatalogo,
  labelPeriodoEs,
} from "@/lib/club-gomez/beneficios-catalog";
import { irASuscribir } from "@/lib/club-gomez/flujo-suscripcion";
import { scrollToId, useReveal } from "./hooks";

export default function BeneficiosDelMes() {
  const { ref, className } = useReveal();
  const [periodoLabel, setPeriodoLabel] = useState("octubre");
  const [destacado, setDestacado] = useState(
    () => beneficiosFallbackDesdeCatalogo("2026-10").destacado
  );
  const [grid, setGrid] = useState(
    () => beneficiosFallbackDesdeCatalogo("2026-10").grid
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/beneficios-publicos", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data.ok || cancelled) return;
        setPeriodoLabel(
          data.periodoLabel || labelPeriodoEs(data.periodo) || "del mes"
        );
        if (data.destacado) setDestacado(data.destacado);
        if (Array.isArray(data.grid) && data.grid.length) {
          setGrid(data.grid);
        }
      } catch {
        /* fallback ya cargado */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mesCorto = String(periodoLabel || "")
    .replace(/\s+de\s+\d{4}/i, "")
    .trim() || "octubre";

  return (
    <section
      id="beneficios-mes"
      ref={ref}
      className={className}
      style={{
        background:
          "linear-gradient(180deg, rgba(5,6,7,0.35) 0%, rgba(10,18,6,0.5) 45%, rgba(5,6,7,0.4) 100%)",
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
          <CtaButton requireAuth onClick={() => scrollToId("membresias")}>
            ¡Quiero mi membresía!
          </CtaButton>
        </div>

        <div className="cg-capsula-motos">
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet={destacado.imagenMovil}
            />
            <img
              src={destacado.imagenPc}
              alt={destacado.titulo}
              className="cg-capsula-motos__img"
            />
          </picture>

          <div className="cg-capsula-motos__overlay" />

          <div className="cg-capsula-motos__copy">
            <span className="cg-capsula-motos__pill">DESTACADO DEL MES</span>
            <p className="cg-capsula-motos__fecha">
              {(destacado.fechas || []).join(" · ")}
            </p>
            <h3 className="cg-capsula-motos__title">{destacado.titulo}</h3>
            <p className="cg-capsula-motos__sub">{destacado.subtitulo}</p>
            <button
              type="button"
              className="cg-capsula-motos__cta"
              onClick={() => {
                if (irASuscribir({})) scrollToId("membresias");
              }}
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
          Más beneficios de {mesCorto}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {grid.map((b, i) => (
            <article
              key={b.id || b.slug || i}
              style={{
                textAlign: "left",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 18,
                padding: 12,
                transition: "transform 0.2s ease, border-color 0.2s ease",
              }}
            >
              <BeneficioMedia
                imagenKey={b.imagenKey}
                label={b.labelPlaceholder || b.nombre}
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
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: "#B8E351",
                  lineHeight: 1.4,
                }}
              >
                {(b.fechas || []).join(" · ")}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
