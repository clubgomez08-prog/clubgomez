"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SESSION_KEY } from "@/lib/club-gomez/demo-miembro";
import { construirUrlWhatsappClaves } from "@/lib/club-gomez/claves-whatsapp";
import { STICKERS } from "@/lib/club-gomez/stickers";
import styles from "./miembro.module.css";

function formatFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
  });
}

function initials(nombre) {
  return String(nombre || "CG")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function planSticker(planId) {
  if (planId === "elite") return STICKERS.corona;
  if (planId === "selecto") return STICKERS.cadena;
  return STICKERS.llave;
}

export default function MiembroPortalPage() {
  const router = useRouter();
  const [miembro, setMiembro] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) {
        router.replace("/miembro/login");
        return;
      }
      setMiembro(JSON.parse(raw));
    } catch {
      router.replace("/miembro/login");
    }
  }, [router]);

  const progreso = useMemo(() => {
    if (!miembro) return { pct: 0, diasRestantes: 0 };
    const start = new Date(miembro.inicio).getTime();
    const end = new Date(miembro.fin).getTime();
    const now = Date.now();
    const total = Math.max(end - start, 1);
    const done = Math.min(Math.max(now - start, 0), total);
    const pct = Math.round((done / total) * 100);
    const diasRestantes = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    return { pct, diasRestantes };
  }, [miembro]);

  function cerrarSesion() {
    sessionStorage.removeItem(SESSION_KEY);
    router.push("/miembro/login");
    router.refresh();
  }

  function enviarWhatsApp() {
    if (!miembro) return;
    const url = construirUrlWhatsappClaves(
      {
        nombre: miembro.nombre,
        planNombre: miembro.planNombre,
        claves: miembro.claves,
      },
      { incluirMotilon: false }
    );
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (!miembro) {
    return <main className={styles.loading}>Cargando…</main>;
  }

  const firstName = miembro.nombre.split(" ")[0];

  return (
    <main className={styles.page}>
      <div className={styles.bg} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Image
            src="/club-gomez/logo-header.png"
            alt="Club Gómez"
            width={120}
            height={40}
            style={{ height: 36, width: "auto", objectFit: "contain" }}
          />
          <button type="button" className={styles.logout} onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className={styles.wrap}>
        <section className={styles.hero}>
          <img
            src={planSticker(miembro.planId)}
            alt=""
            className={styles.heroSticker}
            aria-hidden="true"
          />
          <div className={styles.heroTop}>
            <div className={styles.avatar} aria-hidden="true">
              {initials(miembro.nombre)}
            </div>
            <div>
              <p className={styles.eyebrow}>Membresía {miembro.estado}</p>
              <h1 className={styles.hello}>Hola, {firstName}</h1>
              <p className={styles.meta}>
                {miembro.ciudad}
              </p>
            </div>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statVal}>{miembro.clavesCount}</span>
              <span className={styles.statLbl}>Claves</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statVal}>{progreso.diasRestantes}</span>
              <span className={styles.statLbl}>Días resto</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statVal}>{miembro.descuentosUsados}</span>
              <span className={styles.statLbl}>Descuentos</span>
            </div>
          </div>
        </section>

        <section className={styles.planStrip}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <h2 className={styles.planName}>
              Plan <span>{miembro.planNombre}</span>
            </h2>
            <p className={styles.planTag}>{miembro.planTag}</p>
            <div className={styles.progressBlock}>
              <div className={styles.progressLabels}>
                <span>{formatFecha(miembro.inicio)}</span>
                <span>{progreso.pct}% del mes</span>
                <span>{formatFecha(miembro.fin)}</span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progreso.pct}%` }}
                />
              </div>
            </div>
          </div>
          <div className={styles.priceBig}>
            ${miembro.precioLabel}
            <small> / mes</small>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <h2 className={styles.sectionTitle}>Tus claves</h2>
              <p className={styles.sectionHint}>
                También las tienes en el correo. Compártelas cuando quieras.
              </p>
            </div>
          </div>
          <div className={styles.clavesGrid}>
            {miembro.claves.map((c, i) => (
              <span
                key={c}
                className={styles.clave}
                style={{ animationDelay: `${0.04 * i}s` }}
              >
                {c}
              </span>
            ))}
          </div>
          <button type="button" className={styles.cta} onClick={enviarWhatsApp}>
            Enviar mis claves por WhatsApp
          </button>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <h2 className={styles.sectionTitle}>Beneficios del mes</h2>
              <p className={styles.sectionHint}>Premios y entregas mientras tu plan esté activo.</p>
            </div>
          </div>
          <div className={styles.benefGrid}>
            {miembro.beneficios.map((b, i) => (
              <article
                key={b.id}
                className={`${styles.benef}${i === 0 ? ` ${styles.isFeatured}` : ""}`}
              >
                <h3 className={styles.benefTitle}>{b.titulo}</h3>
                <span
                  className={`${styles.benefStatus}${
                    b.estado === "activo" ? ` ${styles.isOn}` : ` ${styles.isOff}`
                  }`}
                >
                  {b.estado}
                </span>
                <p className={styles.benefDate}>{b.fechas}</p>
              </article>
            ))}
          </div>
        </section>

        <Link href="/#membresias" className={styles.footerLink}>
          Ver planes del Club →
        </Link>
      </div>
    </main>
  );
}
