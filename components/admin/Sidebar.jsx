"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", short: "Inicio", icon: "◆" },
  { href: "/admin/solicitudes", label: "Solicitudes Bold", short: "Pagos", icon: "✓" },
  { href: "/admin/venta-fisica", label: "Venta física", short: "Venta", icon: "▣" },
  { href: "/admin/beneficios", label: "Fechas de premio", short: "Premios", icon: "★" },
  { href: "/admin/miembros", label: "Clientes", short: "Clientes", icon: "○" },
  { href: "/admin/correos", label: "Correos", short: "Correos", icon: "✉" },
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
      className={`admin-sidebar ${abierto ? "is-open" : ""} ${className}`.trim()}
    >
      <div className="admin-sidebar__brand">
        <Image
          src="/club-gomez/logo-header.png"
          alt="Club Gómez"
          width={120}
          height={40}
          style={{ height: 32, width: "auto", objectFit: "contain" }}
        />
        <p className="admin-sidebar__badge">Panel admin</p>
      </div>

      <nav className="admin-sidebar__nav">
        {ADMIN_NAV.map((link) => {
          const esActivo =
            pathname === link.href ||
            (link.href !== "/admin" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`admin-nav-link${esActivo ? " is-active" : ""}`}
            >
              <span className="admin-nav-link__icon">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar__foot">
        <button
          type="button"
          className="admin-sidebar__logout"
          onClick={() => {
            onClose && onClose();
            handleSignOut();
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
