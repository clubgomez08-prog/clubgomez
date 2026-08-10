"use client";

import { useRef, useState } from "react";
import CtaButton from "./CtaButton";
import { scrollToId, useReveal } from "./hooks";

const VIDEO_SRC = "/club-gomez/testimonio-1.mp4";
const POSTER_SRC = "/club-gomez/testimonio-1-poster.jpg";

export default function Testimonios() {
  const { ref, className } = useReveal();
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  return (
    <section id="testimonios" ref={ref} className={`cg-testimonios ${className}`}>
      <div className="cg-testimonios__inner">
        <div className="cg-testimonios__copy">
          <h2>
            ¡TÚ PODRÍAS SER
            <br />
            <span>uno de nuestros beneficiados!</span>
          </h2>
          <p className="cg-testimonios__sub">
            Un momento real del Club — más testimonios pronto
          </p>
          <div className="cg-testimonios__cta">
            <CtaButton onClick={() => scrollToId("membresias")}>¡Suscribirme ya!</CtaButton>
          </div>
        </div>

        <div className="cg-testimonios__feature">
          <button
            type="button"
            className={`cg-testimonios__player${playing ? " is-playing" : ""}`}
            onClick={togglePlay}
            aria-label={playing ? "Pausar testimonio" : "Reproducir testimonio"}
          >
            <video
              ref={videoRef}
              className="cg-testimonios__video"
              src={VIDEO_SRC}
              poster={POSTER_SRC}
              playsInline
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            />
            {!playing && (
              <span className="cg-testimonios__play" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
