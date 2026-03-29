"use client";

import { useState, useEffect, useRef } from "react";
import { esUrlVideo } from "@/lib/esUrlVideo";

/** Video hero (Cloudinary .mov) cuando HERO_VIDEO_FORZAR_SOLO_PUBLIC o fallback por defecto. */
const VIDEO_PUBLIC_RIFEX =
  "https://res.cloudinary.com/dmmnaypmc/video/upload/v1774416287/RIFEX_VIDEO_1_f69so4.mov";

/**
 * TEMPORAL (extraoficial): en true ignora video_url del panel y siempre muestra el MP4 de /public.
 * Ponlo en false cuando el admin ya cargue bien la URL.
 */
const HERO_VIDEO_FORZAR_SOLO_PUBLIC = true;

/** Por defecto el mismo MP4; opcional NEXT_PUBLIC_HERO_VIDEO_DEFAULT para otro archivo. */
const VIDEO_LOCAL_DEFAULT =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_HERO_VIDEO_DEFAULT
    ? process.env.NEXT_PUBLIC_HERO_VIDEO_DEFAULT
    : VIDEO_PUBLIC_RIFEX;

function codificarSegmentosPathname(pathname) {
  const segs = pathname.split("/").filter(Boolean);
  if (segs.length === 0) return "";
  return `/${segs
    .map((seg) => {
      try {
        return encodeURIComponent(decodeURIComponent(seg));
      } catch {
        return encodeURIComponent(seg);
      }
    })
    .join("/")}`;
}

export default function Hero({ rifa, stats, onParticipar, paquetesRef, convertirPrecio }) {
  const [imagenActual, setImagenActual] = useState(0);
  const localVideoRef = useRef(null);

  function getYoutubeId(url) {
    if (!url) return null;
    const s = String(url).trim();
    const shorts = s.match(/\/shorts\/([a-zA-Z0-9_-]{11})(?:\?|#|\/|$)/);
    if (shorts) return shorts[1];
    const embedded = s.match(/\/embed\/([a-zA-Z0-9_-]{11})(?:\?|#|$)/);
    if (embedded) return embedded[1];
    try {
      const u = new URL(s.startsWith("http") ? s : `https://${s}`);
      const v = u.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      if (u.hostname === "youtu.be" || u.hostname.endsWith(".youtu.be")) {
        const id = u.pathname.replace(/^\//, "").split(/[/?#]/)[0];
        if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
      }
    } catch {
      /* ignore */
    }
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = s.match(regExp);
    const id = match && match[2] ? match[2].split(/[?&]/)[0] : "";
    return id.length === 11 ? id : null;
  }

  const esYoutube = (url) =>
    url && (url.includes("youtube.com") || url.includes("youtu.be"));

  /**
   * Rutas a /public: acepta URL absoluta, "/video.mp4", "video.mp4",
   * rutas Windows con .../public/... o "public/...".
   * Codifica espacios y caracteres especiales en el path.
   */
  function normalizarSrcVideoLocal(url) {
    if (!url || typeof url !== "string") return "";
    let s = url
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/\\/g, "/");
    if (!s) return "";
    if (s.startsWith("file://")) s = s.replace(/^file:\/\//i, "");
    if (
      !/^https?:\/\//i.test(s) &&
      /^[\w.-]+(:\d+)?\/.+/i.test(s)
    ) {
      s = `http://${s}`;
    }
    if (/^https?:\/\//i.test(s)) {
      try {
        const u = new URL(s);
        const needsEncode =
          /[ \u00A0]/.test(u.pathname) ||
          /[^\u0020-\u007E]/.test(u.pathname);
        if (needsEncode) {
          u.pathname = codificarSegmentosPathname(u.pathname);
        }
        return u.toString();
      } catch {
        return s;
      }
    }

    const lower = s.toLowerCase();
    const pub = "/public/";
    const i = lower.lastIndexOf(pub);
    if (i !== -1) s = s.slice(i + pub.length);

    if (s.toLowerCase().startsWith("public/")) s = s.slice(7);

    let path = s.startsWith("/") ? s : `/${s}`;
    path = path.replace(/\/+/g, "/");
    return codificarSegmentosPathname(path);
  }

  const todasImagenes = rifa
    ? [
        ...(rifa.imagen_url ? [rifa.imagen_url] : []),
        ...(Array.isArray(rifa.imagenes_url) ? rifa.imagenes_url : []),
      ].filter(Boolean)
    : [];

  const videoUrlRaw = (() => {
    const v = rifa?.video_url;
    if (v == null || v === "") return null;
    const t = String(v).trim();
    return t || null;
  })();
  const videoUrlFromAdmin =
    videoUrlRaw && rifa
      ? esYoutube(videoUrlRaw)
        ? videoUrlRaw
        : normalizarSrcVideoLocal(videoUrlRaw)
      : null;

  const videoUrl = rifa
    ? HERO_VIDEO_FORZAR_SOLO_PUBLIC
      ? VIDEO_PUBLIC_RIFEX
      : videoUrlFromAdmin ||
        (!videoUrlRaw ? VIDEO_LOCAL_DEFAULT : null)
    : null;

  const todosLosSlides = rifa
    ? [
        ...(videoUrl ? [{ tipo: "video", url: videoUrl }] : []),
        ...todasImagenes.map((url) => ({ tipo: "imagen", url })),
      ]
    : [];

  useEffect(() => {
    if (!rifa?.id) return;
    const timer = setTimeout(() => {
      setImagenActual(0);
    }, 0);
    return () => clearTimeout(timer);
  }, [rifa?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setImagenActual((i) =>
        todosLosSlides.length === 0
          ? 0
          : Math.min(i, todosLosSlides.length - 1)
      );
    }, 0);
    return () => clearTimeout(timer);
  }, [todosLosSlides.length]);

  const slideActual =
    rifa && todosLosSlides.length > 0
      ? todosLosSlides[imagenActual]
      : undefined;

  const urlVideoArchivo =
    slideActual?.tipo === "video" &&
    slideActual.url &&
    !esYoutube(slideActual.url)
      ? slideActual.url
      : "";

  useEffect(() => {
    const el = localVideoRef.current;
    if (!el || !urlVideoArchivo) return;
    el.muted = true;
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, [imagenActual, urlVideoArchivo]);

  if (!rifa) return null;

  const precio = rifa.precio_boleto ?? 0;
  const total = rifa.total_numeros ?? 10000;
  const vendidos = stats?.vendidos ?? 0;
  const disponibles = total - vendidos;
  // Variable reservada para uso futuro — no eliminar
  const porcentaje = total > 0 ? ((vendidos / total) * 100).toFixed(1) : 0;
  const pctSorteo = rifa.porcentaje_sorteo ?? 80;

  function formatPrecio(n) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  }

  function formatNum(n) {
    return new Intl.NumberFormat("es-CO").format(n);
  }

  const realPct = total > 0 ? (vendidos / total) * 100 : 0;
  const minVisual =
    rifa?.porcentaje_visual_minimo != null
      ? Number(rifa.porcentaje_visual_minimo)
      : null;
  const pctMostrado =
    minVisual != null && !Number.isNaN(minVisual) && realPct < minVisual
      ? minVisual
      : realPct;
  const displayPct = Math.min(100, pctMostrado);

  return (
    <section className="relative flex flex-col overflow-hidden">
      <div className="relative flex flex-col items-center justify-start px-4 pt-4 pb-3">
        <div className="relative max-w-4xl w-full mx-auto text-center">
          <p className="text-white font-bold text-2xl text-center mb-3 drop-shadow-sm">
            SI LLEGASTE AQUÍ TÚ
            <br />
            PUEDES SER EL PRÓXIMO
            <br />
            <span style={{ color: "#F2B233" }}>BENDECIDO</span>
          </p>
          <div style={{ position: "relative", width: "100%" }} className="max-w-sm md:max-w-lg mx-auto mb-3">
            {todosLosSlides.length > 0 &&
              (slideActual?.tipo === "video" ? (
                esYoutube(slideActual.url) && getYoutubeId(slideActual.url) ? (
                  <div
                    key={slideActual.url}
                    style={{
                      width: "100%",
                      borderRadius: "16px",
                      overflow: "hidden",
                      border: "2px solid rgba(242,178,51,0.5)",
                      boxShadow: "0 0 24px rgba(242,178,51,0.2)",
                      position: "relative",
                      paddingBottom: "56.25%",
                      height: 0,
                    }}
                  >
                    <iframe
                      src={`https://www.youtube.com/embed/${getYoutubeId(slideActual.url)}?autoplay=1&mute=1&loop=1&playlist=${getYoutubeId(slideActual.url)}&controls=0&disablekb=1&modestbranding=1&rel=0&iv_load_policy=3&fs=0`}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        border: "none",
                        pointerEvents: "none",
                      }}
                      allow="autoplay; encrypted-media"
                      allowFullScreen={false}
                      title="Video del premio"
                    />
                  </div>
                ) : (
                  <div
                    key={slideActual.url}
                    style={{
                      width: "100%",
                      lineHeight: 0,
                      borderRadius: "16px",
                      overflow: "hidden",
                      border: "2px solid rgba(242,178,51,0.5)",
                      boxShadow: "0 0 24px rgba(242,178,51,0.2)",
                      backgroundColor: "#0a0a0a",
                    }}
                  >
                    <video
                      key={`${rifa.id}-${imagenActual}-${slideActual.url}`}
                      ref={localVideoRef}
                      src={slideActual.url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      controls
                      style={{
                        width: "100%",
                        height: "auto",
                        maxHeight: "min(85vh, 800px)",
                        display: "block",
                      }}
                    >
                      <source src={slideActual.url} type="video/mp4" />
                    </video>
                  </div>
                )
              ) : esUrlVideo(slideActual?.url) ? (
                <video
                  key={slideActual.url}
                  src={
                    esYoutube(slideActual.url)
                      ? slideActual.url
                      : normalizarSrcVideoLocal(slideActual.url)
                  }
                  controls
                  playsInline
                  style={{
                    width: "100%",
                    height: "auto",
                    maxHeight: "min(70vh, 520px)",
                    objectFit: "cover",
                    borderRadius: "16px",
                    border: "2px solid rgba(242,178,51,0.5)",
                    boxShadow: "0 0 24px rgba(242,178,51,0.2)",
                    display: "block",
                    backgroundColor: "#0a0a0a",
                  }}
                />
              ) : (
                <img
                  src={slideActual?.url}
                  alt={rifa?.nombre}
                  style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "cover",
                    borderRadius: "16px",
                    border: "2px solid rgba(242,178,51,0.5)",
                    boxShadow: "0 0 24px rgba(242,178,51,0.2)",
                    display: "block",
                  }}
                />
              ))}

            {todosLosSlides.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setImagenActual((prev) =>
                      prev === 0 ? todosLosSlides.length - 1 : prev - 1
                    )
                  }
                  style={{
                    position: "absolute",
                    left: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    backgroundColor: "rgba(10,10,10,0.7)",
                    border: "1.5px solid rgba(242,178,51,0.5)",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    color: "#F2B233",
                    fontSize: "20px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                  }}
                >
                  ‹
                </button>

                <button
                  onClick={() =>
                    setImagenActual((prev) =>
                      prev === todosLosSlides.length - 1 ? 0 : prev + 1
                    )
                  }
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    backgroundColor: "rgba(10,10,10,0.7)",
                    border: "1.5px solid rgba(242,178,51,0.5)",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    color: "#F2B233",
                    fontSize: "20px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                  }}
                >
                  ›
                </button>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "6px",
                    marginTop: "8px",
                  }}
                >
                  {todosLosSlides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImagenActual(i)}
                      style={{
                        width: i === imagenActual ? "20px" : "7px",
                        height: "7px",
                        borderRadius: "999px",
                        backgroundColor:
                          i === imagenActual ? "#F2B233" : "rgba(242,178,51,0.3)",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <h1 className="text-white font-bold text-2xl text-center mt-3 mb-2 drop-shadow-sm">
            {rifa.nombre}
          </h1>

          <p className="text-[#F8FAFC] font-semibold text-base text-center mb-3 drop-shadow-sm">
            Un número puede cambiar tu vida
          </p>

          {/* Barra de progreso */}
          <div style={{ width: "100%", marginBottom: "12px" }} className="max-w-md mx-auto">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                background: "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 35%, transparent 65%), #ef4444",
                borderRadius: "999px",
                padding: "6px 14px",
                marginBottom: "8px",
                boxShadow: "0 -2px 6px rgba(255,180,100,0.3), 0 3px 12px rgba(239,68,68,0.5)",
                maxWidth: "100%",
              }}
            >
              <span style={{ color: "white", fontSize: "11px", fontWeight: "800", letterSpacing: "0.4px", lineHeight: 1.25 }}>
                Asegura tu bendición
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: "16px",
                backgroundColor: "#1a1a1a",
                borderRadius: "999px",
                overflow: "hidden",
                border: "1px solid rgba(242,178,51,0.2)",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: `${displayPct}%`,
                  height: "100%",
                  borderRadius: "999px",
                  background: "linear-gradient(90deg, #15803d, #22C55E, #4ADE80, #22C55E)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s infinite linear",
                  boxShadow: "0 0 12px rgba(34,197,94,0.8), 0 0 24px rgba(34,197,94,0.4)",
                  position: "relative",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: "900",
                  letterSpacing: "0.06em",
                  textShadow:
                    "0 0 6px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.9)",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              >
                {`${pctMostrado.toFixed(1)}%`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

