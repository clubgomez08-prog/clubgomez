"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getAdminAuthHeaders } from "@/lib/auth";

function formatFecha(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function pesos(n) {
  return "$ " + Number(n || 0).toLocaleString("es-CO");
}

export default function AdminDashboardPage() {
  const [sorteoId, setSorteoId] = useState("");
  const [sorteo, setSorteo] = useState(null);
  const [otros, setOtros] = useState([]);
  const [stats, setStats] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [finanzasVisibles, setFinanzasVisibles] = useState(false);
  const [modalFinanzas, setModalFinanzas] = useState(false);
  const [passwordFinanzas, setPasswordFinanzas] = useState("");
  const [errorFinanzas, setErrorFinanzas] = useState("");
  const [cargandoFinanzas, setCargandoFinanzas] = useState(false);

  const cargar = useCallback(async (id) => {
    setCargando(true);
    setErrorCarga("");
    try {
      const headers = await getAdminAuthHeaders();
      const url = id ? `/api/admin/dashboard?sorteo=${id}` : "/api/admin/dashboard";
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setSorteo(data.sorteo || null);
      setOtros(data.otros || []);
      setStats(data.stats || null);
      setVentas(data.ventas || []);
      if (data.sorteo?.id) setSorteoId(data.sorteo.id);
    } catch (err) {
      setErrorCarga(err.message || "No se pudieron cargar los datos. Recarga la página.");
      setSorteo(null);
      setStats(null);
      setVentas([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar("");
  }, [cargar]);

  async function confirmarUnlockFinanzas() {
    setCargandoFinanzas(true);
    setErrorFinanzas("");
    try {
      const auth = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/unlock-finanzas", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ password: passwordFinanzas }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorFinanzas(data.error || "Contraseña incorrecta");
        return;
      }
      if (data.success) {
        setFinanzasVisibles(true);
        setModalFinanzas(false);
        setPasswordFinanzas("");
      }
    } catch {
      setErrorFinanzas("Error de conexión");
    } finally {
      setCargandoFinanzas(false);
    }
  }

  const lista = sorteo ? [sorteo, ...otros] : [];

  return (
    <div className="dash">
      {errorCarga ? <p className="dash-error">{errorCarga}</p> : null}

      {cargando ? (
        <div className="dash-carga">
          <div className="dash-spin" />
        </div>
      ) : !sorteo ? (
        <div className="dash-vacio">
          <h1>Todavía no hay un sorteo</h1>
          <p>Cuando crees uno y lo marques para cobrar, los números de ese premio salen aquí.</p>
          <Link href="/admin/sorteos" className="dash-btn dash-btn--lime">
            Ir a sorteos
          </Link>
        </div>
      ) : (
        <>
          <header className="dash-head">
            <div>
              <p className="dash-kicker">{sorteo.vendiendo ? "Vendiendo ahora" : "Este sorteo"}</p>
              <h1>{sorteo.nombre}</h1>
              <p className="dash-meta">
                {[sorteo.fecha, sorteo.loteria].filter(Boolean).join(" · ")}
              </p>
              <div className="dash-pills">
                <span>{sorteo.pagina}</span>
                {sorteo.vendiendo ? <span className="is-on">Vendiendo</span> : null}
              </div>
            </div>
            <div className="dash-acciones">
              {sorteo.pagina !== "Oculta" ? (
                <Link href={`/sorteo/${sorteo.slug}`} className="dash-btn">
                  Ver página
                </Link>
              ) : null}
              <Link href="/admin/sorteos" className="dash-btn">
                Editar
              </Link>
              {finanzasVisibles ? (
                <button type="button" className="dash-btn" onClick={() => setFinanzasVisibles(false)}>
                  Ocultar finanzas
                </button>
              ) : (
                <button
                  type="button"
                  className="dash-btn dash-btn--lime"
                  onClick={() => {
                    setErrorFinanzas("");
                    setPasswordFinanzas("");
                    setModalFinanzas(true);
                  }}
                >
                  Ver finanzas
                </button>
              )}
            </div>
          </header>

          {lista.length > 1 ? (
            <div className="dash-switch" role="tablist" aria-label="Sorteos">
              {lista.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={s.id === sorteoId ? "is-on" : ""}
                  onClick={() => cargar(s.id)}
                >
                  {s.nombre}
                </button>
              ))}
            </div>
          ) : null}

          <div className="dash-grid">
            <article className="dash-card">
              <p>Números libres</p>
              <strong className="is-lime">{stats.libres}</strong>
              <span>
                {stats.dadas === 1 ? "1 dado" : `${stats.dadas} dados`} de {stats.total}. Local {stats.dadasFisico} · web {stats.dadasWeb}
              </span>
            </article>
            <article className="dash-card">
              <p>Ventas</p>
              <strong>{stats.ventasLocal + stats.ventasWeb}</strong>
              <span>
                {stats.ventasWeb} por la página · {stats.ventasLocal} en el local
              </span>
            </article>
            <article className="dash-card">
              <p>Ingresos de este sorteo</p>
              <strong>{finanzasVisibles ? pesos(stats.ingresos) : "$ ***"}</strong>
              <span>Solo lo pagado de este premio.</span>
            </article>
            <article className="dash-card">
              <p>Pagos web sin confirmar</p>
              <strong>{stats.sinConfirmar}</strong>
              <span>Abrieron Bold y todavía no aparece el pago.</span>
            </article>
          </div>

          {stats.sinPago > 0 ? (
            <p className="dash-aviso">
              {stats.sinPago === 1
                ? "Hay 1 venta de este sorteo con número y sin pago."
                : `Hay ${stats.sinPago} ventas de este sorteo con número y sin pago.`}
            </p>
          ) : null}

          <section className="dash-bloque">
            <h2>Ventas de este sorteo</h2>
            <div className="dash-lista">
              {ventas.length === 0 ? (
                <p className="dash-nada">Todavía no hay pagos de este premio.</p>
              ) : (
                ventas.map((v) => (
                  <div key={v.id} className="dash-venta">
                    <div>
                      <strong>{v.nombre}</strong>
                      <p>
                        {v.planNombre} · {v.canal}
                        {v.numeros?.length ? ` · ${v.numeros.join(" ")}` : ""}
                      </p>
                    </div>
                    <div className="dash-venta__lado">
                      <span>{finanzasVisibles ? pesos(v.monto) : "••••"}</span>
                      <small>{formatFecha(v.fecha)}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {otros.length ? (
            <section className="dash-bloque">
              <h2>Otros sorteos</h2>
              <div className="dash-otros">
                {otros.map((s) => (
                  <button key={s.id} type="button" className="dash-otro" onClick={() => cargar(s.id)}>
                    <strong>{s.nombre}</strong>
                    <span>
                      {s.dadas} números · {s.pagina}
                      {s.vendiendo ? " · Vendiendo" : ""}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      {modalFinanzas ? (
        <div className="dash-modal">
          <div className="dash-modal__caja">
            <h2>Acceso a finanzas</h2>
            <p>Ingresa la contraseña para ver los montos de este sorteo.</p>
            <input
              type="password"
              value={passwordFinanzas}
              onChange={(e) => setPasswordFinanzas(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmarUnlockFinanzas();
              }}
              placeholder="Contraseña"
              autoComplete="current-password"
            />
            {errorFinanzas ? <p className="dash-error">{errorFinanzas}</p> : null}
            <button type="button" className="dash-btn dash-btn--lime" onClick={confirmarUnlockFinanzas} disabled={cargandoFinanzas}>
              {cargandoFinanzas ? "…" : "Confirmar"}
            </button>
            <button
              type="button"
              className="dash-btn"
              onClick={() => {
                setModalFinanzas(false);
                setPasswordFinanzas("");
                setErrorFinanzas("");
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
