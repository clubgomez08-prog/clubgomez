"use client";

import Header from "@/components/club-gomez/Header";
import AmbientBg from "@/components/club-gomez/AmbientBg";
import HeroCarousel from "@/components/club-gomez/HeroCarousel";
import BeneficiosPreview from "@/components/club-gomez/BeneficiosPreview";
import BeneficiosCards from "@/components/club-gomez/BeneficiosCards";
import BeneficiosDelMes from "@/components/club-gomez/BeneficiosDelMes";
import Membresias from "@/components/club-gomez/Membresias";
import Testimonios from "@/components/club-gomez/Testimonios";
import FAQ from "@/components/club-gomez/FAQ";
import Footer from "@/components/club-gomez/Footer";

export default function ClubGomezHomePage() {
  return (
    <div className="cg-home">
      <AmbientBg />
      <Header />
      <main className="cg-home__main">
        <HeroCarousel />
        <BeneficiosPreview />
        <BeneficiosCards />
        <BeneficiosDelMes />
        <Membresias />
        <Testimonios />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
