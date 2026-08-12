"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Sidebar, { ADMIN_NAV } from "@/components/admin/Sidebar";
import { ToastProvider } from "@/components/admin/Toast";
import { getSession } from "@/lib/auth";
import "./admin.css";

const BOTTOM_NAV = [
  ADMIN_NAV[0],
  ADMIN_NAV[2],
  ADMIN_NAV[4],
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [sidebarPath, setSidebarPath] = useState(pathname);
  const isLoginPage = pathname === "/admin/login";

  if (pathname !== sidebarPath) {
    setSidebarPath(pathname);
    if (sidebarAbierto) setSidebarAbierto(false);
  }

  useEffect(() => {
    async function checkAuth() {
      const currentSession = await getSession();
      setSession(currentSession);

      if (!currentSession && !isLoginPage) {
        router.replace("/admin/login");
      } else if (currentSession && isLoginPage) {
        router.replace("/admin");
      }

      setChecking(false);
    }

    checkAuth();
  }, [pathname, isLoginPage, router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-2 border-[#B8E351] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session && isLoginPage) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  if (!session) {
    return null;
  }

  const paginaActiva =
    ADMIN_NAV.find(
      (item) =>
        pathname === item.href ||
        (item.href !== "/admin" && pathname.startsWith(item.href))
    )?.label || "Panel";

  return (
    <ToastProvider>
      <div className="admin-shell">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-topbar__menu"
            aria-label={sidebarAbierto ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setSidebarAbierto((v) => !v)}
          >
            {sidebarAbierto ? "✕" : "☰"}
          </button>
          <div className="admin-topbar__brand">
            <span className="admin-topbar__title">{paginaActiva}</span>
            <span className="admin-topbar__sub">Club Gómez</span>
          </div>
        </header>

        {sidebarAbierto ? (
          <div
            className="admin-overlay is-open"
            onClick={() => setSidebarAbierto(false)}
          />
        ) : null}

        <Sidebar
          abierto={sidebarAbierto}
          onClose={() => setSidebarAbierto(false)}
        />

        <main className="admin-main">{children}</main>

        <nav className="admin-bottom-nav" aria-label="Navegación rápida">
          {BOTTOM_NAV.map((item) => {
            const activo =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-bottom-nav__item${activo ? " is-active" : ""}`}
              >
                <span className="admin-bottom-nav__icon">{item.icon}</span>
                {item.short}
              </Link>
            );
          })}
          <button
            type="button"
            className="admin-bottom-nav__item"
            onClick={() => setSidebarAbierto(true)}
          >
            <span className="admin-bottom-nav__icon">☰</span>
            Más
          </button>
        </nav>
      </div>
    </ToastProvider>
  );
}
