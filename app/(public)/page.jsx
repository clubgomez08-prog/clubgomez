"use client";

import { useEffect, useState, useRef } from "react";
import Hero from "@/components/public/Hero";
import PaquetesBoletos from "@/components/public/PaquetesBoletos";
import PremiosAnticipados from "@/components/public/PremiosAnticipados";

export default function LandingPage() {
  const [rifa, setRifa] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [divisa, setDivisa] = useState("COP");
  const [tasas, setTasas] = useState({ COP: 1, USD: 1, VES: 1, EUR: 1, MXN: 1 });
  const [cargandoTasas, setCargandoTasas] = useState(true);
  const paquetesRef = useRef(null);

  useEffect(() => {
    const rifaId = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("rifa")
      : null;

    fetch("/api/rifas")
      .then((res) => res.json())
      .then((data) => {
        const rifas = Array.isArray(data) ? data : [];
        let encontrada = null;

        if (rifaId) {
          encontrada = rifas.find((r) => r.id === rifaId);
        }
        if (!encontrada) {
          encontrada = rifas.find((r) => r.estado === "activa" || !r.estado) ?? rifas[0];
        }

        setRifa(encontrada ?? null);
        if (encontrada) {
          setStats({
            vendidos: encontrada.boletos_vendidos ?? 0,
            disponibles: (encontrada.total_numeros ?? 10000) - (encontrada.boletos_vendidos ?? 0),
            porcentaje: encontrada.total_numeros
              ? (((encontrada.boletos_vendidos ?? 0) / encontrada.total_numeros) * 100).toFixed(1)
              : 0,
          });
        }
      })
      .catch(() => setRifa(null))
      .finally(() => setLoading(false));
  }, []);

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
      <Hero
        rifa={rifa}
        stats={stats}
        onParticipar={() => paquetesRef.current?.scrollIntoView({ behavior: "smooth" })}
        paquetesRef={paquetesRef}
        convertirPrecio={convertirPrecio}
      />
      <PremiosAnticipados premios={rifa.premios_anticipados} />
      <PaquetesBoletos
        rifa={rifa}
        selectedPackage={selectedPackage}
        onSelect={handlePackageSelect}
        refProp={paquetesRef}
        divisa={divisa}
        setDivisa={setDivisa}
        convertirPrecio={convertirPrecio}
        cargandoTasas={cargandoTasas}
      />
    </main>
  );
}
