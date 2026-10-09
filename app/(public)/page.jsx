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

export default function ClubGomezHomePage() {
  useEffect(() => {
    trackViewContent();
  }, []);

  return (
    <div className="cg-home">
      <AmbientBg />
      <Header />
      <main className="cg-home__main">
        <HeroCarousel />
        <DestacadoClub />
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
