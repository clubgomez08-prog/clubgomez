"use client";

import { useEffect } from "react";
import Header from "@/components/club-gomez/Header";
import AmbientBg from "@/components/club-gomez/AmbientBg";
import HeroCarousel from "@/components/club-gomez/HeroCarousel";
import BendecidosPublico from "@/components/club-gomez/BendecidosPublico";
import DestacadoClub from "@/components/club-gomez/DestacadoClub";
import PremiosMismoNumero from "@/components/club-gomez/PremiosMismoNumero";
import BeneficiosCards from "@/components/club-gomez/BeneficiosCards";
import BeneficiosDelMes from "@/components/club-gomez/BeneficiosDelMes";
import Membresias from "@/components/club-gomez/Membresias";
import Testimonios from "@/components/club-gomez/Testimonios";
import VerMisClaves from "@/components/club-gomez/VerMisClaves";
import Footer from "@/components/club-gomez/Footer";
import { trackViewContent } from "@/lib/club-gomez/meta-pixel";
import { CAMPANA_LANDING_DEFAULT } from "@/lib/club-gomez/campana-landing";

export default function HomePage({
  campana = CAMPANA_LANDING_DEFAULT,
  tema = null,
  secciones = null,
  planes = null,
  introPlanes = "",
  frasePremio = "",
  sorteoSlug = "",
  cerrado = false,
  textoBanda = null,
  bloqueTarjetas = null,
  premiosExtra = null,
  premioPrincipal = "",
  textoFooter = "",
  preview = false,
}) {
  const esSorteo = Boolean(preview || sorteoSlug);

  useEffect(() => {
    if (preview) return;
    trackViewContent();
  }, [preview]);

  return (
    <div className="cg-home" style={tema || undefined}>
      <AmbientBg />
      <Header />
      <main className="cg-home__main">
        <HeroCarousel campana={campana} />
        {sorteoSlug === "navidad" ? <BendecidosPublico /> : null}
        {esSorteo || secciones?.destacado !== false ? (
          <DestacadoClub
            campana={campana}
            planesLista={esSorteo ? planes : null}
            sorteoSlug={sorteoSlug}
            cerrado={cerrado}
            anclaPlanes={esSorteo}
          />
        ) : null}
        {esSorteo ? (
          <PremiosMismoNumero
            principal={premioPrincipal}
            fotoPrincipal={campana?.fotos?.[0]?.src || ""}
            extras={premiosExtra}
          />
        ) : null}
        {secciones?.banda !== false ? <BeneficiosCards textos={textoBanda} bloque={bloqueTarjetas} /> : null}
        <BeneficiosDelMes />
        {esSorteo ? null : (
          <Membresias
            planesLista={planes}
            intro={introPlanes}
            frasePremio={frasePremio}
            sorteoSlug={sorteoSlug}
            cerrado={cerrado}
          />
        )}
        {secciones?.testimonios !== false ? <Testimonios /> : null}
        {secciones?.verClaves !== false ? <VerMisClaves /> : null}
      </main>
      <Footer linea={textoFooter} />
    </div>
  );
}
