"use client";

import { useEffect, useState } from "react";
import HomePage from "@/components/club-gomez/HomePage";
import { propsDeSorteo } from "@/lib/club-gomez/sorteos";

export const PREVIEW_KEY = "cg-sorteo-preview";

export default function VistaSorteo() {
  const [pack, setPack] = useState(null);

  useEffect(() => {
    let ultimo = "";
    let extras = "";
    let primera = true;
    function leer() {
      let raw = "";
      try {
        raw = localStorage.getItem(PREVIEW_KEY) || "";
      } catch {
        return;
      }
      if (raw === ultimo) return;
      ultimo = raw;
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }
      setPack(data);
      const ahora = JSON.stringify(data?.form?.premios_extra || []);
      const cambio = ahora !== extras;
      extras = ahora;
      if (!primera && cambio) {
        window.setTimeout(() => {
          document.getElementById("premios-mismo-numero")?.scrollIntoView({ block: "start" });
        }, 80);
      }
      primera = false;
    }
    leer();
    const id = window.setInterval(leer, 400);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    function frenar(e) {
      const destino = e.destination?.url || "";
      if (!destino.includes("/admin/sorteos/vista")) e.preventDefault();
    }
    if (!window.navigation?.addEventListener) return undefined;
    window.navigation.addEventListener("navigate", frenar);
    return () => window.navigation.removeEventListener("navigate", frenar);
  }, []);

  if (!pack?.form) {
    return (
      <div className="sorteo-vista-vacia">
        Abre un sorteo para ver la página.
      </div>
    );
  }

  return <HomePage {...propsDeSorteo(pack.form, pack.planes || [])} preview />;
}
