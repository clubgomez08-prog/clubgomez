"use client";

import { useEffect, useState } from "react";
import { STICKERS } from "@/lib/club-gomez/stickers";
import { irASuscribir } from "@/lib/club-gomez/flujo-suscripcion";
import { getPlanById, PLANES_MEMBRESIA } from "@/lib/club-gomez/planes";
import { trackInitiateCheckoutThenGo } from "@/lib/club-gomez/meta-pixel";
import { useReveal } from "./hooks";
import styles from "./DestacadoClub.module.css";

const FOTOS = [
  {
    src: "/club-gomez/daniel-crypton.jpg",
    alt: "Daniel con la Yamaha Crypton",
  },
  {
    src: "/club-gomez/crypton-frente-sol.jpg",
    alt: "Yamaha Crypton",
  },
  {
    src: "/club-gomez/crypton-trasera-sol.jpg",
    alt: "Yamaha Crypton",
  },
];

const CONFETTI_COLORS = [
  "#B8E351",
  "#FFD84A",
  "#FF6B6B",
  "#FF8BD2",
  "#6EE7F9",
  "#FFFFFF",
  "#FF9F43",
];

const CONFETTI = Array.from({ length: 42 }, (_, n) => ({
  id: n,
  left: `${(n * 13 + 5) % 96}%`,
  delay: `${((n * 0.17) % 3.2).toFixed(2)}s`,
  duration: `${(3.2 + (n % 6) * 0.45).toFixed(2)}s`,
  color: CONFETTI_COLORS[n % CONFETTI_COLORS.length],
  width: 5 + (n % 6),
  height: n % 5 === 0 ? 5 + (n % 4) : 8 + (n % 8),
  radius: n % 4 === 0 ? "50%" : "2px",
  drift: `${(n % 2 === 0 ? -18 : 22) - (n % 9)}px`,
  spin: `${n % 2 === 0 ? 320 : -280}deg`,
}));

const MINI_PLANES = [
  {
    ...PLANES_MEMBRESIA.elite,
    precio: PLANES_MEMBRESIA.elite.precioLabel,
    highlight: true,
    badge: "Recomendado",
    sticker: STICKERS.corona,
  },
  {
    ...PLANES_MEMBRESIA.selecto,
    precio: PLANES_MEMBRESIA.selecto.precioLabel,
    highlight: false,
    badge: null,
    sticker: STICKERS.cadena,
  },
  {
    ...PLANES_MEMBRESIA.esencial,
    precio: PLANES_MEMBRESIA.esencial.precioLabel,
    highlight: false,
    badge: null,
    sticker: STICKERS.llave,
  },
];

export default function DestacadoClub() {
  const { ref, className } = useReveal();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const other = (i + 1) % FOTOS.length;

  useEffect(() => {
    if (paused) return undefined;
    const t = window.setInterval(() => {
      setI((n) => (n + 1) % FOTOS.length);
    }, 4200);
    return () => window.clearInterval(t);
  }, [paused]);

  return (
    <section
      id="destacado-club"
      ref={ref}
      className={`${styles.combo} ${className}`}
    >
      <div className={styles.inner}>
        <div
          className={styles.stage}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <img src={STICKERS.casco} alt="" className={styles.floatA} />
          <img src={STICKERS.rayo} alt="" className={styles.floatB} />
          <img src={STICKERS.billetes} alt="" className={styles.floatC} />

          <div className={styles.gallery}>
            {FOTOS.map((f, idx) => (
              <img
                key={f.src}
                src={f.src}
                alt={idx === i ? f.alt : ""}
                className={`${styles.img}${idx === i ? ` ${styles.imgActive}` : ""}`}
              />
            ))}
            <div className={styles.glow} aria-hidden="true" />
            <div className={styles.confetti} aria-hidden="true">
              {CONFETTI.map((p) => (
                <span
                  key={p.id}
                  className={styles.confettiBit}
                  style={{
                    left: p.left,
                    width: p.width,
                    height: p.height,
                    background: p.color,
                    borderRadius: p.radius,
                    animationDelay: p.delay,
                    animationDuration: p.duration,
                    ["--drift"]: p.drift,
                    ["--spin"]: p.spin,
                  }}
                />
              ))}
            </div>
            <span className={styles.pill}>0 kilómetros</span>
            <div className={styles.captionBlock}>
              <p className={styles.date}>17 de octubre · Lotería de Boyacá</p>
              <p className={styles.caption}>Yamaha Crypton</p>
              <p className={styles.cash}>+ $1.000.000 en efectivo</p>
            </div>
          </div>

          <button
            type="button"
            className={styles.thumb}
            onClick={() => setI(other)}
            aria-label="Ver la otra foto"
          >
            <img src={FOTOS[other].src} alt="" />
          </button>
        </div>

        <div className={styles.copy}>
          <p className={styles.eyebrow}>Entrá este mes</p>
          <h2 className={styles.title}>
            Elige tu <span>membresía</span>
          </h2>
          <p className={styles.kicker}>
            Crypton 0 km más $1.000.000 en efectivo. 17 de octubre, Lotería de Boyacá.
          </p>

          <div className={styles.cards}>
            {MINI_PLANES.map((p) => (
              <article
                key={p.id}
                className={`${styles.plan}${p.highlight ? ` ${styles.featured}` : ""}`}
              >
                <img src={p.sticker} alt="" className={styles.sticker} />
                {p.badge ? <span className={styles.ribbon}>{p.badge}</span> : null}
                <span className={styles.period}>Plan mensual</span>
                <h3>{p.nombre}</h3>
                <p className={styles.keys}>
                  <strong>{p.claves}</strong>{" "}
                  {p.claves === 1 ? "oportunidad" : "oportunidades"}
                </p>
                <div className={styles.price}>
                  <span className={styles.before}>${p.precioAntes}</span>
                  <span className={styles.now}>
                    ${p.precio}
                    <small>/mes</small>
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.cta}
                  onClick={() => {
                    trackInitiateCheckoutThenGo(getPlanById(p.id), () =>
                      irASuscribir({ planId: p.id })
                    );
                  }}
                >
                  ¡Suscribirme ya!
                </button>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
