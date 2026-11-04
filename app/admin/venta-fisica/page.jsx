"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getAdminAuthHeaders } from "@/lib/auth";
import { useToast } from "@/components/admin/Toast";
import { linkWhatsappDeSorteo } from "@/lib/admin-descarga";
import DateOfBirthSelect from "@/components/club-gomez/DateOfBirthSelect";

const LIME = "#B8E351";
const INPUT = "px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white";

function cop(n) {
  return "$" + Number(n || 0).toLocaleString("es-CO");
}

function hora(d) {
  return new Date(d).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
}

function pad3(n) {
  return String(n).padStart(3, "0");
}

function planesActivos(sorteo) {
  return (sorteo?.planes || []).filter((p) => p.activo !== false);
}

export default function VentaFisicaPage() {
  const { addToast } = useToast();
  const [inventario, setInventario] = useState(null);
  const [caja, setCaja] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [sugiriendo, setSugiriendo] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [sorteos, setSorteos] = useState([]);
  const [sorteoId, setSorteoId] = useState("");
  const [form, setForm] = useState({
    planId: "varios",
    cantidadLibre: "",
    monto: "",
    nombre: "",
    telefono: "",
    email: "",
    cedula: "",
    ciudad: "",
    fecha_nacimiento: "",
    clavesTexto: "",
  });

  const cargar = useCallback(async () => {
    if (!sorteoId) return;
    try {
      const res = await fetch(`/api/admin/venta-fisica?sorteo=${sorteoId}`, {
        headers: await getAdminAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setInventario(data.inventario || null);
        setCaja(data.caja || null);
        setVentas(data.ventas || []);
      }
    } catch {
      /* ignore */
    }
  }, [sorteoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/sorteos", { headers: await getAdminAuthHeaders() });
        const data = await res.json().catch(() => ({}));
        if (!vivo || !res.ok) return;
        const lista = data.sorteos || [];
        setSorteos(lista);
        const elegido =
          lista.find((s) => s.trabajando) ||
          lista.find((s) => s.es_principal) ||
          lista[0];
        if (!elegido) return;
        const primero = planesActivos(elegido)[0];
        setSorteoId(elegido.id);
        setForm((f) => ({ ...f, planId: primero?.id || "varios", clavesTexto: "" }));
      } catch {
        if (vivo) setSorteos([]);
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  function sorteoDe(id) {
    if (!id) return null;
    return sorteos.find((s) => s.id === id) || null;
  }

  function elegirSorteo(id) {
    const s = sorteos.find((x) => x.id === id);
    const primero = planesActivos(s)[0];
    setSorteoId(id);
    setResultado(null);
    setForm((f) => ({
      ...f,
      planId: primero?.id || "varios",
      clavesTexto: "",
      cantidadLibre: "",
      monto: "",
    }));
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "planId" ? { clavesTexto: "" } : {}),
    }));
  }

  const sorteo = sorteoDe(sorteoId);
  const planes = planesActivos(sorteo);
  const varios = form.planId === "varios";
  const fila = planes.find((p) => p.id === form.planId) || null;
  const plan = fila
    ? {
        id: fila.id,
        nombre: fila.nombre,
        precio: Number(fila.precio_cop) || 0,
        claves: Number(fila.claves) || 1,
      }
    : { id: "varios", nombre: "Varios números", precio: 0, claves: 1 };
  const numerosEscritos = form.clavesTexto
    .split(/[\s,;]+/)
    .map((n) => n.trim())
    .filter(Boolean);
  const cantidadPedida = Math.min(
    100,
    Math.max(0, Number(String(form.cantidadLibre).replace(/\D/g, "")) || 0)
  );
  const cantidad = varios ? numerosEscritos.length : plan.claves;
  const cantidadVisible = varios ? numerosEscritos.length || cantidadPedida : plan.claves;
  const uno = planes.find((p) => Number(p.claves) === 1) || planes[0];
  const valorUnitario = uno
    ? Math.round((Number(uno.precio_cop) || 0) / Math.max(1, Number(uno.claves) || 1)) || 20000
    : 20000;
  const rangoMin = Number.isFinite(Number(sorteo?.fisico_min)) ? Number(sorteo.fisico_min) : 0;
  const rangoMax = Number.isFinite(Number(sorteo?.fisico_max)) ? Number(sorteo.fisico_max) : 700;
  const webMin = Number.isFinite(Number(sorteo?.web_min)) ? Number(sorteo.web_min) : 701;
  const webMax = Number.isFinite(Number(sorteo?.web_max)) ? Number(sorteo.web_max) : 999;
  const textoRango = `${pad3(rangoMin)} al ${pad3(rangoMax)}`;
  const montoSugerido = varios
    ? valorUnitario * Math.max(cantidadVisible, 1)
    : plan.precio;
  const montoCobrado = varios
    ? (form.monto === "" ? montoSugerido : Number(String(form.monto).replace(/\D/g, "")) || 0)
    : plan.precio;
  const fisico = inventario?.fisico;

  async function sugerir() {
    setSugiriendo(true);
    try {
      const cuanto = varios
        ? Math.min(100, Math.max(1, numerosEscritos.length || cantidadPedida || 1))
        : plan.claves;
      const res = await fetch(`/api/admin/venta-fisica?sugerir=${cuanto}&sorteo=${sorteoId}`, {
        headers: await getAdminAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo sugerir");
      setForm((f) => ({ ...f, clavesTexto: (data.numeros || []).join(" ") }));
    } catch (err) {
      addToast(err.message || "Error", "error");
    } finally {
      setSugiriendo(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setResultado(null);
    if (!sorteoId) {
      addToast("Elige el sorteo.", "error");
      return;
    }
    if (!form.nombre.trim() || !form.telefono.trim() || !form.cedula.trim()) {
      addToast("Nombre, teléfono y cédula son obligatorios.", "error");
      return;
    }
    if (!form.clavesTexto.trim()) {
      addToast(`Ingresa los números que le entregaste (${textoRango}).`, "error");
      return;
    }
    if (!varios && numerosEscritos.length !== plan.claves) {
      addToast(`El plan ${plan.nombre} lleva exactamente ${plan.claves} número(s).`, "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/venta-fisica", {
        method: "POST",
        headers: { ...(await getAdminAuthHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: varios ? "varios" : plan.id,
          sorteoId,
          soloFisico: true,
          monto: varios ? montoCobrado : undefined,
          nombre: form.nombre.trim(),
          telefono: form.telefono.trim(),
          email: form.email.trim() || undefined,
          cedula: form.cedula.trim(),
          ciudad: form.ciudad.trim() || undefined,
          fecha_nacimiento: form.fecha_nacimiento || undefined,
          claves: form.clavesTexto,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        addToast(data.error || "No se pudo registrar.", "error");
        return;
      }
      setResultado(data);
      addToast(
        data.emailOk
          ? `Venta registrada. ${data.claves?.length || 0} números (correo enviado).`
          : `Venta registrada. ${data.claves?.length || 0} números.`,
        "success"
      );
      setForm((prev) => ({
        ...prev,
        monto: "",
        nombre: "",
        telefono: "",
        email: "",
        cedula: "",
        ciudad: "",
        fecha_nacimiento: "",
        clavesTexto: "",
      }));
      await cargar();
    } catch {
      addToast("Error de conexión.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function anular(v) {
    const motivo = prompt(
      `Anular la venta de ${v.nombre} (números ${v.numeros.join(", ")}).\n` +
        "Los números quedan libres otra vez. Escribe el motivo:"
    );
    if (motivo === null) return;
    if (!motivo.trim()) {
      addToast("Escribe un motivo para anular.", "error");
      return;
    }
    setBusyId(v.id);
    try {
      const res = await fetch("/api/admin/anular-venta", {
        method: "POST",
        headers: { ...(await getAdminAuthHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ membresiaId: v.membresiaId, motivo: motivo.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo anular");
      addToast(`Venta anulada. Liberados: ${(data.liberados || []).join(", ")}`, "success");
      await cargar();
    } catch (err) {
      addToast(err.message || "Error", "error");
    } finally {
      setBusyId(null);
    }
  }

  const waResultado = resultado
    ? linkWhatsappDeSorteo(sorteoDe(resultado.sorteoId), {
        telefono: resultado.miembro?.telefono,
        nombre: resultado.miembro?.nombre,
        numeros: resultado.claves,
        planNombre: resultado.plan?.nombre,
      })
    : null;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Venta física</h1>
      <label className="grid gap-1 text-sm text-zinc-400 mb-3 max-w-xl">
        Sorteo
        <select
          value={sorteoId}
          onChange={(e) => elegirSorteo(e.target.value)}
          className={INPUT}
        >
          {sorteos.length === 0 ? <option value="">Sin sorteos</option> : null}
          {sorteos.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre || s.premio}
              {s.trabajando ? " · cobrando aquí" : ""}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm text-zinc-500 mb-6">
        Boletería física de este sorteo: del <strong className="text-zinc-300">{textoRango}</strong>.
        La web reparte del <strong className="text-zinc-300">{pad3(webMin)} al {pad3(webMax)}</strong>.
        Los planes son los de este sorteo.
      </p>

      <div
        className="grid gap-3 mb-6"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}
      >
        <div className="admin-stat">
          <p className="admin-stat__title">Caja de hoy</p>
          <p className="admin-stat__value">{caja ? cop(caja.hoyTotal) : "—"}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {caja ? `${caja.hoyVentas} venta${caja.hoyVentas === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat__title">De este sorteo</p>
          <p className="admin-stat__value">{caja ? cop(caja.sorteoTotal) : "—"}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {caja ? `${caja.sorteoVentas} venta${caja.sorteoVentas === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat__title">Números físicos</p>
          <p className="admin-stat__value">
            {fisico ? `${fisico.libres} libres` : "—"}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {fisico
              ? `${fisico.emitidas} usado${fisico.emitidas === 1 ? "" : "s"} de ${fisico.total}`
              : ""}{" "}
            <Link href="/admin/numeros" style={{ color: LIME }}>
              Ver mapa →
            </Link>
          </p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="bg-zinc-900 rounded-xl p-5 mb-6"
        style={{ border: "1px solid rgba(184,227,81,0.2)" }}
      >
        <p className="text-xs font-semibold tracking-wide text-zinc-500 mb-4">
          NUEVA VENTA FÍSICA
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm text-zinc-400 sm:col-span-2">
            Plan
            <select name="planId" value={varios ? "varios" : plan.id} onChange={onChange} className={INPUT}>
              {planes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} · ${Number(p.precio_cop || 0).toLocaleString("es-CO")} · {p.claves} oport.
                </option>
              ))}
              <option value="varios">Varios números · la cantidad que entregues</option>
            </select>
          </label>

          {varios ? (
            <>
              <label className="grid gap-1 text-sm text-zinc-400">
                Cantidad de números
                <input
                  name="cantidadLibre"
                  value={form.cantidadLibre}
                  onChange={onChange}
                  inputMode="numeric"
                  placeholder="Ej: 7"
                  className={INPUT}
                />
              </label>
              <label className="grid gap-1 text-sm text-zinc-400">
                Valor cobrado
                <input
                  name="monto"
                  value={form.monto}
                  onChange={onChange}
                  inputMode="numeric"
                  placeholder={`Vacío: ${cop(montoSugerido)} (${cop(valorUnitario)} c/u)`}
                  className={INPUT}
                />
              </label>
            </>
          ) : null}

          <label className="grid gap-1 text-sm text-zinc-400">
            Nombre completo *
            <input
              required
              name="nombre"
              value={form.nombre}
              onChange={onChange}
              placeholder="Nombre del cliente"
              className={INPUT}
            />
          </label>

          <label className="grid gap-1 text-sm text-zinc-400">
            WhatsApp / teléfono *
            <input
              required
              name="telefono"
              value={form.telefono}
              onChange={onChange}
              placeholder="3001234567"
              inputMode="tel"
              className={INPUT}
            />
          </label>

          <label className="grid gap-1 text-sm text-zinc-400">
            Email (opcional)
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="Si lo tiene, se envían los números"
              className={INPUT}
            />
          </label>

          <label className="grid gap-1 text-sm text-zinc-400">
            Cédula *
            <input
              required
              name="cedula"
              value={form.cedula}
              onChange={onChange}
              placeholder="Para que pueda consultar sus números"
              inputMode="numeric"
              className={INPUT}
            />
          </label>

          <label className="grid gap-1 text-sm text-zinc-400">
            Ciudad (opcional)
            <input
              name="ciudad"
              value={form.ciudad}
              onChange={onChange}
              placeholder="Cúcuta"
              className={INPUT}
            />
          </label>

          <label className="grid gap-1 text-sm text-zinc-400">
            Cumpleaños (opcional)
            <DateOfBirthSelect
              name="fecha_nacimiento"
              value={form.fecha_nacimiento}
              onChange={onChange}
              selectStyle={{
                minHeight: 42,
                backgroundColor: "#09090b",
                border: "1px solid #3f3f46",
                borderRadius: 8,
                color: "#fff",
                fontSize: 14,
                padding: "10px 8px",
              }}
            />
          </label>

          <div className="grid gap-1 text-sm text-zinc-400 sm:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <span>
                {varios
                  ? `Números entregados * (los que quieras, del ${textoRango})`
                  : `Números entregados * (${plan.claves} del plan ${plan.nombre}, ${textoRango})`}
              </span>
              <button
                type="button"
                onClick={sugerir}
                disabled={sugiriendo}
                className="px-3 py-1 rounded-lg text-xs font-semibold border border-zinc-600 text-zinc-200 hover:bg-zinc-800"
              >
                {sugiriendo ? "…" : "Sugerir números libres"}
              </button>
            </div>
            <textarea
              required
              name="clavesTexto"
              value={form.clavesTexto}
              onChange={onChange}
              rows={2}
              placeholder={
                varios
                  ? "Ej: 012 045 188 320"
                  : `Ej: ${Array.from({ length: plan.claves }, (_, i) =>
                      String(i + 1).padStart(3, "0")
                    ).join(" ")}`
              }
              className={`${INPUT} font-mono`}
            />
            <span className="text-xs text-zinc-600">
              {varios
                ? "Escribe la cantidad y pulsa Sugerir, o pega los números que ya imprimiste. Pueden ser 2, 5, 10 o los que sean. Se revisan antes de guardar."
                : `Escribe los que imprimiste o usa “Sugerir”. Deben ser exactamente ${plan.claves}.`}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-lg py-3 text-sm font-bold disabled:opacity-60"
          style={{ background: LIME, color: "#050607" }}
        >
          {submitting
            ? "Registrando…"
            : `Registrar venta · ${cantidadVisible || 0} número${cantidadVisible === 1 ? "" : "s"} · ${cop(montoCobrado)}`}
        </button>
      </form>

      {resultado ? (
        <section
          className="rounded-xl p-5 mb-6"
          style={{ background: "#111", border: "1px solid rgba(184,227,81,0.28)" }}
        >
          <p className="text-xs text-zinc-500 mb-1">Venta registrada</p>
          <p className="text-lg font-semibold text-white mb-1">{resultado.miembro?.nombre}</p>
          <p className="text-sm text-zinc-400 mb-4">
            {resultado.miembro?.telefono}
            {resultado.plan?.nombre ? ` · ${resultado.plan.nombre}` : ""}
            {resultado.emailOk ? " · correo enviado" : " · sin correo"}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {(resultado.claves || []).map((c) => (
              <span
                key={c}
                className="px-2.5 py-1 rounded-md font-mono text-sm"
                style={{
                  background: "rgba(184,227,81,0.12)",
                  color: LIME,
                  border: "1px solid rgba(184,227,81,0.35)",
                }}
              >
                {c}
              </span>
            ))}
          </div>
          {waResultado ? (
            <a
              href={waResultado}
              target="_blank"
              rel="noreferrer"
              className="inline-block px-4 py-2 rounded-lg text-sm font-bold"
              style={{ background: "#22c55e", color: "#050607" }}
            >
              Enviar números por WhatsApp
            </a>
          ) : null}
        </section>
      ) : null}

      <p className="admin-section-label">Ventas físicas de este sorteo</p>
      <div className="admin-panel">
        {ventas.length === 0 ? (
          <div className="admin-empty">Este sorteo todavía no tiene ventas físicas.</div>
        ) : (
          ventas.map((v) => {
            const anulada = v.estado === "anulado";
            const nombrePlan =
              v.planId === "varios"
                ? "Varios números"
                : planes.find((p) => p.id === v.planId)?.nombre || "Plan";
            const wa = linkWhatsappDeSorteo(sorteoDe(v.sorteoId) || sorteo, {
              telefono: v.telefono,
              nombre: v.nombre,
              numeros: v.numeros,
              planNombre: nombrePlan,
            });
            return (
              <div key={v.id} className="admin-member-row" style={anulada ? { opacity: 0.5 } : undefined}>
                <div className="min-w-0">
                  <div className="admin-member-row__name">
                    {v.nombre}
                    {anulada ? " · ANULADA" : ""}
                  </div>
                  <div className="admin-member-row__email">
                    {nombrePlan} · {v.telefono}
                    {v.numeros.length ? (
                      <span className="font-mono"> · {v.numeros.join(" ")}</span>
                    ) : null}
                  </div>
                </div>
                <div className="admin-member-row__meta">
                  <span className="admin-chip">{cop(v.monto)}</span>
                  <div style={{ marginTop: 6 }}>{hora(v.fecha)}</div>
                  {!anulada ? (
                    <div className="flex gap-2 justify-end mt-2">
                      {wa ? (
                        <a href={wa} target="_blank" rel="noreferrer" className="text-xs" style={{ color: "#22c55e" }}>
                          WhatsApp
                        </a>
                      ) : null}
                      <button
                        type="button"
                        disabled={busyId === v.id}
                        onClick={() => anular(v)}
                        className="text-xs text-red-300"
                      >
                        {busyId === v.id ? "…" : "Anular"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
