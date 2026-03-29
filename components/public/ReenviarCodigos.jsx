"use client";

import { useState } from "react";

const inputClass =
  "w-full px-4 py-3 bg-white border border-[#334155]/30 rounded-lg text-[#071521] placeholder-[#334155]/60 focus:outline-none focus:ring-2 focus:ring-[#F2B233]/50 focus:border-[#F2B233]";

export default function ReenviarCodigos() {
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");

  async function handleEnviar() {
    const trimmed = email.trim();
    if (!trimmed) {
      setMensaje("Ingresa tu correo electrónico.");
      setTipoMensaje("error");
      return;
    }
    setCargando(true);
    setMensaje("");
    setTipoMensaje("");
    try {
      const res = await fetch("/api/reenviar-codigos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMensaje(
          "✅ Te reenviamos tus códigos. Revisa tu bandeja y carpeta de spam."
        );
        setTipoMensaje("success");
      } else {
        setMensaje(data.error || "No pudimos completar el reenvío.");
        setTipoMensaje("error");
      }
    } catch {
      setMensaje("Error de conexión. Intenta de nuevo.");
      setTipoMensaje("error");
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-4">
          <span
            className="inline-flex items-center justify-center rounded-full"
            style={{
              width: "56px",
              height: "56px",
              backgroundColor: "rgba(0,0,0,0.5)",
              border: "2px solid rgba(242,178,51,0.5)",
            }}
            aria-hidden
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                stroke="#F2B233"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 6l-10 7L2 6"
                stroke="#F2B233"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        <h2 className="text-white font-bold text-lg text-center mb-3 drop-shadow-sm">
          ¿No te ha llegado el correo con tus códigos?
        </h2>

        <p className="text-[#F8FAFC] text-sm text-center mb-4 leading-relaxed px-1">
          Si ya te inscribiste, tu pago fue aprobado y han pasado más de 30 minutos sin que te
          llegue el correo, ingresa tu correo electrónico para que te reenviemos tus números de
          participación.
        </p>

        <p className="text-[#F8FAFC]/70 text-xs italic text-center mb-4 leading-snug px-1">
          (Recuerda revisar tu carpeta de spam. Inscripciones con menos de 30 minutos de haberse
          realizado no se procesará el reenvío)
        </p>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            name="email-reenvio"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setMensaje("");
              setTipoMensaje("");
            }}
            className={inputClass}
            placeholder="Tu correo electrónico"
          />
          <button
            type="button"
            onClick={handleEnviar}
            disabled={cargando}
            className="w-full font-extrabold text-lg py-5 px-4 rounded-[14px] border-none cursor-pointer text-[#071521]"
            style={{
              background: "linear-gradient(135deg, #22C55E 0%, #16a34a 100%)",
              boxShadow: "0 4px 20px rgba(34,197,94,0.4)",
              letterSpacing: "0.3px",
              animation: "pulse-glow-green 2s ease-in-out infinite",
            }}
          >
            {cargando ? "Enviando..." : "Enviar mis códigos"}
          </button>
          {mensaje ? (
            <p
              className={
                tipoMensaje === "success"
                  ? "text-sm text-center text-green-400 px-1"
                  : "text-sm text-center text-red-400 px-1"
              }
            >
              {mensaje}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
