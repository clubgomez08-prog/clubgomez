"use client";

import { useEffect, useState } from "react";
import { PLANES_MEMBRESIA, PLAN_DEFAULT_ID } from "@/lib/club-gomez/planes";

let planesRemotos = null;
let pedido = null;

function validar(remotos) {
  const out = {};
  for (const [id, base] of Object.entries(PLANES_MEMBRESIA)) {
    const r = remotos?.[id];
    const ok =
      r &&
      Number.isInteger(r.precio) &&
      r.precio > 0 &&
      Number.isInteger(r.claves) &&
      r.claves > 0 &&
      typeof r.precioLabel === "string";
    out[id] = ok ? { ...base, ...r, id } : base;
  }
  return out;
}

function pedirPlanes() {
  if (!pedido) {
    pedido = fetch("/api/planes")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.planes) planesRemotos = validar(d.planes);
        return planesRemotos;
      })
      .catch(() => null);
  }
  return pedido;
}

/** Planes vigentes. Empieza con los del código y se actualiza con los de la base. */
export function usePlanes() {
  const [planes, setPlanes] = useState(planesRemotos || PLANES_MEMBRESIA);
  useEffect(() => {
    let vivo = true;
    pedirPlanes().then((p) => {
      if (vivo && p) setPlanes(p);
    });
    return () => {
      vivo = false;
    };
  }, []);
  return planes;
}

export function usePlan(planId) {
  const planes = usePlanes();
  const key = String(planId || "").trim().toLowerCase();
  return planes[key] || planes[PLAN_DEFAULT_ID];
}
