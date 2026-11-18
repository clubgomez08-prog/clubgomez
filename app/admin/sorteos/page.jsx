"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAdminAuthHeaders } from "@/lib/auth";
import { useToast } from "@/components/admin/Toast";
import { BLOQUE_TARJETAS_DEFAULT, FUENTES, fechaLegible, slugificar, urlPublicaSorteo } from "@/lib/club-gomez/sorteos";
import { STICKERS } from "@/lib/club-gomez/stickers";

const PREVIEW_KEY = "cg-sorteo-preview";

function entero(v) {
  const n = Number(String(v ?? "").replace(/\D/g, ""));
  return Number.isInteger(n) ? n : NaN;
}

function avisoDeRangos(form) {
  const f0 = entero(form.fisico_min);
  const f1 = entero(form.fisico_max);
  const w0 = entero(form.web_min);
  const w1 = entero(form.web_max);
  const ok = [f0, f1, w0, w1].every((n) => n >= 0 && n <= 9999);
  const fisicos = ok && f0 <= f1 ? f1 - f0 + 1 : 0;
  const webs = ok && w0 <= w1 ? w1 - w0 + 1 : 0;
  const tope = ok && Math.max(f1, w1) > 999 ? 10000 : 1000;
  const fallos = [];
  if (!ok) fallos.push("Cada número va del 0000 al 9999.");
  if (ok && f0 > f1) fallos.push("En persona, Desde tiene que ser menor que Hasta.");
  if (ok && w0 > w1) fallos.push("En la página, Desde tiene que ser menor que Hasta.");
  const seCruzan = ok && f0 <= f1 && w0 <= w1 && f0 <= w1 && w0 <= f1;
  if (seCruzan) fallos.push("Los dos grupos se cruzan. Un número no puede estar en los dos.");
  if (ok && !seCruzan && f0 <= f1 && w0 <= w1 && fisicos + webs < tope) {
    fallos.push(`Quedan ${tope - fisicos - webs} números por fuera. Nadie los puede vender.`);
  }
  return { f0, f1, w0, w1, fisicos, webs, fallos, tope };
}

const PASOS = [
  ["datos", "Datos"],
  ["pagina", "Página"],
  ["fotos", "Fotos"],
  ["apariencia", "Apariencia"],
  ["planes", "Planes"],
  ["premios", "Premios adicionales"],
];

const VACIO = {
  nombre: "",
  slug: "",
  estado: "en_venta",
  es_principal: false,
  trabajando: false,
  fecha_sorteo: "",
  loteria: "Lotería de Boyacá",
  premio: "",
  premio_extra: "",
  hero_eyebrow: "",
  hero_titulo: "",
  hero_titulo_acento: "",
  hero_efectivo: "",
  hero_cta: "¡Participar!",
  hero_img_pc: "",
  hero_img_movil: "",
  fotos_destacado: [],
  texto_planes: "",
  texto_footer: "",
  texto_banda: "",
  color_fondo: "#050607",
  color_texto: "#ffffff",
  color_acento: "#B8E351",
  fuente_titulos: "bebas",
  fuente_texto: "poppins",
  fondo_imagen: "",
  mostrar_testimonios: true,
  mostrar_ver_claves: true,
  mostrar_banda: true,
  mostrar_destacado: true,
  fisico_min: 0,
  fisico_max: 700,
  web_min: 701,
  web_max: 999,
  mensaje_whatsapp: "",
  mensaje_correo_asunto: "",
  mensaje_correo_cuerpo: "",
  bloque_tarjetas: null,
  premios_extra: [],
};

function aForm(s) {
  const base = { ...VACIO, fotos_destacado: [] };
  if (!s) return base;
  for (const k of Object.keys(base)) {
    if (k === "fotos_destacado") base[k] = Array.isArray(s[k]) ? s[k] : [];
    else if (k === "bloque_tarjetas") base[k] = s[k] && typeof s[k] === "object" && !Array.isArray(s[k]) ? s[k] : null;
    else if (k === "premios_extra") base[k] = Array.isArray(s[k]) ? s[k] : [];
    else if (typeof base[k] === "boolean") base[k] = s[k] == null ? base[k] : Boolean(s[k]);
    else if (typeof base[k] === "number") base[k] = s[k] ?? base[k];
    else base[k] = s[k] ?? "";
  }
  return base;
}

function estadoTexto(estado) {
  if (estado === "en_venta") return "En venta";
  if (estado === "cerrado") return "Terminado";
  return "Borrador";
}

export default function SorteosPage() {
  const { addToast } = useToast();
  const [lista, setLista] = useState([]);
  const [faltaTabla, setFaltaTabla] = useState(false);
  const [modo, setModo] = useState("lista");
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [baseForm, setBaseForm] = useState("");
  const [planes, setPlanes] = useState([]);
  const [tab, setTab] = useState("datos");
  const [guardando, setGuardando] = useState(false);
  const [marcando, setMarcando] = useState("");
  const [confirmarId, setConfirmarId] = useState("");
  const [dispositivo, setDispositivo] = useState("pc");
  const [verPreview, setVerPreview] = useState(false);
  const [planForm, setPlanForm] = useState(PLAN_VACIO);

  const cargar = useCallback(async () => {
    const res = await fetch("/api/admin/sorteos", { headers: await getAdminAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo cargar");
    setFaltaTabla(Boolean(data.faltaTabla));
    setLista(data.sorteos || []);
    return data.sorteos || [];
  }, []);

  useEffect(() => {
    cargar().catch((err) => addToast(err.message, "error"));
  }, [cargar, addToast]);

  useEffect(() => {
    if (modo !== "editor") return;
    try {
      localStorage.setItem(PREVIEW_KEY, JSON.stringify({ form, planes }));
    } catch {
      /* la vista previa sigue con el último borrador que cupo */
    }
  }, [modo, form, planes]);

  async function copiar(texto, aviso) {
    try {
      await navigator.clipboard.writeText(texto);
      addToast(aviso, "success");
      return;
    } catch {
      /* el navegador a veces bloquea el portapapeles */
    }
    try {
      const area = document.createElement("textarea");
      area.value = texto;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      if (ok) {
        addToast(aviso, "success");
        return;
      }
    } catch {
      /* sigue abajo */
    }
    addToast("No se pudo copiar. Selecciona el link y cópialo a mano.", "error");
  }

  async function marcar(s, cuerpo, aviso) {
    setMarcando(s.id);
    try {
      const res = await fetch(`/api/admin/sorteos/${s.id}`, {
        method: "PUT",
        headers: { ...(await getAdminAuthHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      addToast(aviso, "success");
      await cargar();
    } catch (err) {
      addToast(err.message || "No se pudo guardar", "error");
    } finally {
      setMarcando("");
    }
  }

  function ponerEnInicio(s) {
    marcar(
      s,
      { es_principal: true },
      "Este sorteo queda en clubgomez.co. El otro sale de la página de inicio."
    );
  }

  function terminar(s) {
    setConfirmarId("");
    marcar(s, { estado: "cerrado" }, "Sorteo terminado. Ya no se vende.");
  }

  function abrir(s, conservarTab) {
    const f = aForm(s);
    setSel(s);
    setForm(f);
    setBaseForm(JSON.stringify(f));
    setPlanes(s ? (s.planes || []).map(rellenarTarjeta) : planesDeInicio());
    setPlanForm(PLAN_VACIO);
    if (!conservarTab) setTab("datos");
    setModo("editor");
    setVerPreview(false);
  }

  function volver() {
    if (JSON.stringify(form) !== baseForm) {
      const ok = window.confirm("Hay cambios sin guardar. ¿Volver a la lista?");
      if (!ok) return;
    }
    setModo("lista");
    setVerPreview(false);
  }

  function setCampo(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const slug = slugificar(form.slug || form.nombre || "nuevo");
  const previewUrl = urlPublicaSorteo(slug);

  async function guardar() {
    setGuardando(true);
    try {
      const borradores = sel ? [] : planesPorGuardar();
      const resto = { ...form };
      delete resto.mensaje_whatsapp;
      delete resto.mensaje_correo_asunto;
      delete resto.mensaje_correo_cuerpo;
      delete resto.trabajando;
      const cuerpo = {
        ...resto,
        slug: slugificar(form.slug || form.nombre),
        sinPlanesBase: borradores.length > 0,
      };
      const res = await fetch(sel ? `/api/admin/sorteos/${sel.id}` : "/api/admin/sorteos", {
        method: sel ? "PUT" : "POST",
        headers: { ...(await getAdminAuthHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      if (borradores.length && data.sorteo?.id) {
        for (const plan of borradores) {
          const alta = await fetch(`/api/admin/sorteos/${data.sorteo.id}/planes`, {
            method: "POST",
            headers: { ...(await getAdminAuthHeaders()), "Content-Type": "application/json" },
            body: JSON.stringify(plan),
          });
          const altaData = await alta.json().catch(() => ({}));
          if (!alta.ok) throw new Error(altaData.error || "El sorteo quedó creado, pero un plan no se guardó.");
        }
      }
      addToast(
        data.aviso ||
          (data.slugAnterior
            ? `Link cambiado. El anterior (${data.slugAnterior}) ya no abre.`
            : "Sorteo guardado"),
        data.aviso ? "error" : "success"
      );
      const todos = await cargar();
      const fresco = todos.find((s) => s.id === data.sorteo.id) || data.sorteo;
      abrir(fresco, true);
    } catch (err) {
      addToast(err.message || "Error", "error");
    } finally {
      setGuardando(false);
    }
  }

  async function subirUrl(file) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/campanas/imagen", {
      method: "POST",
      headers: await getAdminAuthHeaders(),
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo subir");
    return data.url;
  }

  async function subir(campo, file) {
    const url = await subirUrl(file);
    if (campo === "fotos_destacado") {
      setCampo("fotos_destacado", [...form.fotos_destacado, url].slice(0, 6));
    } else {
      setCampo(campo, url);
    }
    addToast("Imagen subida. Recuerda guardar.", "success");
  }

  function esBorrador(plan) {
    return String(plan?.id || "").startsWith("borrador-");
  }

  function planesPorGuardar() {
    const listos = planes.filter(esBorrador);
    if (planForm.nombre.trim()) listos.push({ ...planForm, id: `borrador-${Date.now()}` });
    return listos;
  }

  function agregarOtra() {
    setPlanes((ps) => [
      ...ps,
      rellenarTarjeta({
        id: `borrador-${Date.now()}`,
        nombre: "",
        precio_cop: "",
        claves: 1,
        recomendado: false,
      }),
    ]);
  }

  async function guardarPlan(existente) {
    if (!sel) return;
    const alta = !existente || esBorrador(existente);
    const res = await fetch(`/api/admin/sorteos/${sel.id}/planes`, {
      method: alta ? "POST" : "PUT",
      headers: { ...(await getAdminAuthHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify(existente || planForm),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo guardar el plan");
    setPlanes((data.planes || []).map(rellenarTarjeta));
    addToast(data.aviso || "Plan guardado", data.aviso ? "error" : "success");
  }

  function actualizarPlanLocal(row) {
    setPlanes((ps) =>
      ps.map((p) =>
        p.id === row.id
          ? {
              ...p,
              ...row,
              precio_cop: Number(row.precio_cop) || 0,
              claves: Number(row.claves) || 1,
              recomendado: row.recomendado === true,
            }
          : p
      )
    );
  }

  if (faltaTabla) {
    return (
      <div className="sorteo-top">
        <h1 className="sorteo-title">Sorteos</h1>
        <p className="sorteo-lead">
          Falta ejecutar en Supabase el archivo supabase/migrations/020_sorteos_independientes.sql.
          Hasta eso, el panel sigue como está y no se borra nada.
        </p>
      </div>
    );
  }

  if (modo === "lista") {
    return (
      <div className="sorteo-lista">
        <header className="sorteo-top">
          <div>
            <p className="sorteo-kicker">Premios</p>
            <h1 className="sorteo-title">Sorteos</h1>
            <p className="sorteo-lead">
              Cada premio tiene su página y su link. El marcado es el que sale al entrar a clubgomez.co. Solo puede haber uno.
            </p>
          </div>
          <button type="button" className="sorteo-btn sorteo-btn--lime" onClick={() => abrir(null)}>
            Nuevo sorteo
          </button>
        </header>

        {lista.length === 0 ? (
          <p className="sorteo-lead">Todavía no hay sorteos. Crea el primero.</p>
        ) : (
          <div className="sorteo-grid">
            {lista.map((s) => {
              const url = urlPublicaSorteo(s.slug);
              const historia = `Ya puedes participar por ${s.premio || s.nombre}. Entra aquí: ${url}`;
              return (
                <article key={s.id} className={`sorteo-card${s.es_principal ? " is-principal" : ""}`}>
                  <div className="sorteo-card__cabeza">
                    <button type="button" className="sorteo-card__abrir" onClick={() => abrir(s)}>
                      <span className={`sorteo-estado is-${s.estado}`}>{estadoTexto(s.estado)}</span>
                      <strong>{s.nombre}</strong>
                    </button>
                    <button type="button" className="sorteo-card__editar" onClick={() => abrir(s)}>
                      Editar
                    </button>
                  </div>
                  {s.es_principal ? (
                    <div className="sorteo-marca is-on">
                      <span className="sorteo-marca__punto" aria-hidden="true" />
                      <span>
                        <strong>Sale en clubgomez.co</strong>
                        <small>Quien entra al dominio ve este premio. Si marcas otro, este deja de salir.</small>
                      </span>
                    </div>
                  ) : (
                    <button type="button" className="sorteo-marca" disabled={marcando === s.id} onClick={() => ponerEnInicio(s)}>
                      <span className="sorteo-marca__punto" aria-hidden="true" />
                      <span>
                        <strong>Marcar para clubgomez.co</strong>
                        <small>Al marcarlo, este sale en el dominio y el otro deja de salir.</small>
                      </span>
                    </button>
                  )}
                  <div className="sorteo-card__share">
                    <span className="sorteo-card__url">{url}</span>
                    <div className="sorteo-card__acciones">
                      <button type="button" onClick={() => copiar(url, "Link copiado")}>
                        Copiar link
                      </button>
                      <button type="button" onClick={() => copiar(historia, "Texto copiado para la historia")}>
                        Copiar para historias
                      </button>
                      {s.estado === "borrador" ? (
                        <button type="button" disabled={marcando === s.id} onClick={() => marcar(s, { estado: "en_venta" }, "El link ya abre y se puede comprar.")}>
                          Publicar
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="sorteo-card__fin">
                    {s.estado === "cerrado" ? (
                      <small>Terminado. El link abre, pero ya no se vende.</small>
                    ) : confirmarId === s.id ? (
                      <div className="sorteo-card__confirma">
                        <p>
                          ¿Terminar {s.nombre}? El link sigue abriendo, pero ya no se puede comprar.
                          {s.es_principal ? " Sigue en clubgomez.co hasta que marques otro." : ""}
                        </p>
                        <div>
                          <button type="button" disabled={marcando === s.id} onClick={() => terminar(s)}>
                            Sí, terminar
                          </button>
                          <button type="button" onClick={() => setConfirmarId("")}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button type="button" disabled={marcando === s.id} onClick={() => setConfirmarId(s.id)}>
                          Terminar sorteo
                        </button>
                        <small>
                          {fechaLegible(s.fecha_sorteo)
                            ? `Se termina solo el ${fechaLegible(s.fecha_sorteo)}. Desde ese día ya no se puede comprar.`
                            : "Cierra la venta. El link sigue abriendo, pero ya no se puede comprar."}
                        </small>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="sorteo-editor">
      <header className="sorteo-editor__bar">
        <button type="button" className="sorteo-btn sorteo-btn--ghost" onClick={volver}>
          ← Sorteos
        </button>
        <div className="sorteo-editor__titulo">
          <strong>{form.premio || form.nombre || "Sorteo nuevo"}</strong>
          <span>La página de la derecha cambia mientras escribes.</span>
        </div>
        <div className="sorteo-editor__acciones">
          {sel && form.estado !== "borrador" ? (
            <a className="sorteo-btn sorteo-btn--ghost" href={`/sorteo/${slug}`} target="_blank" rel="noreferrer">
              Ver página
            </a>
          ) : null}
          <button type="button" className="sorteo-btn sorteo-btn--lime" disabled={guardando} onClick={guardar}>
            {guardando ? "Guardando…" : sel ? "Guardar" : "Crear sorteo"}
          </button>
        </div>
      </header>

      <div className="sorteo-editor__body">
        <section className="sorteo-form">
          <div className="sorteo-steps" role="tablist">
            {PASOS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={`sorteo-step${tab === id ? " is-on" : ""}`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "datos" ? (
            <div className="sorteo-block">
              <h3>1. Este premio</h3>
              <p>Nombre, fecha y el link con el que se abre. No se comparte con los otros premios.</p>
              <label className="sorteo-label">
                Nombre
                <input className="sorteo-field" value={form.nombre} onChange={(e) => setCampo("nombre", e.target.value)} />
              </label>
              <label className="sorteo-label">
                Premio principal
                <input className="sorteo-field" value={form.premio || ""} onChange={(e) => setCampo("premio", e.target.value)} />
              </label>
              <div className="sorteo-dos">
                <label className="sorteo-label">
                  Fecha
                  <input type="date" className="sorteo-field" value={String(form.fecha_sorteo || "").slice(0, 10)} onChange={(e) => setCampo("fecha_sorteo", e.target.value)} />
                </label>
                <label className="sorteo-label">
                  Lotería
                  <input className="sorteo-field" value={form.loteria || ""} onChange={(e) => setCampo("loteria", e.target.value)} />
                </label>
              </div>
              <label className="sorteo-label">
                Dirección de esta página
                <input
                  className="sorteo-field"
                  value={form.slug}
                  placeholder="pcgamer"
                  onChange={(e) => setCampo("slug", slugificar(e.target.value))}
                />
                <span className="sorteo-ayuda">La gente entra por {previewUrl}. Cuál sale en clubgomez.co, y cuándo se termina, se marca en la lista de sorteos.</span>
              </label>
              <h3>Qué números usa este premio</h3>
              <p>Son solo de este premio. El 537 de aquí no bloquea el 537 de otro.</p>
              <AvisoRangos form={form} />
              <p className="sorteo-pregunta">Los que vende Daniel en persona</p>
              <div className="sorteo-dos">
                <label className="sorteo-label">
                  Desde
                  <input className="sorteo-field" inputMode="numeric" value={form.fisico_min} onChange={(e) => setCampo("fisico_min", e.target.value.replace(/\D/g, ""))} />
                </label>
                <label className="sorteo-label">
                  Hasta
                  <input className="sorteo-field" inputMode="numeric" value={form.fisico_max} onChange={(e) => setCampo("fisico_max", e.target.value.replace(/\D/g, ""))} />
                </label>
              </div>
              <p className="sorteo-pregunta">Los que se compran por la página</p>
              <div className="sorteo-dos">
                <label className="sorteo-label">
                  Desde
                  <input className="sorteo-field" inputMode="numeric" value={form.web_min} onChange={(e) => setCampo("web_min", e.target.value.replace(/\D/g, ""))} />
                </label>
                <label className="sorteo-label">
                  Hasta
                  <input className="sorteo-field" inputMode="numeric" value={form.web_max} onChange={(e) => setCampo("web_max", e.target.value.replace(/\D/g, ""))} />
                </label>
              </div>
            </div>
          ) : null}

          {tab === "pagina" ? (
            <>
            <div className="sorteo-block">
              <h3>2. Textos de la página</h3>
              <p>Lo que se lee arriba de la landing. La foto se ve en la vista previa en cuanto termina de subir.</p>
              {[
                ["hero_eyebrow", "Frase pequeña"],
                ["hero_titulo", "Título"],
                ["hero_titulo_acento", "Título destacado"],
                ["hero_efectivo", "Línea extra"],
                ["hero_cta", "Botón"],
                ["texto_planes", "Texto sobre los planes"],
                ["texto_banda", "Frase de la banda"],
                ["texto_footer", "Pie de página"],
              ].map(([k, label]) => (
                <label key={k} className="sorteo-label">
                  {label}
                  <input className="sorteo-field" value={form[k] || ""} onChange={(e) => setCampo(k, e.target.value)} />
                </label>
              ))}
              <p className="sorteo-ayuda">Las fotos están en el paso Fotos.</p>
            </div>
            <EditorTarjetas
              bloque={form.bloque_tarjetas}
              onChange={(bloque) => setCampo("bloque_tarjetas", bloque)}
              onSubir={subirUrl}
              onAviso={(msg) => addToast(msg, "success")}
              onError={(msg) => addToast(msg, "error")}
            />
          </>
          ) : null}

          {tab === "fotos" ? (
            <div className="sorteo-fotos">
              <FotoGrande
                titulo="Foto de arriba, en computador"
                ayuda="Es la imagen grande al entrar desde un computador."
                url={form.hero_img_pc}
                onFile={(file) => subir("hero_img_pc", file).catch((err) => addToast(err.message, "error"))}
                onQuitar={() => setCampo("hero_img_pc", "")}
              />
              <FotoGrande
                titulo="Foto de arriba, en celular"
                ayuda="La misma zona, cuando alguien entra desde el teléfono."
                url={form.hero_img_movil}
                onFile={(file) => subir("hero_img_movil", file).catch((err) => addToast(err.message, "error"))}
                onQuitar={() => setCampo("hero_img_movil", "")}
              />
              <GaleriaPremio
                fotos={form.fotos_destacado || []}
                onFile={(file) => subir("fotos_destacado", file).catch((err) => addToast(err.message, "error"))}
                onQuitar={(url) => setCampo("fotos_destacado", form.fotos_destacado.filter((f) => f !== url))}
              />
            </div>
          ) : null}

          {tab === "apariencia" ? (
            <div className="sorteo-block">
              <h3>3. Colores y letras</h3>
              <p>Fondo, texto y el color de botones. La página no se desarma: solo cambian estos tres.</p>
              <div className="sorteo-colores">
                {[
                  ["color_fondo", "Fondo"],
                  ["color_texto", "Texto"],
                  ["color_acento", "Botones"],
                ].map(([k, label]) => (
                  <label key={k} className="sorteo-label">
                    {label}
                    <input type="color" className="sorteo-color" value={form[k] || "#000000"} onChange={(e) => setCampo(k, e.target.value)} />
                  </label>
                ))}
              </div>
              <label className="sorteo-label">
                Títulos
                <select className="sorteo-field" value={form.fuente_titulos} onChange={(e) => setCampo("fuente_titulos", e.target.value)}>
                  {Object.entries(FUENTES).map(([id, f]) => (
                    <option key={id} value={id}>{f.label}</option>
                  ))}
                </select>
              </label>
              <label className="sorteo-label">
                Texto
                <select className="sorteo-field" value={form.fuente_texto} onChange={(e) => setCampo("fuente_texto", e.target.value)}>
                  {Object.entries(FUENTES).map(([id, f]) => (
                    <option key={id} value={id}>{f.label}</option>
                  ))}
                </select>
              </label>
              <h3>Qué bloques se ven</h3>
              <p>Lo que no se puede editar se puede apagar. La página sigue en pie.</p>
              {[
                ["mostrar_destacado", "Foto del medio", "Solo la foto grande del premio. El título y los planes salen una sola vez, más abajo."],
                ["mostrar_banda", "Tarjetas de beneficios", "El bloque de Oportunidades y Premios. El texto y el sticker se cambian en Página."],
                ["mostrar_testimonios", "Videos", "Los testimonios del final. Todavía no se cambian."],
                ["mostrar_ver_claves", "Consultar números", "La caja «¿Ya eres miembro?»."],
              ].map(([k, label, ayuda]) => (
                <label key={k} className="sorteo-check">
                  <input type="checkbox" checked={Boolean(form[k])} onChange={(e) => setCampo(k, e.target.checked)} />
                  <span>
                    <strong>{label}</strong>
                    <small>{ayuda}</small>
                  </span>
                </label>
              ))}
            </div>
          ) : null}

          {tab === "planes" ? (
            <div className="sorteo-block">
              <h3>4. Planes de {form.premio || form.nombre || "este premio"}</h3>
              <p>Empieza con estas tres tarjetas, ya con el texto que se ve en la página.</p>
              {planes.map((p) => (
                <PlanFila
                  key={p.id}
                  plan={p}
                  onChange={actualizarPlanLocal}
                  onGuardar={
                    sel
                      ? (row) => guardarPlan(row).catch((err) => addToast(err.message, "error"))
                      : null
                  }
                  onQuitar={
                    esBorrador(p)
                      ? () => setPlanes((ps) => ps.filter((item) => item.id !== p.id))
                      : null
                  }
                />
              ))}
              <button type="button" className="sorteo-btn sorteo-btn--lime" onClick={agregarOtra}>
                Agregar otra tarjeta
              </button>
            </div>
          ) : null}

          {tab === "premios" ? (
            <div className="sorteo-block">
              <h3>Premios adicionales</h3>
              <p>Salen en la vista previa, justo debajo de los planes, en «También participa por».</p>
              <PremiosExtra
                premios={form.premios_extra || []}
                onChange={(premios) => setCampo("premios_extra", premios)}
                onSubir={subirUrl}
                onAviso={(msg) => addToast(msg, "success")}
                onError={(msg) => addToast(msg, "error")}
              />
            </div>
          ) : null}

        </section>

        <PreviewPanel
          dispositivo={dispositivo}
          setDispositivo={setDispositivo}
          abierto={verPreview}
          cerrar={() => setVerPreview(false)}
        />
      </div>

      <button type="button" className="sorteo-fab" onClick={() => setVerPreview(true)}>
        Vista previa
      </button>
    </div>
  );
}

function PreviewPanel({ dispositivo, setDispositivo, abierto, cerrar }) {
  const caja = useRef(null);
  const [ancho, setAncho] = useState(0);
  const base = dispositivo === "movil" ? 390 : 1280;
  const alto = dispositivo === "movil" ? 780 : 820;

  useEffect(() => {
    const el = caja.current;
    if (!el) return undefined;
    const medir = () => setAncho(el.clientWidth);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [abierto, dispositivo]);

  const escala = ancho > 16 ? Math.min(dispositivo === "movil" ? 1 : 1, (ancho - 8) / base) : 0.4;

  return (
    <aside className={`sorteo-preview${abierto ? " is-open" : ""}`}>
      <div className="sorteo-preview__bar">
        <strong>Vista previa</strong>
        <div className="sorteo-switch" role="group" aria-label="Tamaño de la página">
          <button type="button" className={dispositivo === "pc" ? "is-on" : ""} onClick={() => setDispositivo("pc")}>
            Escritorio
          </button>
          <button type="button" className={dispositivo === "movil" ? "is-on" : ""} onClick={() => setDispositivo("movil")}>
            Celular
          </button>
        </div>
        <button type="button" className="sorteo-preview__cerrar" onClick={cerrar}>
          Cerrar
        </button>
      </div>

      <div className="sorteo-marco" ref={caja}>
        <div className="sorteo-marco__lienzo" style={{ width: base * escala, height: alto * escala }}>
          <iframe
            title="Vista previa de la landing"
            src="/admin/sorteos/vista?v=5"
            style={{
              width: base,
              height: alto,
              transform: `scale(${escala})`,
            }}
          />
        </div>
      </div>
    </aside>
  );
}

const STICKER_LISTA = [
  ["llave", "Llave"],
  ["trofeo", "Trofeo"],
  ["corona", "Corona"],
  ["casco", "Casco"],
  ["rayo", "Rayo"],
  ["dolar", "Dólar"],
  ["billetes", "Billetes"],
  ["moneda", "Moneda"],
  ["cohete", "Cohete"],
  ["cadena", "Cadena"],
  ["mano", "Mano"],
];

function EditorTarjetas({ bloque, onChange, onSubir, onAviso, onError }) {
  const actual = bloque?.items?.length ? bloque : BLOQUE_TARJETAS_DEFAULT;

  function publicar(next) {
    onChange(next);
  }

  function setItem(i, partial) {
    publicar({
      ...actual,
      items: actual.items.map((item, idx) => (idx === i ? { ...item, ...partial } : item)),
    });
  }

  async function subirSticker(i, file) {
    try {
      const url = await onSubir(file);
      setItem(i, { sticker: url });
      onAviso("Sticker subido. Recuerda guardar.");
    } catch (err) {
      onError(err.message || "No se pudo subir el sticker");
    }
  }

  return (
    <section className="sorteo-block sorteo-tarjetas">
      <h3>Tarjetas de este premio</h3>
      <p>Son las de Oportunidades y Premios del mes. El título, el texto y el sticker son de este sorteo.</p>
      <div className="sorteo-dos">
        <label className="sorteo-label">
          Título
          <input className="sorteo-field" value={actual.titulo || ""} onChange={(e) => publicar({ ...actual, titulo: e.target.value })} />
        </label>
        <label className="sorteo-label">
          Palabra en verde
          <input className="sorteo-field" value={actual.acento || ""} onChange={(e) => publicar({ ...actual, acento: e.target.value })} />
        </label>
      </div>
      <label className="sorteo-label">
        Frase de abajo
        <input className="sorteo-field" value={actual.bajada || ""} onChange={(e) => publicar({ ...actual, bajada: e.target.value })} />
      </label>
      <label className="sorteo-label">
        Botón
        <input className="sorteo-field" value={actual.boton || ""} onChange={(e) => publicar({ ...actual, boton: e.target.value })} />
      </label>
      {actual.items.map((item, i) => (
        <div key={i} className="sorteo-tarjeta">
          <div className="sorteo-tarjeta__top">
            <strong>Tarjeta {i + 1}</strong>
            {actual.items.length > 1 ? (
              <button
                type="button"
                className="sorteo-btn sorteo-btn--ghost"
                onClick={() => publicar({ ...actual, items: actual.items.filter((_, idx) => idx !== i) })}
              >
                Quitar
              </button>
            ) : null}
          </div>
          <div className="sorteo-stickers">
            {STICKER_LISTA.map(([id, nombre]) => (
              <button
                key={id}
                type="button"
                title={nombre}
                className={`sorteo-sticker${item.sticker === STICKERS[id] ? " is-on" : ""}`}
                onClick={() => setItem(i, { sticker: STICKERS[id] })}
              >
                <img src={STICKERS[id]} alt={nombre} />
              </button>
            ))}
            {item.sticker && !Object.values(STICKERS).includes(item.sticker) ? (
              <span className="sorteo-sticker is-on">
                <img src={item.sticker} alt="" />
              </span>
            ) : null}
          </div>
          <label className="sorteo-btn sorteo-btn--ghost sorteo-sticker-subir">
            Subir otro sticker
            <input
              type="file"
              accept="image/png,image/webp,image/jpeg"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) subirSticker(i, file);
              }}
            />
          </label>
          <label className="sorteo-label">
            Título de la tarjeta
            <input className="sorteo-field" value={item.titulo} onChange={(e) => setItem(i, { titulo: e.target.value })} />
          </label>
          <label className="sorteo-label">
            Texto
            <textarea className="sorteo-field" rows={3} value={item.texto} onChange={(e) => setItem(i, { texto: e.target.value })} />
          </label>
        </div>
      ))}
      {actual.items.length < 4 ? (
        <button
          type="button"
          className="sorteo-btn sorteo-btn--lime"
          onClick={() =>
            publicar({
              ...actual,
              items: [
                ...actual.items,
                { titulo: "Nuevo", texto: "Escribe de qué se trata esta tarjeta.", sticker: STICKERS.trofeo },
              ],
            })
          }
        >
          Agregar tarjeta
        </button>
      ) : null}
    </section>
  );
}

function PremiosExtra({ premios, onChange, onSubir, onAviso, onError }) {
  const lista = Array.isArray(premios) ? premios : [];

  function setItem(i, partial) {
    onChange(lista.map((item, idx) => (idx === i ? { ...item, ...partial } : item)));
  }

  function fotosDe(item) {
    const fotos = Array.isArray(item?.fotos) ? item.fotos.filter(Boolean) : [];
    if (fotos.length) return fotos;
    return item?.imagen ? [item.imagen] : [];
  }

  async function subir(i, file) {
    const item = lista[i];
    const fotos = fotosDe(item);
    if (fotos.length >= 4) return;
    try {
      const url = await onSubir(file);
      const next = [...fotos, url].slice(0, 4);
      setItem(i, { fotos: next, imagen: next[0] || "" });
      onAviso("Foto subida. Recuerda guardar.");
    } catch (err) {
      onError(err.message || "No se pudo subir la foto");
    }
  }

  return (
    <div className="sorteo-tarjeta">
      <div className="sorteo-tarjeta__top">
        <strong>Los de esta página</strong>
      </div>
      <p className="sorteo-ayuda">
        En cada uno eliges si se gana con el mismo número o con otro, y subes hasta 4 fotos.
      </p>
      {lista.map((item, i) => {
        const fotos = fotosDe(item);
        const mismo = item.mismo_numero !== false;
        return (
          <div key={i} className="sorteo-premio">
            <div className="sorteo-plan">
              <label className="sorteo-label">
                Premio
                <input className="sorteo-field" value={item.nombre || ""} onChange={(e) => setItem(i, { nombre: e.target.value })} />
              </label>
              <label className="sorteo-label">
                Detalle
                <input className="sorteo-field" value={item.detalle || ""} onChange={(e) => setItem(i, { detalle: e.target.value })} />
              </label>
            </div>
            <div className="sorteo-label">
              Cómo se gana
              <div className="sorteo-switch sorteo-switch--bloque" role="group" aria-label="Cómo se gana este premio">
                <button type="button" className={mismo ? "is-on" : ""} onClick={() => setItem(i, { mismo_numero: true })}>
                  Mismo número
                </button>
                <button type="button" className={!mismo ? "is-on" : ""} onClick={() => setItem(i, { mismo_numero: false })}>
                  Otro número
                </button>
              </div>
              <small className="sorteo-ayuda">
                {mismo
                  ? "Se gana con el mismo número del premio principal."
                  : "Se gana con un número distinto. Sigue en esta página."}
              </small>
            </div>
            <FotosExtra
              fotos={fotos}
              onSubir={(file) => subir(i, file)}
              onQuitar={(url) => {
                const next = fotos.filter((src) => src !== url);
                setItem(i, { fotos: next, imagen: next[0] || "" });
              }}
            />
            <button type="button" className="sorteo-btn sorteo-btn--ghost" onClick={() => onChange(lista.filter((_, idx) => idx !== i))}>
              Quitar premio
            </button>
          </div>
        );
      })}
      {lista.length < 6 ? (
        <button
          type="button"
          className="sorteo-btn sorteo-btn--lime"
          onClick={() => onChange([...lista, { nombre: "", detalle: "", mismo_numero: true, fotos: [], imagen: "" }])}
        >
          Agregar premio
        </button>
      ) : null}
    </div>
  );
}

function FotosExtra({ fotos, onSubir, onQuitar }) {
  const lista = fotos || [];
  const [activa, setActiva] = useState(0);
  const i = lista.length ? Math.min(activa, lista.length - 1) : 0;
  const actual = lista[i] || "";
  return (
    <div className="sorteo-premio__fotos">
      <strong>Fotos de este premio</strong>
      <div className="sorteo-premio__marco">
        {actual ? <img src={actual} alt="" /> : <span>Todavía sin fotos</span>}
        {actual ? (
          <button type="button" className="sorteo-premio__x" onClick={() => onQuitar(actual)} aria-label="Quitar foto">
            ×
          </button>
        ) : null}
      </div>
      {lista.length > 1 ? (
        <div className="sorteo-premio__minis">
          {lista.map((src, idx) => (
            <button key={src} type="button" className={idx === i ? "is-on" : ""} onClick={() => setActiva(idx)}>
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      ) : null}
      <div className="sorteo-foto__bar">
        <label className={`sorteo-btn sorteo-btn--lime${lista.length >= 4 ? " is-off" : ""}`}>
          Subir imagen
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            disabled={lista.length >= 4}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onSubir(file);
            }}
          />
        </label>
        <span>Se ve completa, sin recortar · hasta 4</span>
      </div>
    </div>
  );
}

function FotoGrande({ titulo, ayuda, url, onFile, onQuitar }) {
  return (
    <section className="sorteo-foto">
      <h3>{titulo}</h3>
      <p>{ayuda}</p>
      <div className="sorteo-foto__marco">
        {url ? <img src={url} alt="" /> : <span>Todavía sin foto</span>}
      </div>
      <div className="sorteo-foto__bar">
        <label className="sorteo-btn sorteo-btn--lime">
          Subir imagen
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onFile(file);
            }}
          />
        </label>
        <span>JPG, PNG o WEBP</span>
        {url ? (
          <button type="button" className="sorteo-btn sorteo-btn--ghost" onClick={onQuitar}>
            Quitar
          </button>
        ) : null}
      </div>
    </section>
  );
}

function GaleriaPremio({ fotos, onFile, onQuitar }) {
  const [activa, setActiva] = useState(0);
  const lista = fotos || [];
  const i = lista.length ? Math.min(activa, lista.length - 1) : 0;
  const url = lista[i] || "";

  return (
    <section className="sorteo-foto">
      <h3>Fotos del premio</h3>
      <p>Salen en el bloque del medio, si ese bloque está encendido. Máximo 6.</p>
      <div className="sorteo-foto__marco">
        {url ? <img src={url} alt="" /> : <span>Todavía sin fotos del premio</span>}
      </div>
      <div className="sorteo-foto__bar">
        <label className={`sorteo-btn sorteo-btn--lime${lista.length >= 6 ? " is-off" : ""}`}>
          Subir imagen
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            disabled={lista.length >= 6}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onFile(file);
            }}
          />
        </label>
        <span>JPG, PNG o WEBP · hasta 6</span>
      </div>
      {lista.length ? (
        <div className="sorteo-thumbs">
          {lista.map((src, idx) => (
            <div key={src} className={`sorteo-thumb${idx === i ? " is-on" : ""}`}>
              <button type="button" className="sorteo-thumb__img" onClick={() => setActiva(idx)}>
                <img src={src} alt="" />
              </button>
              <button type="button" className="sorteo-thumb__x" onClick={() => onQuitar(src)} aria-label="Quitar foto">
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

const PLAN_VACIO = {
  nombre: "",
  precio_cop: "",
  precio_antes: "",
  claves: "1",
  etiqueta: "Plan mensual",
  precio_sufijo: "/mes",
  boton: "¡Suscribirme ya!",
  recomendado: false,
};

function rellenarTarjeta(plan) {
  return {
    ...plan,
    etiqueta: plan?.etiqueta || "Plan mensual",
    precio_sufijo: plan?.precio_sufijo || "/mes",
    boton: plan?.boton || "¡Suscribirme ya!",
  };
}

function planesDeInicio() {
  return [
    { nombre: "Élite", precio_cop: 30000, claves: 1 },
    { nombre: "Selecto", precio_cop: 30000, claves: 6 },
    { nombre: "Esencial", precio_cop: 20000, claves: 1 },
  ].map((plan, i) =>
    rellenarTarjeta({
      ...plan,
      id: `borrador-${i + 1}`,
      precio_antes: "",
      recomendado: false,
      activo: true,
    })
  );
}

function filaDePlan(plan) {
  const listo = rellenarTarjeta(plan);
  return {
    id: listo.id,
    nombre: listo.nombre || "",
    precio_cop: listo.precio_cop == null || listo.precio_cop === "" ? "" : String(listo.precio_cop),
    precio_antes: listo.precio_antes ? String(listo.precio_antes) : "",
    claves: listo.claves == null || listo.claves === "" ? "1" : String(listo.claves),
    etiqueta: listo.etiqueta,
    precio_sufijo: listo.precio_sufijo,
    boton: listo.boton,
    recomendado: listo.recomendado === true,
    activo: listo.activo !== false,
  };
}

function CamposPlan({ row, set }) {
  return (
    <>
      <label className="sorteo-label">
        Nombre
        <input className="sorteo-field" value={row.nombre} onChange={(e) => set({ nombre: e.target.value })} />
      </label>
      <label className="sorteo-label">
        Precio
        <input className="sorteo-field" inputMode="numeric" value={row.precio_cop} onChange={(e) => set({ precio_cop: e.target.value.replace(/\D/g, "") })} />
      </label>
      <label className="sorteo-label">
        Precio tachado
        <input className="sorteo-field" inputMode="numeric" placeholder="Opcional" value={row.precio_antes || ""} onChange={(e) => set({ precio_antes: e.target.value.replace(/\D/g, "") })} />
      </label>
      <label className="sorteo-label">
        Oportunidades
        <input className="sorteo-field" inputMode="numeric" value={row.claves} onChange={(e) => set({ claves: e.target.value.replace(/\D/g, "") })} />
      </label>
      <label className="sorteo-label">
        Texto de arriba
        <input className="sorteo-field" value={row.etiqueta} onChange={(e) => set({ etiqueta: e.target.value })} />
      </label>
      <label className="sorteo-label">
        Después del precio
        <input className="sorteo-field" value={row.precio_sufijo} onChange={(e) => set({ precio_sufijo: e.target.value })} />
      </label>
      <label className="sorteo-label sorteo-plan__ancho">
        Botón
        <input className="sorteo-field" value={row.boton} onChange={(e) => set({ boton: e.target.value })} />
      </label>
      <label className="sorteo-check sorteo-plan__ancho">
        <input type="checkbox" checked={row.recomendado === true} onChange={(e) => set({ recomendado: e.target.checked })} />
        <span>
          <strong>Recomendado</strong>
          <small>La cinta de la tarjeta.</small>
        </span>
      </label>
    </>
  );
}

function AvisoRangos({ form }) {
  const { f0, f1, w0, w1, fisicos, webs, fallos, tope } = avisoDeRangos(form);
  const ancho = tope > 1000 ? 4 : 3;
  const pad = (n) => String(n).padStart(ancho, "0");
  return (
    <div className={`sorteo-aviso${fallos.length ? " is-mal" : " is-ok"}`}>
      <strong>Cómo repartir los {tope} números</strong>
      <p>
        Desde y Hasta son los números, no la cantidad. Para dejar la mitad en persona y la mitad en la página:
        persona <b>0</b> y <b>{Math.floor(tope / 2) - 1}</b>, página <b>{Math.floor(tope / 2)}</b> y <b>{tope - 1}</b>.
      </p>
      {Number.isInteger(f0) && Number.isInteger(f1) && f0 <= f1 ? (
        <p>
          En persona: {fisicos} números, del {pad(f0)} al {pad(f1)}.
          {Number.isInteger(w0) && Number.isInteger(w1) && w0 <= w1
            ? ` En la página: ${webs} números, del ${pad(w0)} al ${pad(w1)}.`
            : ""}
        </p>
      ) : null}
      {fallos.map((f) => (
        <p key={f}>{f}</p>
      ))}
    </div>
  );
}

function PlanFila({ plan, onChange, onGuardar, onQuitar }) {
  const [row, setRow] = useState(() => filaDePlan(plan));

  function set(partial) {
    const next = { ...row, ...partial };
    setRow(next);
    onChange(next);
  }

  return (
    <div className="sorteo-plan">
      <CamposPlan row={row} set={set} />
      <div className="sorteo-plan__ancho" style={{ display: "flex", gap: 8 }}>
        {onGuardar ? (
          <button type="button" className="sorteo-btn sorteo-btn--ghost" onClick={() => onGuardar(row)}>
            Guardar plan
          </button>
        ) : null}
        {onQuitar ? (
          <button type="button" className="sorteo-btn sorteo-btn--ghost" onClick={onQuitar}>
            Quitar
          </button>
        ) : null}
      </div>
    </div>
  );
}
