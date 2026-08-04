"use client";

import Link from "next/link";
import Image from "next/image";
import { STICKERS } from "@/lib/club-gomez/stickers";
import { useReveal } from "./hooks";

const PLANES = [
  {
    id: "elite",
    nombre: "Élite",
    precio: "90.000",
    tag: "Vives la mejor versión del Club",
    badge: "Recomendado por el Club",
    highlight: true,
    equiv: "La experiencia completa del Club",
    extras: ["Te conviertes en miembro VIP"],
    avatarPos: "center 20%",
    sticker: STICKERS.corona,
  },
  {
    id: "selecto",
    nombre: "Selecto",
    precio: "60.000",
    tag: "Vas en serio con el Club",
    badge: null,
    highlight: false,
    equiv: "El equilibrio ideal",
    extras: [],
    avatarPos: "center 25%",
    sticker: STICKERS.cadena,
  },
  {
    id: "esencial",
    nombre: "Esencial",
    precio: "30.000",
    tag: "Arrancas con el Club",
    badge: null,
    highlight: false,
    equiv: "O sea, entras mes a mes",
    extras: [],
    avatarPos: "center 18%",
    sticker: STICKERS.llave,
  },
];

export default function Membresias() {
  const { ref, className } = useReveal();

  return (
    <section id="membresias" ref={ref} className={`cg-planes ${className}`}>
      <div className="cg-planes__bg" aria-hidden="true">
        <Image
          src="/club-gomez/plan-daniel.png"
          alt=""
          fill
          sizes="800px"
          style={{ objectFit: "cover", objectPosition: "center 20%" }}
        />
      </div>

      <div className="cg-planes__inner">
        <div className="cg-planes__head">
          <div className="cg-planes__stickers" aria-hidden="true">
            <img src={STICKERS.rayo} alt="" className="cg-sticker-img cg-planes__sticker cg-planes__sticker--1" />
            <img src={STICKERS.dolar} alt="" className="cg-sticker-img cg-planes__sticker cg-planes__sticker--2" />
            <img src={STICKERS.cohete} alt="" className="cg-sticker-img cg-planes__sticker cg-planes__sticker--3" />
          </div>
          <h2>
            Elige tu <span>membresía</span>
          </h2>
          <p>Elige tu plan y empieza a vivir el Club en serio.</p>
        </div>

        <div className="cg-planes__grid">
          {PLANES.map((p) => (
            <article
              key={p.id}
              className={`cg-plan-card${p.highlight ? " is-featured" : ""}`}
            >
              {p.badge && <span className="cg-plan-card__ribbon">{p.badge}</span>}

              <div className="cg-plan-card__sticker" aria-hidden="true">
                <img src={p.sticker} alt="" className="cg-sticker-img" />
              </div>

              <div className="cg-plan-card__top">
                <div>
                  <span className="cg-plan-card__period">Plan mensual</span>
                  <h3>{p.nombre}</h3>
                  <p className="cg-plan-card__tag">{p.tag}</p>
                </div>
                <div className="cg-plan-card__avatar">
                  <Image
                    src="/club-gomez/plan-daniel.png"
                    alt="Club Gómez"
                    width={88}
                    height={88}
                    style={{ objectFit: "cover", objectPosition: p.avatarPos }}
                  />
                </div>
              </div>

              <ul className="cg-plan-card__list">
                <li>Mientras tu membresía esté activa: accedes a descuentos exclusivos en marcas aliadas.</li>
                <li>Participas de los beneficios durante el mes.</li>
                {p.extras.map((ex) => (
                  <li key={ex}>{ex}</li>
                ))}
              </ul>

              <div className="cg-plan-card__price">
                <span className="cg-plan-card__currency">$</span>
                <span className="cg-plan-card__amount">{p.precio}</span>
                <span className="cg-plan-card__per">/Mensuales</span>
              </div>
              <p className="cg-plan-card__equiv">{p.equiv}</p>

              <Link href={`/formulario?plan=${p.id}`} className="cg-plan-card__cta">
                ¡Suscribirme ya!
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
