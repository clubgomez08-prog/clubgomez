"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getAdminAuthHeaders } from "@/lib/auth";
import { useToast } from "@/components/admin/Toast";
import { PLANES_MEMBRESIA } from "@/lib/club-gomez/planes";
import DateOfBirthSelect from "@/components/club-gomez/DateOfBirthSelect";

const LIME = "#B8E351";
const PLANES = Object.values(PLANES_MEMBRESIA);

export default function VentaFisicaPage() {
  const { addToast } = useToast();
  const [inventario, setInventario] = useState(null);
  const [submitting, setSubmitting] = useState(false);
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

  const cargarInventario = useCallback(async () => {
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/venta-fisica", { headers });
      const data = await res.json();
      if (res.ok) setInventario(data.inventario || null);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    cargarInventario();
  }, [cargarInventario]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setResultado(null);
    if (!form.nombre.trim() || !form.telefono.trim()) {
      addToast("Nombre y teléfono son obligatorios.", "error");
      return;
    }
    if (!form.clavesTexto.trim()) {
      addToast("Ingresa las claves impresas que le entregaste (6001–9999).", "error");
      return;
    }
    setSubmitting(true);
    try {
      const headers = {
        ...(await getAdminAuthHeaders()),
        "Content-Type": "application/json",
      };
      const res = await fetch("/api/admin/venta-fisica", {
        method: "POST",
        headers,
        body: JSON.stringify({
          planId: form.planId,
          nombre: form.nombre.trim(),
          telefono: form.telefono.trim(),
          email: form.email.trim() || undefined,
          cedula: form.cedula.trim() || undefined,
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
          ? `Activada. ${data.claves?.length || 0} claves (correo enviado).`
          : `Activada. ${data.claves?.length || 0} claves del pool físico.`,
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
      await cargarInventario();
    } catch {
      addToast("Error de conexión.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const plan = PLANES_MEMBRESIA[form.planId] || PLANES_MEMBRESIA.esencial;
  const fisico = inventario?.fisico;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Venta física</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Daniel imprime las claves <strong className="text-zinc-300">6001–9999</strong>{" "}
        y las entrega en persona. Aquí registras al cliente e <strong className="text-zinc-300">ingresas esas claves</strong>.
        Obligatorio: nombre, teléfono y las claves. La web solo usa 0000–6000.
      </p>

      {fisico ? (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-sm"
          style={{
            background: "rgba(184,227,81,0.08)",
            border: "1px solid rgba(184,227,81,0.22)",
            color: "#d4f06a",
          }}
        >
          Pool físico {inventario.periodo}: {fisico.emitidas} usadas ·{" "}
          {fisico.libres} libres de {fisico.total}
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="bg-zinc-900 rounded-xl p-5 mb-6"
        style={{ border: "1px solid rgba(184,227,81,0.2)" }}
      >
        <p className="text-xs font-semibold tracking-wide text-zinc-500 mb-4">
          NUEVO CLIENTE FÍSICO
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm text-zinc-400 sm:col-span-2">
            Plan
            <select
              name="planId"
              value={form.planId}
              onChange={onChange}
              className="px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white"
            >
              {PLANES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} · ${p.precioLabel} · {p.claves} claves
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
              className="px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white"
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
              className="px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white"
            />
          </label>

          <label className="grid gap-1 text-sm text-zinc-400">
            Email (opcional)
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="Si lo tiene, se envían las claves"
              className="px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white"
            />
          </label>

          <label className="grid gap-1 text-sm text-zinc-400">
            Cédula (opcional)
            <input
              name="cedula"
              value={form.cedula}
              onChange={onChange}
              placeholder="Documento"
              className="px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white"
            />
          </label>

          <label className="grid gap-1 text-sm text-zinc-400">
            Ciudad (opcional)
            <input
              name="ciudad"
              value={form.ciudad}
              onChange={onChange}
              placeholder="Cúcuta"
              className="px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white"
            />
          </label>

          <label className="grid gap-1 text-sm text-zinc-400 sm:col-span-2">
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

          <label className="grid gap-1 text-sm text-zinc-400 sm:col-span-2">
            Claves impresas * ({plan.claves} del plan {plan.nombre}, rango 6001–9999)
            <textarea
              required
              name="clavesTexto"
              value={form.clavesTexto}
              onChange={onChange}
              rows={3}
              placeholder={
                plan.claves === 3
                  ? "Ej: 6001 6002 6003"
                  : plan.claves === 7
                    ? "Ej: 6101, 6102, 6103, 6104, 6105, 6106, 6107"
                    : "Escribe las claves separadas por espacio o coma"
              }
              className="px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white font-mono"
            />
            <span className="text-xs text-zinc-600">
              Deben ser exactamente {plan.claves} claves. Si ya están usadas este mes, el sistema avisa.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-lg py-3 text-sm font-bold disabled:opacity-60"
          style={{ background: LIME, color: "#050607" }}
        >
          {submitting
            ? "Registrando…"
            : `Registrar cliente · ${plan.claves} claves impresas`}
        </button>
      </form>

      {resultado ? (
        <section
          className="rounded-xl p-5"
          style={{
            background: "#111",
            border: "1px solid rgba(184,227,81,0.28)",
          }}
        >
          <p className="text-xs text-zinc-500 mb-1">Cliente registrado</p>
          <p className="text-lg font-semibold text-white mb-1">
            {resultado.miembro?.nombre}
          </p>
          <p className="text-sm text-zinc-400 mb-4">
            {resultado.miembro?.telefono}
            {resultado.plan?.nombre ? ` · ${resultado.plan.nombre}` : ""}
            {resultado.emailOk ? " · correo enviado" : " · sin correo"}
          </p>
          <p className="text-xs text-zinc-500 mb-2">
            Claves ({resultado.claves?.length || 0})
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
          <Link
            href="/admin/miembros"
            className="text-sm font-semibold"
            style={{ color: LIME }}
          >
            Ver en Clientes →
          </Link>
        </section>
      ) : null}
    </div>
  );
}
