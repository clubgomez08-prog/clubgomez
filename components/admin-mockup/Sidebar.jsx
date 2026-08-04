"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { getNotificaciones } from "@/lib/mock-admin/store";

const BASE = "/admin-mockup";

const navItems = [
  { href: BASE, label: "Dashboard", icon: "📊", exact: true },
  { href: `${BASE}/analytics`, label: "Analytics", icon: "📈" },
  { href: `${BASE}/rifas`, label: "Membresías", icon: "⭐" },
  { href: `${BASE}/participantes`, label: "Miembros", icon: "👥" },
  { href: `${BASE}/landing`, label: "Homepage", icon: "🖼️" },
  { href: `${BASE}/venta-fisica`, label: "Venta física", icon: "🧾" },
  { href: `${BASE}/sorteo`, label: "Beneficios mes", icon: "🎁" },
  { href: `${BASE}/campanas`, label: "Campañas", icon: "📣" },
  { href: `${BASE}/automatizaciones`, label: "Automatizaciones", icon: "⚡" },
  { href: `${BASE}/equipo`, label: "Equipo", icon: "👤" },
  { href: `${BASE}/reportes`, label: "Reportes", icon: "📑" },
  { href: `${BASE}/actividad`, label: "Actividad", icon: "📋" },
  { href: `${BASE}/notificaciones`, label: "Notificaciones", icon: "🔔" },
];

export default function SidebarMock({ abierto, onClose, className = "" }) {
  const pathname = usePathname();
  const router = useRouter();
  const noLeidas =
    typeof window !== "undefined"
      ? getNotificaciones().filter((n) => !n.leida).length
      : 0;

  function handleSignOut() {
    sessionStorage.removeItem("mock-admin-session");
    router.push(`${BASE}/login`);
    router.refresh();
  }

  return (
    <aside
      className={`w-64 min-h-screen flex flex-col ${className}`}
      style={{
        backgroundColor: "#090909",
        borderRight: "1px solid rgba(184,227,81,0.15)",
      }}
    >
      <div className="p-5 pb-4">
        <Image
          src="/club-gomez/logo-header.png"
          alt="Club Gómez"
          width={150}
          height={48}
          style={{ height: 40, width: "auto", objectFit: "contain" }}
        />
        <p
          style={{
            margin: "10px 0 0",
            fontSize: 11,
            fontWeight: 700,
            color: "#B8E351",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Panel Admin
        </p>
      </div>
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((link) => {
          const esActivo = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(link.href + "/");
          const badge =
            link.label === "Notificaciones" && noLeidas > 0 ? noLeidas : null;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "10px",
                textDecoration: "none",
                color: esActivo ? "#B8E351" : "rgba(248,250,252,0.7)",
                backgroundColor: esActivo ? "rgba(184,227,81,0.12)" : "transparent",
                fontWeight: esActivo ? "700" : "500",
                fontSize: "13px",
                fontFamily: "Poppins, sans-serif",
                transition: "all 0.2s ease",
                border: esActivo ? "1px solid rgba(184,227,81,0.25)" : "1px solid transparent",
              }}
            >
              <span style={{ fontSize: "16px", width: "22px", textAlign: "center" }}>
                {link.icon}
              </span>
              <span className="flex-1">{link.label}</span>
              {badge && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: "#B8E351", color: "#050607" }}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t" style={{ borderColor: "rgba(184,227,81,0.12)" }}>
        <Link
          href="/"
          style={{
            display: "block",
            width: "100%",
            padding: "8px 12px",
            fontSize: "12px",
            fontWeight: "600",
            color: "#B8E351",
            textDecoration: "none",
            borderRadius: "8px",
            border: "1px solid rgba(184,227,81,0.3)",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          → Ver homepage
        </Link>
        <Link
          href="/admin"
          style={{
            display: "block",
            width: "100%",
            padding: "8px 12px",
            fontSize: "12px",
            fontWeight: "600",
            color: "#60a5fa",
            textDecoration: "none",
            borderRadius: "8px",
            border: "1px solid rgba(96,165,250,0.25)",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          → Panel RIFEX oficial
        </Link>
        <button
          onClick={() => {
            onClose && onClose();
            handleSignOut();
          }}
          className="w-full py-2.5 px-3 text-sm font-medium text-zinc-400 hover:text-white rounded-lg transition-colors"
          style={{ background: "transparent" }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
