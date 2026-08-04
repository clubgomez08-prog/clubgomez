"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { scrollToId } from "./hooks";
import CtaButton from "./CtaButton";

const NAV = [
  { id: "inicio", label: "Inicio", href: "/" },
  { id: "beneficios", label: "Beneficios", href: "/beneficios" },
  { id: "como-funciona", label: "¿Cómo funciona?", href: "/#como-funciona" },
  { id: "membresias", label: "Membresías", href: "/#membresias" },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const onHome = pathname === "/";
  const onBeneficios = pathname?.startsWith("/beneficios");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    onScroll();
    onResize();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function goHomeSection(id) {
    setMenuOpen(false);
    if (onHome) {
      scrollToId(id);
      return;
    }
    window.location.href = `/#${id}`;
  }

  function handleNav(item) {
    setMenuOpen(false);
    if (item.href === "/beneficios") return;
    if (item.id === "inicio") {
      if (onHome) scrollToId("inicio");
      return;
    }
    if (item.href.startsWith("/#")) {
      goHomeSection(item.id);
    }
  }

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: scrolled ? "12px 16px" : "18px 16px",
          transition: "padding 0.25s ease, background 0.25s ease, border-color 0.25s ease",
          background: scrolled || onBeneficios ? "rgba(5,6,7,0.92)" : "transparent",
          backdropFilter: scrolled || onBeneficios ? "blur(12px)" : "none",
          borderBottom:
            scrolled || onBeneficios
              ? "1px solid rgba(184,227,81,0.12)"
              : "1px solid transparent",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Club Gómez — Inicio"
          >
            <Image
              src="/club-gomez/logo-header.png"
              alt="Club Gómez"
              width={220}
              height={80}
              style={{
                height: "clamp(52px, 7vw, 72px)",
                width: "auto",
                objectFit: "contain",
              }}
              priority
            />
          </Link>

          {isDesktop && (
            <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {NAV.map((item) => {
                const active =
                  (item.href === "/beneficios" && onBeneficios) ||
                  (item.id === "inicio" && onHome && !onBeneficios);
                const commonStyle = {
                  background: "none",
                  border: "none",
                  color: active ? "#B8E351" : "rgba(255,255,255,0.75)",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontFamily: "Poppins, sans-serif",
                  borderRadius: 8,
                  textDecoration: active ? "underline" : "none",
                  textUnderlineOffset: 6,
                  textDecorationColor: "#B8E351",
                };

                if (item.href === "/beneficios" || item.href === "/") {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      style={commonStyle}
                      onClick={() => handleNav(item)}
                    >
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item)}
                    style={commonStyle}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isDesktop && (
              <a
                href="/admin-mockup/login"
                style={{
                  display: "inline-flex",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                Inicia sesión
              </a>
            )}
            {!isDesktop && (
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Abrir menú"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  border: "1px solid rgba(184,227,81,0.35)",
                  background: "rgba(9,9,9,0.8)",
                  color: "#B8E351",
                  fontSize: 20,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ☰
              </button>
            )}
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.7)",
          }}
          onClick={() => setMenuOpen(false)}
        >
          <aside
            className="cg-drawer-enter"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "min(320px, 88vw)",
              height: "100%",
              background: "#090909",
              borderLeft: "1px solid rgba(184,227,81,0.2)",
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Image
                src="/club-gomez/logo-mark.jpg"
                alt="Club Gómez"
                width={56}
                height={56}
                style={{ borderRadius: 12, objectFit: "cover" }}
              />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#B8E351",
                  fontSize: 28,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
            {NAV.map((item) => {
              if (item.href === "/beneficios" || item.href === "/") {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      textAlign: "left",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      padding: "14px 16px",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 15,
                      fontFamily: "Poppins, sans-serif",
                      textDecoration: "none",
                    }}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item)}
                  style={{
                    textAlign: "left",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: "14px 16px",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                    fontFamily: "Poppins, sans-serif",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              <a
                href="/admin-mockup/login"
                style={{
                  textAlign: "center",
                  color: "#fff",
                  textDecoration: "none",
                  padding: "12px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Inicia sesión
              </a>
              <CtaButton onClick={() => goHomeSection("membresias")} animate={false}>
                ¡Suscribirme!
              </CtaButton>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
