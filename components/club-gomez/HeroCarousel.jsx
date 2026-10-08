"use client";

import CtaButton from "./CtaButton";
import { lanzarConfeti } from "@/lib/club-gomez/confeti";
import { scrollToId } from "./hooks";

export default function HeroCarousel() {
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
            srcSet="/club-gomez/hero-crypton-movil.jpg"
          />
          <img
            src="/club-gomez/hero-crypton-pc.png"
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
            <p className="cg-hero__eyebrow">0 km · la nueva moto del Club</p>
            <h1 className="cg-hero__title">
              YAMAHA
              <br />
              <span className="cg-hero__title-accent">CRYPTON</span>
            </h1>
            <div className="cg-hero__sub">
              <p className="cg-hero__sub-cash">
                + $1.000.000
                <span> EN EFECTIVO</span>
              </p>
            </div>
          </div>
        </div>
        <div className="cg-hero__cta">
          <CtaButton
            animate
            className="cg-cta-blink"
            onClick={irAParticipar}
          >
            ¡Participar!
          </CtaButton>
        </div>
      </div>
    </section>
  );
}
