"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminAuthHeaders } from "@/lib/auth";
import { useToast } from "@/components/admin/Toast";
import { CAMPANA_VACIA } from "@/lib/club-gomez/campanas";

const LIME = "#B8E351";
const INPUT =
  "px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white w-full";

function aForm(c) {
  const base = { ...CAMPANA_VACIA };
  if (!c) return base;
  for (const k of Object.keys(base)) {
    if (k === "fotos_destacado") base[k] = Array.isArray(c[k]) ? c[k] : [];
    else base[k] = c[k] ?? "";
  }
  return base;
}

function Campo({ label, hint, children, full }) {
  return (
    <label className={`grid gap-1 text-sm text-zinc-400${full ? " sm:col-span-2" : ""}`}>
      {label}
      {children}
      {hint ? <span className="text-xs text-zinc-600">{hint}</span> : null}
    </label>
  );
}

function SubirImagen({ value, onChange, label, alto = 120 }) {
  const { addToast } = useToast();
  const [subiendo, setSubiendo] = useState(false);

  async function subir(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/campanas/imagen", {
        method: "POST",
        headers: await getAdminAuthHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo subir");
      onChange(data.url);
      addToast("Imagen subida. Recuerda guardar.", "success");
    } catch (err) {
      addToast(err.message || "Error al subir", "error");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm text-zinc-400">{label}</span>
      <div
        className="rounded-lg overflow-hidden bg-zinc-950 border border-zinc-700 flex items-center justify-center"
        style={{ height: alto }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-zinc-600">Sin imagen</span>
        )}
      </div>
      <div className="flex gap-2">
        <label
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-600 text-zinc-200 hover:bg-zinc-800 cursor-pointer"
          style={{ opacity: subiendo ? 0.6 : 1 }}
        >
          {subiendo ? "Subiendo…" : value ? "Cambiar" : "Subir imagen"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={subiendo}
            onChange={subir}
          />
        </label>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-red-300"
          >
            Quitar
          </button>
        ) : null}
      </div>
    </div>
  );
}

function VistaPrevia({ form }) {
  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{ aspectRatio: "16 / 8", background: "#050607" }}
    >
      {form.hero_img_pc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={form.hero_img_pc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(5,6,7,0.85) 0%, rgba(5,6,7,0.35) 60%, transparent 100%)",
        }}
      />
      <div className="relative h-full flex flex-col justify-center p-5 gap-1">
        <p className="text-xs uppercase tracking-wide" style={{ color: LIME }}>
          {form.hero_eyebrow || "Subtítulo"}
        </p>
        <p className="text-2xl sm:text-3xl font-black text-white leading-none">
          {form.hero_titulo || "TÍTULO"}
          <br />
          <span style={{ color: LIME }}>{form.hero_titulo_acento || "DESTACADO"}</span>
        </p>
        {form.hero_efectivo ? (
          <p className="text-sm font-bold text-white mt-1">{form.hero_efectivo}</p>
        ) : null}
        <span
          className="mt-3 self-start px-4 py-1.5 rounded-full text-xs font-bold"
          style={{ background: LIME, color: "#050607" }}
        >
          {form.hero_cta || "¡Participar!"}
        </span>
      </div>
    </div>
  );
}

export default function AdminCampanaPage() {
  const { addToast } = useToast();
  const [campanas, setCampanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [seleccion, setSeleccion] = useState(null);
  const [form, setForm] = useState(aForm(null));
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(
    async (idPreferido) => {
      setLoading(true);
      setErrorCarga("");
      try {
        const res = await fetch("/api/admin/campanas", {
          headers: await getAdminAuthHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al cargar");
        const lista = data.campanas || [];
        setCampanas(lista);
        const elegida =
          lista.find((c) => c.id === idPreferido) ||
          lista.find((c) => c.activa) ||
          lista[0] ||
          null;
        setSeleccion(elegida?.id || "nueva");
        setForm(aForm(elegida));
      } catch (err) {
        setErrorCarga(err.message || "Error al cargar");
        setCampanas([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  const actual = campanas.find((c) => c.id === seleccion) || null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function nueva(copiarDe) {
    const base = aForm(copiarDe);
    setSeleccion("nueva");
    setForm(
      copiarDe
        ? { ...base, nombre: `${base.nombre} (copia)` }
        : base
    );
  }

  async function guardar({ activar = false } = {}) {
    setGuardando(true);
    try {
      const headers = {
        ...(await getAdminAuthHeaders()),
        "Content-Type": "application/json",
      };
      let id = actual?.id;
      if (!id) {
        const res = await fetch("/api/admin/campanas", {
          method: "POST",
          headers,
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No se pudo crear");
        id = data.campana.id;
      }
      const res = await fetch(`/api/admin/campanas/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(activar ? { ...form, activa: true } : form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      addToast(activar ? "Campaña guardada y marcada como activa" : "Campaña guardada", "success");
      await cargar(id);
    } catch (err) {
      addToast(err.message || "Error al guardar", "error");
    } finally {
      setGuardando(false);
    }
  }

  async function borrar() {
    if (!actual || actual.activa) return;
    if (!confirm(`¿Borrar la campaña "${actual.nombre}"?`)) return;
    try {
      const res = await fetch(`/api/admin/campanas/${actual.id}`, {
        method: "DELETE",
        headers: await getAdminAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo borrar");
      addToast("Campaña borrada", "success");
      await cargar();
    } catch (err) {
      addToast(err.message || "Error al borrar", "error");
    }
  }

  function setFoto(idx, url) {
    setForm((f) => {
      const fotos = [...f.fotos_destacado];
      if (url) fotos[idx] = url;
      else fotos.splice(idx, 1);
      return { ...f, fotos_destacado: fotos };
    });
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Campaña</h1>
      <p className="text-sm text-zinc-500 mb-4">
        Textos e imágenes del premio principal (hero y destacado) para cada
        sorteo. Solo una campaña queda activa a la vez.
      </p>
      <div
        className="rounded-xl px-4 py-3 mb-6 text-sm"
        style={{
          background: "rgba(251,191,36,0.08)",
          border: "1px solid rgba(251,191,36,0.35)",
          color: "#fcd34d",
        }}
      >
        Por ahora esto solo se guarda. La landing sigue mostrando Crypton tal
        como está hoy hasta que se conecte esta sección.
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: LIME, borderTopColor: "transparent" }}
          />
        </div>
      ) : errorCarga ? (
        <p className="text-sm text-red-300 py-6">{errorCarga}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {campanas.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSeleccion(c.id);
                  setForm(aForm(c));
                }}
                className="px-3 py-2 rounded-lg text-sm border"
                style={{
                  borderColor: seleccion === c.id ? LIME : "rgba(63,63,70,1)",
                  color: seleccion === c.id ? "#fff" : "#a1a1aa",
                  background: seleccion === c.id ? "rgba(184,227,81,0.08)" : "transparent",
                }}
              >
                {c.nombre}
                <span className="text-xs text-zinc-500"> · {c.periodo}</span>
                {c.activa ? (
                  <span
                    className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: LIME, color: "#050607" }}
                  >
                    ACTIVA
                  </span>
                ) : null}
              </button>
            ))}
            <button
              type="button"
              onClick={() => nueva(actual)}
              disabled={!actual}
              className="px-3 py-2 rounded-lg text-sm border border-dashed border-zinc-600 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
            >
              + Nueva (copiar esta)
            </button>
            <button
              type="button"
              onClick={() => nueva(null)}
              className="px-3 py-2 rounded-lg text-sm border border-dashed border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              + Nueva en blanco
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="grid gap-6">
              <section
                className="bg-zinc-900 rounded-xl p-5"
                style={{ border: "1px solid rgba(184,227,81,0.2)" }}
              >
                <p className="text-xs font-semibold tracking-wide text-zinc-500 mb-3">
                  SORTEO
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Campo label="Nombre interno" full>
                    <input
                      value={form.nombre}
                      onChange={set("nombre")}
                      placeholder="Ej. Yamaha Crypton 0 km + $1.000.000"
                      className={INPUT}
                    />
                  </Campo>
                  <Campo label="Mes de la campaña" hint="Las oportunidades se cuentan por mes">
                    <input
                      type="month"
                      value={form.periodo}
                      onChange={set("periodo")}
                      className={INPUT}
                    />
                  </Campo>
                  <Campo label="Fecha del sorteo">
                    <input
                      type="date"
                      value={form.fecha_sorteo}
                      onChange={set("fecha_sorteo")}
                      className={INPUT}
                    />
                  </Campo>
                  <Campo label="Lotería" full>
                    <input
                      value={form.loteria}
                      onChange={set("loteria")}
                      placeholder="Lotería de Boyacá"
                      className={INPUT}
                    />
                  </Campo>
                </div>
              </section>

              <section
                className="bg-zinc-900 rounded-xl p-5"
                style={{ border: "1px solid rgba(184,227,81,0.2)" }}
              >
                <p className="text-xs font-semibold tracking-wide text-zinc-500 mb-3">
                  HERO (PORTADA)
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Campo label="Texto pequeño de arriba" full>
                    <input
                      value={form.hero_eyebrow}
                      onChange={set("hero_eyebrow")}
                      placeholder="0 km · la nueva moto del Club"
                      className={INPUT}
                    />
                  </Campo>
                  <Campo label="Título (línea 1)">
                    <input
                      value={form.hero_titulo}
                      onChange={set("hero_titulo")}
                      placeholder="YAMAHA"
                      className={INPUT}
                    />
                  </Campo>
                  <Campo label="Título resaltado (línea 2)">
                    <input
                      value={form.hero_titulo_acento}
                      onChange={set("hero_titulo_acento")}
                      placeholder="CRYPTON"
                      className={INPUT}
                    />
                  </Campo>
                  <Campo label="Premio extra" hint="Déjalo vacío si no hay efectivo">
                    <input
                      value={form.hero_efectivo}
                      onChange={set("hero_efectivo")}
                      placeholder="+ $1.000.000 EN EFECTIVO"
                      className={INPUT}
                    />
                  </Campo>
                  <Campo label="Texto del botón">
                    <input
                      value={form.hero_cta}
                      onChange={set("hero_cta")}
                      placeholder="¡Participar!"
                      className={INPUT}
                    />
                  </Campo>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 mt-4">
                  <SubirImagen
                    label="Imagen PC (horizontal)"
                    value={form.hero_img_pc}
                    onChange={(url) => setForm((f) => ({ ...f, hero_img_pc: url }))}
                  />
                  <SubirImagen
                    label="Imagen celular (vertical)"
                    value={form.hero_img_movil}
                    alto={180}
                    onChange={(url) => setForm((f) => ({ ...f, hero_img_movil: url }))}
                  />
                </div>
              </section>

              <section
                className="bg-zinc-900 rounded-xl p-5"
                style={{ border: "1px solid rgba(184,227,81,0.2)" }}
              >
                <p className="text-xs font-semibold tracking-wide text-zinc-500 mb-1">
                  FOTOS DEL DESTACADO
                </p>
                <p className="text-xs text-zinc-600 mb-3">
                  Las que rotan en la sección del premio. Máximo 6.
                </p>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                  {form.fotos_destacado.map((url, idx) => (
                    <SubirImagen
                      key={`${url}-${idx}`}
                      label={`Foto ${idx + 1}`}
                      value={url}
                      onChange={(u) => setFoto(idx, u)}
                    />
                  ))}
                  {form.fotos_destacado.length < 6 ? (
                    <SubirImagen
                      key={`nueva-${form.fotos_destacado.length}`}
                      label="Agregar foto"
                      value=""
                      onChange={(u) => setFoto(form.fotos_destacado.length, u)}
                    />
                  ) : null}
                </div>
              </section>
            </div>

            <div className="grid gap-4 content-start lg:sticky lg:top-4">
              <p className="text-xs font-semibold tracking-wide text-zinc-500">
                VISTA PREVIA (APROXIMADA)
              </p>
              <VistaPrevia form={form} />
              <button
                type="button"
                disabled={guardando}
                onClick={() => guardar()}
                className="px-4 py-2.5 rounded-lg text-sm font-bold"
                style={{ background: LIME, color: "#050607", opacity: guardando ? 0.7 : 1 }}
              >
                {guardando ? "Guardando…" : "Guardar"}
              </button>
              {!actual?.activa ? (
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => {
                    if (confirm("¿Guardar y dejar esta campaña como la activa?")) {
                      guardar({ activar: true });
                    }
                  }}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-zinc-600 text-zinc-200 hover:bg-zinc-800"
                >
                  Guardar y marcar como activa
                </button>
              ) : null}
              {actual && !actual.activa ? (
                <button
                  type="button"
                  onClick={borrar}
                  className="text-xs text-zinc-500 hover:text-red-300"
                >
                  Borrar campaña
                </button>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
