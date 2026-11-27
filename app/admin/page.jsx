"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getAdminAuthHeaders } from "@/lib/auth";
import AnticipadosSorteo from "@/components/admin/AnticipadosSorteo";
import BendecidosSorteo from "@/components/admin/BendecidosSorteo";

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

function cantidad(n, uno, varios) {
  return `${n} ${Number(n) === 1 ? uno : varios}`;
}

function ListaVentas({ titulo, vacio, ventas, finanzasVisibles }) {
  return (
    <section className="dash-bloque">
      <h2>{titulo}</h2>
      <div className="dash-lista">
        {ventas.length === 0 ? (
          <p className="dash-nada">{vacio}</p>
        ) : (
          ventas.map((v) => (
            <div key={v.id} className="dash-venta">
              <div>
                <strong>{v.nombre}</strong>
                <p>
                  {v.planNombre}
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
  );
}

export default function AdminDashboardPage() {
  const [sorteoId, setSorteoId] = useState("");
  const [sorteo, setSorteo] = useState(null);
  const [otros, setOtros] = useState([]);
  const [stats, setStats] = useState(null);
  const [ventasFisicas, setVentasFisicas] = useState([]);
  const [ventasWeb, setVentasWeb] = useState([]);
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
      setVentasFisicas(data.ventasFisicas || []);
      setVentasWeb(data.ventasWeb || []);
      if (data.sorteo?.id) setSorteoId(data.sorteo.id);
    } catch (err) {
      setErrorCarga(err.message || "No se pudieron cargar los datos. Recarga la página.");
      setSorteo(null);
      setStats(null);
      setVentasFisicas([]);
      setVentasWeb([]);
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
          <p>Cuando crees uno, los números de ese premio salen aquí.</p>
          <Link href="/admin/sorteos" className="dash-btn dash-btn--lime">
            Ir a sorteos
          </Link>
        </div>
      ) : (
        <>
          <header className="dash-head">
            <div>
              <p className="dash-kicker">{sorteo.enInicio ? "En la página de inicio" : "Este sorteo"}</p>
              <h1>{sorteo.nombre}</h1>
              <p className="dash-meta">
                {[sorteo.fecha, sorteo.loteria].filter(Boolean).join(" · ")}
              </p>
              <div className="dash-pills">
                <span>{sorteo.pagina}</span>
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

          <section className="dash-elige">
            <p>Ver un sorteo</p>
            <div className="dash-switch" role="tablist" aria-label="Sorteos">
              {lista.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={s.id === sorteoId}
                  className={s.id === sorteoId ? "is-on" : ""}
                  onClick={() => cargar(s.id)}
                >
                  <strong>{s.nombre}</strong>
                  <span>
                    {s.slug === "navidad"
                      ? "Premios de los sábados"
                      : s.enInicio
                        ? "En la página de inicio"
                        : s.pagina}
                  </span>
                </button>
              ))}
            </div>
            <p className="dash-aclaracion">
              {lista.length > 1
                ? "Las ventas de abajo son solo del sorteo marcado. Elegir otro no cambia el de la página de inicio."
                : "Cuando haya otro sorteo, sale aquí al lado. Sus ventas no se suman con este."}
            </p>
          </section>

          {sorteo.slug === "navidad" ? (
            <>
              <BendecidosSorteo sorteoId={sorteo.id} />
              <AnticipadosSorteo sorteoId={sorteo.id} />
            </>
          ) : null}

          <div className="dash-resumen">
            <article className="dash-card">
              <p>Ventas físicas</p>
              <strong>{stats.ventasLocal}</strong>
              <span className="dash-card__monto">{finanzasVisibles ? pesos(stats.ingresosFisico) : "$ ***"}</span>
              <span>{cantidad(stats.dadasFisico, "número dado", "números dados")} de {stats.totalFisico}</span>
              <span>Del {stats.rangoFisico}</span>
              <Link href="/admin/venta-fisica" className="dash-card__ir">Ir a venta física</Link>
            </article>
            <article className="dash-card">
              <p>Ventas web</p>
              <strong>{stats.ventasWeb}</strong>
              <span className="dash-card__monto">{finanzasVisibles ? pesos(stats.ingresosWeb) : "$ ***"}</span>
              <span>{cantidad(stats.dadasWeb, "número dado", "números dados")} de {stats.totalWeb}</span>
              <span>Del {stats.rangoWeb}</span>
              {stats.sinConfirmar > 0 ? (
                <span>{cantidad(stats.sinConfirmar, "pago abierto en Bold", "pagos abiertos en Bold")}, todavía sin confirmar.</span>
              ) : (
                <span>Sin pagos pendientes.</span>
              )}
              <Link href="/admin/solicitudes" className="dash-card__ir">Ir a pagos web</Link>
            </article>
            <article className="dash-card dash-card--total">
              <p>Ventas totales</p>
              <strong>{stats.ventasLocal + stats.ventasWeb}</strong>
              <span className="dash-card__monto">{finanzasVisibles ? pesos(stats.ingresos) : "$ ***"}</span>
              <span>{stats.ventasLocal} físicas · {stats.ventasWeb} web</span>
              <span>{cantidad(stats.dadas, "número dado", "números dados")} de {stats.total}</span>
              <span>{cantidad(stats.libres, "libre", "libres")}</span>
            </article>
          </div>

          <div className="dash-numeros">
            <article className="dash-numero">
              <div>
                <p>Libres en físico</p>
                <span>Del {stats.rangoFisico}</span>
              </div>
              <strong className="is-lime">{stats.libresFisico}</strong>
            </article>
            <article className="dash-numero">
              <div>
                <p>Libres en la web</p>
                <span>Del {stats.rangoWeb}</span>
              </div>
              <strong className="is-lime">{stats.libresWeb}</strong>
            </article>
          </div>

          {stats.sinPago > 0 ? (
            <p className="dash-aviso">
              {stats.sinPago === 1
                ? "Hay 1 venta de este sorteo con número y sin pago."
                : `Hay ${stats.sinPago} ventas de este sorteo con número y sin pago.`}
            </p>
          ) : null}

          <div className="dash-columnas">
            <ListaVentas
              titulo="Ventas físicas"
              vacio="Todavía no hay ventas en el local."
              ventas={ventasFisicas}
              finanzasVisibles={finanzasVisibles}
            />
            <ListaVentas
              titulo="Ventas web"
              vacio="Todavía no hay ventas por la página."
              ventas={ventasWeb}
              finanzasVisibles={finanzasVisibles}
            />
          </div>

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
