"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getAdminAuthHeaders } from "@/lib/auth";
import { useToast } from "@/components/admin/Toast";
import { linkWhatsappNumeros } from "@/lib/admin-descarga";
import {
  fechaLegible,
  MENSAJE_WHATSAPP_DEFAULT,
  renderMensaje,
} from "@/lib/club-gomez/sorteos";

const ASUNTO_BASE = "Tus números";
const CUERPO_BASE = "Hola {nombre}. Tus números son {numeros}.";

const OTROS = [
  {
    id: "bienvenida",
    titulo: "Bienvenida",
    desc: "Al crear la cuenta. No depende del sorteo.",
  },
  {
    id: "cumpleanos",
    titulo: "Cumpleaños",
    desc: "El día del cumpleaños. No depende del sorteo.",
  },
  {
    id: "ganador",
    titulo: "Resultado",
    desc: "Si un número coincide con el premio del día.",
  },
];

function pegar(texto, token) {
  const base = String(texto || "");
  const sep = base && !/\s$/.test(base) ? " " : "";
  return `${base}${sep}${token}`;
}

export default function AdminCorreosPage() {
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("Darwin");
  const [telefono, setTelefono] = useState("");
  const [sorteos, setSorteos] = useState([]);
  const [sorteoId, setSorteoId] = useState("");
  const [whatsapp, setWhatsapp] = useState(MENSAJE_WHATSAPP_DEFAULT);
  const [asunto, setAsunto] = useState(ASUNTO_BASE);
  const [cuerpo, setCuerpo] = useState(CUERPO_BASE);
  const [guardando, setGuardando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [previewTipo, setPreviewTipo] = useState("claves");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [cargandoSorteos, setCargandoSorteos] = useState(true);
  const [errorSorteos, setErrorSorteos] = useState("");

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/sorteos", {
          headers: await getAdminAuthHeaders(),
        });
        const data = await res.json().catch(() => ({}));
        if (!vivo) return;
        if (!res.ok) throw new Error(data.error || "No se pudieron cargar los sorteos");
        const lista = data.sorteos || [];
        setSorteos(lista);
        setErrorSorteos("");
        const elegido =
          lista.find((s) => s.trabajando) ||
          lista.find((s) => s.es_principal) ||
          lista[0];
        setSorteoId(elegido?.id || "");
      } catch (err) {
        if (vivo) {
          setSorteos([]);
          setErrorSorteos(err.message || "No se pudieron cargar los sorteos");
        }
      } finally {
        if (vivo) setCargandoSorteos(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const sorteo = sorteos.find((s) => s.id === sorteoId) || null;
  const cargado = useRef("");

  useEffect(() => {
    if (!sorteo || cargado.current === sorteo.id) return;
    cargado.current = sorteo.id;
    setWhatsapp(sorteo.mensaje_whatsapp || MENSAJE_WHATSAPP_DEFAULT);
    setAsunto(sorteo.mensaje_correo_asunto || ASUNTO_BASE);
    setCuerpo(sorteo.mensaje_correo_cuerpo || CUERPO_BASE);
  }, [sorteo]);

  const vars = useMemo(
    () => ({
      nombre: nombre.trim().split(/\s+/)[0] || "Cliente",
      numeros: "537",
      premio: sorteo?.premio || sorteo?.nombre || "",
      fecha: fechaLegible(sorteo?.fecha_sorteo),
      loteria: sorteo?.loteria || "",
      plan: "Esencial",
    }),
    [nombre, sorteo]
  );

  const vistaWhatsapp = renderMensaje(whatsapp, vars);

  const enlaceWhatsapp = linkWhatsappNumeros({
    telefono,
    nombre,
    numeros: ["537"],
    planNombre: "Esencial",
    plantilla: whatsapp,
    premio: vars.premio,
    fecha: sorteo?.fecha_sorteo || "",
    loteria: vars.loteria,
  });

  async function guardar() {
    if (!sorteoId) {
      addToast("Elige un sorteo.", "error");
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch(`/api/admin/sorteos/${sorteoId}`, {
        method: "PUT",
        headers: {
          ...(await getAdminAuthHeaders()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mensaje_whatsapp: whatsapp,
          mensaje_correo_asunto: asunto,
          mensaje_correo_cuerpo: cuerpo,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      setSorteos((lista) =>
        lista.map((s) =>
          s.id === sorteoId
            ? {
                ...s,
                mensaje_whatsapp: whatsapp,
                mensaje_correo_asunto: asunto,
                mensaje_correo_cuerpo: cuerpo,
              }
            : s
        )
      );
      addToast("Mensajes guardados en este sorteo", "success");
    } catch (err) {
      addToast(err.message || "No se pudo guardar", "error");
    } finally {
      setGuardando(false);
    }
  }

  async function enviarPrueba() {
    const dest = email.trim();
    if (!dest || !dest.includes("@")) {
      addToast("Escribe un email para la prueba.", "error");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch("/api/admin/email-prueba", {
        method: "POST",
        headers: {
          ...(await getAdminAuthHeaders()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "claves",
          emailDestino: dest,
          nombre: nombre.trim() || "Cliente",
          sorteoId,
          mensaje_correo_asunto: asunto,
          mensaje_correo_cuerpo: cuerpo,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo enviar");
      addToast(data.message || "Correo de prueba enviado", "success");
    } catch (err) {
      addToast(err.message || "No se pudo enviar", "error");
    } finally {
      setEnviando(false);
    }
  }

  useEffect(() => {
    if (previewTipo === "claves" && !sorteoId) return undefined;
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await fetch("/api/admin/email-preview", {
          method: "POST",
          headers: {
            ...(await getAdminAuthHeaders()),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tipo: previewTipo,
            nombre: nombre.trim() || "Cliente",
            email: email.trim() || "preview@clubgomez.co",
            sorteoId: previewTipo === "claves" ? sorteoId : "",
            mensaje_correo_asunto: previewTipo === "claves" ? asunto : undefined,
            mensaje_correo_cuerpo: previewTipo === "claves" ? cuerpo : undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "No se pudo ver el correo");
        setPreviewSubject(data.subject || "");
        setPreviewHtml(data.html || "");
      } catch (err) {
        addToast(err.message || "No se pudo ver el correo", "error");
      } finally {
        setPreviewLoading(false);
      }
    }, previewTipo === "claves" ? 400 : 0);
    return () => clearTimeout(timer);
  }, [previewTipo, sorteoId, asunto, cuerpo, nombre, email, addToast]);

  return (
    <div className="max-w-6xl" style={{ display: "grid", gap: 16 }}>
      <div>
        <h1 className="text-2xl font-semibold text-white mb-1">Correos y WhatsApp</h1>
        <p className="text-sm text-zinc-500">
          Eliges el sorteo, escribes el mensaje y pulsas el botón verde
          <strong> Guardar el mensaje que se envía</strong>. Hasta que no lo pulses, las
          ventas siguen con el texto anterior. El correo sale solo si la persona dejó email.
          WhatsApp no sale solo: en la venta se abre el chat y tú pulsas enviar.
        </p>
      </div>

      <section className="correo-caja">
        <label>
          Sorteo
          <select value={sorteoId} onChange={(e) => setSorteoId(e.target.value)}>
            {cargandoSorteos ? <option value="">Cargando sorteos…</option> : null}
            {!cargandoSorteos && sorteos.length === 0 ? <option value="">Sin sorteos</option> : null}
            {sorteos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre || s.premio}
                {s.trabajando ? " · cobrando aquí" : ""}
              </option>
            ))}
          </select>
        </label>
        {errorSorteos ? <p className="ayuda">{errorSorteos}</p> : null}
        {cargandoSorteos ? <p className="ayuda">Cargando el sorteo. En un momento puedes escribir el mensaje.</p> : null}
      </section>

      {!cargandoSorteos && sorteo ? (
      <div className="correo-par">
        <section className="correo-caja">
          <h2>WhatsApp</h2>
          <p className="ayuda">
            Este texto es el que se abre en el chat de la persona. No se envía solo: Daniel pulsa enviar en WhatsApp.
            Deja {"{nombre}"} y {"{numeros}"} para que se completen solos.
          </p>
          <label>
            Mensaje
            <textarea value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </label>
          <div className="correo-vars">
            <button type="button" onClick={() => setWhatsapp((v) => pegar(v, "{nombre}"))}>
              + nombre
            </button>
            <button type="button" onClick={() => setWhatsapp((v) => pegar(v, "{numeros}"))}>
              + números
            </button>
          </div>
          <div className="correo-wa__burbuja">{vistaWhatsapp || "El mensaje se ve aquí."}</div>
          <label>
            Celular de prueba
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="3001234567"
              inputMode="tel"
            />
          </label>
          {enlaceWhatsapp ? (
            <a className="correo-btn correo-btn--wa" href={enlaceWhatsapp} target="_blank" rel="noreferrer">
              Probar en WhatsApp
            </a>
          ) : (
            <button
              type="button"
              className="correo-btn correo-btn--wa"
              onClick={() => addToast("Escribe un celular de 10 dígitos.", "error")}
            >
              Probar en WhatsApp
            </button>
          )}
          <p className="ayuda">Abre el chat de prueba. Tú tienes que pulsar enviar. No guarda el mensaje.</p>
        </section>

        <section className="correo-caja">
          <h2>Correo de la venta</h2>
          <p className="ayuda">
            Este correo sí sale solo, cuando la venta tiene email. Deja {"{nombre}"} y {"{numeros}"}.
          </p>
          <label>
            Asunto
            <input value={asunto} onChange={(e) => setAsunto(e.target.value)} />
          </label>
          <label>
            Mensaje
            <textarea value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} />
          </label>
          <div className="correo-vars">
            <button type="button" onClick={() => setCuerpo((v) => pegar(v, "{nombre}"))}>
              + nombre
            </button>
            <button type="button" onClick={() => setCuerpo((v) => pegar(v, "{numeros}"))}>
              + números
            </button>
          </div>
          <label>
            Nombre de prueba
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </label>
          <label>
            Email de prueba
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </label>
          <button type="button" className="correo-btn correo-btn--ghost" disabled={enviando} onClick={enviarPrueba}>
            {enviando ? "Enviando…" : "Mandar un correo de prueba"}
          </button>
          <p className="ayuda">Solo llega a ese email de prueba. No guarda el mensaje de las ventas.</p>
        </section>
      </div>
      ) : null}

      {!cargandoSorteos && sorteo ? (
      <div className="correo-guardar">
        <button type="button" className="correo-btn correo-btn--lima" disabled={guardando || !sorteoId} onClick={guardar}>
          {guardando ? "Guardando…" : "Guardar el mensaje que se envía"}
        </button>
        <span>
          Este es el botón que deja el WhatsApp y el correo de <strong>{sorteo.nombre || sorteo.premio}</strong>.
          Las pruebas de arriba no lo guardan.
        </span>
      </div>
      ) : null}

      <section className="correo-caja">
        <h2>Vista previa del correo</h2>
        <div className="correo-acciones">
          <button
            type="button"
            className={`correo-btn ${previewTipo === "claves" ? "correo-btn--lima" : "correo-btn--ghost"}`}
            onClick={() => setPreviewTipo("claves")}
          >
            Venta
          </button>
          {OTROS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`correo-btn ${previewTipo === p.id ? "correo-btn--lima" : "correo-btn--ghost"}`}
              onClick={() => setPreviewTipo(p.id)}
            >
              {p.titulo}
            </button>
          ))}
        </div>
        <p className="ayuda">
          {previewTipo === "claves"
            ? "Así llega el correo de esta venta, con el texto que estás escribiendo."
            : OTROS.find((p) => p.id === previewTipo)?.desc}
        </p>
        <div className="correo-preview">
          <div className="correo-preview__bar">
            <span>Asunto</span>
            <strong>{previewLoading && !previewSubject ? "Cargando…" : previewSubject || "—"}</strong>
          </div>
          {previewHtml ? (
            <iframe title="Vista previa del correo" srcDoc={previewHtml} />
          ) : (
            <p className="ayuda" style={{ padding: 24, textAlign: "center" }}>
              {previewLoading ? "Armando el correo…" : "La vista previa aparece aquí."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
