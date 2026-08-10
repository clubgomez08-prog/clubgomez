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
    claves: 10,
    extras: ["Te conviertes en miembro VIP"],
    avatar: "/club-gomez/plan-elite.png",
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
    claves: 7,
    extras: [],
    avatar: "/club-gomez/plan-selecto.png",
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
    claves: 3,
    extras: [],
    avatar: "/club-gomez/plan-esencial.png",
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

      <div className="cg-planes__floaters" aria-hidden="true">
        <img src={STICKERS.rayo} alt="" className="cg-sticker-img cg-planes__floater cg-planes__floater--1" />
        <img src={STICKERS.dolar} alt="" className="cg-sticker-img cg-planes__floater cg-planes__floater--2" />
        <img src={STICKERS.cohete} alt="" className="cg-sticker-img cg-planes__floater cg-planes__floater--3" />
        <img src={STICKERS.trofeo} alt="" className="cg-sticker-img cg-planes__floater cg-planes__floater--4" />
        <img src={STICKERS.casco} alt="" className="cg-sticker-img cg-planes__floater cg-planes__floater--5" />
        <img src={STICKERS.billetes} alt="" className="cg-sticker-img cg-planes__floater cg-planes__floater--6" />
        <img src={STICKERS.mano} alt="" className="cg-sticker-img cg-planes__floater cg-planes__floater--7" />
        <img src={STICKERS.moneda} alt="" className="cg-sticker-img cg-planes__floater cg-planes__floater--8" />
      </div>

      <div className="cg-planes__inner">
        <div className="cg-planes__head">
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

              <div className="cg-plan-card__figure" aria-hidden="true">
                <Image
                  src={p.avatar}
                  alt=""
                  width={440}
                  height={520}
                  sizes="220px"
                  style={{ objectFit: "contain", objectPosition: "center top" }}
                />
              </div>

              <div className="cg-plan-card__sticker" aria-hidden="true">
                <img src={p.sticker} alt="" className="cg-sticker-img" />
              </div>

              <div className="cg-plan-card__top">
                <div>
                  <span className="cg-plan-card__period">Plan mensual</span>
                  <h3>{p.nombre}</h3>
                  <p className="cg-plan-card__tag">{p.tag}</p>
                </div>
              </div>

              <ul className="cg-plan-card__list">
                <li>
                  <strong>{p.claves} claves</strong> con oportunidades
                </li>
                <li>Un mes de beneficios: descuentos en marcas aliadas.</li>
                <li>Participas de los premios y entregas del mes.</li>
                <li>Recibes tus claves por correo al activar.</li>
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
