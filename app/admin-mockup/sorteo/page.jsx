"use client";

import { useEffect, useState } from "react";
import { getBeneficiosMes, getParticipantes } from "@/lib/mock-admin/store";
import { construirUrlWhatsappClaves, LOTERIA_INTERNA } from "@/lib/club-gomez/claves-whatsapp";

const LIME = "#B8E351";

export default function MockBeneficiosMesPage() {
  const [beneficios, setBeneficios] = useState([]);
  const [miembros, setMiembros] = useState([]);

  function cargar() {
    setBeneficios(getBeneficiosMes());
    setMiembros(getParticipantes({ estado: "aprobado", pageSize: 8 }).participantes);
  }

  useEffect(() => {
    cargar();
    window.addEventListener("mock-admin-update", cargar);
    return () => window.removeEventListener("mock-admin-update", cargar);
  }, []);

  function abrirWa(miembro) {
    const url = construirUrlWhatsappClaves(
      {
        nombre: miembro.nombre,
        planNombre: miembro.rifa_id,
        claves: (miembro.boletos || []).map(String),
      },
      { incluirMotilon: true }
    );
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="py-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Beneficios del mes</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Calendario de premios y entregas. Motilón Noche solo en ops / correos (no en landing).
      </p>

      <div className="grid gap-4 mb-8">
        {beneficios.map((b) => (
          <div
            key={b.id}
            className="bg-zinc-900 rounded-xl p-5"
            style={{ border: "1px solid rgba(184,227,81,0.2)" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-white">{b.nombre}</h3>
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  background:
                    b.estado === "activo" ? "rgba(184,227,81,0.15)" : "rgba(255,255,255,0.06)",
                  color: b.estado === "activo" ? LIME : "#a1a1aa",
                }}
              >
                {b.estado}
              </span>
            </div>
            <p className="text-sm mt-2" style={{ color: LIME }}>
              {b.fechas.join(" · ")}
            </p>
          </div>
        ))}
      </div>

      <div
        className="bg-zinc-900 rounded-xl p-5 mb-8"
        style={{ border: "1px solid rgba(184,227,81,0.15)" }}
      >
        <p className="text-xs font-semibold tracking-wide text-zinc-500 mb-2">
          OPS INTERNO
        </p>
        <p className="text-sm text-zinc-300">
          Lotería de referencia para correos:{" "}
          <strong style={{ color: LIME }}>{LOTERIA_INTERNA}</strong>
        </p>
        <p className="text-xs text-zinc-500 mt-2">
          No se muestra en la homepage. Solo correos, WhatsApp de claves y este panel.
        </p>
      </div>

      <h2 className="text-lg font-semibold text-white mb-3">Miembros recientes — claves</h2>
      <div className="space-y-3">
        {miembros.map((m) => (
          <div
            key={m.id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <p className="text-white font-medium">{m.nombre}</p>
              <p className="text-xs text-zinc-500">
                Plan {m.rifa_id} · {(m.boletos || []).length} claves
              </p>
              <p className="text-xs font-mono mt-1" style={{ color: LIME }}>
                {(m.boletos || []).slice(0, 5).join(" · ")}
                {(m.boletos || []).length > 5 ? "…" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => abrirWa(m)}
              className="px-3 py-2 text-sm font-semibold rounded-lg"
              style={{ background: LIME, color: "#050607" }}
            >
              WhatsApp claves
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
