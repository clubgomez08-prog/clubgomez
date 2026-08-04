"use client";

import { useState } from "react";
import Image from "next/image";
import PlaceholderMedia from "./PlaceholderMedia";
import { beneficioSrc } from "@/lib/club-gomez/beneficios-data";

export default function BeneficioMedia({ imagenKey, label, aspect = "1", rounded = "16px", className = "" }) {
  const [ok, setOk] = useState(true);
  const src = beneficioSrc(imagenKey);

  if (!ok) {
    return <PlaceholderMedia label={label} aspect={aspect} rounded={rounded} className={className} />;
  }

  return (
    <div
      className={className}
      style={{
        position: "relative",
        aspectRatio: aspect,
        borderRadius: rounded,
        overflow: "hidden",
        background: "#111",
        border: "1px solid rgba(184,227,81,0.2)",
      }}
    >
      <Image
        src={src}
        alt={label}
        fill
        sizes="(max-width: 768px) 50vw, 280px"
        style={{ objectFit: "contain", background: "#0a0a0a" }}
        onError={() => setOk(false)}
      />
    </div>
  );
}
