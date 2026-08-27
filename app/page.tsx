"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Hero from "@/components/homePage/Hero";
import HowItWorks from "@/components/homePage/HowItWorks";
import Engagement from "@/components/homePage/Engagement";
import Pricing from "@/components/homePage/Pricing";
import Testimonials from "@/components/homePage/Testimonials";
import WhatMembersGet from "@/components/homePage/WhatMembersGet";
import ContactUs from "@/components/homePage/ContactUs";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans text-[#0F172A] selection:bg-blue-500 selection:text-white">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Engagement />
        <Pricing />
        <Testimonials />
        <WhatMembersGet />
        <ContactUs />
      </main>
      <Footer />
    </div>
  );
}
