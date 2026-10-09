"use client";

import CtaButton from "./CtaButton";
import { lanzarConfeti } from "@/lib/club-gomez/confeti";
import { CAMPANA_LANDING_DEFAULT, partirEfectivo } from "@/lib/club-gomez/campana-landing";
import { scrollToId } from "./hooks";

export default function HeroCarousel({ campana = CAMPANA_LANDING_DEFAULT }) {
  const efectivo = partirEfectivo(campana.heroEfectivo);

  function irAParticipar() {
    lanzarConfeti();
    window.setTimeout(() => scrollToId("destacado-club"), 180);
  }
  return (
    <section
      id="inicio"
      className="cg-hero cg-hero--crypton"
      style={{
        position: "relative",
        minHeight: "100svh",
        overflow: "hidden",
        background: "#050607",
      }}
    >
      <div className="cg-hero__media" aria-hidden="true">
        <picture className="cg-hero__picture is-active">
          <source
            media="(max-width: 767px)"
            srcSet={campana.heroImgMovil}
          />
          <img
            src={campana.heroImgPc}
            alt=""
            className="cg-hero__img"
            style={{ ["--cg-hero-pos-mobile"]: "72% 42%" }}
            fetchPriority="high"
          />
        </picture>
        <div className="cg-hero__overlay" />
      </div>

      <div className="cg-hero__content">
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
        </div>
      </div>
    </section>
  );
}
