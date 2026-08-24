"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "./Header";
import Footer from "./Footer";
import CtaButton from "./CtaButton";
import {
  beneficioSrc,
  beneficiosFallbackDesdeCatalogo,
} from "@/lib/club-gomez/beneficios-catalog";

const TAGS = ["Motos", "Hogar", "Tech", "Premios"];

function buildPremios(destacado, items) {
  const list = [];
  if (destacado) {
    list.push({
      id: destacado.id || "motos",
      nombre: destacado.titulo,
      subtitulo: destacado.subtitulo,
      fechas: destacado.fechas || [],
      imagen: destacado.imagenPc,
      destacado: true,
    });
  }
  for (const b of items || []) {
    if (destacado?.slugs?.includes(b.slug)) continue;
    list.push({
      id: b.id || b.slug,
      nombre: b.nombre,
      subtitulo: null,
      fechas: b.fechas || [],
      imagen: b.imagenKey ? beneficioSrc(b.imagenKey) : "/club-gomez/logo-mark.jpg",
      destacado: false,
    });
  }
  return list;
}

export default function BeneficiosPageView() {
  const fallback = beneficiosFallbackDesdeCatalogo("2026-10");
  const [premios, setPremios] = useState(() =>
    buildPremios(fallback.destacado, fallback.grid)
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/beneficios-publicos", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data.ok || cancelled) return;
        setPremios(buildPremios(data.destacado, data.grid || data.items));
      } catch {
        /* keep fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="cg-benef-page">
      <Header />
      <main>
        <section className="cg-benef-hero">
          <div className="cg-benef-hero__copy">
            <p className="cg-benef-hero__eyebrow">Club Gómez</p>
            <h1>
              Premios de tu
              <br />
              <span>MEMBRESÍA</span>
            </h1>
            <p className="cg-benef-hero__sub">
              Motos, tech, hogar y más. Activa tu membresía: descuentos, premios
              del mes y oportunidades enviadas a tu correo.
            </p>
            <div className="cg-benef-hero__actions">
              <CtaButton href="/#membresias" requireAuth>
                ¡Suscribirme!
              </CtaButton>
              <Link href="/#beneficios-mes" className="cg-benef-hero__link">
                Ver en la home →
              </Link>
            </div>
          </div>

          <div className="cg-benef-hero__visual">
            <div className="cg-benef-hero__circle">
              <Image
                src="/club-gomez/plan-daniel.png"
                alt="Club Gómez"
                fill
                sizes="420px"
                style={{ objectFit: "cover", objectPosition: "center 18%" }}
                priority
              />
            </div>
            <ul className="cg-benef-hero__tags">
              {TAGS.map((t, i) => (
                <li
                  key={t}
                  className={`cg-benef-hero__tag cg-benef-hero__tag--${i + 1}`}
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="cg-benef-catalog">
          <div className="cg-benef-catalog__inner">
            <div className="cg-benef-catalog__head">
              <h2>
                Todos los <span>premios</span>
              </h2>
              <p>Fechas alineadas con el panel de Fechas de premio</p>
            </div>

            <div className="cg-benef-grid cg-benef-grid--premios">
              {premios.map((p) => (
                <article
                  key={p.id}
                  className={`cg-premio-card${p.destacado ? " is-featured" : ""}`}
                >
                  <div className="cg-premio-card__media">
                    <img src={p.imagen} alt={p.nombre} />
                    {p.destacado && (
                      <span className="cg-premio-card__badge">Destacado</span>
                    )}
                  </div>
                  <div className="cg-premio-card__body">
                    <h3>{p.nombre}</h3>
                    {p.subtitulo && (
                      <p className="cg-premio-card__sub">{p.subtitulo}</p>
                    )}
                    <p className="cg-premio-card__fechas">
                      {(p.fechas || []).join(" · ")}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
