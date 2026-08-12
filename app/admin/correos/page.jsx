"use client";

import { useState } from "react";
import { getAdminAuthHeaders } from "@/lib/auth";
import { useToast } from "@/components/admin/Toast";

const LIME = "#B8E351";

const PLANTILLAS = [
  {
    id: "claves",
    titulo: "Confirmación + claves",
    desc: "Correo que llega al activar la membresía (pago Bold / activación manual). Incluye las claves del mes.",
  },
  {
    id: "cumpleanos",
    titulo: "Felicitación de cumpleaños",
    desc: "Correo automático del cron diario cuando es el cumpleaños del miembro.",
  },
  {
    id: "bienvenida",
    titulo: "Bienvenida (registro)",
    desc: "Correo al crear la cuenta, antes de suscribirse.",
  },
];

export default function AdminCorreosPage() {
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("Miembro Prueba");
  const [enviando, setEnviando] = useState(null);
  const [ultimo, setUltimo] = useState(null);

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
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-white mb-1">
        Correos de prueba
      </h1>
      <p className="text-sm text-zinc-500 mb-6">
        Envía cada plantilla a un email real para revisar diseño y confirmar que
        Resend está conectado.
      </p>

      <div
        className="bg-zinc-900 rounded-xl p-5 mb-6 grid gap-3"
        style={{ border: "1px solid rgba(184,227,81,0.2)" }}
      >
        <label className="grid gap-1 text-sm text-zinc-400">
          Email destino
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

      <div className="grid gap-4">
        {PLANTILLAS.map((p) => (
          <div
            key={p.id}
            className="bg-zinc-900 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{ border: "1px solid rgba(184,227,81,0.15)" }}
          >
            <div className="flex-1">
              <h2 className="text-white font-semibold">{p.titulo}</h2>
              <p className="text-sm text-zinc-500 mt-1">{p.desc}</p>
            </div>
            <button
              type="button"
              disabled={Boolean(enviando)}
              onClick={() => enviar(p.id)}
              className="px-4 py-2.5 rounded-lg text-sm font-bold shrink-0"
              style={{
                background: LIME,
                color: "#050607",
                opacity: enviando ? 0.65 : 1,
              }}
            >
              {enviando === p.id ? "Enviando…" : "Enviar prueba"}
            </button>
          </div>
        ))}
      </div>

      {ultimo ? (
        <div
          className="mt-6 rounded-xl p-4 text-sm"
          style={{
            background: "rgba(184,227,81,0.08)",
            border: "1px solid rgba(184,227,81,0.25)",
            color: "#e4e4e7",
          }}
        >
          <p className="font-semibold" style={{ color: LIME }}>
            Último envío OK
          </p>
          <p className="mt-1">{ultimo.message}</p>
          {ultimo.from ? (
            <p className="mt-1 text-zinc-500 text-xs">From: {ultimo.from}</p>
          ) : null}
          {ultimo.id ? (
            <p className="mt-1 text-zinc-500 text-xs font-mono">
              Resend id: {ultimo.id}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-zinc-500">
            Revisa bandeja y spam. También puedes ver el estado en el panel de
            Resend → Emails.
          </p>
        </div>
      ) : null}
    </div>
  );
}
