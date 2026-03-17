"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { ToastProvider } from "@/components/admin/Toast";
import { getSession } from "@/lib/auth";

export default function AdminLayout({ children }) {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

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
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session && isLoginPage) {
    return (
      <ToastProvider>
        {children}
      </ToastProvider>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <ToastProvider>
    <div className="flex min-h-screen bg-zinc-950">
      <style>{`
        @media (max-width: 767px) {
          .admin-hamburger {
            display: flex !important;
          }
          .admin-overlay {
            display: block !important;
          }
          .admin-sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            position: fixed !important;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 150;
          }
          .admin-sidebar.abierto {
            transform: translateX(0);
          }
          .admin-main {
            margin-left: 0 !important;
            padding-top: 60px !important;
          }
        }
      `}</style>

      <button
        onClick={() => setSidebarAbierto(!sidebarAbierto)}
        style={{
          display: "none",
          position: "fixed",
          top: "12px",
          left: "12px",
          zIndex: 200,
          backgroundColor: "#1a1a1a",
          border: "1px solid rgba(242,178,51,0.3)",
          borderRadius: "8px",
          color: "#F2B233",
          fontSize: "20px",
          width: "40px",
          height: "40px",
          cursor: "pointer",
          alignItems: "center",
          justifyContent: "center",
        }}
        className="admin-hamburger"
      >
        {sidebarAbierto ? "✕" : "☰"}
      </button>

      {sidebarAbierto && (
        <div
          onClick={() => setSidebarAbierto(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            zIndex: 149,
            display: "none",
          }}
          className="admin-overlay"
        />
      )}

      <Sidebar
        abierto={sidebarAbierto}
        onClose={() => setSidebarAbierto(false)}
        className={sidebarAbierto ? "admin-sidebar abierto" : "admin-sidebar"}
      />
      <main className="flex-1 p-8 bg-zinc-900/50 admin-main">{children}</main>
    </div>
    </ToastProvider>
  );
}
