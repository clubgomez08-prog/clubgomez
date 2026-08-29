"use client";

import Image from "next/image";
import CtaButton from "./CtaButton";
import { scrollToId, useReveal } from "./hooks";

const ALIADOS = [
  {
    id: "caobos",
    nombre: "Veterinaria Caobos",
    logo: "/club-gomez/aliado-caobos.png",
    logoAlt: "Logo Veterinaria Caobos",
    logoBg: "#10160e",
    logoTall: true,
    ofertas: [
      { pct: "30%", texto: "Servicios · atención a cachorros" },
      { pct: "20%", texto: "Alimento y medicinas" },
    ],
    servicios: [
      "Consulta médica y diagnóstico",
      "Cirugía y hospitalización",
      "Estética y bienestar",
      "Farmacia y tienda",
      "Transporte a domicilio",
    ],
    nota: "Presenta tu membresía Club Gómez al canjear.",
  },
  {
    id: "pochos",
    nombre: "Plásticos Los Pochos",
    logo: "/club-gomez/aliado-plasticos-pochos.jpg",
    logoAlt: "Plásticos Los Pochos",
    logoBg: "#0a2a6b",
    logoFit: "cover",
    ofertas: [{ pct: "5%", texto: "En todo lo relacionado en plásticos" }],
    servicios: [
      "Bolsas, vasos, pitillos e icopor",
      "Variedad y buenos precios",
      "Cenabastos · Galpón Azul, Cúcuta",
    ],
    nota: "Descuento exclusivo para miembros del Club.",
  },
];

export default function Aliados() {
  const { ref, className } = useReveal();

  return (
    <section id="aliados" ref={ref} className={`cg-aliados ${className}`}>
      <div className="cg-aliados__inner">
        <header className="cg-aliados__head">
          <h2>
            Aliados <span>comerciales</span>
          </h2>
          <p>
            Descuentos reales en negocios aliados. Con tu membresía activa,
            presentas tu comprobante y listo.
          </p>
        </header>

        <div className="cg-aliados__grid">
          {ALIADOS.map((a) => (
            <article key={a.id} className="cg-aliados__card">
              <div
                className={`cg-aliados__logo-wrap${
                  a.logoTall ? " is-tall" : ""
                }`}
                style={{ background: a.logoBg }}
              >
                <Image
                  src={a.logo}
                  alt={a.logoAlt}
                  fill
                  sizes="(max-width: 860px) 90vw, 420px"
                  className={`cg-aliados__logo${
                    a.logoFit === "cover" ? " is-cover" : ""
                  }`}
                />
              </div>

              <div className="cg-aliados__body">
                <h3>{a.nombre}</h3>

                <div className="cg-aliados__offers">
                  {a.ofertas.map((o) => (
                    <div key={o.pct + o.texto} className="cg-aliados__offer">
                      <strong>{o.pct}</strong>
                      <span>{o.texto}</span>
                    </div>
                  ))}
                </div>

                <ul className="cg-aliados__list">
                  {a.servicios.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>

                <p className="cg-aliados__nota">{a.nota}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="cg-aliados__more">Pronto sumamos más marcas al Club.</p>

        <div className="cg-aliados__cta">
          <CtaButton requireAuth onClick={() => scrollToId("membresias")}>
            ¡Quiero mi membresía!
          </CtaButton>
        </div>
      </div>
    </section>
  );
}
