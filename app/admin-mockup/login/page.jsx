"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const BASE = "/admin-mockup";

export default function AdminMockLoginPage() {
  const [email, setEmail] = useState("demo@clubgomez.com");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (!email || !password) {
        setError("Completa email y contraseña.");
        setLoading(false);
        return;
      }

      sessionStorage.setItem(
        "mock-admin-session",
        JSON.stringify({ email, nombre: "Admin Demo", rol: "superadmin" })
      );
      router.push(BASE);
      router.refresh();
      setLoading(false);
    }, 400);
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#050607" }}
    >
      <div className="w-full max-w-md">
        <div
          className="rounded-2xl p-8 shadow-2xl"
          style={{
            background: "#090909",
            border: "1px solid rgba(184,227,81,0.2)",
          }}
        >
          <div className="text-center mb-8">
            <Image
              src="/club-gomez/logo-full.png"
              alt="Club Gómez"
              width={180}
              height={90}
              style={{ height: 80, width: "auto", objectFit: "contain", margin: "0 auto 16px" }}
            />
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Panel Club Gómez
            </h1>
            <p className="text-zinc-500 text-sm mt-2">
              Usa cualquier credencial para entrar al entorno demo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-zinc-900 border rounded-lg text-white placeholder-zinc-500 focus:outline-none transition-colors"
                style={{ borderColor: "rgba(184,227,81,0.25)" }}
                placeholder="demo@clubgomez.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-zinc-900 border rounded-lg text-white placeholder-zinc-500 focus:outline-none transition-colors"
                style={{ borderColor: "rgba(184,227,81,0.25)" }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 font-semibold rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#B8E351", color: "#050607" }}
            >
              {loading ? "Entrando..." : "Iniciar sesión"}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-600 mt-6">
            Demo local · no afecta el panel oficial en{" "}
            <a href="/admin" className="hover:underline" style={{ color: "#B8E351" }}>
              /admin
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
