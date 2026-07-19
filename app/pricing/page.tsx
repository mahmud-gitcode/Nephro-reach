"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PricingHero from "@/components/homePage/PricingHero";
import Pricing from "@/components/homePage/Pricing";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans">
      <div>
        <Header />
        <PricingHero />
        <Pricing />
      </div>
      <Footer />
    </div>
  );
}
