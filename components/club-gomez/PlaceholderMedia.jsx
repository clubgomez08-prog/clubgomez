"use client";

export default function PlaceholderMedia({
  label,
  aspect = "16/9",
  className = "",
  rounded = "1rem",
}) {
  return (
    <div
      className={className}
      style={{
        ...(aspect !== "auto" ? { aspectRatio: aspect } : { width: "100%", height: "100%" }),
        borderRadius: rounded,
        border: "1.5px dashed rgba(184,227,81,0.35)",
        background:
          "linear-gradient(145deg, rgba(35,67,12,0.45) 0%, rgba(9,9,9,0.9) 60%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px",
        color: "rgba(184,227,81,0.75)",
        fontSize: "12px",
        fontWeight: 600,
        textAlign: "center",
        letterSpacing: "0.02em",
        fontFamily: "Poppins, sans-serif",
      }}
      aria-label={label}
    >
      {label}
    </div>
  );
}
