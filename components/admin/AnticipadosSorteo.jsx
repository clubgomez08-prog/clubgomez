"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminAuthHeaders } from "@/lib/auth";

function Persona({ dueno }) {
  if (!dueno) {
    return (
      <p className="anti__vacio">
        Nadie ha comprado este número en este sorteo. Puedes guardarlo igual: no se aparta y no se le quita a nadie.
      </p>
    );
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
    </dl>
  );
}

export default function AnticipadosSorteo({ sorteoId }) {
  const [dias, setDias] = useState([]);
  const [valores, setValores] = useState({});
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [hallazgo, setHallazgo] = useState(null);
  const [guardando, setGuardando] = useState("");

  const cargar = useCallback(async () => {
    setError("");
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`/api/admin/anticipados?sorteo=${sorteoId}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudieron cargar los sábados");
      setDias(data.dias || []);
      setValores(Object.fromEntries((data.dias || []).map((d) => [d.fecha, d.numero || ""])));
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
        `/api/admin/anticipados?sorteo=${sorteoId}&numero=${encodeURIComponent(busqueda)}`,
        { headers }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo ver la persona");
      setHallazgo(data.busqueda);
    } catch (err) {
      setError(err.message || "Error");
    }
  }

  async function guardar(fecha) {
    setGuardando(fecha);
    setAviso("");
    setError("");
    try {
      const headers = await getAdminAuthHeaders();
      const numero = valores[fecha] || "";
      const res = await fetch("/api/admin/anticipados", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ sorteoId, fecha, numero }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      const repetido = data.repetido?.length
        ? ` Ya había salido: ${data.repetido.join(", ")}. Sigue con su dueño.`
        : "";
      setAviso(
        data.numero
          ? `Guardado el ${data.numero} en este sábado.${repetido}`
          : "Este sábado quedó sin número."
      );
      await cargar();
    } catch (err) {
      setError(err.message || "Error");
    } finally {
      setGuardando("");
    }
  }

  return (
    <section className="anti">
      <p className="anti__kicker">Solo las 3 motos</p>
      <h2>Premios de los sábados</h2>
      <p className="anti__nota">
        Daniel, los $500.000 se anotan aquí. El número tiene 4 cifras, del 0000 al 9999. El 26 de diciembre no va en esta lista: ese día son las 3 motos.
      </p>
      <ol className="anti__pasos">
        <li>
          <strong>Para ver quién lo compró.</strong> Escribe el número en «Ver a la persona» y pulsa Ver persona. Solo consulta. No aparta el número ni se lo quita a nadie.
        </li>
        <li>
          <strong>Para guardar el que salió.</strong> Escríbelo en ese sábado y pulsa Guardar sábado. El número sigue con su dueño. Si sale otra vez otro sábado, se guarda otra vez y sigue jugando hasta el 26 de diciembre.
        </li>
      </ol>

      <form className="anti__busca" onSubmit={buscar}>
        <label>
          Ver a la persona
          <input
            inputMode="numeric"
            maxLength={4}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
            placeholder="Ej. 0342"
          />
        </label>
        <button type="submit" className="dash-btn dash-btn--lime" disabled={!busqueda}>
          Ver persona
        </button>
      </form>
      {hallazgo ? (
        <div className="anti__resultado">
          <p>Número <strong>{hallazgo.numero}</strong></p>
          <Persona dueno={hallazgo.dueno} />
          <p>
            {hallazgo.dias?.length
              ? `Guardado en: ${hallazgo.dias.join(", ")}.`
              : "Todavía no está guardado en ningún sábado."}
          </p>
        </div>
      ) : null}

      <div className="anti__dias">
        {dias.map((dia) => {
          const escrito = valores[dia.fecha] || "";
          const puedeQuitar = !escrito && dia.numero;
          return (
            <article key={dia.fecha} className="anti__dia">
              <div>
                <strong>{dia.etiqueta}</strong>
                <span>{dia.premio}</span>
              </div>
              <label>
                Número que salió
                <input
                  inputMode="numeric"
                  maxLength={4}
                  value={escrito}
                  onChange={(e) =>
                    setValores((prev) => ({
                      ...prev,
                      [dia.fecha]: e.target.value.replace(/[^\d]/g, "").slice(0, 4),
                    }))
                  }
                  placeholder="Ej. 0342"
                />
              </label>
              <button
                type="button"
                className="dash-btn dash-btn--lime"
                disabled={guardando === dia.fecha || (!escrito && !dia.numero)}
                onClick={() => guardar(dia.fecha)}
              >
                {guardando === dia.fecha ? "…" : puedeQuitar ? "Quitar" : "Guardar sábado"}
              </button>
              {dia.numero ? (
                <div className="anti__guardado">
                  <p>Guardado: <strong>{dia.numero}</strong>. Sigue con su dueño.</p>
                  <Persona dueno={dia.dueno} />
                </div>
              ) : (
                <p>Este sábado todavía no tiene número.</p>
              )}
            </article>
          );
        })}
      </div>
      {aviso ? <p className="anti__ok">{aviso}</p> : null}
      {error ? <p className="dash-error">{error}</p> : null}
    </section>
  );
}
