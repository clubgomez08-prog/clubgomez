"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const LOGO_SRC =
  "https://res.cloudinary.com/dmmnaypmc/image/upload/v1774429833/logo-rifex_odtuey.png";

const FULL_PHRASE = "Preparando tu experiencia";

/** Mínimo 15 partículas; posiciones deterministas (sin mismatch hidratación) */
const STAR_SEEDS = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: ((i * 19 + 5) % 92) + 4,
  top: ((i * 31 + 13) % 85) + 8,
  size: 2 + (i % 3),
  delay: ((i * 0.37) % 5).toFixed(2),
  duration: 9 + (i % 4) * 1.4,
  opacity: 0.3 + ((i * 17) % 4) / 10,
}));

const css = `
  @keyframes club-logo-in {
    from {
      opacity: 0;
      transform: translateY(-28px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes club-logo-shimmer {
    0% {
      transform: translateX(-120%);
      opacity: 0;
    }
    8% {
      opacity: 1;
    }
    35% {
      transform: translateX(120%);
      opacity: 0.85;
    }
    36%, 100% {
      transform: translateX(120%);
      opacity: 0;
    }
  }
  @keyframes club-progress-fill {
    from { width: 0%; }
    to { width: 100%; }
  }
  @keyframes club-progress-shine-move {
    0%, 72% {
      transform: translateX(-110%);
      opacity: 0;
    }
    73% {
      opacity: 0.95;
    }
    88% {
      transform: translateX(110%);
      opacity: 0.45;
    }
    89%, 100% {
      transform: translateX(110%);
      opacity: 0;
    }
  }
  @keyframes club-btn-in {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes club-btn-glow {
    0%, 100% {
      box-shadow:
        0 0 20px rgba(242, 178, 51, 0.55),
        0 0 32px rgba(242, 178, 51, 0.28),
        0 0 6px rgba(255, 255, 255, 0.12) inset;
    }
    50% {
      box-shadow:
        0 0 28px rgba(242, 178, 51, 0.95),
        0 0 48px rgba(242, 178, 51, 0.42),
        0 0 52px rgba(242, 178, 51, 0.22),
        0 0 6px rgba(255, 255, 255, 0.16) inset;
    }
  }
  @keyframes club-star-rise {
    0% {
      transform: translateY(10px);
    }
    100% {
      transform: translateY(-32px);
    }
  }
  @keyframes club-dot-seq-1 {
    0%, 72% { opacity: 1; transform: translateY(0); }
    80%, 100% { opacity: 0.2; transform: translateY(1px); }
  }
  @keyframes club-dot-seq-2 {
    0%, 14% { opacity: 0.18; transform: translateY(0); }
    18%, 72% { opacity: 1; transform: translateY(0); }
    80%, 100% { opacity: 0.18; transform: translateY(1px); }
  }
  @keyframes club-dot-seq-3 {
    0%, 32% { opacity: 0.18; transform: translateY(0); }
    36%, 72% { opacity: 1; transform: translateY(0); }
    80%, 100% { opacity: 0.18; transform: translateY(1px); }
  }
  .club-logo-anim {
    animation: club-logo-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .club-logo-shimmer-layer {
    position: absolute;
    inset: -8% -12%;
    pointer-events: none;
    background: linear-gradient(
      102deg,
      transparent 36%,
      rgba(255, 252, 246, 0.45) 48%,
      rgba(242, 178, 51, 0.35) 52%,
      transparent 64%
    );
    mix-blend-mode: soft-light;
    animation: club-logo-shimmer 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  .club-progress-inner {
    animation: club-progress-fill 2s cubic-bezier(0.45, 0, 0.2, 1) forwards;
  }
  .club-progress-shine {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 42%;
    border-radius: 9999px;
    pointer-events: none;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.05) 35%,
      rgba(255, 255, 255, 0.55) 50%,
      rgba(255, 255, 255, 0.08) 65%,
      transparent 100%
    );
    animation: club-progress-shine-move 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  .club-btn-visible.club-btn-pulse {
    animation:
      club-btn-in 1s ease-in both,
      club-btn-glow 2.4s ease-in-out 1s infinite;
    border: 2px solid rgba(242, 178, 51, 0.55);
  }
  .club-dot-1 {
    animation: club-dot-seq-1 1.8s cubic-bezier(0.45, 0, 0.55, 1) infinite;
  }
  .club-dot-2 {
    animation: club-dot-seq-2 1.8s cubic-bezier(0.45, 0, 0.55, 1) infinite;
  }
  .club-dot-3 {
    animation: club-dot-seq-3 1.8s cubic-bezier(0.45, 0, 0.55, 1) infinite;
  }
`;

export default function ClubPage() {
  const [typedLen, setTypedLen] = useState(0);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const phraseLen = FULL_PHRASE.length;
    const msPerChar = 2000 / phraseLen;
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setTypedLen((n) => Math.min(n + 1, phraseLen));
      if (i >= phraseLen) clearInterval(t);
    }, msPerChar);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowButton(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const visiblePhrase = FULL_PHRASE.slice(0, typedLen);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div
        className="relative min-h-[100vh] overflow-hidden text-white"
        style={{ backgroundColor: "#071521" }}
      >
        <div
          className="pointer-events-none absolute inset-0 z-0"
          aria-hidden
        >
          {STAR_SEEDS.map((s) => (
            <span
              key={s.id}
              className="absolute rounded-full bg-[#F2B233]"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: s.size,
                height: s.size,
                opacity: s.opacity,
                animationName: "club-star-rise",
                animationDuration: `${s.duration}s`,
                animationDelay: `${s.delay}s`,
                animationIterationCount: "infinite",
                animationTimingFunction: "ease-in-out",
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex min-h-[100vh] w-full flex-col items-center justify-center px-5 py-6">
          <div className="flex w-full max-w-md flex-col items-center">
            <div className="mb-4 flex flex-col items-center">
              <div
                className="club-logo-anim relative inline-block"
                style={{ lineHeight: 0 }}
              >
                <img
                  src={LOGO_SRC}
                  alt="Rifex"
                  width={220}
                  height={88}
                  className="relative z-[1] h-auto w-[min(62vw,220px)] object-contain"
                  decoding="async"
                />
                <div className="club-logo-shimmer-layer z-[2]" aria-hidden />
              </div>
            </div>

            <p
              className="mb-4 min-h-[3rem] w-full text-center text-[0.95rem] font-medium leading-relaxed tracking-wide text-white/90 sm:text-base"
              style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
            >
              {visiblePhrase}
              {typedLen >= FULL_PHRASE.length ? (
                <span className="club-dots whitespace-nowrap" aria-hidden>
                  <span className="club-dot-1">.</span>
                  <span className="club-dot-2">.</span>
                  <span className="club-dot-3">.</span>
                </span>
              ) : (
                <span className="inline-block w-0.5 animate-pulse text-[#F2B233]">
                  |
                </span>
              )}
            </p>

            <div
              className="relative mb-6 h-2 w-full overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={
                typedLen >= FULL_PHRASE.length
                  ? 100
                  : Math.round((typedLen / FULL_PHRASE.length) * 100)
              }
              aria-label="Progreso"
            >
              <div className="club-progress-inner relative z-[1] h-full rounded-full bg-[#F2B233]" />
              <div className="club-progress-shine z-[2]" />
            </div>

            <div className="flex w-full flex-col items-center">
              {showButton ? (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "https://rifex.app";
                  }}
                  className="club-btn-visible club-btn-pulse flex w-full max-w-sm items-center justify-center rounded-2xl px-5 py-5 text-center text-base font-extrabold tracking-wide text-[#071521] outline-none transition-[filter] active:brightness-95 sm:text-lg"
                  style={{
                    backgroundColor: "#F2B233",
                    fontFamily: "var(--font-poppins), system-ui, sans-serif",
                  }}
                >
                  Toca para continuar
                </button>
              ) : (
                <div className="h-[72px] w-full max-w-sm" aria-hidden />
              )}
            </div>
          </div>
        </div>

        <nav className="fixed bottom-[20px] left-0 right-0 z-20 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 text-center text-[11px] font-medium text-white/45 sm:text-xs">
          <a
            href="https://instagram.com/clubrifex"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#F2B233]/90"
          >
            Instagram @clubrifex
          </a>
          <span className="text-white/20" aria-hidden>
            ·
          </span>
          <a
            href="https://wa.me/573114405488"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#F2B233]/90"
          >
            WhatsApp soporte
          </a>
          <span className="text-white/20" aria-hidden>
            ·
          </span>
          <Link href="/terminos" className="hover:text-[#F2B233]/90">
            Términos y condiciones
          </Link>
        </nav>
      </div>
    </>
  );
}
