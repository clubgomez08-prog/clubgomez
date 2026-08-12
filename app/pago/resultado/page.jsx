"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { trackPurchase } from "@/lib/club-gomez/meta-pixel";

function ResultadoPagoInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("bold-order-id") || "";
  const txStatus = searchParams.get("bold-tx-status") || "";

  const [estado, setEstado] = useState(() => (orderId ? "loading" : "error"));
  const [mensaje, setMensaje] = useState(() =>
    orderId
      ? "Confirmando tu pago con Bold…"
      : "No llegó el identificador del pago."
  );
  const [clavesCount, setClavesCount] = useState(0);

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;
    let attempts = 0;

    async function confirmar() {
      attempts += 1;
      try {
        const res = await fetch("/api/bold/confirmar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, txStatus }),
        });
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (data.ok) {
          setEstado("ok");
          setClavesCount(data.clavesCount || 0);
          setMensaje(
            data.alreadyActive
              ? "Tu membresía ya estaba activa."
              : data.emailOk
                ? "Pago aprobado. Revisá tu correo: ahí están tus claves."
                : "Pago aprobado y membresía activa. Si no ves el correo, revisá spam."
          );
          trackPurchase(
            { id: "membresia", nombre: "Membresía Club Gómez", precio: 0 },
            { orderId }
          );
          return;
        }

        if (data.pending && attempts < 6) {
          setMensaje("Bold aún procesa el pago… reintentando.");
          setTimeout(confirmar, 2500);
          return;
        }

        setEstado("error");
        setMensaje(data.error || "No se pudo confirmar el pago.");
      } catch {
        if (cancelled) return;
        if (attempts < 4) {
          setTimeout(confirmar, 2500);
          return;
        }
        setEstado("error");
        setMensaje("Error de conexión al confirmar el pago.");
      }
    }

    confirmar();
    return () => {
      cancelled = true;
    };
  }, [orderId, txStatus]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(184,227,81,0.18), transparent 55%), #050607",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "var(--font-poppins), Poppins, sans-serif",
        color: "#fff",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#090909",
          border: "1px solid rgba(184,227,81,0.22)",
          borderRadius: 20,
          padding: "32px 28px",
          textAlign: "center",
        }}
      >
        <Image
          src="/club-gomez/logo-full.png"
          alt="Club Gómez"
          width={140}
          height={70}
          style={{ height: 56, width: "auto", margin: "0 auto 16px" }}
        />
        <h1 style={{ margin: "0 0 10px", fontSize: "1.4rem" }}>
          {estado === "ok"
            ? "¡Listo!"
            : estado === "error"
              ? "Pago pendiente o fallido"
              : "Confirmando…"}
        </h1>
        <p style={{ margin: "0 0 18px", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
          {mensaje}
        </p>
        {estado === "ok" && clavesCount > 0 ? (
          <p style={{ color: "#B8E351", fontWeight: 700 }}>{clavesCount} claves asignadas</p>
        ) : null}
        {orderId ? (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
            Ref: {orderId}
            {txStatus ? ` · ${txStatus}` : ""}
          </p>
        ) : null}
        <div style={{ display: "grid", gap: 10, marginTop: 22 }}>
          <Link
            href="/miembro"
            style={{
              display: "block",
              padding: "14px 18px",
              borderRadius: 12,
              background: "linear-gradient(135deg, #d4f06a, #b8e351)",
              color: "#050607",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Ir a mi cuenta
          </Link>
          <Link
            href="/"
            style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textDecoration: "none" }}
          >
            ← Volver al Club
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PagoResultadoPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#050607",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          Cargando…
        </main>
      }
    >
      <ResultadoPagoInner />
    </Suspense>
  );
}
