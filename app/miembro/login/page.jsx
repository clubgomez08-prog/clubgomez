"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEMO_MIEMBRO_CREDS } from "@/lib/club-gomez/demo-miembro";
import { iniciarSesionCuenta } from "@/lib/club-gomez/cuentas-miembro";

export default function MiembroLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await iniciarSesionCuenta(email, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/miembro");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(184,227,81,0.18), transparent 55%), #050607",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "var(--font-poppins), Poppins, sans-serif",
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
              style={{
                height: 72,
                width: "auto",
                objectFit: "contain",
                margin: "0 auto 14px",
              }}
              priority
            />
            <h1
              style={{
                margin: 0,
                color: "#fff",
                fontSize: "1.5rem",
                fontWeight: 700,
              }}
            >
              Área de miembros
            </h1>
            <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
              Entra con tu cuenta. También puedes registrarte sin suscribirte.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 600 }}>
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
              <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 600 }}>
                Contraseña
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
              }}
            >
              {loading ? "Entrando…" : "Iniciar sesión"}
            </button>
          </form>

          <p
            style={{
              margin: "18px 0 0",
              textAlign: "center",
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.5,
            }}
          >
            ¿No tienes cuenta?{" "}
            <Link href="/miembro/registro" style={{ color: "#B8E351", fontWeight: 600 }}>
              Regístrate gratis
            </Link>
            <br />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              Demo activa: {DEMO_MIEMBRO_CREDS.email} / {DEMO_MIEMBRO_CREDS.password}
            </span>
            <br />
            <Link href="/" style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none", fontSize: 12 }}>
              ← Volver al Club
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
