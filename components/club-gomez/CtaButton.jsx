"use client";

export default function CtaButton({
  children,
  onClick,
  href,
  variant = "primary",
  className = "",
  animate = true,
}) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontFamily: "var(--font-oswald), Poppins, sans-serif",
    fontWeight: 700,
    fontSize: "15px",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    borderRadius: "999px",
    padding: "16px 36px",
    cursor: "pointer",
    textDecoration: "none",
    border: "none",
    transition: "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
  };

  const styles =
    variant === "primary"
      ? {
          ...base,
          backgroundColor: "#B8E351",
          color: "#050607",
          boxShadow: "0 0 28px rgba(184,227,81,0.45), 0 0 48px rgba(204,255,0,0.2)",
          fontSize: "16px",
        }
      : variant === "ghost"
        ? {
            ...base,
            backgroundColor: "transparent",
            color: "#B8E351",
            border: "1.5px solid rgba(184,227,81,0.5)",
          }
        : {
            ...base,
            backgroundColor: "rgba(255,255,255,0.08)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.15)",
          };

  const cls = `${animate && variant === "primary" ? "cg-cta-bounce cg-pulse-glow " : ""}${className}`;

  if (href) {
    return (
      <a href={href} style={styles} className={cls} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" style={styles} className={cls} onClick={onClick}>
      {children}
    </button>
  );
}
