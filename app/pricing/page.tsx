"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Pricing from "@/components/homePage/Pricing";
import "@/components/homePage/landing-animations.css";

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sf text-[#0F172A]">
      <Header />
      <main className="flex-grow">
        <Pricing eyebrow="Pricing" sideCtaVariant="outline" />
      </main>
      <Footer />
    </div>
  );
}
