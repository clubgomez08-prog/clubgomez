"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

function Icono({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function IconoTablero() {
  return (
    <Icono>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </Icono>
  );
}

function IconoBoleto() {
  return (
    <Icono>
      <path d="M4 8.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4v-2z" />
      <path d="M12 7.5v9" />
    </Icono>
  );
}

function IconoTarjeta() {
  return (
    <Icono>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </Icono>
  );
}

function IconoLocal() {
  return (
    <Icono>
      <path d="M4 10 12 4l8 6" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M10 20v-5h4v5" />
    </Icono>
  );
}

function IconoNumeros() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <text x="12" y="16.5" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif">
        123
      </text>
    </svg>
  );
}

function IconoPersona() {
  return (
    <Icono>
      <circle cx="12" cy="8" r="3" />
      <path d="M5.5 19.5c1.2-3 3.4-4.5 6.5-4.5s5.3 1.5 6.5 4.5" />
    </Icono>
  );
}

function IconoCorreo() {
  return (
    <Icono>
      <rect x="3.5" y="6" width="17" height="12" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </Icono>
  );
}

function IconoReloj() {
  return (
    <Icono>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 2" />
    </Icono>
  );
}

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", short: "Inicio", icon: IconoTablero },
  { href: "/admin/sorteos", label: "Sorteos", short: "Sorteos", icon: IconoBoleto },
  { href: "/admin/solicitudes", label: "Pagos web", short: "Pagos", icon: IconoTarjeta },
  { href: "/admin/venta-fisica", label: "Venta física", short: "Venta", icon: IconoLocal },
  { href: "/admin/numeros", label: "Números", short: "Números", icon: IconoNumeros },
  { href: "/admin/miembros", label: "Clientes", short: "Clientes", icon: IconoPersona },
  { href: "/admin/correos", label: "Correos", short: "Correos", icon: IconoCorreo },
  { href: "/admin/historial", label: "Historial", short: "Historial", icon: IconoReloj },
];

export default function Sidebar({ abierto, onClose, onOcultar, className = "" }) {
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
              <span className="admin-nav-link__icon">
                <link.icon />
              </span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar__foot">
        <button type="button" className="admin-sidebar__ocultar" onClick={onOcultar}>
          Ocultar menú
        </button>
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
