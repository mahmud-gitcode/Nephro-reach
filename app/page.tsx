"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Hero from "@/components/homePage/Hero";
import HowItWorks from "@/components/homePage/HowItWorks";
import Engagement from "@/components/homePage/Engagement";
import Pricing from "@/components/homePage/Pricing";
import WhatMembersGet from "@/components/homePage/WhatMembersGet";
import ContactUs from "@/components/homePage/ContactUs";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Engagement />
        <Pricing />
        <WhatMembersGet />
        <ContactUs />
      </main>
      <Footer />
    </div>
  );
}
