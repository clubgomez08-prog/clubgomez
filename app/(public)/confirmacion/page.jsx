"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const participanteId = searchParams.get("participante") || searchParams.get("external_reference");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (!participanteId) {
      setError("No se especificó participante");
      setLoading(false);
      return;
    }

    fetch(`/api/participantes/${participanteId}`)
      .then((res) => res.json())
      .then((participante) => {
        if (participante.error) throw new Error(participante.error);
        setData(participante);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [participanteId]);

  useEffect(() => {
    if (!data?.id) return;

    const url = typeof window !== "undefined"
      ? `${window.location.origin}/confirmacion?participante=${data.id}`
      : "";

    QRCode.toDataURL(url, { width: 200, margin: 2 })
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, [data?.id]);

  function formatPrecio(n) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  }

  function shareWhatsApp() {
    const rifaId = data?.rifa_id;
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const link = rifaId ? `${baseUrl}/?rifa=${rifaId}` : baseUrl;
    const text = encodeURIComponent(
      `¡Participa en esta rifa! ${link}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-display text-2xl text-white mb-4">Error</h1>
          <p className="text-zinc-400 mb-6">{error || "No se encontró el participante"}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <h1 className="font-display text-4xl md:text-5xl text-amber-500 mb-2">
            ¡Compra Exitosa!
          </h1>
          <p className="text-zinc-400 text-sm mb-8">
            Tu ticket digital está listo
          </p>

          <div className="space-y-4 text-left mb-8">
            <div>
              <p className="text-zinc-500 text-sm">Participante</p>
              <p className="text-white font-medium text-lg">{data.nombre}</p>
            </div>

            <div>
              <p className="text-zinc-500 text-sm">Boletos comprados</p>
              <p className="text-white font-medium">{data.cantidad_boletos}</p>
            </div>

            <div>
              <p className="text-zinc-500 text-sm">Total pagado</p>
              <p className="text-amber-500 font-semibold text-xl">
                {formatPrecio(data.total_pagado ?? 0)}
              </p>
            </div>

            <div>
              <p className="text-zinc-500 text-sm mb-2">Números asignados</p>
              {data.boletos && data.boletos.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.boletos.map((n) => (
                    <span
                      key={n}
                      className="px-3 py-1 bg-zinc-800 text-amber-400 rounded-lg text-sm font-mono"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">
                  Tu numeración será asignada tras confirmar el pago
                </p>
              )}
            </div>
          </div>

          {qrUrl && (
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-white rounded-xl inline-block">
                <img src={qrUrl} alt="QR del ticket" width={200} height={200} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={shareWhatsApp}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-colors"
            >
              Compartir en WhatsApp
            </button>
            <Link
              href="/"
              className="block w-full py-3 px-4 text-center bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-xl transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <ConfirmacionContent />
    </Suspense>
  );
}
