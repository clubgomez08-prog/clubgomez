"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { construirUrlWhatsappClaves } from "@/lib/club-gomez/claves-whatsapp";

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const participanteId =
    searchParams.get("participante") || searchParams.get("external_reference");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const purchaseTracked = useRef(false);
  const lastPurchaseParticipanteIdRef = useRef(null);

  useEffect(() => {
    if (!participanteId) {
      const timer = setTimeout(() => {
        setError("No se especificó la membresía");
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const controller = new AbortController();
    if (lastPurchaseParticipanteIdRef.current !== participanteId) {
      lastPurchaseParticipanteIdRef.current = participanteId;
      purchaseTracked.current = false;
    }

    fetch(`/api/participantes/${participanteId}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((participante) => {
        if (participante.error) throw new Error(participante.error);
        setData(participante);
        if (typeof window !== "undefined" && window.fbq) {
          if (purchaseTracked.current) return;
          purchaseTracked.current = true;
          window.fbq("track", "Purchase", {
            value: participante.total_pagado,
            currency: "COP",
          });
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [participanteId]);

  useEffect(() => {
    if (!data?.id) return;
    const url =
      typeof window !== "undefined"
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

  function openWhatsAppClaves() {
    const url = construirUrlWhatsappClaves(
      {
        nombre: data?.nombre,
        planNombre: data?.rifas?.nombre || data?.plan || "Membresía",
        claves: data?.boletos || [],
      },
      { incluirMotilon: false }
    );
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#050607",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            border: "2px solid #B8E351",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#050607",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <h1 style={{ color: "#fff", fontSize: 24, marginBottom: 12 }}>Error</h1>
          <p style={{ color: "rgba(255,255,255,0.55)", marginBottom: 20 }}>
            {error || "No se encontró la membresía"}
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "12px 22px",
              background: "#B8E351",
              color: "#050607",
              fontWeight: 700,
              borderRadius: 12,
              textDecoration: "none",
            }}
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const claves = data.boletos || [];
  const planNombre = data.rifas?.nombre || "Membresía Club Gómez";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050607",
        padding: "28px 20px 56px",
        fontFamily: "var(--font-poppins), Poppins, sans-serif",
      }}
    >
      <div style={{ maxWidth: 440, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Image
            src="/club-gomez/logo-header.png"
            alt="Club Gómez"
            width={140}
            height={48}
            style={{ objectFit: "contain", margin: "0 auto" }}
          />
        </div>

        <div
          style={{
            background: "#121410",
            border: "1px solid rgba(184,227,81,0.28)",
            borderRadius: 20,
            padding: "28px 22px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 6px",
              color: "#B8E351",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Membresía activa
          </p>
          <h1
            style={{
              margin: "0 0 8px",
              fontFamily: "var(--font-bebas), Impact, sans-serif",
              fontSize: "2.4rem",
              color: "#fff",
              fontWeight: 400,
            }}
          >
            ¡Bienvenido al Club!
          </h1>
          <p style={{ margin: "0 0 24px", color: "rgba(255,255,255,0.55)", fontSize: 14 }}>
            Tus claves con oportunidades ya están listas
          </p>

          <div style={{ textAlign: "left", marginBottom: 22 }}>
            <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
              Miembro
            </p>
            <p style={{ margin: "0 0 14px", color: "#fff", fontWeight: 600, fontSize: 16 }}>
              {data.nombre}
            </p>

            <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
              Plan
            </p>
            <p style={{ margin: "0 0 14px", color: "#fff", fontWeight: 600 }}>{planNombre}</p>

            <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
              Total
            </p>
            <p
              style={{
                margin: "0 0 16px",
                color: "#B8E351",
                fontWeight: 700,
                fontSize: 20,
              }}
            >
              {formatPrecio(data.total_pagado ?? 0)}
            </p>

            <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
              Tus claves
            </p>
            {claves.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {claves.map((n) => (
                  <span
                    key={n}
                    style={{
                      padding: "8px 12px",
                      background: "#0a0c08",
                      border: "1px solid rgba(184,227,81,0.35)",
                      borderRadius: 10,
                      color: "#B8E351",
                      fontFamily: "Consolas, monospace",
                      fontSize: 13,
                    }}
                  >
                    {n}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                Tus claves se confirmarán por correo al completar el proceso.
              </p>
            )}
          </div>

          {qrUrl ? (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div style={{ padding: 12, background: "#fff", borderRadius: 14 }}>
                <img src={qrUrl} alt="QR de confirmación" width={160} height={160} />
              </div>
            </div>
          ) : null}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              type="button"
              onClick={openWhatsAppClaves}
              style={{
                width: "100%",
                padding: "14px 18px",
                border: "none",
                borderRadius: 12,
                background: "linear-gradient(135deg, #d4f06a, #b8e351, #9bcf2e)",
                color: "#050607",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Enviar mis claves por WhatsApp
            </button>
            <Link
              href="/"
              style={{
                display: "block",
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 18px",
                textAlign: "center",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
              }}
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
        <main
          style={{
            minHeight: "100vh",
            background: "#050607",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          Cargando…
        </main>
      }
    >
      <ConfirmacionContent />
    </Suspense>
  );
}
