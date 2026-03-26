"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Hero from "@/components/public/Hero";
import PaquetesBoletos, { PAQUETES } from "@/components/public/PaquetesBoletos";
import PremiosAnticipados from "@/components/public/PremiosAnticipados";
import NumeroBendecido from "@/components/public/NumeroBendecido";
import ReenviarCodigos from "@/components/public/ReenviarCodigos";
import WhatsAppFlotante from "@/components/public/WhatsAppFlotante";

const comprasEnVivo = [
  { nombre: "Carlos M.", cantidad: 10, tiempo: "hace 2 min" },
  { nombre: "Valentina R.", cantidad: 25, tiempo: "hace 5 min" },
  { nombre: "Juan P.", cantidad: 5, tiempo: "hace 8 min" },
  { nombre: "Daniela S.", cantidad: 50, tiempo: "hace 12 min" },
  { nombre: "Andrés G.", cantidad: 100, tiempo: "hace 15 min" },
  { nombre: "María L.", cantidad: 10, tiempo: "hace 18 min" },
];

export default function LandingPage() {
  const searchParams = useSearchParams();
  const [rifas, setRifas] = useState([]);
  const [rifaActual, setRifaActual] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [divisa, setDivisa] = useState("COP");
  const [tasas, setTasas] = useState({ COP: 1, USD: 1, VES: 1, EUR: 1, MXN: 1 });
  const [cargandoTasas, setCargandoTasas] = useState(true);
  const paquetesRef = useRef(null);
  const [whatsappNumero, setWhatsappNumero] = useState("+573114405488");
  const [whatsappActivo, setWhatsappActivo] = useState(true);

  const rifa = rifas?.[rifaActual] ?? null;
  const stats = rifa ? {
    vendidos: rifa.boletos_vendidos ?? 0,
    disponibles: (rifa.total_numeros ?? 10000) - (rifa.boletos_vendidos ?? 0),
    porcentaje: rifa.total_numeros
      ? (((rifa.boletos_vendidos ?? 0) / rifa.total_numeros) * 100).toFixed(1)
      : 0,
  } : null;

  useEffect(() => {
    supabaseBrowser
      .from("configuracion")
      .select("whatsapp_numero, whatsapp_activo")
      .eq("id", "global")
      .single()
      .then(({ data, error }) => {
        if (error || !data) return;
        if (
          data.whatsapp_numero != null &&
          String(data.whatsapp_numero).trim() !== ""
        ) {
          setWhatsappNumero(String(data.whatsapp_numero).trim());
        }
        setWhatsappActivo(data.whatsapp_activo !== false);
      })
      .catch(() => {});

    fetch("/api/rifas", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const rifaId = new URLSearchParams(window.location.search).get("rifa");
        const todas = Array.isArray(data) ? data : [];
        const norm = (id) => String(id ?? "").trim().toLowerCase();
        const rid = rifaId ? norm(rifaId) : "";

        const activas = todas
          .filter((r) => r.estado === "activa" || !r.estado)
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        let lista = activas.length > 0 ? activas : todas;

        if (rid) {
          let idx = lista.findIndex((r) => norm(r.id) === rid);
          if (idx < 0) {
            const pedida = todas.find((r) => norm(r.id) === rid);
            if (pedida) {
              lista = [
                pedida,
                ...lista.filter((r) => norm(r.id) !== rid),
              ];
              idx = 0;
            } else {
              idx = 0;
            }
          }
          setRifas(lista);
          setRifaActual(idx);
        } else {
          setRifas(lista);
          setRifaActual(0);
        }
      })
      .catch(() => setRifas([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (rifas.length === 0) return;
    const rid = searchParams.get("rifa");
    if (!rid) return;
    const norm = (id) => String(id ?? "").trim().toLowerCase();
    const idx = rifas.findIndex((r) => norm(r.id) === norm(rid));
    if (idx >= 0) setRifaActual(idx);
  }, [rifas, searchParams]);

  const irAnterior = () =>
    setRifaActual((prev) => (prev === 0 ? rifas.length - 1 : prev - 1));
  const irSiguiente = () =>
    setRifaActual((prev) => (prev === rifas.length - 1 ? 0 : prev + 1));

  useEffect(() => {
    setSelectedPackage(PAQUETES[0]);
  }, [rifaActual]);

  useEffect(() => {
    const obtenerTasas = async () => {
      try {
        setCargandoTasas(true);
        const res = await fetch("https://api.frankfurter.app/latest?from=COP&to=USD,EUR,MXN");
        const data = await res.json();

        const tasaVES = 0.000025;

        setTasas({
          COP: 1,
          USD: data.rates.USD,
          EUR: data.rates.EUR,
          MXN: data.rates.MXN,
          VES: tasaVES,
        });
      } catch (error) {
        setTasas({
          COP: 1,
          USD: 0.00025,
          EUR: 0.00023,
          MXN: 0.0043,
          VES: 0.000025,
        });
      } finally {
        setCargandoTasas(false);
      }
    };
    obtenerTasas();
  }, []);

  const convertirPrecio = (precioEnCOP) => {
    if (!precioEnCOP) return "0";
    const convertido = precioEnCOP * tasas[divisa];

    const formatos = {
      COP: { locale: "es-CO", currency: "COP", decimals: 0 },
      USD: { locale: "en-US", currency: "USD", decimals: 2 },
      EUR: { locale: "de-DE", currency: "EUR", decimals: 2 },
      MXN: { locale: "es-MX", currency: "MXN", decimals: 0 },
      VES: { locale: "es-VE", currency: "VES", decimals: 2 },
    };

    const fmt = formatos[divisa];
    return new Intl.NumberFormat(fmt.locale, {
      style: "currency",
      currency: fmt.currency,
      minimumFractionDigits: fmt.decimals,
      maximumFractionDigits: fmt.decimals,
    }).format(convertido);
  };

  function handlePackageSelect(cantidad) {
    setSelectedPackage(cantidad);
    paquetesRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!rifa) {
    return (
      <main className="min-h-screen bg-[#F1F5F9] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-[#071521] font-extrabold text-3xl md:text-4xl mb-4">
            No hay rifas activas en RIFEX
          </h1>
          <p className="text-[#334155]">
            No hay rifas activas en este momento. Vuelve pronto para participar.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{
          backgroundImage: "url('/fondo_principalino.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* Header fijo */}
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 100,
        minHeight: "56px",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        backgroundColor: "rgba(0,0,0,0.25)",
        borderBottom: "1px solid rgba(242,178,51,0.15)",
        padding: "4px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <img
          src="/logo_principal.png"
          alt="RIFEX"
          style={{
            height: "40px",
            objectFit: "contain",
            transform: "scale(2.2)",
            transformOrigin: "left center",
          }}
        />
        <a href="/mis-tickets" style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          backgroundColor: "transparent",
          border: "1.5px solid #F2B233",
          borderRadius: "999px",
          padding: "6px 14px",
          color: "#F2B233",
          fontSize: "13px",
          fontWeight: "700",
          textDecoration: "none",
          fontFamily: "Poppins, sans-serif",
        }}>
          🎟 Mis tickets
        </a>
      </div>

      {/* Contenedor con paddingTop para no quedar debajo del header */}
      <div style={{ paddingTop: "56px" }}>
        {/* Barra EN VIVO */}
        <div style={{
          backgroundColor: "rgba(1,4,9,0.98)",
          borderBottom: "1px solid rgba(242,178,51,0.2)",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          overflow: "hidden",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            flexShrink: 0,
          }}>
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <polyline
                points="0,10 3,10 5,4 7,12 9,2 11,8 13,6 15,9 17,5 20,5"
                stroke="#22C55E"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            <span style={{
              color: "#22C55E",
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "0.5px",
            }}>
              EN VIVO
            </span>
          </div>
          <div style={{
            width: "1px", height: "16px",
            backgroundColor: "rgba(242,178,51,0.3)",
            flexShrink: 0,
          }} />
          <div style={{
            overflow: "hidden",
            flex: 1,
            maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          }}>
            <div style={{
              display: "flex",
              gap: "40px",
              animation: "scrollLeft 18s linear infinite",
              width: "max-content",
            }}>
              {[...comprasEnVivo, ...comprasEnVivo].map((c, i) => (
                <span key={i} style={{
                  color: "#F8FAFC",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}>
                  <span style={{ color: "#F2B233", fontWeight: "700" }}>
                    {c.nombre}
                  </span>
                  {" compró "}
                  <span style={{ color: "#22C55E", fontWeight: "700" }}>
                    {c.cantidad} tickets
                  </span>
                  <span style={{ color: "rgba(248,250,252,0.4)", marginLeft: "4px" }}>
                    · {c.tiempo}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <Hero
        rifa={rifa}
        stats={stats}
        onParticipar={() => paquetesRef.current?.scrollIntoView({ behavior: "smooth" })}
        paquetesRef={paquetesRef}
        convertirPrecio={convertirPrecio}
      />
      {rifas?.length > 1 && (
        <>
          <button
            type="button"
            onClick={irAnterior}
            aria-label="Rifa anterior"
            style={{ position: "fixed", bottom: "24px", left: "24px", zIndex: 50 }}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white text-2xl flex items-center justify-center transition-colors"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={irSiguiente}
            aria-label="Rifa siguiente"
            style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 50 }}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white text-2xl flex items-center justify-center transition-colors"
          >
            ›
          </button>
          <div
            style={{ position: "fixed", bottom: "16px", left: "50%", transform: "translateX(-50%)", zIndex: 50 }}
            className="flex gap-2"
          >
            {rifas.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRifaActual(i)}
                aria-label={`Ir a rifa ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-opacity ${i === rifaActual ? "bg-white opacity-100" : "bg-white/50 opacity-60 hover:opacity-80"}`}
              />
            ))}
          </div>
        </>
      )}
      <PremiosAnticipados />
      <NumeroBendecido />
      <PaquetesBoletos
        rifa={rifa}
        paquetesConfig={rifa?.paquetes_tickets}
        selectedPackage={selectedPackage}
        onSelect={handlePackageSelect}
        refProp={paquetesRef}
        divisa={divisa}
        setDivisa={setDivisa}
        convertirPrecio={convertirPrecio}
        cargandoTasas={cargandoTasas}
      />
      <ReenviarCodigos />
      <WhatsAppFlotante numero={whatsappNumero} activo={whatsappActivo} />
      </div>
    </main>
  );
}
