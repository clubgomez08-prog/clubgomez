"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminAuthHeaders } from "@/lib/auth";

function Persona({ dueno, ganadorMillon }) {
  if (!dueno) {
    return <p className="anti__vacio">Nadie ha comprado este número todavía.</p>;
  }
  return (
    <dl className="anti__persona">
      <div>
        <dt>Nombre</dt>
        <dd>{dueno.nombre}</dd>
      </div>
      <div>
        <dt>Teléfono</dt>
        <dd>{dueno.telefono || "Sin teléfono"}</dd>
      </div>
      {ganadorMillon ? (
        <div>
          <dt>Premio</dt>
          <dd style={{ color: "#b8e351", fontWeight: 700 }}>Ganador del $1.000.000</dd>
        </div>
      ) : null}
    </dl>
  );
}

export default function BendecidosSorteo({ sorteoId }) {
  const [items, setItems] = useState([]);
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [hallazgo, setHallazgo] = useState(null);
  const [busy, setBusy] = useState("");

  const cargar = useCallback(async () => {
    setError("");
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`/api/admin/bendecidos?sorteo=${sorteoId}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudieron cargar los bendecidos");
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || "Error");
    }
  }, [sorteoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function buscar(e) {
    e.preventDefault();
    setAviso("");
    setHallazgo(null);
    setError("");
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(
        `/api/admin/bendecidos?sorteo=${sorteoId}&numero=${encodeURIComponent(busqueda)}`,
        { headers }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo ver la persona");
      setHallazgo(data.busqueda);
    } catch (err) {
      setError(err.message || "Error");
    }
  }

  async function toggle(numero, activo) {
    setBusy(numero);
    setAviso("");
    setError("");
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/bendecidos", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ sorteoId, numero, activo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      setAviso(
        activo
          ? `${numero} quedó activo: ya puede tocarle a alguien. Si se vende, gana $1.000.000.`
          : `${numero} quedó apagado: nadie se lo puede llevar por ahora.`
      );
      await cargar();
    } catch (err) {
      setError(err.message || "Error");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="anti" style={{ marginTop: 18 }}>
      <p className="anti__kicker">Solo las 3 motos</p>
      <h2>Números bendecidos · $1.000.000</h2>
      <p className="anti__nota">
        Empiezan <strong>apagados</strong>: nadie se los puede llevar hasta que tú los actives. Si
        está <strong>activo</strong> y le toca a alguien, esa persona gana <strong>$1.000.000</strong>.
        Esto es aparte de los sábados de $500.000.
      </p>

      <form className="anti__busca" onSubmit={buscar}>
        <label>
          Ver a quién le tocó
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="Ej. 0181"
            inputMode="numeric"
          />
        </label>
        <button type="submit" className="dash-btn dash-btn--lime" disabled={!busqueda}>
          Ver persona
        </button>
      </form>

      {hallazgo ? (
        <div className="anti__resultado">
          <p>
            Número <strong>{hallazgo.numero}</strong>
            {hallazgo.bendecido ? " · bendecido" : " · no es de la lista"}
            {hallazgo.bendecido
              ? hallazgo.activo
                ? " · activo"
                : " · apagado"
              : ""}
          </p>
          <Persona dueno={hallazgo.dueno} ganadorMillon={hallazgo.ganadorMillon} />
        </div>
      ) : null}

      {aviso ? <p className="anti__ok">{aviso}</p> : null}
      {error ? <p className="dash-error">{error}</p> : null}

      <div className="bend__lista">
        {items.map((item) => (
          <article key={item.numero} className="anti__dia">
            <div className="bend__fila">
              <div>
                <p className="bend__num">{item.numero}</p>
                <p className="anti__guardado">
                  {item.activo ? "Activo · puede tocar" : "Apagado · no se asigna"}
                  {item.ganadorMillon ? " · ya tiene dueño · ganador del millón" : ""}
                </p>
                {item.dueno ? (
                  <p className="anti__guardado">
                    {item.dueno.nombre}
                    {item.dueno.telefono ? ` · ${item.dueno.telefono}` : ""}
                  </p>
                ) : (
                  <p className="anti__vacio">Libre</p>
                )}
              </div>
              <button
                type="button"
                className={item.activo ? "dash-btn dash-btn--lime" : "dash-btn"}
                disabled={busy === item.numero}
                onClick={() => toggle(item.numero, !item.activo)}
              >
                {busy === item.numero ? "…" : item.activo ? "Apagar" : "Activar"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
