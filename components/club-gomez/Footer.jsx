"use client";

import Image from "next/image";

export default function Footer() {
  return (
    <footer
      style={{
        background: "#050607",
        borderTop: "1px solid rgba(184,227,81,0.12)",
        padding: "28px 20px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 10,
        }}
      >
        <Image
          src="/club-gomez/logo-full.png"
          alt="Club Gómez"
          width={140}
          height={70}
          style={{ height: 56, width: "auto", objectFit: "contain" }}
        />
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.4,
          }}
        >
          Membresía exclusiva · Descuentos · Beneficios del Club
        </p>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          © {new Date().getFullYear()} Club Gómez. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
