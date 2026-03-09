"use client";

import { useEffect, useState, useRef } from "react";
import Hero from "@/components/public/Hero";
import Contador from "@/components/public/Contador";
import PaquetesBoletos from "@/components/public/PaquetesBoletos";
import PremiosAnticipados from "@/components/public/PremiosAnticipados";
import ComoFunciona from "@/components/public/ComoFunciona";
import Seguridad from "@/components/public/Seguridad";
import FormRegistro from "@/components/public/FormRegistro";

export default function LandingPage() {
  const [rifa, setRifa] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
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

  function handlePackageSelect(cantidad) {
    setSelectedPackage(cantidad);
    document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#071521] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!rifa) {
    return (
      <main className="min-h-screen bg-[#071521] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-white font-extrabold text-3xl md:text-4xl mb-4">
            No hay rifas activas en RIFEX
          </h1>
          <p className="text-zinc-400">
            No hay rifas activas en este momento. Vuelve pronto para participar.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#071521]">
      <Hero
        rifa={rifa}
        stats={stats}
        onParticipar={() => paquetesRef.current?.scrollIntoView({ behavior: "smooth" })}
        paquetesRef={paquetesRef}
      />
      <Contador rifa={rifa} initialStats={stats} />
      <PremiosAnticipados premios={rifa.premios_anticipados} />
      <PaquetesBoletos
        rifa={rifa}
        selectedPackage={selectedPackage}
        onSelect={handlePackageSelect}
        refProp={paquetesRef}
      />
      <ComoFunciona />
      <Seguridad />
      <FormRegistro
        rifa={rifa}
        cantidadBoletos={selectedPackage}
        onSuccess={(data) => {
          if (typeof window !== "undefined") {
            window.location.href = `/confirmacion?participante=${data.id}`;
          }
        }}
      />
    </main>
  );
}
