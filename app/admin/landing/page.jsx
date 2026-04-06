"use client";

import { useEffect, useState, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { getAdminAuthHeaders } from "@/lib/auth";
import { useToast } from "@/components/admin/Toast";

export default function AdminLandingPage() {
  const { addToast } = useToast();
  const [imagenIzq, setImagenIzq] = useState(null);
  const [imagenDer, setImagenDer] = useState(null);
  const [subiendoIzq, setSubiendoIzq] = useState(false);
  const [subiendoDer, setSubiendoDer] = useState(false);
  const inputIzqRef = useRef(null);
  const inputDerRef = useRef(null);
  const [whatsappNumero, setWhatsappNumero] = useState("+573137453511");
  const [whatsappActivo, setWhatsappActivo] = useState(true);
  const [guardandoWa, setGuardandoWa] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabaseBrowser
        .from("configuracion")
        .select(
          "imagen_banner_izquierda, imagen_banner_derecha, whatsapp_numero, whatsapp_activo"
        )
        .eq("id", "global")
        .maybeSingle();

      if (error) {
        console.error("[landing admin] cargar config:", error.message);
        return;
      }
      if (data) {
        setImagenIzq(data.imagen_banner_izquierda || null);
        setImagenDer(data.imagen_banner_derecha || null);
        if (
          data.whatsapp_numero != null &&
          String(data.whatsapp_numero).trim() !== ""
        ) {
          setWhatsappNumero(String(data.whatsapp_numero).trim());
        }
        setWhatsappActivo(data.whatsapp_activo !== false);
      }
    })();
  }, []);

  async function guardarConfiguracion({ izquierda, derecha }) {
    const { error } = await supabaseBrowser.from("configuracion").upsert(
      {
        id: "global",
        imagen_banner_izquierda: izquierda ?? null,
        imagen_banner_derecha: derecha ?? null,
      },
      { onConflict: "id" }
    );
    if (error) throw new Error(error.message);
  }

  async function subirBanner(file) {
    const formData = new FormData();
    formData.append("file", file);
    const auth = await getAdminAuthHeaders();
    const res = await fetch("/api/upload/rifa", {
      method: "POST",
      headers: { ...auth },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al subir");
    return data.url;
  }

  async function handleCambiarIzquierda(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSubiendoIzq(true);
    try {
      const url = await subirBanner(file);
      await guardarConfiguracion({
        izquierda: url,
        derecha: imagenDer,
      });
      setImagenIzq(url);
      addToast("Imagen izquierda guardada correctamente", "success");
    } catch (err) {
      addToast(err.message || "Error al guardar imagen izquierda", "error");
    } finally {
      setSubiendoIzq(false);
    }
  }

  async function guardarWhatsAppFlotante() {
    setGuardandoWa(true);
    try {
      const { error } = await supabaseBrowser.from("configuracion").upsert(
        {
          id: "global",
          imagen_banner_izquierda: imagenIzq,
          imagen_banner_derecha: imagenDer,
          whatsapp_numero: whatsappNumero.trim() || "+573137453511",
          whatsapp_activo: Boolean(whatsappActivo),
        },
        { onConflict: "id" }
      );
      if (error) throw new Error(error.message);
      addToast("WhatsApp flotante guardado correctamente", "success");
    } catch (err) {
      addToast(err.message || "Error al guardar WhatsApp", "error");
    } finally {
      setGuardandoWa(false);
    }
  }

  async function handleCambiarDerecha(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSubiendoDer(true);
    try {
      const url = await subirBanner(file);
      await guardarConfiguracion({
        izquierda: imagenIzq,
        derecha: url,
      });
      setImagenDer(url);
      addToast("Imagen derecha guardada correctamente", "success");
    } catch (err) {
      addToast(err.message || "Error al guardar imagen derecha", "error");
    } finally {
      setSubiendoDer(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-2">
        Configuración de Landing
      </h1>
      <p className="text-zinc-400 text-sm mb-8">
        Personaliza las imágenes del banner principal
      </p>

      <div className="space-y-6 max-w-xl">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-medium text-white mb-4">
            Imagen izquierda (banner)
          </h2>
          <div
            className="bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center mb-4 overflow-hidden"
            style={{ minHeight: "120px" }}
          >
            <img
              src={imagenIzq || "/moto.png"}
              alt="Vista previa izquierda"
              className="max-h-[200px] w-full object-contain"
            />
          </div>
          <input
            ref={inputIzqRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCambiarIzquierda}
          />
          <button
            type="button"
            disabled={subiendoIzq}
            onClick={() => inputIzqRef.current?.click()}
            className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 font-semibold rounded-lg text-sm"
          >
            {subiendoIzq ? "Subiendo…" : "Cambiar imagen"}
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-medium text-white mb-4">
            Imagen derecha (banner)
          </h2>
          <div
            className="bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center mb-4 overflow-hidden"
            style={{ minHeight: "120px" }}
          >
            <img
              src={imagenDer || "/carro.png"}
              alt="Vista previa derecha"
              className="max-h-[200px] w-full object-contain"
            />
          </div>
          <input
            ref={inputDerRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCambiarDerecha}
          />
          <button
            type="button"
            disabled={subiendoDer}
            onClick={() => inputDerRef.current?.click()}
            className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 font-semibold rounded-lg text-sm"
          >
            {subiendoDer ? "Subiendo…" : "Cambiar imagen"}
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-medium text-white mb-2">
            WhatsApp flotante
          </h2>
          <p className="text-zinc-500 text-sm mb-4">
            Botón fijo visible en la landing y en inicio (esquina inferior
            derecha).
          </p>

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-zinc-300 text-sm font-medium">
              Mostrar botón
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={whatsappActivo}
              onClick={() => setWhatsappActivo((v) => !v)}
              className={`relative w-12 h-7 rounded-full border-2 transition-colors shrink-0 ${
                whatsappActivo
                  ? "bg-green-600/40 border-green-500/60"
                  : "bg-zinc-700 border-zinc-600"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all ${
                  whatsappActivo ? "left-6 bg-green-400" : "left-0.5 bg-zinc-400"
                }`}
              />
            </button>
            <span
              className={`text-xs font-semibold ${
                whatsappActivo ? "text-green-400" : "text-red-400"
              }`}
            >
              {whatsappActivo ? "Activado" : "Desactivado"}
            </span>
          </div>

          <label className="block text-sm text-zinc-400 mb-2">
            Número de WhatsApp
          </label>
          <input
            type="text"
            value={whatsappNumero}
            onChange={(e) => setWhatsappNumero(e.target.value)}
            placeholder="+573137453511"
            className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 mb-4 text-sm"
            autoComplete="tel"
          />

          <button
            type="button"
            disabled={guardandoWa}
            onClick={guardarWhatsAppFlotante}
            className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 font-semibold rounded-lg text-sm"
          >
            {guardandoWa ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
