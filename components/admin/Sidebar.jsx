"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/rifas", label: "Rifas" },
  { href: "/admin/participantes", label: "Participantes" },
  { href: "/admin/sorteo", label: "Sorteo" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 min-h-screen flex flex-col">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-white tracking-tight">
          Panel Admin
        </h2>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/admin" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={handleSignOut}
          className="w-full py-2.5 px-3 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
