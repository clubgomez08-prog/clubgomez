"use client";

import { useEffect } from "react";
import Header from "@/components/club-gomez/Header";
import AmbientBg from "@/components/club-gomez/AmbientBg";
import HeroCarousel from "@/components/club-gomez/HeroCarousel";
import DestacadoClub from "@/components/club-gomez/DestacadoClub";
import BeneficiosCards from "@/components/club-gomez/BeneficiosCards";
import BeneficiosDelMes from "@/components/club-gomez/BeneficiosDelMes";
import Membresias from "@/components/club-gomez/Membresias";
import Testimonios from "@/components/club-gomez/Testimonios";
import VerMisClaves from "@/components/club-gomez/VerMisClaves";
import Footer from "@/components/club-gomez/Footer";
import { trackViewContent } from "@/lib/club-gomez/meta-pixel";
import { CAMPANA_LANDING_DEFAULT } from "@/lib/club-gomez/campana-landing";

export default function HomePage({ campana = CAMPANA_LANDING_DEFAULT }) {
  useEffect(() => {
    trackViewContent();
  }, []);

  return (
    <div className="cg-home">
      <AmbientBg />
      <Header />
      <main className="cg-home__main">
        <HeroCarousel campana={campana} />
        <DestacadoClub campana={campana} />
        <BeneficiosCards />
        <BeneficiosDelMes />
        <Membresias />
        <Testimonios />
        <VerMisClaves />
      </main>
      <Footer />
    </div>
  );
}
