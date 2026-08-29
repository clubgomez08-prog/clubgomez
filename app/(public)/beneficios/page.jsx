"use client";

import { useEffect } from "react";

/**
 * La pauta de Meta/ads sigue apuntando a /beneficios.
 * Redirigimos a la sección de la home para no perder ese tráfico.
 */
export default function BeneficiosRedirectPage() {
  useEffect(() => {
    window.location.replace("/#beneficios-mes");
  }, []);

  return (
    <main
      style={{
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
        background: "#050607",
        color: "rgba(255,255,255,0.7)",
        fontFamily: "var(--font-poppins), Poppins, sans-serif",
        fontSize: 14,
        padding: 24,
      }}
    >
      <p style={{ margin: 0 }}>Llevándote a los beneficios del mes…</p>
    </main>
  );
}
