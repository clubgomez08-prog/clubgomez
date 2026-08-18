"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { registrarCuenta } from "@/lib/club-gomez/cuentas-miembro";
import {
  irDespuesDeAuth,
  rutaLoginConNext,
  sanitizarNext,
} from "@/lib/club-gomez/flujo-suscripcion";
import { trackCompleteRegistration } from "@/lib/club-gomez/meta-pixel";
import DateOfBirthSelect from "@/components/club-gomez/DateOfBirthSelect";

const fieldStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1.5px solid rgba(184,227,81,0.28)",
  background: "#0a0c08",
  color: "#fff",
  fontSize: 15,
  outline: "none",
};

const labelStyle = {
  display: "grid",
  gap: 6,
};

const labelText = {
  color: "rgba(255,255,255,0.75)",
  fontSize: 13,
  fontWeight: 600,
};

function MiembroRegistroForm() {
  const searchParams = useSearchParams();
  const next = sanitizarNext(searchParams.get("next"));

  const [form, setForm] = useState({
    nombre: "",
    cedula: "",
    email: "",
    telefono: "",
    ciudad: "",
    fecha_nacimiento: "",
    password: "",
    password2: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.fecha_nacimiento) {
      setError("Indica tu fecha de nacimiento.");
      return;
    }

    if (form.password !== form.password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const result = await registrarCuenta({
        nombre: form.nombre,
        cedula: form.cedula,
        email: form.email,
        telefono: form.telefono,
        ciudad: form.ciudad,
        fecha_nacimiento: form.fecha_nacimiento,
        password: form.password,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      trackCompleteRegistration({
        content_name: form.email,
        email: form.email,
        telefono: form.telefono,
        nombre: form.nombre,
        ciudad: form.ciudad,
        fecha_nacimiento: form.fecha_nacimiento,
      });
      irDespuesDeAuth(next, "/miembro");
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
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div
          style={{
            background: "#090909",
            border: "1px solid rgba(184,227,81,0.22)",
            borderRadius: 20,
            padding: "32px 28px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Image
              src="/club-gomez/logo-full.png"
              alt="Club Gómez"
              width={160}
              height={80}
              style={{
                height: 64,
                width: "auto",
                objectFit: "contain",
                margin: "0 auto 12px",
              }}
              priority
            />
            <h1
              style={{
                margin: 0,
                color: "#fff",
                fontSize: "1.45rem",
                fontWeight: 700,
              }}
            >
              Crear cuenta
            </h1>
            <p
              style={{
                margin: "8px 0 0",
                color: "rgba(255,255,255,0.55)",
                fontSize: 13,
                lineHeight: 1.45,
              }}
            >
              Primero crea tu cuenta.{" "}
              <strong style={{ color: "#B8E351" }}>Después</strong> eliges tu plan
              y activas la membresía.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
            <label style={labelStyle}>
              <span style={labelText}>Nombre completo</span>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                placeholder="Tu nombre"
                style={fieldStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelText}>Cédula (opcional)</span>
              <input
                name="cedula"
                value={form.cedula}
                onChange={handleChange}
                placeholder="Documento"
                style={fieldStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelText}>Email</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="tu@email.com"
                style={fieldStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelText}>WhatsApp</span>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                required
                placeholder="3001234567"
                style={fieldStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelText}>Fecha de nacimiento</span>
              <DateOfBirthSelect
                name="fecha_nacimiento"
                value={form.fecha_nacimiento}
                onChange={handleChange}
                required
                selectStyle={fieldStyle}
              />
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                El Club te felicita en tu cumpleaños
              </span>
            </label>

            <label style={labelStyle}>
              <span style={labelText}>Ciudad</span>
              <input
                name="ciudad"
                value={form.ciudad}
                onChange={handleChange}
                placeholder="Cúcuta"
                style={fieldStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelText}>Contraseña</span>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                style={fieldStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelText}>Confirmar contraseña</span>
              <input
                name="password2"
                type="password"
                value={form.password2}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Repite la contraseña"
                style={fieldStyle}
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
              {loading ? "Creando cuenta…" : "Crear cuenta gratis"}
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
            ¿Ya tienes cuenta?{" "}
            <Link
              href={rutaLoginConNext(next || "/#membresias")}
              style={{ color: "#B8E351", fontWeight: 600 }}
            >
              Inicia sesión
            </Link>
            <br />
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

export default function MiembroRegistroPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#050607",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          Cargando…
        </main>
      }
    >
      <MiembroRegistroForm />
    </Suspense>
  );
}
