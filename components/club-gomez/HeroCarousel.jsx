"use client";

import CtaButton from "./CtaButton";
import { lanzarConfeti } from "@/lib/club-gomez/confeti";
import { CAMPANA_LANDING_DEFAULT, partirEfectivo } from "@/lib/club-gomez/campana-landing";
import { scrollToId } from "./hooks";

export default function HeroCarousel({ campana = CAMPANA_LANDING_DEFAULT }) {
  const efectivo = partirEfectivo(campana.heroEfectivo);
  const esNavidad = String(campana.heroImgPc || "").includes("hero-navidad");

  function irAParticipar() {
    lanzarConfeti();
    window.setTimeout(() => scrollToId("destacado-club"), 180);
  }
  return (
    <section
      id="inicio"
      className={`cg-hero cg-hero--crypton${esNavidad ? " cg-hero--navidad" : ""}`}
      style={{
        position: "relative",
        minHeight: esNavidad ? "auto" : "100svh",
        overflow: "hidden",
        background: "#050607",
      }}
    >
      <div
        className="cg-hero__media"
        aria-hidden="true"
        style={esNavidad ? { position: "relative", inset: "auto", height: "auto" } : undefined}
      >
        <picture
          className="cg-hero__picture is-active"
          style={esNavidad ? { position: "relative", inset: "auto", height: "auto", opacity: 1 } : undefined}
        >
          <source
            media="(max-width: 767px)"
            srcSet={campana.heroImgMovil}
          />
          <img
            src={campana.heroImgPc}
            alt=""
            className="cg-hero__img"
            style={
              esNavidad
                ? { width: "100%", height: "auto", objectFit: "unset", display: "block" }
                : { ["--cg-hero-pos-mobile"]: "72% 42%" }
            }
            fetchPriority="high"
          />
        </picture>
        <div className="cg-hero__overlay" style={esNavidad ? { background: "none" } : undefined} />
      </div>

      {esNavidad ? (
        <style>{`
          .cg-hero--navidad .cg-hero__content {
            justify-content: flex-start;
            padding-top: 7%;
            padding-left: clamp(28px, 4vw, 64px);
          }
          .cg-hero--navidad .cg-hero__copy {
            max-width: min(680px, 48vw);
          }
          .cg-hero--navidad .cg-hero__copy-text {
            background: linear-gradient(90deg, rgba(5, 6, 7, 0.82) 0%, rgba(5, 6, 7, 0.5) 70%, transparent 100%);
            margin-left: -16px;
            padding: 16px 56px 18px 16px;
            border-radius: 18px;
          }
          .cg-hero--navidad .cg-hero__title {
            font-size: clamp(3.8rem, 6.4vw, 6.4rem);
          }
          .cg-hero--navidad .cg-hero__cta {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
          }
          .cg-hero--navidad .cg-hero__anticipado {
            margin: 0;
            max-width: 440px;
            padding: 12px 14px 14px;
            border-radius: 16px;
            background: rgba(5, 6, 7, 0.82);
            color: #fff;
            font-family: var(--font-poppins), sans-serif;
            font-size: 14px;
            line-height: 1.35;
          }
          .cg-hero--navidad .cg-hero__anticipado strong {
            display: block;
            font-size: 12px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #b8e351;
          }
          .cg-hero--navidad .cg-hero__anticipado span {
            display: block;
            margin: 2px 0 6px;
            font-family: var(--font-bebas), Impact, sans-serif;
            font-size: 34px;
            letter-spacing: 0.03em;
            line-height: 0.9;
            color: #b8e351;
          }
          @media (max-width: 767px) {
            .cg-hero.cg-hero--navidad {
              display: grid;
              overflow: visible !important;
              margin-bottom: 210px;
            }
            .cg-hero--navidad .cg-hero__media,
            .cg-hero--navidad .cg-hero__content {
              grid-area: 1 / 1;
            }
            .cg-hero--navidad .cg-hero__content {
              position: relative !important;
              inset: auto !important;
              min-height: 100%;
              height: 100%;
              justify-content: space-between;
              align-items: stretch;
              gap: 0;
              padding: 76px 14px 12px;
              background: none;
              text-align: center;
            }
            .cg-hero--navidad .cg-hero__copy { max-width: 100%; }
            .cg-hero--navidad .cg-hero__copy-text {
              margin-left: 0;
              padding: 8px 8px 4px;
              background: linear-gradient(180deg, rgba(5, 6, 7, 0.42), transparent 80%);
              border-radius: 0;
            }
            .cg-hero--navidad .cg-hero__title {
              font-size: clamp(3.3rem, 16vw, 4.5rem);
            }
            .cg-hero--navidad .cg-hero__cta {
              position: relative;
              align-items: stretch;
              margin-top: auto;
            }
            .cg-hero--navidad .cg-hero__anticipado {
              position: absolute;
              left: 0;
              right: 0;
              top: calc(100% + 12px);
              max-width: none;
              text-align: left;
              padding: 10px 12px;
              background: rgba(5, 6, 7, 0.92);
            }
            .cg-hero--navidad .cg-hero__anticipado span {
              font-size: 28px;
            }
          }
        `}</style>
      ) : null}
      <div
        className="cg-hero__content"
        style={esNavidad ? { position: "absolute", inset: 0, minHeight: 0 } : undefined}
      >
        <div className="cg-hero__copy">
          <div className="cg-hero__copy-text">
            <p className="cg-hero__eyebrow">{campana.heroEyebrow}</p>
            <h1 className="cg-hero__title">
              {campana.heroTitulo}
              <br />
              <span className="cg-hero__title-accent">{campana.heroTituloAcento}</span>
            </h1>
            {efectivo.monto ? (
              <div className="cg-hero__sub">
                <p className="cg-hero__sub-cash">
                  {efectivo.monto}
                  {efectivo.resto ? <span>{efectivo.resto}</span> : null}
                </p>
              </div>
            ) : null}
          </div>
        </div>
        <div className="cg-hero__cta">
          <CtaButton
            animate
            className="cg-cta-blink"
            onClick={irAParticipar}
          >
            {campana.heroCta}
          </CtaButton>
          {esNavidad ? (
            <p className="cg-hero__anticipado">
              <strong>Premios anticipados</strong>
              <span>$500.000 en efectivo</span>
              Todos los sábados, del 21 de noviembre al 19 de diciembre, con el Premio Mayor de la Lotería de Boyacá.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
