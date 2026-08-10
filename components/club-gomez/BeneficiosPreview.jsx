"use client";

import Link from "next/link";
import CtaButton from "./CtaButton";
import BeneficioMedia from "./BeneficioMedia";
import { BENEFICIOS_CLOVER } from "@/lib/club-gomez/beneficios-data";
import { scrollToId, useReveal } from "./hooks";

export default function BeneficiosPreview() {
  const { ref, className } = useReveal();

  return (
    <section id="beneficios" ref={ref} className={`cg-confia ${className}`}>
      <div className="cg-confia__capsule">
        <div className="cg-confia__copy">
          <h2 className="cg-confia__title">
            ¡Confía en el <span>Club!</span>
          </h2>
          <p className="cg-confia__sub">Beneficios increíbles todos los meses</p>
          <div className="cg-confia__actions">
            <Link
              href="/beneficios"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 28px",
                borderRadius: 999,
                border: "1.5px solid #23430c",
                background: "transparent",
                color: "#23430c",
                fontFamily: "var(--font-oswald), sans-serif",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              Todos los beneficios
            </Link>
            <CtaButton requireAuth onClick={() => scrollToId("membresias")}>
              ¡Suscribirme ya!
            </CtaButton>
          </div>
        </div>

        <div className="cg-trebol" aria-hidden="false">
          <div className="cg-trebol__spin">
            {BENEFICIOS_CLOVER.map((b, i) => (
              <div key={b.id} className={`cg-trebol__leaf cg-trebol__leaf--${i + 1}`}>
                <div className="cg-trebol__circle">
                  <BeneficioMedia
                    imagenKey={b.imagenKey}
                    label={b.labelPlaceholder}
                    aspect="1"
                    rounded="50%"
                    className="cg-trebol__media"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
