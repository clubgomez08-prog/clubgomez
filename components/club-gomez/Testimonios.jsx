"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import CtaButton from "./CtaButton";
import { scrollToId, useReveal } from "./hooks";

const FOTOS_ARRIBA = [
  {
    id: "n3187",
    src: "/club-gomez/testimonio-3187.jpg",
    alt: "Entrega de moto Club Gómez",
  },
  {
    id: "tv",
    src: "/club-gomez/testimonio-5.jpg",
    alt: "Beneficiados con televisor",
  },
  {
    id: "n3186",
    src: "/club-gomez/testimonio-3186.jpg",
    alt: "Beneficiado con moto Club Gómez",
  },
  {
    id: "noche",
    src: "/club-gomez/testimonio-foto-noche.jpg",
    alt: "Beneficiados del Club de noche",
  },
  {
    id: "moto",
    src: "/club-gomez/testimonio-foto-moto.jpg",
    alt: "Beneficiada con moto Suzuki",
  },
];

const FOTOS_ABAJO = [
  {
    id: "n2186",
    src: "/club-gomez/testimonio-2186.jpg",
    alt: "Entrega de beneficios Club Gómez",
    objectPosition: "center 22%",
  },
  {
    id: "abrazo",
    src: "/club-gomez/testimonio-2.jpg",
    alt: "Beneficiados celebrando",
  },
  {
    id: "pasillo",
    src: "/club-gomez/testimonio-foto-pasillo.jpg",
    alt: "Beneficiados del Club Gómez",
  },
  {
    id: "abrazo-foto",
    src: "/club-gomez/testimonio-foto-abrazo.jpg",
    alt: "Celebración Club Gómez",
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

function fillLane(items, min = 8) {
  if (!items.length) return [];
  const unique = [];
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.src)) continue;
    seen.add(item.src);
    unique.push(item);
  }
  const out = [];
  let i = 0;
  while (out.length < Math.max(min, unique.length)) {
    const item = unique[i % unique.length];
    const prev = out[out.length - 1];
    if (prev?.src === item.src && unique.length > 1) {
      i += 1;
      continue;
    }
    out.push({ ...item, laneKey: `${item.id}-${out.length}` });
    i += 1;
    if (i > unique.length * 24) break;
  }
  return out;
}

function MarqueeRow({ direction = "left", paused = false, label, items, renderItem }) {
  return (
    <div
      className={`cg-testimonios__row cg-testimonios__row--${direction}${
        paused ? " is-paused" : ""
      }`}
      aria-label={label}
    >
      <div className="cg-testimonios__track">
        <div className="cg-testimonios__group">
          {items.map((item) => renderItem(item, ""))}
        </div>
        <div className="cg-testimonios__group" aria-hidden="true">
          {items.map((item) => renderItem(item, "-dup"))}
        </div>
      </div>
    </div>
  );
}

function PhotoCard({ foto }) {
  return (
    <figure className="cg-testimonios__shot">
      <Image
        src={foto.src}
        alt={foto.alt}
        fill
        sizes="(max-width: 860px) 42vw, 220px"
        className="cg-testimonios__shot-img"
        style={foto.objectPosition ? { objectPosition: foto.objectPosition } : undefined}
      />
    </figure>
  );
}

function VideoTile({ item, playingId, onToggle }) {
  const videoRef = useRef(null);
  const playing = playingId === item.laneKey;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!playing) {
      v.pause();
      return;
    }
    v.play().catch(() => onToggle(null));
  }, [playing, onToggle]);

  function handleClick() {
    onToggle(playing ? null : item.laneKey);
  }

  return (
    <button
      type="button"
      className={`cg-testimonios__vid${playing ? " is-playing" : ""}`}
      onClick={handleClick}
      aria-label={playing ? `Pausar ${item.alt}` : `Reproducir ${item.alt}`}
    >
      <video
        ref={videoRef}
        className="cg-testimonios__vid-media"
        src={item.src}
        poster={item.poster}
        playsInline
        preload="metadata"
        onEnded={() => onToggle(null)}
      />
      {!playing && (
        <span className="cg-testimonios__play" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      )}
    </button>
  );
}

export default function Testimonios() {
  const { ref, className } = useReveal();
  const [playingId, setPlayingId] = useState(null);

  const fotosTop = fillLane(FOTOS_ARRIBA, 8);
  const fotosBottom = fillLane(FOTOS_ABAJO, 8);
  const videosLane = fillLane(VIDEOS, 6);

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
        </div>
      </div>

      <div className="cg-testimonios__lanes">
        <MarqueeRow
          direction="left"
          label="Fotos de beneficiados"
          items={fotosTop}
          renderItem={(foto, suffix) => (
            <PhotoCard key={`${foto.laneKey}${suffix}`} foto={foto} />
          )}
        />

        <MarqueeRow
          direction="right"
          paused={Boolean(playingId)}
          label="Videos de testimonios"
          items={videosLane}
          renderItem={(item, suffix) => (
            <VideoTile
              key={`${item.laneKey}${suffix}`}
              item={
                suffix
                  ? { ...item, laneKey: `${item.laneKey}${suffix}` }
                  : item
              }
              playingId={playingId}
              onToggle={setPlayingId}
            />
          )}
        />

        <MarqueeRow
          direction="left"
          label="Más fotos de beneficiados"
          items={fotosBottom}
          renderItem={(foto, suffix) => (
            <PhotoCard key={`${foto.laneKey}${suffix}`} foto={foto} />
          )}
        />
      </div>

      <div className="cg-testimonios__inner cg-testimonios__inner--cta">
        <div className="cg-testimonios__cta">
          <CtaButton requireAuth onClick={() => scrollToId("membresias")}>
            ¡Suscribirme ya!
          </CtaButton>
        </div>
      </div>
    </section>
  );
}
