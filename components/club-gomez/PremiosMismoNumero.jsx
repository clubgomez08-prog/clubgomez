"use client";

import { useState } from "react";

function fotosDe(premio) {
  const lista = Array.isArray(premio?.fotos) ? premio.fotos.filter(Boolean) : [];
  if (lista.length) return lista;
  return premio?.imagen ? [premio.imagen] : [];
}

function FotoPremio({ fotos, nombre }) {
  const lista = fotos || [];
  const [i, setI] = useState(0);
  const actual = lista.length ? Math.min(i, lista.length - 1) : 0;
  if (!lista.length) {
    return <span className="cg-mismo__hueco">{(nombre || "?").slice(0, 1)}</span>;
  }
  return (
    <div className="cg-mismo__fotos">
      <img src={lista[actual]} alt="" />
      {lista.length > 1 ? (
        <div className="cg-mismo__minis">
          {lista.map((src, idx) => (
            <button
              key={src}
              type="button"
              className={idx === actual ? "is-on" : ""}
              onClick={() => setI(idx)}
              aria-label={`Foto ${idx + 1} de ${nombre}`}
            >
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Premios extra de la misma página. Cada uno dice si gana con el mismo número o con otro. */
export default function PremiosMismoNumero({ principal = "", fotoPrincipal = "", extras = [] }) {
  const lista = (Array.isArray(extras) ? extras : []).filter(
    (p) => p?.nombre || fotosDe(p).length
  );
  if (!lista.length) return null;
  const tituloPrincipal = principal || "Premio principal";

  const otros = lista.filter((p) => p.mismo_numero === false);
  const mismos = lista.filter((p) => p.mismo_numero !== false);
  const kicker = otros.length && !mismos.length ? "Otro número" : mismos.length && !otros.length ? "Mismo número" : "Esta página";
  const lead = otros.length && !mismos.length
    ? "Estos premios se ganan con un número distinto al del premio principal. Siguen en esta página."
    : mismos.length && !otros.length
      ? "Estos premios se ganan con el mismo número del premio principal."
      : "Cada premio dice si se gana con el mismo número o con otro.";

  const todos = [
    { nombre: tituloPrincipal, detalle: "", imagen: fotoPrincipal, fotos: fotoPrincipal ? [fotoPrincipal] : [], mismo_numero: true, principal: true },
    ...lista,
  ];

  return (
    <section className="cg-mismo" id="premios-mismo-numero">
      <div className="cg-mismo__inner">
        <p className="cg-mismo__kicker">{kicker}</p>
        <h2>También participa por</h2>
        <p className="cg-mismo__lead">{lead}</p>
        <div className="cg-mismo__grid">
          {todos.map((p, index) => {
            const mismo = p.mismo_numero !== false;
            return (
              <article key={`${p.principal ? "principal" : "extra"}-${index}`} className="cg-mismo__card">
                <FotoPremio fotos={fotosDe(p)} nombre={p.nombre} />
                <p className="cg-mismo__modo">{p.principal ? "Premio principal" : mismo ? "Mismo número" : "Otro número"}</p>
                <h3>{p.nombre || "Premio"}</h3>
                {p.detalle ? <p>{p.detalle}</p> : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
