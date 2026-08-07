"use client";

import { useEffect, useState } from "react";
import CtaButton from "./CtaButton";
import { scrollToId } from "./hooks";

const SLIDES = [
  {
    id: 0,
    title: "¡ÚNETE!",
    titleAccent: null,
    lines: ["OBTÉN DESCUENTOS EXCLUSIVOS", "Y SÉ PARTE DE LOS BENEFICIOS DEL CLUB"],
    pc: "/club-gomez/hero-pc.png",
    mobile: "/club-gomez/hero-movil.png",
    showBadge: true,
  },
  {
    id: 1,
    title: "BENEFICIOS",
    titleAccent: "EXCLUSIVOS",
    lines: ["DESCUENTOS · MEMBRESÍAS"],
    pc: "/club-gomez/hero-pc-2.png",
    mobile: "/club-gomez/hero-movil-2.png",
    showBadge: false,
  },
  {
    id: 2,
    title: "SUSCRÍBETE",
    titleAccent: null,
    lines: ["DESDE CUALQUIER", "PARTE DEL MUNDO"],
    pc: "/club-gomez/hero-pc-3.png",
    mobile: "/club-gomez/hero-movil-3.png",
    showBadge: false,
  },
  {
    id: 3,
    title: "PREMIOS",
    titleAccent: "DEL CLUB",
    lines: ["TECH · HOGAR · EXPERIENCIAS"],
    pc: "/club-gomez/hero-pc-4.png",
    mobile: "/club-gomez/hero-movil-4.png",
    showBadge: false,
  },
  {
    id: 4,
    title: "¡ÚNETE!",
    titleAccent: null,
    lines: ["2 MOTOS · BENEFICIOS DEL MES"],
    pc: "/club-gomez/hero-pc-5.png",
    mobile: "/club-gomez/hero-movil-5.png",
    showBadge: true,
  },
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  const slide = SLIDES[index];

  return (
    <section
      id="inicio"
      className="cg-hero"
      style={{
        position: "relative",
        minHeight: "100svh",
        overflow: "hidden",
        background: "#050607",
      }}
    >
      <div className="cg-hero__media" aria-hidden="true">
        {SLIDES.map((s) => (
          <picture
            key={s.id}
            className={`cg-hero__picture${index === s.id ? " is-active" : ""}`}
          >
            <source media="(max-width: 767px)" srcSet={s.mobile} />
            <img
              src={s.pc}
              alt=""
              className="cg-hero__img"
              fetchPriority={s.id === 0 ? "high" : "auto"}
            />
          </picture>
        ))}
        <div className="cg-hero__overlay" />
      </div>

      <div className="cg-hero__content">
        <div key={slide.id} className="cg-hero__copy">
          <h1 className="cg-hero__title">
            {slide.title}
            {slide.titleAccent ? (
              <>
                <br />
                <span className="cg-hero__title-accent">{slide.titleAccent}</span>
              </>
            ) : null}
          </h1>
          <div className="cg-hero__sub">
            {slide.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="cg-hero__cta">
            <CtaButton onClick={() => scrollToId("membresias")}>¡Suscribirme!</CtaButton>
          </div>
        </div>

        {slide.showBadge && (
          <button
            type="button"
            className="cg-hero__badge cg-float"
            onClick={() => scrollToId("beneficios-mes")}
            aria-label="Ver 2 motos del mes"
          >
            <span className="cg-hero__badge-label">¡2 MOTOS!</span>
            <span className="cg-hero__badge-media">
              <img
                src="/club-gomez/badge-motos.png"
                alt="Special 110 y NKD 125"
              />
            </span>
            <span className="cg-hero__badge-date">26 DE SEPTIEMBRE</span>
          </button>
        )}

        <div className="cg-hero__dots">
          {SLIDES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Slide ${s.id + 1}`}
              onClick={() => setIndex(s.id)}
              className={index === s.id ? "is-active" : ""}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
