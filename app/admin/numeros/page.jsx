"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminAuthHeaders } from "@/lib/auth";
import { useToast } from "@/components/admin/Toast";
import PeriodoPicker from "@/components/admin/PeriodoPicker";
import { periodoDe, padClave } from "@/lib/club-gomez/claves-pool";
import { descargarArchivoAdmin, linkWhatsappNumeros } from "@/lib/admin-descarga";

const LIME = "#B8E351";
const WEB = "#60a5fa";
const FISICO = "#fbbf24";
const TODOS = Array.from({ length: 1000 }, (_, i) => String(i).padStart(3, "0"));

function formatFecha(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
}

function FichaNumero({ numero, info, canal, onReenviar, onAnular, busy }) {
  const color = canal === "web" ? WEB : FISICO;
  if (!info) {
    return (
      <div className="bg-zinc-900 rounded-xl p-5" style={{ border: "1px solid rgba(63,63,70,1)" }}>
        <p className="text-3xl font-black font-mono text-white">{numero}</p>
        <p className="text-sm mt-2" style={{ color }}>
          Libre · {canal === "web" ? "rango web" : "rango físico"}
        </p>
        <p className="text-sm text-zinc-500 mt-2">Nadie tiene este número este mes.</p>
      </div>
    );
  }
  const wa = linkWhatsappNumeros({
    telefono: info.telefono,
    nombre: info.nombre,
    numeros: info.todos,
    planNombre: info.planNombre,
  });
  return (
    <div className="bg-zinc-900 rounded-xl p-5" style={{ border: `1px solid ${LIME}55` }}>
      <p className="text-3xl font-black font-mono" style={{ color: LIME }}>
        {numero}
      </p>
      <p className="text-lg font-semibold text-white mt-2">{info.nombre}</p>
      <p className="text-sm text-zinc-400">
        {info.telefono || "sin teléfono"}
        {info.email ? ` · ${info.email}` : ""}
        {info.cedula ? ` · CC ${info.cedula}` : ""}
      </p>
      <p className="text-sm mt-2" style={{ color }}>
        Plan {info.planNombre} · {canal === "web" ? "Web" : "Físico"} ·{" "}
        {formatFecha(info.fecha)}
      </p>
      <p className="text-xs text-zinc-500 mt-2">
        Todos sus números este mes:{" "}
        <span className="font-mono text-zinc-300">{info.todos.join(" · ")}</span>
      </p>
      <div className="flex flex-wrap gap-2 mt-4">
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: "#22c55e", color: "#050607" }}
          >
            WhatsApp
          </a>
        ) : null}
        {info.email ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onReenviar(info)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-600 text-zinc-200 hover:bg-zinc-800"
          >
            {busy ? "…" : "Reenviar correo"}
          </button>
        ) : null}
        {info.origen === "manual" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAnular(info)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-300 hover:bg-red-950/40"
          >
            Anular venta física
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function NumerosPage() {
  const { addToast } = useToast();
  const [periodo, setPeriodo] = useState(periodoDe());
  const [numeros, setNumeros] = useState([]);
  const [rangos, setRangos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos");
  const [buscar, setBuscar] = useState("");
  const [seleccion, setSeleccion] = useState(null);
  const [busy, setBusy] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/numeros?periodo=${periodo}`, {
        headers: await getAdminAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar");
      setNumeros(data.numeros || []);
      setRangos(data.rangos || null);
    } catch (err) {
      addToast(err.message || "Error al cargar", "error");
      setNumeros([]);
    } finally {
      setLoading(false);
    }
  }, [periodo, addToast]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const porNumero = useMemo(() => {
    const porMembresia = {};
    for (const n of numeros) {
      (porMembresia[n.membresiaId] ||= []).push(n.numero);
    }
    const map = {};
    for (const n of numeros) {
      map[n.numero] = { ...n, todos: (porMembresia[n.membresiaId] || []).sort() };
    }
    return map;
  }, [numeros]);

  const canalDe = useCallback(
    (num) => {
      const v = Number(num);
      if (rangos?.web && v >= rangos.web.min && v <= rangos.web.max) return "web";
      return "fisico";
    },
    [rangos]
  );

  const resumen = useMemo(() => {
    const r = { web: { v: 0, t: 0 }, fisico: { v: 0, t: 0 } };
    for (const num of TODOS) {
      const c = canalDe(num);
      r[c].t += 1;
      if (porNumero[num]) r[c].v += 1;
    }
    return r;
  }, [porNumero, canalDe]);

  const visibles = TODOS.filter((num) => {
    if (filtro === "todos") return true;
    if (filtro === "vendidos") return Boolean(porNumero[num]);
    if (filtro === "libres") return !porNumero[num];
    return canalDe(num) === filtro;
  });

  function consultar(e) {
    e.preventDefault();
    const digits = buscar.replace(/\D/g, "");
    if (!digits) return;
    setSeleccion(padClave(digits));
  }

  async function reenviar(info) {
    if (!confirm(`¿Reenviar el correo de oportunidades a ${info.email}?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/reenviar-correo", {
        method: "POST",
        headers: { ...(await getAdminAuthHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ membresiaId: info.membresiaId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo reenviar");
      addToast(`Correo reenviado a ${data.email}`, "success");
    } catch (err) {
      addToast(err.message || "Error", "error");
    } finally {
      setBusy(false);
    }
  }

  async function anular(info) {
    const motivo = prompt(
      `Anular la venta física de ${info.nombre} (números ${info.todos.join(", ")}).\n` +
        "Los números quedan libres otra vez. Escribe el motivo:"
    );
    if (motivo === null) return;
    if (!motivo.trim()) {
      addToast("Escribe un motivo para anular.", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/anular-venta", {
        method: "POST",
        headers: { ...(await getAdminAuthHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ membresiaId: info.membresiaId, motivo: motivo.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo anular");
      addToast(`Venta anulada. Liberados: ${(data.liberados || []).join(", ")}`, "success");
      await cargar();
    } catch (err) {
      addToast(err.message || "Error", "error");
    } finally {
      setBusy(false);
    }
  }

  async function descargar(tipo) {
    try {
      await descargarArchivoAdmin(
        `/api/admin/exportar?tipo=${tipo}&periodo=${periodo}`,
        `club-gomez-${tipo}-${periodo}.csv`
      );
    } catch (err) {
      addToast(err.message || "No se pudo descargar", "error");
    }
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Números</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Mapa del 000 al 999 del mes. Consulta quién tiene un número (por ejemplo
        el ganador de la lotería) sin cambiar nada.
      </p>

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <PeriodoPicker value={periodo} onChange={setPeriodo} />
        <form onSubmit={consultar} className="flex items-end gap-2">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Consultar número / ganador
            </span>
            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Ej. 709"
              inputMode="numeric"
              className="px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-mono w-32"
            />
          </label>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: LIME, color: "#050607" }}
          >
            Buscar
          </button>
        </form>
        <div className="flex gap-2 sm:ml-auto">
          <button
            type="button"
            onClick={() => descargar("ventas")}
            className="px-3 py-2.5 rounded-xl text-sm font-semibold border border-zinc-600 text-zinc-200 hover:bg-zinc-800"
          >
            Excel ventas
          </button>
          <button
            type="button"
            onClick={() => descargar("numeros")}
            className="px-3 py-2.5 rounded-xl text-sm font-semibold border border-zinc-600 text-zinc-200 hover:bg-zinc-800"
          >
            Excel números
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: LIME, borderTopColor: "transparent" }}
          />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex flex-wrap gap-2 mb-3 text-xs">
              {[
                ["todos", "Todos"],
                ["web", `Web ${resumen.web.v}/${resumen.web.t}`],
                ["fisico", `Físico ${resumen.fisico.v}/${resumen.fisico.t}`],
                ["vendidos", "Vendidos"],
                ["libres", "Libres"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFiltro(id)}
                  className="px-3 py-1.5 rounded-lg border"
                  style={{
                    borderColor: filtro === id ? LIME : "rgba(63,63,70,1)",
                    color: filtro === id ? "#fff" : "#a1a1aa",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mb-3 text-xs text-zinc-500">
              <span>
                <span className="inline-block w-3 h-3 rounded-sm mr-1 align-middle" style={{ background: WEB }} />
                Web vendido
              </span>
              <span>
                <span className="inline-block w-3 h-3 rounded-sm mr-1 align-middle" style={{ background: FISICO }} />
                Físico vendido
              </span>
              <span>
                <span className="inline-block w-3 h-3 rounded-sm mr-1 align-middle border border-zinc-600" />
                Libre
              </span>
            </div>
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(42px, 1fr))" }}
            >
              {visibles.map((num) => {
                const vendido = Boolean(porNumero[num]);
                const c = canalDe(num);
                const color = c === "web" ? WEB : FISICO;
                const sel = seleccion === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSeleccion(num)}
                    title={vendido ? porNumero[num].nombre : "Libre"}
                    className="rounded font-mono text-[11px] py-1.5"
                    style={{
                      background: vendido ? color : "transparent",
                      color: vendido ? "#050607" : `${color}aa`,
                      border: sel ? `2px solid ${LIME}` : `1px solid ${vendido ? color : "#3f3f46"}`,
                      fontWeight: vendido ? 700 : 400,
                    }}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:sticky lg:top-4 content-start grid gap-3">
            {seleccion ? (
              <FichaNumero
                numero={seleccion}
                info={porNumero[seleccion]}
                canal={canalDe(seleccion)}
                onReenviar={reenviar}
                onAnular={anular}
                busy={busy}
              />
            ) : (
              <p className="text-sm text-zinc-500">
                Toca un número o búscalo para ver quién lo tiene.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
