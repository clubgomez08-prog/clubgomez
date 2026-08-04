"use client";

import Link from "next/link";
import Image from "next/image";
import Header from "./Header";
import Footer from "./Footer";
import CtaButton from "./CtaButton";
import { BENEFICIOS_MES, DESTACADO_MES, beneficioSrc } from "@/lib/club-gomez/beneficios-data";

const TAGS = ["Motos", "Hogar", "Tech", "Premios"];

const PREMIOS = [
  {
    id: DESTACADO_MES.id,
    nombre: DESTACADO_MES.titulo,
    subtitulo: DESTACADO_MES.subtitulo,
    fechas: DESTACADO_MES.fechas,
    imagen: DESTACADO_MES.imagenPc,
    destacado: true,
  },
  ...BENEFICIOS_MES.map((b) => ({
    id: b.id,
    nombre: b.nombre,
    subtitulo: null,
    fechas: b.fechas,
    imagen: beneficioSrc(b.imagenKey),
    destacado: false,
  })),
];

export default function BeneficiosPageView() {
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
              Motos, tech, hogar y más. Activa tu membresía y participa de los beneficios del mes.
            </p>
            <div className="cg-benef-hero__actions">
              <CtaButton href="/#membresias">¡Suscribirme!</CtaButton>
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
                <li key={t} className={`cg-benef-hero__tag cg-benef-hero__tag--${i + 1}`}>
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
              <p>Beneficios del mes disponibles para miembros activos</p>
            </div>

            <div className="cg-benef-grid cg-benef-grid--premios">
              {PREMIOS.map((p) => (
                <article
                  key={p.id}
                  className={`cg-premio-card${p.destacado ? " is-featured" : ""}`}
                >
                  <div className="cg-premio-card__media">
                    <img src={p.imagen} alt={p.nombre} />
                    {p.destacado && <span className="cg-premio-card__badge">Destacado</span>}
                  </div>
                  <div className="cg-premio-card__body">
                    <h3>{p.nombre}</h3>
                    {p.subtitulo && <p className="cg-premio-card__sub">{p.subtitulo}</p>}
                    <ul className="cg-premio-card__fechas">
                      {p.fechas.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
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
