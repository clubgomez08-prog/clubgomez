"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import CtaButton from "./CtaButton";
import { scrollToId, useReveal } from "./hooks";

/** Fotos reales de beneficiados (intercaladas cada 3s) */
const FOTOS = [
  {
    id: "abrazo",
    src: "/club-gomez/testimonio-foto-abrazo.jpg",
    alt: "Beneficiados celebrando con su televisor",
  },
  {
    id: "tv",
    src: "/club-gomez/testimonio-foto-tv-pie.jpg",
    alt: "Beneficiados con televisor",
  },
  {
    id: "moto",
    src: "/club-gomez/testimonio-foto-moto.jpg",
    alt: "Beneficiada con moto Suzuki",
  },
];

const VIDEOS = [
  {
    id: "v1",
    src: "/club-gomez/testimonio-1.mp4",
    poster: "/club-gomez/testimonio-1-poster.jpg",
    alt: "Testimonio en video Club Gómez",
  },
  {
    id: "v3",
    src: "/club-gomez/testimonio-3.mp4",
    poster: "/club-gomez/testimonio-3-poster.jpg",
    alt: "Testimonio en video con moto",
  },
];

function VideoCard({ item, active }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || active) return;
    v.pause();
    setPlaying(false);
  }, [active]);

  function togglePlay(e) {
    e.stopPropagation();
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
    <div className={`cg-testimonios__phone${active ? " is-active" : ""}`}>
      <span className="cg-testimonios__phone-notch" aria-hidden="true" />
      <button
        type="button"
        className={`cg-testimonios__player${playing ? " is-playing" : ""}`}
        onClick={togglePlay}
        aria-label={playing ? `Pausar ${item.alt}` : `Reproducir ${item.alt}`}
      >
        <video
          ref={videoRef}
          className="cg-testimonios__video"
          src={item.src}
          poster={item.poster}
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
      <span className="cg-testimonios__phone-bar" aria-hidden="true" />
    </div>
  );
}

export default function Testimonios() {
  const { ref, className } = useReveal();
  const [fotoIndex, setFotoIndex] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      setFotoIndex((i) => (i + 1) % FOTOS.length);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      setVideoIndex((i) => (i + 1) % VIDEOS.length);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="testimonios" ref={ref} className={`cg-testimonios ${className}`}>
      <div className="cg-testimonios__inner">
        <div className="cg-testimonios__copy">
          <h2>
            ¡TÚ PODRÍAS SER
            <br />
            <span>uno de nuestros beneficiados!</span>
          </h2>
          <p className="cg-testimonios__sub">Momentos reales del Club</p>
          <div className="cg-testimonios__cta">
            <CtaButton onClick={() => scrollToId("membresias")}>¡Suscribirme ya!</CtaButton>
          </div>
        </div>

        <div className="cg-testimonios__media">
          <div className="cg-testimonios__stack" aria-label="Fotos de beneficiados">
            {FOTOS.map((foto, i) => {
              const isFront = i === fotoIndex;
              const isBack = i === (fotoIndex + 1) % FOTOS.length;
              if (!isFront && !isBack) return null;
              return (
                <figure
                  key={foto.id}
                  className={`cg-testimonios__photo${
                    isFront ? " is-front" : " is-back"
                  }`}
                >
                  <Image
                    src={foto.src}
                    alt={foto.alt}
                    fill
                    sizes="(max-width: 860px) 52vw, 240px"
                    className="cg-testimonios__photo-img"
                    priority={isFront}
                  />
                </figure>
              );
            })}
          </div>

          <div className="cg-testimonios__videos" aria-label="Videos de testimonios">
            <div
              className="cg-testimonios__videos-track"
              style={{ transform: `translateX(-${videoIndex * 100}%)` }}
            >
              {VIDEOS.map((item, i) => (
                <div key={item.id} className="cg-testimonios__videos-slide">
                  <VideoCard item={item} active={i === videoIndex} />
                </div>
              ))}
            </div>
            <div className="cg-testimonios__videos-dots">
              {VIDEOS.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  className={i === videoIndex ? "is-active" : ""}
                  aria-label={`Video ${i + 1}`}
                  onClick={() => setVideoIndex(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
