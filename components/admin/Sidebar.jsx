"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "◆" },
  { href: "/admin/solicitudes", label: "Solicitudes Bold", icon: "✓" },
  { href: "/admin/beneficios", label: "Fechas de premio", icon: "★" },
  { href: "/admin/miembros", label: "Clientes", icon: "○" },
  { href: "/admin/correos", label: "Correos prueba", icon: "✉" },
];

export default function Sidebar({ abierto, onClose, className = "" }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside
      className={`w-64 min-h-screen flex flex-col ${className}`}
      style={{
        background: "#090909",
        borderRight: "1px solid rgba(184,227,81,0.18)",
      }}
    >
      <div style={{ padding: "20px 18px 16px" }}>
        <Image
          src="/club-gomez/logo-header.png"
          alt="Club Gómez"
          width={120}
          height={40}
          style={{ height: 32, width: "auto", objectFit: "contain" }}
        />
        <p
          style={{
            margin: "10px 0 0",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(184,227,81,0.7)",
            fontWeight: 700,
          }}
        >
          Panel admin
        </p>
      </div>

      <nav style={{ flex: 1, padding: "8px 12px", display: "grid", gap: 4 }}>
        {navItems.map((link) => {
          const esActivo =
            pathname === link.href ||
            (link.href !== "/admin" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 12px",
                borderRadius: 10,
                textDecoration: "none",
                color: esActivo ? "#050607" : "rgba(248,250,252,0.72)",
                background: esActivo
                  ? "linear-gradient(135deg, #d4f06a, #b8e351)"
                  : "transparent",
                fontWeight: esActivo ? 700 : 500,
                fontSize: 14,
                fontFamily: "var(--font-poppins), Poppins, sans-serif",
                border: esActivo ? "none" : "1px solid transparent",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ width: 18, textAlign: "center", opacity: 0.9 }}>
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          padding: 14,
          borderTop: "1px solid rgba(184,227,81,0.14)",
        }}
      >
        <button
          type="button"
          onClick={() => {
            onClose && onClose();
            handleSignOut();
          }}
          style={{
            width: "100%",
            padding: "11px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "transparent",
            color: "rgba(255,255,255,0.55)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
