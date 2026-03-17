"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/rifas", label: "Rifas", icon: "🎯" },
  { href: "/admin/participantes", label: "Participantes", icon: "👥" },
  { href: "/admin/sorteo", label: "Sorteo", icon: "🏆" },
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
      className={`w-64 bg-zinc-900 border-r border-zinc-800 min-h-screen flex flex-col ${className}`}
    >
      <div className="p-6">
        <h2 className="text-lg font-semibold text-white tracking-tight">
          Panel Admin
        </h2>
      </div>
      <nav className="flex-1 px-4 space-y-1">
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
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "10px",
                textDecoration: "none",
                color: esActivo ? "#F2B233" : "rgba(248,250,252,0.7)",
                backgroundColor: esActivo ? "rgba(242,178,51,0.1)" : "transparent",
                fontWeight: esActivo ? "700" : "500",
                fontSize: "14px",
                fontFamily: "Poppins, sans-serif",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: "18px", width: "24px", textAlign: "center" }}>
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={() => {
            onClose && onClose();
            handleSignOut();
          }}
          className="w-full py-2.5 px-3 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
