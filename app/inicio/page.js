"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import styles from "./inicio.module.css";

export default function InicioPage() {
  const [imgBannerIzq, setImgBannerIzq] = useState(null);
  const [imgBannerDer, setImgBannerDer] = useState(null);

  useEffect(() => {
    supabaseBrowser
      .from("configuracion")
      .select("imagen_banner_izquierda, imagen_banner_derecha")
      .eq("id", "global")
      .single()
      .then(({ data, error }) => {
        if (error || !data) return;
        setImgBannerIzq(data.imagen_banner_izquierda || null);
        setImgBannerDer(data.imagen_banner_derecha || null);
      });
  }, []);

  return (
    <div
      className={styles.desktopRoot}
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/RIFEX%20PORTADA%20LANDING%20.PNG')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        position: "relative",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* Overlay oscuro para atenuar un poco la imagen de fondo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Logo hero encima de los botones */}
      <img
        src="/logo_hero.png"
        alt="RIFEX"
        className={styles.desktopLogo}
        style={{
          position: "absolute",
          top: "var(--logo-hero-top-mobile)",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: "420px",
          zIndex: 10,
          pointerEvents: "none",
        }}
      />

        {/* Panel de botones — zona inferior */}
      <div
        className={styles.desktopPanel}
        style={{
          position: "relative",
          zIndex: 2,
          padding: "0 16px 28px 16px",
        }}
      >
        {/* Barra de progreso — ayuda visual de marketing */}
        <div
          className={styles.desktopBar}
          style={{
            width: "100%",
            height: "36px",
            backgroundColor: "#dc2626",
            borderRadius: "999px",
            overflow: "hidden",
            marginBottom: "14px",
            display: "flex",
            alignItems: "stretch",
          }}
        >
          <div
            className={styles.desktopBarInner}
            style={{
              width: "49%",
              height: "100%",
              background: "linear-gradient(to right, #22C55E, #F2B233)",
              borderRadius: "999px",
              display: "flex",
              alignItems: "center",
              paddingLeft: "14px",
              minWidth: "0",
            }}
          >
            <span style={{ color: "black", fontSize: "12px", fontWeight: "700" }}>
              SOLO QUEDA EL 49.35%
            </span>
          </div>
        </div>

        {/* Botón Sorteo abierto */}
        <Link
          href="/"
          className={styles.sorteoAbiertoBtn}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            width: "100%",
            backgroundColor: "#000000",
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "20px",
            padding: "2px 16px",
            borderRadius: "14px",
            textAlign: "center",
            marginBottom: "12px",
            textDecoration: "none",
            boxSizing: "border-box",
            border: "2px solid #F2B233",
            textShadow: "0 0 8px rgba(255,255,255,0.6), 0 0 16px rgba(255,255,255,0.35)",
          }}
        >
          <img src={imgBannerIzq || "/moto.png"} alt="Moto" style={{ width: "120px", height: "120px", objectFit: "contain", display: "block" }} />
          Sorteo abierto
          <img src={imgBannerDer || "/carro.png"} alt="Carro" style={{ width: "120px", height: "120px", objectFit: "contain", display: "block" }} />
        </Link>

        {/* Botón Comprar tickets */}
        <Link
          href="/"
          style={{
            display: "block",
            width: "100%",
            backgroundColor: "#22C55E",
            color: "black",
            fontWeight: "700",
            fontSize: "17px",
            padding: "14px 16px",
            borderRadius: "14px",
            textAlign: "center",
            marginBottom: "12px",
            textDecoration: "none",
            boxSizing: "border-box",
            boxShadow: "0 0 24px rgba(34, 197, 94, 0.65), 0 0 40px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255,255,255,0.35)",
          }}
        >
          Comprar tickets
        </Link>

        {/* Botón Verificar tus tickets */}
        <a
          href="/mis-tickets"
          style={{
            display: "block",
            width: "100%",
            backgroundColor: "#F2B233",
            color: "black",
            fontWeight: "700",
            fontSize: "16px",
            padding: "12px 16px",
            borderRadius: "14px",
            textAlign: "center",
            marginBottom: "12px",
            textDecoration: "none",
            boxSizing: "border-box",
            boxShadow: "0 0 14px rgba(242, 178, 51, 0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          Verificar tus tickets
        </a>

        {/* Botón Canal de Instagram */}
        <a
          href="https://www.instagram.com/clubrifex?igsh=b2lhbGxkOW5hcGhu"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            width: "100%",
            backgroundColor: "#000000",
            color: "white",
            fontWeight: "700",
            fontSize: "18px",
            padding: "18px 16px",
            borderRadius: "14px",
            textAlign: "center",
            marginBottom: "12px",
            textDecoration: "none",
            boxSizing: "border-box",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 14px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            Canal de Instagram
          </span>
        </a>

        {/* Botón Soporte — WhatsApp */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
          <a
            href="https://wa.me/573114405488"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              backgroundColor: "#229ED9",
              color: "white",
              fontWeight: "700",
              fontSize: "14px",
              padding: "12px 24px",
              borderRadius: "999px",
              textDecoration: "none",
              boxSizing: "border-box",
              boxShadow: "0 0 12px rgba(34, 158, 217, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Soporte
          </a>
        </div>

        {/* Links Reels y Vlogs */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "28px",
            marginBottom: "12px",
          }}
        >
          <a
            href="https://www.instagram.com/clubrifex?igsh=b2lhbGxkOW5hcGhu"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "white",
              fontSize: "15px",
              fontWeight: "600",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="3" />
              <polygon points="10 8 16 12 10 16 10 8" fill="white" />
            </svg>
            Reels
          </a>
          <a
            href="https://www.instagram.com/clubrifex?igsh=b2lhbGxkOW5hcGhu"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "white",
              fontSize: "15px",
              fontWeight: "600",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <svg width="20" height="14" viewBox="0 0 24 17">
              <path d="M23.498 2.67a2.99 2.99 0 0 0-2.122-2.122C19.5 0 12 0 12 0S4.5 0 2.623.548A2.99 2.99 0 0 0 .502 2.67C0 4.546 0 8.5 0 8.5s0 3.954.502 5.83a2.99 2.99 0 0 0 2.122 2.122C4.5 17 12 17 12 17s7.5 0 9.377-.548a2.99 2.99 0 0 0 2.122-2.122C24 12.454 24 8.5 24 8.5s0-3.954-.502-5.83z" fill="#FF0000" />
              <path d="M9.545 12.273V4.727L15.818 8.5 9.545 12.273z" fill="white" />
            </svg>
            Vlogs
          </a>
        </div>

        {/* Términos y Condiciones */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <a
            href="#terminos"
            style={{
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: "999px",
              padding: "5px 18px",
              color: "rgba(255,255,255,0.55)",
              fontSize: "12px",
              textDecoration: "none",
            }}
          >
            Términos y Condiciones
          </a>
        </div>
      </div>
    </div>
  );
}
