"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Pricing from "@/features/landing-page/Pricing";
import "@/features/landing-page/landing-animations.css";

export default function PricingPage() {
  return (
    <div className="font-sf flex min-h-screen flex-col bg-white text-[#0F172A]">
      <Header />
      <main className="flex-grow">
        <Pricing eyebrow="Pricing" sideCtaVariant="outline" />
      </main>
      <Footer />
    </div>
  );
}
