"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Hero from "@/features/landing-page/Hero";
import HowItWorks from "@/features/landing-page/HowItWorks";
import Engagement from "@/features/landing-page/Engagement";
import Pricing from "@/features/landing-page/Pricing";
import Testimonials from "@/features/landing-page/Testimonials";
import ContactUs from "@/features/landing-page/ContactUs";
import Footer from "@/components/layout/Footer";
import LandingAnimationObserver from "@/features/landing-page/LandingAnimationObserver";
import "@/features/landing-page/landing-animations.css";

export default function Home() {
  return (
    <div className="font-sf min-h-screen overflow-x-clip bg-white text-[#0F172A] selection:bg-blue-500 selection:text-white">
      <Header />
      <main className="flex flex-col">
        <Hero />
        {/* Client, 2026-10-05: "Your Health, All in One Place" above How
            It Works; What Members Get folded into How It Works; reviews as
            a moving banner rather than a section of their own. */}
        <Testimonials />
        <Engagement />
        <HowItWorks />
        <Pricing eyebrow="Pricing" sideCtaVariant="outline" />
        <ContactUs />
      </main>
      <Footer />
    </div>
  );
}
