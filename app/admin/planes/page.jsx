"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminAuthHeaders } from "@/lib/auth";
import { useToast } from "@/components/admin/Toast";

const LIME = "#B8E351";
const INPUT = "px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white w-full";

function soloDigitos(v) {
  return String(v ?? "").replace(/\D/g, "");
}

function aForm(p) {
  return {
    id: p.id,
    nombre: p.nombre,
    precio: String(p.precio),
    precioAntes: soloDigitos(p.precioAntes),
    claves: String(p.claves),
    tag: p.tag || "",
    equiv: p.equiv || "",
  };
}

function TarjetaPlan({ plan, ventasMes, onGuardado }) {
  const { addToast } = useToast();
  const [form, setForm] = useState(aForm(plan));
  const [guardando, setGuardando] = useState(false);
  const set = (k, digits = false) => (e) =>
    setForm((f) => ({ ...f, [k]: digits ? soloDigitos(e.target.value) : e.target.value }));

  const original = aForm(plan);
  const cambioPrecio = form.precio !== original.precio;
  const cambioClaves = form.claves !== original.claves;
  const hayCambios = JSON.stringify(form) !== JSON.stringify(original);

  async function guardar() {
    const avisos = [];
    if (cambioPrecio) {
      avisos.push(
        `Precio: $${Number(original.precio).toLocaleString("es-CO")} → $${Number(form.precio || 0).toLocaleString("es-CO")}`
      );
    }
    if (cambioClaves) avisos.push(`Oportunidades: ${original.claves} → ${form.claves}`);
    const texto =
      (avisos.length ? avisos.join("\n") + "\n\n" : "") +
      (ventasMes > 0
        ? `Este mes ya hay ${ventasMes} venta(s) del plan ${plan.nombre}. Esas ventas NO cambian: conservan lo que pagaron y sus números.\n\n`
        : "") +
      "El cambio se verá en la página y en Bold en menos de un minuto. ¿Guardar?";
    if (!confirm(texto)) return;

    setGuardando(true);
    try {
      const res = await fetch("/api/admin/planes", {
        method: "PUT",
        headers: { ...(await getAdminAuthHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      addToast(`Plan ${data.plan.nombre} guardado`, "success");
      onGuardado();
    } catch (err) {
      addToast(err.message || "Error al guardar", "error");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section
      className="bg-zinc-900 rounded-xl p-5"
      style={{ border: `1px solid ${hayCambios ? LIME : "rgba(184,227,81,0.2)"}` }}
    >
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <p className="text-lg font-semibold text-white">{plan.nombre}</p>
        <span className="text-xs text-zinc-500">
          {ventasMes || 0} venta{ventasMes === 1 ? "" : "s"} este mes
        </span>
      </div>
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm text-zinc-400">
          Nombre
          <input value={form.nombre} onChange={set("nombre")} className={INPUT} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm text-zinc-400">
            Precio (COP)
            <input
              value={form.precio}
              onChange={set("precio", true)}
              inputMode="numeric"
              className={INPUT}
              style={cambioPrecio ? { borderColor: LIME } : undefined}
            />
          </label>
          <label className="grid gap-1 text-sm text-zinc-400">
            Precio tachado
            <input
              value={form.precioAntes}
              onChange={set("precioAntes", true)}
              inputMode="numeric"
              className={INPUT}
            />
          </label>
        </div>
        <label className="grid gap-1 text-sm text-zinc-400">
          Oportunidades (números por compra)
          <input
            value={form.claves}
            onChange={set("claves", true)}
            inputMode="numeric"
            className={INPUT}
            style={cambioClaves ? { borderColor: LIME } : undefined}
          />
        </label>
        <label className="grid gap-1 text-sm text-zinc-400">
          Frase corta
          <input value={form.tag} onChange={set("tag")} className={INPUT} />
        </label>
        <label className="grid gap-1 text-sm text-zinc-400">
          Texto bajo el precio
          <input value={form.equiv} onChange={set("equiv")} className={INPUT} />
        </label>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          disabled={!hayCambios || guardando}
          onClick={guardar}
          className="px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-40"
          style={{ background: LIME, color: "#050607" }}
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        {hayCambios ? (
          <button
            type="button"
            onClick={() => setForm(original)}
            className="px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white"
          >
            Deshacer
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default function PlanesPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/planes", { headers: await getAdminAuthHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al cargar");
      setData(json);
      setVersion((v) => v + 1);
    } catch (err) {
      setError(err.message || "Error al cargar");
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Planes</h1>
      <p className="text-sm text-zinc-500 mb-4">
        Precio y oportunidades de cada plan. Aplica a la página, al cobro en Bold y
        a la venta física.
      </p>
      <div
        className="rounded-xl px-4 py-3 mb-6 text-sm grid gap-1"
        style={{
          background: "rgba(96,165,250,0.08)",
          border: "1px solid rgba(96,165,250,0.3)",
          color: "#bfdbfe",
        }}
      >
        <span>• Las ventas ya hechas no cambian: cada persona conserva lo que pagó y sus números.</span>
        <span>• Quien ya abrió Bold antes del cambio recibe las oportunidades que vio al pagar.</span>
        <span>• Los rangos de números (web 701–999, físico 000–700) no cambian aquí.</span>
      </div>

      {error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : !data ? (
        <div className="flex justify-center py-10">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: LIME, borderTopColor: "transparent" }}
          />
        </div>
      ) : (
        <>
          {data.faltaMigracion ? (
            <p className="text-sm text-amber-300 mb-4">
              Falta correr la migración 019_historial_planes_editables.sql en Supabase
              para poder guardar cambios.
            </p>
          ) : null}
          <div className="grid gap-4 md:grid-cols-3">
            {data.planes.map((p) => (
              <TarjetaPlan
                key={`${p.id}-${version}`}
                plan={p}
                ventasMes={data.ventasMes?.[p.id] || 0}
                onGuardado={cargar}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
