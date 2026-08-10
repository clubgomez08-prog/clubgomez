"use client";

import { useMemo, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getPlanById,
  construirUrlWhatsappMembresia,
} from "@/lib/club-gomez/planes";
import styles from "./formulario.module.css";

function FormularioMembresia() {
  const searchParams = useSearchParams();
  const plan = useMemo(
    () => getPlanById(searchParams.get("plan")),
    [searchParams]
  );

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

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const msg = validar();
    if (msg) {
      setError(msg);
      return;
    }

    setLoading(true);
    window.open(abrirWhatsapp(), "_blank", "noopener,noreferrer");
    setEnviado(true);
    setLoading(false);
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
                <span className={styles.fieldLabel}>Email</span>
                <input
                  className={styles.input}
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
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
