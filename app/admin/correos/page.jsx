"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminAuthHeaders } from "@/lib/auth";
import { useToast } from "@/components/admin/Toast";

const LIME = "#B8E351";

const PLANTILLAS = [
  {
    id: "claves",
    titulo: "Confirmación + oportunidades",
    desc: "Al activar membresía: mes, beneficios con fechas, aliados comerciales y oportunidades.",
  },
  {
    id: "bienvenida",
    titulo: "Bienvenida (registro)",
    desc: "Al crear la cuenta, antes de suscribirse.",
  },
  {
    id: "cumpleanos",
    titulo: "Felicitación de cumpleaños",
    desc: "Cron diario cuando es el cumpleaños del miembro.",
  },
  {
    id: "ganador",
    titulo: "Resultado favorecido",
    desc: "Cuando una oportunidad coincide con el beneficio del día.",
  },
];

export default function AdminCorreosPage() {
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("Darwin Pabon");
  const [enviando, setEnviando] = useState(null);
  const [ultimo, setUltimo] = useState(null);
  const [previewTipo, setPreviewTipo] = useState("claves");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const cargarPreview = useCallback(
    async (tipo) => {
      setPreviewLoading(true);
      try {
        const headers = {
          ...(await getAdminAuthHeaders()),
          "Content-Type": "application/json",
        };
        const res = await fetch("/api/admin/email-preview", {
          method: "POST",
          headers,
          body: JSON.stringify({
            tipo,
            nombre: nombre.trim() || "Miembro Prueba",
            email: email.trim() || "preview@clubgomez.co",
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "No se pudo generar preview");
        setPreviewTipo(tipo);
        setPreviewSubject(data.subject || "");
        setPreviewHtml(data.html || "");
      } catch (err) {
        addToast(err.message || "Error en preview", "error");
      } finally {
        setPreviewLoading(false);
      }
    },
    [nombre, email, addToast]
  );

  useEffect(() => {
    cargarPreview("claves");
    // Solo al montar la primera vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enviar(tipo) {
    const dest = email.trim();
    if (!dest || !dest.includes("@")) {
      addToast("Escribe un email destino válido", "error");
      return;
    }

    setEnviando(tipo);
    setUltimo(null);
    try {
      const headers = {
        ...(await getAdminAuthHeaders()),
        "Content-Type": "application/json",
      };
      const res = await fetch("/api/admin/email-prueba", {
        method: "POST",
        headers,
        body: JSON.stringify({
          tipo,
          emailDestino: dest,
          nombre: nombre.trim() || "Miembro Prueba",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "No se pudo enviar");
      }
      setUltimo(data);
      addToast(data.message || "Correo enviado", "success");
    } catch (err) {
      addToast(err.message || "Error al enviar", "error");
    } finally {
      setEnviando(null);
    }
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Correos</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Previsualiza las plantillas reales (con beneficios y fechas del mes) y
        envía pruebas con Resend.
      </p>

      <div
        className="bg-zinc-900 rounded-xl p-5 mb-6 grid gap-3 sm:grid-cols-2"
        style={{ border: "1px solid rgba(184,227,81,0.2)" }}
      >
        <label className="grid gap-1 text-sm text-zinc-400">
          Email destino (solo para enviar prueba)
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white"
          />
        </label>
        <label className="grid gap-1 text-sm text-zinc-400">
          Nombre en el correo
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Miembro Prueba"
            className="px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white"
          />
        </label>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] gap-5 items-start">
        <div className="grid gap-3">
          {PLANTILLAS.map((p) => {
            const activo = previewTipo === p.id;
            return (
              <div
                key={p.id}
                className="bg-zinc-900 rounded-xl p-4 grid gap-3"
                style={{
                  border: activo
                    ? "1px solid rgba(184,227,81,0.45)"
                    : "1px solid rgba(184,227,81,0.15)",
                }}
              >
                <div>
                  <h2 className="text-white font-semibold text-sm">{p.titulo}</h2>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={previewLoading}
                    onClick={() => cargarPreview(p.id)}
                    className="px-3 py-2 rounded-lg text-xs font-bold border border-zinc-600 text-zinc-200 hover:bg-zinc-800"
                  >
                    {previewLoading && previewTipo === p.id
                      ? "Cargando…"
                      : "Previsualizar"}
                  </button>
                  {p.id !== "ganador" ? (
                    <button
                      type="button"
                      disabled={Boolean(enviando)}
                      onClick={() => enviar(p.id)}
                      className="px-3 py-2 rounded-lg text-xs font-bold"
                      style={{
                        background: LIME,
                        color: "#050607",
                        opacity: enviando ? 0.65 : 1,
                      }}
                    >
                      {enviando === p.id ? "Enviando…" : "Enviar prueba"}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}

          {ultimo ? (
            <div
              className="rounded-xl p-4 text-sm"
              style={{
                background: "rgba(184,227,81,0.08)",
                border: "1px solid rgba(184,227,81,0.25)",
                color: "#e4e4e7",
              }}
            >
              <p className="font-semibold" style={{ color: LIME }}>
                Último envío OK
              </p>
              <p className="mt-1 text-xs">{ultimo.message}</p>
              {ultimo.id ? (
                <p className="mt-1 text-zinc-500 text-[11px] font-mono">
                  Resend: {ultimo.id}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div
          className="bg-zinc-900 rounded-xl overflow-hidden min-h-[640px] flex flex-col"
          style={{ border: "1px solid rgba(184,227,81,0.2)" }}
        >
          <div
            className="px-4 py-3 border-b border-zinc-800 flex flex-wrap items-center gap-2"
            style={{ background: "rgba(0,0,0,0.35)" }}
          >
            <span className="text-xs text-zinc-500">Asunto</span>
            <span className="text-sm text-white font-medium truncate flex-1">
              {previewSubject || "—"}
            </span>
            <button
              type="button"
              disabled={previewLoading || !previewTipo}
              onClick={() => cargarPreview(previewTipo)}
              className="text-xs px-2.5 py-1.5 rounded-md border border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              Actualizar preview
            </button>
          </div>
          <div className="flex-1 bg-zinc-950 p-3 sm:p-4">
            {previewLoading && !previewHtml ? (
              <p className="text-sm text-zinc-500 text-center py-20">
                Generando preview…
              </p>
            ) : previewHtml ? (
              <iframe
                title="Vista previa del correo"
                srcDoc={previewHtml}
                className="w-full rounded-lg bg-white"
                style={{
                  minHeight: 620,
                  height: "70vh",
                  border: "1px solid #e5e7eb",
                }}
              />
            ) : (
              <p className="text-sm text-zinc-500 text-center py-20">
                Elige una plantilla para previsualizar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
