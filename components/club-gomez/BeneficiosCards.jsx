"use client";

import Link from "next/link";
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

export default function BeneficiosCards() {
  const { ref, className } = useReveal();

  return (
    <section id="como-funciona" ref={ref} className={`cg-perk-cards ${className}`}>
      <div className="cg-perk-cards__inner">
        <div className="cg-perk-cards__head">
          <div>
            <h2>
              Una membresía <span>exclusiva</span>
            </h2>
            <p>para disfrutar cada mes de:</p>
          </div>
          <CtaButton
            requireAuth
            onClick={() => scrollToId("membresias")}
            animate={false}
          >
            Quiero suscribirme
          </CtaButton>
        </div>

        <div className="cg-perk-cards__grid">
          {BENEFICIO_CARDS.map((c) => (
            <article key={c.id} className="cg-perk-card">
              <div className="cg-perk-card__sticker">
                <img src={c.sticker} alt="" className="cg-sticker-img" decoding="async" />
              </div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              <Link
                href="/beneficios"
                className="cg-perk-card__more"
                aria-label={`Ver más: ${c.title}`}
              >
                ↓
              </Link>
            </article>
          ))}
        </div>
      </div>

      <div className="cg-text-band" aria-hidden="true">
        <div className="cg-text-band__track">
          {[...TEXTO_BANDA, ...TEXTO_BANDA].map((t, i) => (
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
