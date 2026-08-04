"use client";

import Link from "next/link";
import CtaButton from "./CtaButton";
import { BENEFICIO_CARDS } from "@/lib/club-gomez/stickers";
import { scrollToId, useReveal } from "./hooks";

const TEXTO_BANDA = [
  "Descuentos exclusivos",
  "Membresía Club Gómez",
  "Beneficios del mes",
  "Experiencia VIP",
  "Desde cualquier ciudad",
  "Marcas aliadas",
  "Actitud Club",
  "Participación mensual",
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
          <CtaButton onClick={() => scrollToId("membresias")} animate={false}>
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
