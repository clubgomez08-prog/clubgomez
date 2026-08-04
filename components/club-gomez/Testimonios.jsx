"use client";

import CtaButton from "./CtaButton";
import PlaceholderMedia from "./PlaceholderMedia";
import { scrollToId, useReveal } from "./hooks";

const CAPTURAS = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  label: `Testimonio / captura ${i + 1}`,
}));

export default function Testimonios() {
  const { ref, className } = useReveal();
  const loop = [...CAPTURAS, ...CAPTURAS];

  return (
    <section id="testimonios" ref={ref} className={`cg-testimonios ${className}`}>
      <div className="cg-testimonios__inner">
        <h2>
          ¡TÚ PODRÍAS SER
          <br />
          <span>uno de nuestros beneficiados!</span>
        </h2>
        <p className="cg-testimonios__sub">Capturas, entregas y momentos del Club</p>

        <div className="cg-testimonios__marquee" aria-label="Galería de beneficiados">
          <div className="cg-testimonios__track">
            {loop.map((c, i) => (
              <div key={`${c.id}-${i}`} className="cg-testimonios__card">
                <PlaceholderMedia label={c.label} aspect="3/4" rounded="14px" />
              </div>
            ))}
          </div>
        </div>

        <div className="cg-testimonios__cta">
          <CtaButton onClick={() => scrollToId("membresias")}>¡Suscribirme ya!</CtaButton>
        </div>
      </div>
    </section>
  );
}
