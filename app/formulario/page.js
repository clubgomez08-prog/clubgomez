"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getPlanById } from "@/lib/club-gomez/planes";
import {
  guardarSesion,
  leerSesionLocal,
} from "@/lib/club-gomez/cuentas-miembro";
import { rutaLoginConNext } from "@/lib/club-gomez/flujo-suscripcion";
import {
  trackAddPaymentInfo,
  trackCompleteRegistration,
  trackInitiateCheckoutOnce,
  readMetaCookies,
} from "@/lib/club-gomez/meta-pixel";
import DateOfBirthSelect from "@/components/club-gomez/DateOfBirthSelect";
import styles from "./formulario.module.css";

function FormularioMembresia() {
  const searchParams = useSearchParams();
  const plan = useMemo(
    () => getPlanById(searchParams.get("plan")),
    [searchParams]
  );

  const [sesion, setSesion] = useState(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    cedula: "",
    email: "",
    email2: "",
    telefono: "",
    ciudad: "",
    fecha_nacimiento: "",
  });

  useEffect(() => {
    const s = leerSesionLocal();
    setSesion(s);
    if (s) {
      setForm((prev) => ({
        ...prev,
        nombre: s.nombre || prev.nombre,
        cedula: s.cedula || prev.cedula,
        email: s.email || prev.email,
        telefono: s.telefono || prev.telefono,
        ciudad: s.ciudad || prev.ciudad,
        fecha_nacimiento:
          s.fechaNacimiento || s.fecha_nacimiento || prev.fecha_nacimiento,
      }));
    }
    setReady(true);
    // Si llegó por URL directa (sin clic en plan), igual dispara IC una vez
    trackInitiateCheckoutOnce(plan);
  }, [plan.id]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function validar() {
    if (!form.nombre.trim()) return "Escribe tu nombre completo";
    if (!form.cedula.trim()) return "Escribe tu cédula / documento";
    if (!form.email.trim() || !form.email.includes("@")) {
      return "Escribe un email válido";
    }
    if (!sesion?.email) {
      if (!form.email2.trim()) return "Confirma tu email";
      if (
        form.email.trim().toLowerCase() !== form.email2.trim().toLowerCase()
      ) {
        return "Los emails no coinciden";
      }
    }
    if (!form.telefono.trim()) return "Escribe tu WhatsApp";
    if (!form.ciudad.trim()) return "Escribe tu ciudad";
    if (!form.fecha_nacimiento) return "Indica tu fecha de nacimiento";
    return "";
  }

  function loadBoldScript() {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Solo en navegador"));
        return;
      }

      let settled = false;
      let poll = null;
      let timeout = null;

      const cleanup = () => {
        if (poll != null) window.clearInterval(poll);
        if (timeout != null) window.clearTimeout(timeout);
      };

      const ok = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };
      const fail = (err) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(err);
      };

      if (window.BoldCheckout) {
        ok();
        return;
      }

      const src = "https://checkout.bold.co/library/boldPaymentButton.js";
      const existing = document.querySelector(`script[src="${src}"]`);

      timeout = window.setTimeout(() => {
        fail(new Error("Bold no cargó. Recarga e intenta de nuevo."));
      }, 12000);

      poll = window.setInterval(() => {
        if (window.BoldCheckout) ok();
      }, 50);

      if (existing) {
        existing.addEventListener("load", ok);
        existing.addEventListener("error", () =>
          fail(new Error("Bold script error"))
        );
        return;
      }

      const js = document.createElement("script");
      js.src = src;
      js.async = true;
      js.onload = () => ok();
      js.onerror = () => fail(new Error("No se pudo cargar Bold"));
      document.head.appendChild(js);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const msg = validar();
    if (msg) {
      setError(msg);
      return;
    }

    setLoading(true);
    const metaUser = {
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      telefono: form.telefono.trim(),
      ciudad: form.ciudad.trim(),
      fecha_nacimiento: form.fecha_nacimiento,
    };
    // InitiateCheckout ya se dispara al elegir plan (home). Aquí no se repite.
    try {
      const cookies = readMetaCookies();
      const res = await fetch("/api/bold/crear-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          nombre: form.nombre.trim(),
          cedula: form.cedula.trim(),
          email: form.email.trim(),
          telefono: form.telefono.trim(),
          ciudad: form.ciudad.trim(),
          fecha_nacimiento: form.fecha_nacimiento,
          password: undefined,
          baseUrl: window.location.origin,
          fbp: cookies.fbp || undefined,
          fbc: cookies.fbc || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "No se pudo preparar el pago con Bold.");
        return;
      }

      if (data.perfil) {
        guardarSesion(data.perfil, data.session);
        setSesion(data.perfil);
      }

      // CompleteRegistration: datos de membresía listos (también en checkout invitado).
      // Antes solo salía en /miembro/registro; por eso Meta lo marcaba sin actividad.
      try {
        const regKey = `cg_meta_reg_${metaUser.email.toLowerCase()}_${plan.id}`;
        if (sessionStorage.getItem(regKey) !== "1") {
          sessionStorage.setItem(regKey, "1");
          trackCompleteRegistration({
            content_name: `Plan ${plan.nombre}`,
            ...metaUser,
          });
        }
      } catch {
        trackCompleteRegistration({
          content_name: `Plan ${plan.nombre}`,
          ...metaUser,
        });
      }

      trackAddPaymentInfo(plan, metaUser);
      await loadBoldScript();

      if (!window.BoldCheckout) {
        setError("Bold no cargó. Recarga e intenta de nuevo.");
        return;
      }

      const c = data.checkout;
      const config = {
        orderId: c.orderId,
        currency: c.currency,
        amount: String(c.amount),
        apiKey: c.apiKey,
        integritySignature: c.integritySignature,
        description: c.description,
      };
      if (c.customerData) {
        config.customerData =
          typeof c.customerData === "string"
            ? c.customerData
            : JSON.stringify(c.customerData);
      }
      if (c.redirectionUrl && String(c.redirectionUrl).startsWith("https://")) {
        config.redirectionUrl = c.redirectionUrl;
      }
      const checkout = new window.BoldCheckout(config);
      checkout.open();
      setEnviado(true);
    } catch (err) {
      setError(err?.message || "Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <main className={styles.page}>
        <p className={styles.loading}>Cargando…</p>
      </main>
    );
  }

  const loginHref = rutaLoginConNext(`/formulario?plan=${plan.id}`);

  return (
    <main className={styles.page}>
      <div className={styles.bg} aria-hidden="true" />

      <header className={styles.brand}>
        <div className={styles.brandInner}>
          <Image
            className={styles.logo}
            src="/club-gomez/logo-header.png"
            alt="Club Gómez"
            width={120}
            height={40}
            priority
          />
          <Link href="/#membresias" className={styles.back}>
            ← Volver
          </Link>
        </div>
      </header>

      <div className={styles.wrap}>
        <section className={styles.card}>
          <p className={styles.eyebrow}>Activa tu membresía</p>
          <h1 className={styles.title}>
            Plan <span className={styles.titleAccent}>{plan.nombre}</span>
          </h1>
          <p className={styles.tag}>{plan.tag}</p>
          <ul className={styles.facts}>
            <li>
              <span className={styles.factLabel}>Oportunidades</span>
              <strong className={styles.factValue}>{plan.claves}</strong>
            </li>
            <li>
              <span className={styles.factLabel}>Precio</span>
              <strong className={styles.price}>${plan.precioLabel}</strong>
              <em className={styles.per}>/ mes</em>
            </li>
          </ul>
          <p className={styles.equiv}>{plan.equiv}</p>
        </section>

        <section className={styles.card}>
          {enviado ? (
            <div className={styles.done}>
              <h2 className={styles.heading}>Pasarela Bold abierta</h2>
              <p>
                Completa el pago del plan <strong>{plan.nombre}</strong> en Bold.
                Al aprobarse activamos tu membresía y te enviamos tus oportunidades.
              </p>
              <button
                type="button"
                className={styles.cta}
                onClick={() => {
                  setEnviado(false);
                  setError("");
                }}
              >
                Reintentar pago
              </button>
              <Link href="/#membresias" className={styles.link}>
                Volver a membresías
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h2 className={styles.heading}>
                {sesion ? "Confirma tus datos y paga" : "Completa tus datos y paga"}
              </h2>
              <p className={styles.hint}>
                {sesion
                  ? "Revisa tus datos y paga con Bold. Al aprobar el pago activamos tu plan."
                  : "Solo necesitamos tus datos para activar la membresía. Paga con Bold y te enviamos tus oportunidades al correo."}
              </p>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Nombre completo</span>
                <input
                  className={styles.input}
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Tu nombre completo"
                  autoComplete="name"
                  required
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Cédula / Documento</span>
                <input
                  className={styles.input}
                  name="cedula"
                  value={form.cedula}
                  onChange={handleChange}
                  placeholder="Número de documento"
                  inputMode="numeric"
                  required
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Email</span>
                <input
                  className={styles.input}
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  readOnly={Boolean(sesion?.email)}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  required
                />
              </label>

              {!sesion?.email ? (
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Confirma tu email</span>
                  <input
                    className={styles.input}
                    name="email2"
                    type="email"
                    value={form.email2}
                    onChange={handleChange}
                    placeholder="Repite tu email"
                    autoComplete="email"
                    required
                  />
                </label>
              ) : null}

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Teléfono / WhatsApp</span>
                <input
                  className={styles.input}
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="Tu número de contacto"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Ciudad / Departamento</span>
                <input
                  className={styles.input}
                  name="ciudad"
                  value={form.ciudad}
                  onChange={handleChange}
                  placeholder="Tu ciudad"
                  autoComplete="address-level2"
                  required
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Fecha de nacimiento</span>
                <DateOfBirthSelect
                  name="fecha_nacimiento"
                  value={form.fecha_nacimiento}
                  onChange={handleChange}
                  required
                />
              </label>

              {error ? <p className={styles.error}>{error}</p> : null}

              <button type="submit" className={styles.cta} disabled={loading}>
                {loading
                  ? "Preparando pago…"
                  : `Pagar $${plan.precioLabel} con Bold`}
              </button>
              <p className={styles.foot}>
                Pago seguro con Bold · Solo membresía Club Gómez
              </p>
              {!sesion ? (
                <p className={styles.foot}>
                  ¿Ya tienes cuenta?{" "}
                  <Link href={loginHref} className={styles.link}>
                    Inicia sesión
                  </Link>
                  {" · "}
                  <Link href="/miembro/registro" className={styles.link}>
                    Crear cuenta (opcional)
                  </Link>
                </p>
              ) : null}
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

export default function FormularioPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <p className={styles.loading}>Cargando…</p>
        </main>
      }
    >
      <FormularioMembresia />
    </Suspense>
  );
}
