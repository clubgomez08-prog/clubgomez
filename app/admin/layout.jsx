"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { getSession } from "@/lib/auth";

export default function AdminLayout({ children }) {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
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
    return <>{children}</>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 p-8 bg-zinc-900/50">{children}</main>
    </div>
  );
}
