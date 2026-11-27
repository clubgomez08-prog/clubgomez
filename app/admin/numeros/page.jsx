"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminAuthHeaders } from "@/lib/auth";
import { useToast } from "@/components/admin/Toast";
import { formatearNumero } from "@/lib/club-gomez/claves-pool";
import { esNumeroBendecido } from "@/lib/club-gomez/bendecidos";
import { descargarArchivoAdmin, linkWhatsappDeSorteo } from "@/lib/admin-descarga";

const LIME = "#B8E351";
const WEB = "#1d4ed8";
const FISICO = "#b45309";
const WEB_FONDO = "#dbeafe";
const FISICO_FONDO = "#fde7c2";
const MAPA_3 = Array.from({ length: 1000 }, (_, i) => String(i).padStart(3, "0"));

function formatFecha(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
}

function FichaNumero({ numero, info, canal, precio, sorteo, onAsignar, onReenviar, onAnular, busy, bendecido }) {
  const color = canal === "web" ? WEB : FISICO;
  const [asignar, setAsignar] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    cedula: "",
    email: "",
    monto: precio ? String(precio) : "",
  });
  if (!info) {
    return (
      <div className="bg-zinc-900 rounded-xl p-5" style={{ border: "1px solid rgba(63,63,70,1)" }}>
        <p className="text-3xl font-black font-mono text-white">{numero}</p>
        <p className="text-sm mt-2" style={{ color }}>
          Libre · {canal === "web" ? "rango web" : "rango físico"}
        </p>
        {bendecido ? (
          <p className="text-sm font-bold mt-1" style={{ color: LIME }}>
            Número bendecido · si se vende gana $1.000.000
          </p>
        ) : null}
        <p className="text-sm text-zinc-500 mt-2">Nadie tiene este número en este sorteo.</p>
        {asignar ? (
          <form
            className="grid gap-2 mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              onAsignar({ ...form, numero });
            }}
          >
            <input
              required
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Nombre"
              className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-sm"
            />
            <input
              required
              value={form.telefono}
              onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              placeholder="Teléfono"
              inputMode="tel"
              className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-sm"
            />
            <input
              required
              value={form.cedula}
              onChange={(e) => setForm((f) => ({ ...f, cedula: e.target.value }))}
              placeholder="Cédula"
              className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-sm"
            />
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="Correo, si tiene"
              className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-sm"
            />
            <label className="grid gap-1 text-xs font-semibold text-zinc-500">
              Cuánto pagó
              <input
                value={form.monto}
                onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value.replace(/\D/g, "") }))}
                placeholder="0"
                aria-label="Cuánto pagó"
                inputMode="numeric"
                className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-sm font-normal"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="px-3 py-2 rounded-lg text-sm font-bold"
                style={{ background: LIME, color: "#161814", opacity: busy ? 0.6 : 1 }}
              >
                {busy ? "Asignando…" : "Asignar"}
              </button>
              <button
                type="button"
                className="px-3 py-2 rounded-lg text-sm font-semibold border border-zinc-600 text-zinc-200"
                onClick={() => setAsignar(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            className="mt-4 px-3 py-2 rounded-lg text-sm font-bold"
            style={{ background: LIME, color: "#161814" }}
            onClick={() => setAsignar(true)}
          >
            Asignar este número
          </button>
        )}
      </div>
    );
  }
  const wa = linkWhatsappDeSorteo(sorteo, {
    telefono: info.telefono,
    nombre: info.nombre,
    numeros: info.todos,
    planNombre: info.planNombre,
  });
  return (
    <div className="bg-zinc-900 rounded-xl p-5" style={{ border: `1px solid ${LIME}55` }}>
      <p className="text-3xl font-black font-mono" style={{ color: "#161814" }}>
        {numero}
      </p>
      <p className="text-lg font-semibold text-white mt-2">{info.nombre}</p>
      {bendecido ? (
        <p className="text-sm font-bold mt-1" style={{ color: LIME }}>
          Número bendecido · ganador del $1.000.000
        </p>
      ) : null}
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
        Todos sus números en este sorteo:{" "}
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
            Enviar números por WhatsApp
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
  const [sorteos, setSorteos] = useState([]);
  const [sorteoId, setSorteoId] = useState("");
  const [numeros, setNumeros] = useState([]);
  const [rangos, setRangos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos");
  const [buscar, setBuscar] = useState("");
  const [seleccion, setSeleccion] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/sorteos", { headers: await getAdminAuthHeaders() });
        const data = await res.json().catch(() => ({}));
        if (!vivo) return;
        const lista = data.sorteos || [];
        setSorteos(lista);
        const elegido =
          lista.find((s) => s.es_principal) ||
          lista[0];
        setSorteoId(elegido?.id || "");
      } catch {
        if (vivo) setSorteos([]);
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const cargar = useCallback(async () => {
    if (!sorteoId) {
      setNumeros([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/numeros?sorteo=${sorteoId}`, {
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
  }, [sorteoId, addToast]);

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

  const ancho = Math.max(rangos?.fisico?.max ?? 0, rangos?.web?.max ?? 0) > 999 ? 4 : 3;
  const mapaCompleto = ancho === 3;

  const resumen = useMemo(() => {
    const total = (lado) => (lado ? lado.max - lado.min + 1 : 0);
    const r = {
      web: { v: 0, t: mapaCompleto ? 0 : total(rangos?.web) },
      fisico: { v: 0, t: mapaCompleto ? 0 : total(rangos?.fisico) },
    };
    if (mapaCompleto) {
      for (const num of MAPA_3) {
        const c = canalDe(num);
        r[c].t += 1;
        if (porNumero[num]) r[c].v += 1;
      }
      return r;
    }
    for (const n of numeros) {
      if (n.canal === "web" || n.canal === "fisico") r[n.canal].v += 1;
    }
    return r;
  }, [porNumero, canalDe, mapaCompleto, rangos, numeros]);

  const visibles = useMemo(() => {
    const base = mapaCompleto ? MAPA_3 : numeros.map((n) => n.numero);
    const lista = base.filter((num) => {
      if (filtro === "todos") return true;
      if (filtro === "vendidos") return Boolean(porNumero[num]);
      if (filtro === "libres") return mapaCompleto && !porNumero[num];
      return canalDe(num) === filtro;
    });
    if (!mapaCompleto && seleccion && !lista.includes(seleccion) && !porNumero[seleccion]) {
      if (filtro === "todos" || filtro === "libres" || canalDe(seleccion) === filtro) {
        lista.unshift(seleccion);
      }
    }
    return lista;
  }, [mapaCompleto, numeros, filtro, porNumero, canalDe, seleccion]);

  function consultar(e) {
    e.preventDefault();
    const digits = buscar.replace(/\D/g, "");
    if (!digits) return;
    setSeleccion(formatearNumero(digits, ancho));
  }

  const precioUno = useMemo(() => {
    const sorteo = sorteos.find((s) => s.id === sorteoId);
    const planes = (sorteo?.planes || []).filter((p) => p.activo !== false);
    const uno = planes.find((p) => Number(p.claves) === 1) || planes[0];
    if (!uno) return 20000;
    const claves = Math.max(1, Number(uno.claves) || 1);
    return Math.round(Number(uno.precio_cop) / claves) || 20000;
  }, [sorteos, sorteoId]);

  async function asignar(datos) {
    if (!sorteoId) {
      addToast("Elige el sorteo.", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/venta-fisica", {
        method: "POST",
        headers: { ...(await getAdminAuthHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: "varios",
          sorteoId,
          monto: datos.monto,
          nombre: datos.nombre.trim(),
          telefono: datos.telefono.trim(),
          cedula: datos.cedula.trim(),
          email: datos.email.trim() || undefined,
          claves: datos.numero,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo asignar");
      addToast(`${datos.numero} quedó asignado a ${data.miembro?.nombre || datos.nombre}.`, "success");
      await cargar();
    } catch (err) {
      addToast(err.message || "No se pudo asignar", "error");
    } finally {
      setBusy(false);
    }
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
      const nombre = (sorteos.find((s) => s.id === sorteoId)?.slug || "sorteo").slice(0, 40);
      await descargarArchivoAdmin(
        `/api/admin/exportar?tipo=${tipo}&sorteo=${sorteoId}`,
        `club-gomez-${tipo}-${nombre}.csv`
      );
    } catch (err) {
      addToast(err.message || "No se pudo descargar", "error");
    }
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Números</h1>
      <p className="text-sm text-zinc-500 mb-6">
        {mapaCompleto
          ? "Mapa del 000 al 999 de este sorteo, web y físico. Toca un vendido para enviarle los números por WhatsApp, o un libre para asignarlo. El texto es el de Correos."
          : `Este sorteo tiene ${resumen.fisico.t + resumen.web.t} números: en persona del ${formatearNumero(rangos?.fisico?.min ?? 0, 4)} al ${formatearNumero(rangos?.fisico?.max ?? 0, 4)} y en la página del ${formatearNumero(rangos?.web?.min ?? 0, 4)} al ${formatearNumero(rangos?.web?.max ?? 0, 4)}. Busca un número para verlo o asignarlo.`}
      </p>

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <label className="grid gap-1.5 min-w-[260px]">
          <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Sorteo
          </span>
          <select
            value={sorteoId}
            onChange={(e) => {
              setSorteoId(e.target.value);
              setSeleccion(null);
            }}
            className="px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white"
          >
            {sorteos.length === 0 ? <option value="">Sin sorteos</option> : null}
            {sorteos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre || s.premio}
                {s.es_principal ? " · en la página de inicio" : ""}
              </option>
            ))}
          </select>
        </label>
        <form onSubmit={consultar} className="flex items-end gap-2">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Consultar número / ganador
            </span>
            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value.replace(/\D/g, "").slice(0, ancho))}
              placeholder={ancho === 4 ? "Ej. 6001" : "Ej. 709"}
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
                ["fisico", `Físico del ${formatearNumero(rangos?.fisico?.min ?? 0, ancho)} al ${formatearNumero(rangos?.fisico?.max ?? 0, ancho)}`],
                ["web", `Virtual del ${formatearNumero(rangos?.web?.min ?? 0, ancho)} al ${formatearNumero(rangos?.web?.max ?? 0, ancho)}`],
                ["vendidos", "Vendidos"],
                ["libres", "Libres"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFiltro(id)}
                  className="px-3 py-1.5 rounded-lg border"
                  style={{
                    background: filtro === id ? LIME : "#fff",
                    borderColor: filtro === id ? LIME : "rgba(22,24,20,0.12)",
                    color: "#161814",
                    fontWeight: filtro === id ? 700 : 500,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mb-3 text-xs text-zinc-500">
              <span>
                <span className="inline-block w-3 h-3 rounded-sm mr-1 align-middle" style={{ background: WEB }} />
                Virtual vendido
              </span>
              <span>
                <span className="inline-block w-3 h-3 rounded-sm mr-1 align-middle" style={{ background: FISICO }} />
                Físico vendido
              </span>
              <span>
                <span
                  className="inline-block w-3 h-3 rounded-sm mr-1 align-middle"
                  style={{ background: FISICO_FONDO, boxShadow: "inset 0 0 0 1px rgba(22,24,20,0.12)" }}
                />
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
                      background: vendido
                        ? color
                        : c === "web"
                          ? WEB_FONDO
                          : FISICO_FONDO,
                      color: vendido ? "#fff" : "#161814",
                      border: sel
                        ? `2px solid ${LIME}`
                        : "1px solid transparent",
                      fontWeight: 700,
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
                key={seleccion}
                numero={seleccion}
                info={porNumero[seleccion]}
                canal={canalDe(seleccion)}
                precio={precioUno}
                sorteo={sorteos.find((s) => s.id === sorteoId) || null}
                onAsignar={asignar}
                onReenviar={reenviar}
                onAnular={anular}
                busy={busy}
                bendecido={
                  (sorteos.find((s) => s.id === sorteoId)?.slug === "navidad") &&
                  esNumeroBendecido(seleccion)
                }
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
