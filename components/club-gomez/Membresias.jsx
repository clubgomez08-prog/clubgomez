"use client";

import Image from "next/image";
import { STICKERS } from "@/lib/club-gomez/stickers";
import { irASuscribir } from "@/lib/club-gomez/flujo-suscripcion";
import { labelOportunidades } from "@/lib/club-gomez/planes";
import { usePlanes } from "@/lib/club-gomez/use-planes";
import { trackInitiateCheckoutThenGo } from "@/lib/club-gomez/meta-pixel";
import { useReveal } from "./hooks";

const PRESENTACION = [
  {
    id: "elite",
    badge: "Recomendado por el Club",
    highlight: true,
    extras: ["Te conviertes en miembro VIP"],
    avatar: "/club-gomez/plan-elite.png",
    sticker: STICKERS.corona,
  },
  {
    id: "selecto",
    badge: null,
    highlight: false,
    extras: [],
    avatar: "/club-gomez/plan-selecto.png",
    sticker: STICKERS.cadena,
  },
  {
    id: "esencial",
    badge: null,
    highlight: false,
    extras: [],
    avatar: "/club-gomez/plan-esencial.png",
    sticker: STICKERS.llave,
  },
];

export default function Membresias({ planesLista = null, intro = "", frasePremio = "", sorteoSlug = "", cerrado = false }) {
  const { ref, className } = useReveal();
  const planes = usePlanes();
  const PLANES = planesLista
    ? planesLista.map((p, i) => ({
        ...p,
        precio: p.precioLabel,
        badge: i === 0 ? "Recomendado por el Club" : null,
        highlight: i === 0,
        extras: [],
        avatar: PRESENTACION[i % PRESENTACION.length].avatar,
        sticker: PRESENTACION[i % PRESENTACION.length].sticker,
      }))
    : PRESENTACION.map((extra) => ({
        ...planes[extra.id],
        ...extra,
        precio: planes[extra.id].precioLabel,
      }));

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
          <p>
            {intro ||
              "Entras a la Yamaha Crypton 0 km más $1.000.000. 17 de octubre, Lotería de Boyacá."}
          </p>
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
                  <strong>{labelOportunidades(p.claves)}</strong> (últimos 3 de
                  Boyacá)
                </li>
                <li>
                  {frasePremio || "Participas por la Crypton 0 km más $1.000.000 en efectivo."}
                </li>
                <li>Participas de los premios y entregas del mes.</li>
                <li>Recibes tus oportunidades por correo al activar.</li>
                {p.extras.map((ex) => (
                  <li key={ex}>{ex}</li>
                ))}
              </ul>

              <div className="cg-plan-card__price">
                {p.precioAntes ? (
                  <span className="cg-plan-card__before">
                    ${p.precioAntes}
                  </span>
                ) : null}
                <span className="cg-plan-card__now">
                  <span className="cg-plan-card__currency">$</span>
                  <span className="cg-plan-card__amount">{p.precio}</span>
                  <span className="cg-plan-card__per">/Mensuales</span>
                </span>
              </div>
              <p className="cg-plan-card__equiv">{p.equiv}</p>

              <button
                type="button"
                className="cg-plan-card__cta"
                disabled={cerrado}
                onClick={() => {
                  if (cerrado) return;
                  trackInitiateCheckoutThenGo(
                    { ...p, precio: Number(String(p.precio).replace(/\./g, "")) || p.precio },
                    () => irASuscribir({ planId: p.id, sorteoSlug })
                  );
                }}
              >
                {cerrado ? "Sorteo cerrado" : "¡Suscribirme ya!"}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
