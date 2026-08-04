"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import SidebarMock from "@/components/admin-mockup/Sidebar";
import { ToastProvider } from "@/components/admin/Toast";

const BASE = "/admin-mockup";

export default function AdminMockLayout({ children }) {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === `${BASE}/login`;

  useEffect(() => {
    const mockSession = sessionStorage.getItem("mock-admin-session");
    setSession(mockSession ? JSON.parse(mockSession) : null);

    if (!mockSession && !isLoginPage) {
      router.replace(`${BASE}/login`);
    } else if (mockSession && isLoginPage) {
      router.replace(BASE);
    }

    setChecking(false);
  }, [pathname, isLoginPage, router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050607" }}>
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "#B8E351", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!session && isLoginPage) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  if (!session) return null;

  return (
    <ToastProvider>
      <div className="flex min-h-screen" style={{ background: "#050607" }}>
        <style>{`
          @media (max-width: 767px) {
            .admin-mock-hamburger { display: flex !important; }
            .admin-mock-overlay { display: block !important; }
            .admin-mock-sidebar {
              transform: translateX(-100%);
              transition: transform 0.3s ease;
              position: fixed !important;
              top: 0; left: 0;
              height: 100vh;
              z-index: 150;
            }
            .admin-mock-sidebar.abierto { transform: translateX(0); }
            .admin-mock-main {
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
            backgroundColor: "#090909",
            border: "1px solid rgba(184,227,81,0.35)",
            borderRadius: "8px",
            color: "#B8E351",
            fontSize: "20px",
            width: "40px",
            height: "40px",
            cursor: "pointer",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="admin-mock-hamburger"
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
            className="admin-mock-overlay"
          />
        )}

        <SidebarMock
          abierto={sidebarAbierto}
          onClose={() => setSidebarAbierto(false)}
          className={
            sidebarAbierto ? "admin-mock-sidebar abierto" : "admin-mock-sidebar"
          }
        />
        <main className="flex-1 p-8 admin-mock-main" style={{ background: "rgba(9,9,9,0.85)" }}>{children}</main>
      </div>
    </ToastProvider>
  );
}
