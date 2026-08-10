"use client";

import { useState } from "react";
import { STICKERS } from "@/lib/club-gomez/stickers";
import { useReveal } from "./hooks";

const FAQ_ITEMS = [
  {
    q: "¿Qué es Club Gómez?",
    a: "Es una membresía exclusiva: un mes de beneficios con descuentos en negocios aliados, premios del Club y claves con oportunidades según tu plan.",
  },
  {
    q: "¿Cómo me uno al Club?",
    a: "Elige tu plan (Élite, Selecto o Esencial), completa el registro y activa tu membresía. En minutos ya formas parte del Club.",
  },
  {
    q: "¿Qué son las claves con oportunidades?",
    a: "Con tu membresía recibes claves (3, 7 o 10 según el plan). Te las enviamos por correo con la información para participar en los beneficios del mes. También puedes compartirlas por WhatsApp desde el mismo correo.",
  },
  {
    q: "¿Puedo participar desde otra ciudad?",
    a: "Sí. Puedes unirte desde cualquier ciudad. Coordinamos entregas y beneficios según tu ubicación.",
  },
  {
    q: "¿Cuándo se entregan los beneficios mensuales?",
    a: "Los beneficios del mes se comunican a los miembros activos. Las fechas se confirman por los canales oficiales del Club.",
  },
  {
    q: "¿Cómo me contactan si resulto favorecido?",
    a: "Te contactamos por WhatsApp y/o correo con los datos que registraste al activar tu membresía.",
  },
  {
    q: "¿Cuánto demora la entrega de mi beneficio?",
    a: "Depende del tipo de beneficio y tu ciudad. Te informamos tiempos estimados al momento de la confirmación.",
  },
];

export default function FAQ() {
  const { ref, className } = useReveal();
  const [open, setOpen] = useState(0);

  return (
    <section
      id="faq"
      ref={ref}
      className={className}
      style={{
        background: "rgba(9,9,9,0.45)",
        padding: "72px 20px",
        borderTop: "1px solid rgba(184,227,81,0.08)",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: -8,
            top: -28,
            width: 72,
            height: 72,
            opacity: 0.85,
          }}
        >
          <img
            src={STICKERS.mano}
            alt=""
            className="cg-sticker-img"
          />
        </div>
        <h2
          style={{
            fontSize: "clamp(1.7rem, 5vw, 2.4rem)",
            fontWeight: 900,
            color: "#fff",
            margin: "0 0 8px",
            textAlign: "center",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          ¿Tienes <span style={{ color: "#B8E351" }}>dudas?</span>
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.5)",
            margin: "0 0 28px",
            fontSize: 14,
          }}
        >
          Preguntas frecuentes
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: isOpen
                    ? "1px solid rgba(184,227,81,0.4)"
                    : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  overflow: "hidden",
                  transition: "border-color 0.2s ease",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "16px 18px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 15,
                    fontFamily: "Poppins, sans-serif",
                  }}
                >
                  {item.q}
                  <span
                    style={{
                      color: "#B8E351",
                      fontSize: 22,
                      lineHeight: 1,
                      transform: isOpen ? "rotate(45deg)" : "none",
                      transition: "transform 0.2s ease",
                      flexShrink: 0,
                    }}
                  >
                    +
                  </span>
                </button>
                <div
                  style={{
                    maxHeight: isOpen ? 280 : 0,
                    overflow: "hidden",
                    transition: "max-height 0.3s ease",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      padding: "0 18px 16px",
                      fontSize: 14,
                      color: "rgba(255,255,255,0.6)",
                      lineHeight: 1.55,
                    }}
                  >
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
