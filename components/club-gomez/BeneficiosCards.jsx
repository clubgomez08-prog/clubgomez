"use client";

import CtaButton from "./CtaButton";
import { BENEFICIO_CARDS } from "@/lib/club-gomez/stickers";
import { scrollToId, useReveal } from "./hooks";

const TEXTO_BANDA = [
  "Crypton 0 km más $1.000.000",
  "Membresía Club Gómez",
  "17 de octubre",
  "Lotería de Boyacá",
  "Oportunidades del Club",
  "Premios del mes",
  "Desde cualquier ciudad",
  "3 últimos números",
];

export default function BeneficiosCards({ textos = null, bloque = null }) {
  const { ref, className } = useReveal();
  const cinta = textos?.length ? textos : TEXTO_BANDA;
  const titulo = bloque?.titulo || "Una membresía";
  const acento = bloque?.acento || "exclusiva";
  const bajada = bloque?.bajada || "para disfrutar cada mes de:";
  const boton = bloque?.boton || "Quiero suscribirme";
  const tarjetas = bloque?.items?.length
    ? bloque.items
    : BENEFICIO_CARDS.map((c) => ({ titulo: c.title, texto: c.desc, sticker: c.sticker }));

  return (
    <section id="como-funciona" ref={ref} className={`cg-perk-cards ${className}`}>
      <div className="cg-perk-cards__inner">
        <div className="cg-perk-cards__head">
          <div>
            <h2>
              {titulo} {acento ? <span>{acento}</span> : null}
            </h2>
            <p>{bajada}</p>
          </div>
          <CtaButton
            requireAuth
            onClick={() => scrollToId("membresias")}
            animate={false}
          >
            {boton}
          </CtaButton>
        </div>

        <div className={`cg-perk-cards__grid${tarjetas.length === 1 ? " is-una" : ""}`}>
          {tarjetas.map((c) => (
            <article key={`${c.titulo}-${c.sticker}`} className="cg-perk-card">
              <div className="cg-perk-card__sticker">
                <img src={c.sticker} alt="" className="cg-sticker-img" decoding="async" />
              </div>
              <h3>{c.titulo}</h3>
              <p>{c.texto}</p>
              <button
                type="button"
                className="cg-perk-card__more"
                aria-label={`Bajar a los planes: ${c.titulo}`}
                onClick={() => scrollToId("membresias")}
              >
                ↓
              </button>
            </article>
          ))}
        </div>
      </div>

      <div className="cg-text-band" aria-hidden="true">
        <div className="cg-text-band__track">
          {[...cinta, ...cinta].map((t, i) => (
            <span key={`${t}-${i}`} className="cg-text-band__item">
              {t}
              <span className="cg-text-band__dot" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
