"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getPlanById,
} from "@/lib/club-gomez/planes";
import { leerSesionLocal } from "@/lib/club-gomez/cuentas-miembro";
import { rutaRegistroConNext } from "@/lib/club-gomez/flujo-suscripcion";
import {
  trackAddPaymentInfo,
  trackInitiateCheckout,
} from "@/lib/club-gomez/meta-pixel";
import styles from "./formulario.module.css";

function FormularioMembresia() {
  const searchParams = useSearchParams();
  const plan = useMemo(
    () => getPlanById(searchParams.get("plan")),
    [searchParams]
  );

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    cedula: "",
    email: "",
    telefono: "",
    ciudad: "",
    fecha_nacimiento: "",
  });

  useEffect(() => {
    const sesion = leerSesionLocal();
    if (!sesion) {
      const next = `/formulario?plan=${plan.id}`;
      window.location.replace(rutaRegistroConNext(next));
      return;
    }
    setForm((prev) => ({
      ...prev,
      nombre: sesion.nombre || prev.nombre,
      cedula: sesion.cedula || prev.cedula,
      email: sesion.email || prev.email,
      telefono: sesion.telefono || prev.telefono,
      ciudad: sesion.ciudad || prev.ciudad,
      fecha_nacimiento:
        sesion.fechaNacimiento ||
        sesion.fecha_nacimiento ||
        prev.fecha_nacimiento,
    }));
    setReady(true);
    trackInitiateCheckout(plan);
  }, [plan.id]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function validar() {
    if (!form.nombre.trim()) return "Escribe tu nombre completo";
    if (!form.cedula.trim()) return "Escribe tu cédula / documento";
    if (!form.email.trim() || !form.email.includes("@")) return "Escribe un email válido";
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
      if (window.BoldCheckout) {
        resolve();
        return;
      }
      const existing = document.querySelector(
        'script[src="https://checkout.bold.co/library/boldPaymentButton.js"]'
      );
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Bold script error")));
        return;
      }
      const js = document.createElement("script");
      js.src = "https://checkout.bold.co/library/boldPaymentButton.js";
      js.async = true;
      js.onload = () => resolve();
      js.onerror = () => reject(new Error("No se pudo cargar Bold"));
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
    try {
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
          baseUrl: window.location.origin,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "No se pudo preparar el pago con Bold.");
        return;
      }

      trackAddPaymentInfo(plan);
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
      // Bold exige string JSON (si mandas objeto → "[object Object]" → BTN-001)
      if (c.customerData) {
        config.customerData =
          typeof c.customerData === "string"
            ? c.customerData
            : JSON.stringify(c.customerData);
      }
      // Solo si es https (Bold rechaza http://localhost → BTN-001)
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
        <p className={styles.loading}>Verificando tu cuenta…</p>
      </main>
    );
  }

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
          <p className={styles.eyebrow}>Resumen de tu membresía</p>
          <h1 className={styles.title}>
            Plan <span className={styles.titleAccent}>{plan.nombre}</span>
          </h1>
          <p className={styles.tag}>{plan.tag}</p>
          <ul className={styles.facts}>
            <li>
              <span className={styles.factLabel}>Claves</span>
              <strong className={styles.factValue}>
                {plan.claves} con oportunidades
              </strong>
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
                Al terminar volverás automáticamente y activamos tu membresía.
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
              <h2 className={styles.heading}>Tus datos</h2>
              <p className={styles.hint}>
                Confirma tus datos y paga con Bold. El pago queda registrado en el
                panel del Club.
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
                <span className={styles.fieldLabel}>Email (de tu cuenta)</span>
                <input
                  className={styles.input}
                  name="email"
                  type="email"
                  value={form.email}
                  readOnly
                  placeholder="tu@email.com"
                  autoComplete="email"
                  required
                />
              </label>

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
                <input
                  className={styles.input}
                  name="fecha_nacimiento"
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={handleChange}
                  required
                />
              </label>

              {error ? <p className={styles.error}>{error}</p> : null}

              <button type="submit" className={styles.cta} disabled={loading}>
                {loading ? "Abriendo Bold…" : `Pagar $${plan.precioLabel} con Bold`}
              </button>
              <p className={styles.foot}>Pago seguro con Bold · Solo membresía Club Gómez</p>
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
