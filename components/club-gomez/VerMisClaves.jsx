"use client";

import { useState } from "react";
import { useReveal } from "./hooks";
import styles from "./VerMisClaves.module.css";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function fechaSorteoTexto(fecha) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fecha || ""));
  if (!m) return "";
  return `${Number(m[3])} de ${MESES[Number(m[2]) - 1]}`;
}

export default function VerMisClaves() {
  const { ref, className } = useReveal();
  const [abierto, setAbierto] = useState(false);
  const [cedula, setCedula] = useState("");
  const [ultimos4, setUltimos4] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);

  async function consultar(e) {
    e.preventDefault();
    setError("");
    setResultado(null);
    if (cedula.replace(/\D/g, "").length < 5) {
      setError("Escribe tu número de cédula.");
      return;
    }
    if (ultimos4.length !== 4) {
      setError("Escribe los últimos 4 dígitos de tu celular.");
      return;
    }
    setCargando(true);
    try {
      const res = await fetch("/api/claves/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula, ultimos4 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No pudimos consultar tus claves.");
      setResultado(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  const fecha = fechaSorteoTexto(resultado?.sorteo?.fecha);

  return (
    <section id="ver-mis-claves" ref={ref} className={`${styles.section} ${className}`}>
      <div className={styles.inner}>
        <h2 className={styles.title}>
          ¿YA ERES MIEMBRO?
          <br />
          <span>Consulta tus claves del mes</span>
        </h2>

        {!abierto ? (
          <button type="button" className={styles.btn} onClick={() => setAbierto(true)}>
            Ver mis claves
          </button>
        ) : (
          <form className={styles.form} onSubmit={consultar} noValidate>
            <label className={styles.field}>
              <span>Cédula</span>
              <input
                value={cedula}
                onChange={(e) => setCedula(e.target.value.replace(/[^\d.]/g, "").slice(0, 15))}
                inputMode="numeric"
                autoComplete="off"
                placeholder="Tu número de cédula"
              />
            </label>
            <label className={styles.field}>
              <span>Últimos 4 dígitos de tu celular</span>
              <input
                value={ultimos4}
                onChange={(e) => setUltimos4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                autoComplete="off"
                placeholder="Ej. 4567"
              />
            </label>
            <button type="submit" className={styles.btn} disabled={cargando}>
              {cargando ? "Consultando…" : "Ver mis claves"}
            </button>
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
          </form>
        )}

        {resultado && (
          <div className={styles.resultado} aria-live="polite">
            <p className={styles.hola}>
              Hola, <strong>{resultado.nombre}</strong>. Tienes {resultado.total}{" "}
              {resultado.total === 1 ? "clave" : "claves"} este mes:
            </p>
            {resultado.grupos.map((g, i) => (
              <div key={i} className={styles.grupo}>
                <p className={styles.plan}>Plan {g.plan}</p>
                <div className={styles.numeros}>
                  {g.numeros.map((n) => (
                    <span key={n} className={styles.numero}>
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {(fecha || resultado.sorteo?.loteria) && (
              <p className={styles.sorteo}>
                Juegas{fecha ? ` el ${fecha}` : ""}
                {resultado.sorteo?.loteria ? ` con la ${resultado.sorteo.loteria}` : ""} (últimas 3 cifras).
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
