"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getPlanById,
  construirUrlWhatsappMembresia,
} from "@/lib/club-gomez/planes";
import { leerSesionLocal } from "@/lib/club-gomez/cuentas-miembro";
import { rutaRegistroConNext } from "@/lib/club-gomez/flujo-suscripcion";
import {
  trackAddPaymentInfo,
  trackInitiateCheckout,
  trackPurchase,
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
    return "";
  }

  function abrirWhatsapp() {
    return construirUrlWhatsappMembresia({
      plan,
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      cedula: form.cedula.trim(),
      telefono: form.telefono.trim(),
      ciudad: form.ciudad.trim(),
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
      const res = await fetch("/api/solicitudes-membresia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          nombre: form.nombre.trim(),
          cedula: form.cedula.trim(),
          email: form.email.trim(),
          telefono: form.telefono.trim(),
          ciudad: form.ciudad.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "No se pudo guardar la solicitud. Intenta de nuevo.");
        return;
      }

      trackAddPaymentInfo(plan);
      trackPurchase(plan, { orderId: data.id });
      window.open(abrirWhatsapp(), "_blank", "noopener,noreferrer");
      setEnviado(true);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
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
              <h2 className={styles.heading}>¡Ya casi!</h2>
              <p>
                Se abrió WhatsApp con tu solicitud del plan{" "}
                <strong>{plan.nombre}</strong>. Completa el pago con el equipo
                para activar tu membresía.
              </p>
              <button
                type="button"
                className={styles.cta}
                onClick={() =>
                  window.open(abrirWhatsapp(), "_blank", "noopener,noreferrer")
                }
              >
                Abrir WhatsApp de nuevo
              </button>
              <Link href="/#membresias" className={styles.link}>
                Volver a membresías
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h2 className={styles.heading}>Tus datos</h2>
              <p className={styles.hint}>
                Completa el formulario y te contactamos por WhatsApp para
                activar tu plan.
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
                  placeholder="Tu número de WhatsApp"
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

              {error ? <p className={styles.error}>{error}</p> : null}

              <button type="submit" className={styles.cta} disabled={loading}>
                {loading ? "Abriendo…" : "Continuar por WhatsApp"}
              </button>
              <p className={styles.foot}>
                Completa tu pago con el equipo por WhatsApp
              </p>
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
