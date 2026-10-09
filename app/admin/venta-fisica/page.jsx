"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getAdminAuthHeaders } from "@/lib/auth";
import { useToast } from "@/components/admin/Toast";
import { usePlanes } from "@/lib/club-gomez/use-planes";
import { linkWhatsappNumeros } from "@/lib/admin-descarga";
import DateOfBirthSelect from "@/components/club-gomez/DateOfBirthSelect";

const LIME = "#B8E351";
const INPUT = "px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white";

function cop(n) {
  return "$" + Number(n || 0).toLocaleString("es-CO");
}

function hora(d) {
  return new Date(d).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
}

export default function VentaFisicaPage() {
  const { addToast } = useToast();
  const planesMap = usePlanes();
  const PLANES = Object.values(planesMap);
  const [inventario, setInventario] = useState(null);
  const [caja, setCaja] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [sugiriendo, setSugiriendo] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [form, setForm] = useState({
    planId: "esencial",
    nombre: "",
    telefono: "",
    email: "",
    cedula: "",
    ciudad: "",
    fecha_nacimiento: "",
    clavesTexto: "",
  });

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/venta-fisica", {
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
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  const plan = planesMap[form.planId] || planesMap.esencial;
  const fisico = inventario?.fisico;

  async function sugerir() {
    setSugiriendo(true);
    try {
      const res = await fetch(`/api/admin/venta-fisica?sugerir=${plan.claves}`, {
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
    if (!form.nombre.trim() || !form.telefono.trim() || !form.cedula.trim()) {
      addToast("Nombre, teléfono y cédula son obligatorios.", "error");
      return;
    }
    if (!form.clavesTexto.trim()) {
      addToast("Ingresa los números que le entregaste (000–700).", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/venta-fisica", {
        method: "POST",
        headers: { ...(await getAdminAuthHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: form.planId,
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
    ? linkWhatsappNumeros({
        telefono: resultado.miembro?.telefono,
        nombre: resultado.miembro?.nombre,
        numeros: resultado.claves,
        planNombre: resultado.plan?.nombre,
      })
    : null;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Venta física</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Daniel entrega números del <strong className="text-zinc-300">000 al 700</strong>.
        La web reparte del <strong className="text-zinc-300">701 al 999</strong>. Obligatorio:
        nombre, teléfono y los números entregados.
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
          <p className="admin-stat__title">Físico este mes</p>
          <p className="admin-stat__value">{caja ? cop(caja.mesTotal) : "—"}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {caja ? `${caja.mesVentas} venta${caja.mesVentas === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat__title">Números físicos</p>
          <p className="admin-stat__value">
            {fisico ? `${fisico.libres} libres` : "—"}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {fisico ? `${fisico.emitidas} usados de ${fisico.total}` : ""}{" "}
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
            <select name="planId" value={form.planId} onChange={onChange} className={INPUT}>
              {PLANES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} · ${p.precioLabel} · {p.claves} oport.
                </option>
              ))}
            </select>
          </label>

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
                Números entregados * ({plan.claves} del plan {plan.nombre}, 000–700)
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
              placeholder={`Ej: ${Array.from({ length: plan.claves }, (_, i) =>
                String(i + 1).padStart(3, "0")
              ).join(" ")}`}
              className={`${INPUT} font-mono`}
            />
            <span className="text-xs text-zinc-600">
              Escribe los que imprimiste o usa “Sugerir” para que el sistema proponga
              libres. Deben ser exactamente {plan.claves}. Se revisan antes de guardar.
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
            : `Registrar venta · ${plan.claves} número${plan.claves === 1 ? "" : "s"} · $${plan.precioLabel}`}
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

      <p className="admin-section-label">Ventas físicas del mes</p>
      <div className="admin-panel">
        {ventas.length === 0 ? (
          <div className="admin-empty">Aún no hay ventas físicas este mes.</div>
        ) : (
          ventas.map((v) => {
            const anulada = v.estado === "anulado";
            const wa = linkWhatsappNumeros({
              telefono: v.telefono,
              nombre: v.nombre,
              numeros: v.numeros,
              planNombre: planesMap[v.planId]?.nombre,
            });
            return (
              <div key={v.id} className="admin-member-row" style={anulada ? { opacity: 0.5 } : undefined}>
                <div className="min-w-0">
                  <div className="admin-member-row__name">
                    {v.nombre}
                    {anulada ? " · ANULADA" : ""}
                  </div>
                  <div className="admin-member-row__email">
                    {planesMap[v.planId]?.nombre || v.planId} · {v.telefono}
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
