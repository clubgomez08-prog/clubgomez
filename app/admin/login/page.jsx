"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      if (authError.message.includes("Invalid login")) {
        setError("Credenciales incorrectas. Verifica tu email y contraseña.");
      } else if (authError.message.includes("Email not confirmed")) {
        setError("Email no confirmado. Revisa tu bandeja de entrada.");
      } else {
        setError("Error al iniciar sesión: " + authError.message);
      }
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "var(--font-poppins), Poppins, sans-serif",
        background:
          "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(184,227,81,0.18), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 80%, rgba(35,67,12,0.35), transparent 50%), #050607",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div
          style={{
            background: "#090909",
            border: "1px solid rgba(184,227,81,0.22)",
            borderRadius: 20,
            padding: "32px 28px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <Image
              src="/club-gomez/logo-full.png"
              alt="Club Gómez"
              width={160}
              height={80}
              priority
              style={{
                height: 64,
                width: "auto",
                objectFit: "contain",
                margin: "0 auto 14px",
              }}
            />
            <h1
              style={{
                margin: 0,
                color: "#fff",
                fontSize: "1.45rem",
                fontWeight: 700,
              }}
            >
              Panel Club Gómez
            </h1>
            <p
              style={{
                margin: "8px 0 0",
                color: "rgba(255,255,255,0.5)",
                fontSize: 13,
              }}
            >
              Solicitudes Bold, miembros y operaciones
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@email.com"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1.5px solid rgba(184,227,81,0.28)",
                  background: "#0a0c08",
                  color: "#fff",
                  fontSize: 15,
                  outline: "none",
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Contraseña
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Tu contraseña"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1.5px solid rgba(184,227,81,0.28)",
                  background: "#0a0c08",
                  color: "#fff",
                  fontSize: 15,
                  outline: "none",
                }}
              />
            </label>

            {error ? (
              <p
                style={{
                  margin: 0,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(248,113,113,0.12)",
                  border: "1px solid rgba(248,113,113,0.35)",
                  color: "#fca5a5",
                  fontSize: 13,
                }}
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4,
                padding: "14px 18px",
                border: "none",
                borderRadius: 12,
                background: "linear-gradient(135deg, #d4f06a, #b8e351, #9bcf2e)",
                color: "#050607",
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.75 : 1,
                fontFamily: "var(--font-oswald), sans-serif",
                letterSpacing: "0.03em",
              }}
            >
              {loading ? "Verificando…" : "Entrar al panel"}
            </button>
          </form>

          <p
            style={{
              margin: "18px 0 0",
              textAlign: "center",
            }}
          >
            <Link
              href="/"
              style={{
                color: "rgba(255,255,255,0.45)",
                textDecoration: "none",
                fontSize: 12,
              }}
            >
              ← Volver al Club
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
