"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Image from "next/image";

export default function AboutUsPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-white overflow-hidden">
      <Header />
      
      <main className="flex-grow w-full">
        
        {/* HERO SECTION (Image already contains text) */}
        <section className="w-full px-10">
          <img 
            src="/images/aboutHeroFrame.png" 
            alt="About Us Hero" 
            className="w-full h-auto object-contain"
          />
        </section>

        {/* FOUNDER SECTION */}
        <section className="w-full px-6 sm:px-12 md:px-[60px] lg:px-[120px] py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl md:text-[40px] font-bold text-slate-800 mb-6 leading-tight inline-block relative">
                Founded by Dr Jaime Jonsson
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#E5A8A3]" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="transparent" />
                </svg>
              </h2>
              
              <div className="space-y-6 text-slate-600 text-[17px] leading-relaxed font-medium">
                <p>
                  Eye Movement Desensitisation and Reprocessing (EMDR) is an evidence based therapy for all types of mental health problems.
                </p>
                <p>
                  Our program combines professional guidance, AI-assisted tools, and personalised support to make EMDR therapy accessible in a safe and structured way.
                </p>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="relative w-full aspect-square lg:aspect-[4/5]">
                <Image
                  src="/images/aboutImage.png"
                  alt="Dr Jaime Jonsson"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* WHO WE ARE */}
        <section className="w-full px-6 sm:px-12 md:px-[60px] lg:px-[120px] py-16 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Who We Are</h2>
          <div className="space-y-4 text-slate-600 text-[16px] leading-relaxed font-medium text-left">
            <p>
              We are a non-clinical educational engagement platform designed to support members through simple, automated, and meaningful digital interactions. Our platform helps users register by phone number, receive a unique member ID, access a private digital journal, follow a 12-week education library, and stay connected through automated SMS check-ins.
            </p>
            <p>
              Our goal is to make personal growth and learning easier through a system that works smoothly without requiring real-time human responses.
            </p>
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section className="w-full px-6 sm:px-12 md:px-[60px] lg:px-[120px] pt-16 pb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Why Choose Us</h2>
          <p className="text-slate-600 text-[16px] leading-relaxed font-medium text-left">
            We provide a simple and scalable platform that combines SMS automation, digital journaling, education, and live class access in one easy-to-use system. Members can choose the plan that fits them best, whether they want journal-only access, full membership, or a one-time class purchase. The system is designed to be user-friendly, automated, and ready for future expansion.
          </p>
        </section>

        {/* ZIGZAG LIST */}
        <section className="w-full px-6 sm:px-12 md:px-[60px] lg:px-[120px] py-12 space-y-24">
          
          {/* Item 1: Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-xl border border-slate-100">
              <Image src="/images/aboutCard.png" alt="Our Vision" fill className="object-cover" />
            </div>
            <div>
              <h3 className="text-[28px] font-bold text-slate-900 mb-4">Our Vision</h3>
              <p className="text-slate-600 text-[16px] leading-relaxed font-medium">
                To become a trusted digital education and engagement platform that helps members stay connected, accountable, and supported through simple automated tools.
              </p>
            </div>
          </div>

          {/* Item 2: Mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 md:order-1">
              <h3 className="text-[28px] font-bold text-slate-900 mb-4">Our Mission</h3>
              <p className="text-slate-600 text-[16px] leading-relaxed font-medium">
                To make learning, reflection, and personal growth easier by providing automated SMS support, digital journaling, structured education, and monthly live class access in one seamless platform.
              </p>
            </div>
            <div className="order-1 md:order-2 relative w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-xl border border-slate-100">
              <Image src="/images/aboutCard.png" alt="Our Mission" fill className="object-cover" />
            </div>
          </div>

          {/* Item 3: What We Are Not */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-xl border border-slate-100">
              <Image src="/images/aboutCard.png" alt="What We Are Not" fill className="object-cover" />
            </div>
            <div>
              <h3 className="text-[28px] font-bold text-slate-900 mb-4">What We Are Not</h3>
              <div className="space-y-4 text-slate-600 text-[16px] leading-relaxed font-medium">
                <p>
                  We are not a clinical, medical, or emergency response platform. The system does not provide diagnosis, treatment, therapy, or real-time human support.
                </p>
                <p>
                  This platform is designed for non-clinical education, engagement, journaling, and automated member support only.
                </p>
              </div>
            </div>
          </div>
          
        </section>

        {/* CORE VALUES */}
        <section className="w-full px-6 sm:px-12 md:px-[60px] lg:px-[120px] py-20 pb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-[34px] font-bold text-slate-900 mb-6">Our Core Values</h2>
            <p className="text-slate-600 text-[16px] leading-relaxed font-medium mx-auto">
              We are building a simple, supportive, and scalable platform based on trust, accessibility, automation, and meaningful member engagement.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connecting line behind cards */}
            <div className="hidden md:block absolute top-[110px] left-0 w-full h-[2px] bg-slate-200 z-0" />
            
            {/* Card 1 */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm relative z-10 flex flex-col h-full">
              <div className="h-[220px] bg-[#F7FBF8] flex items-center justify-center p-8">
                 {/* Bulb Icon Placeholder (using simple SVG based on screenshot) */}
                 <div className="w-20 h-20 relative text-orange-500">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                     <path d="M9 18h6" />
                     <path d="M10 22h4" />
                     <path d="M12 2v1" />
                     <path d="M12 7v1" />
                     <path d="M19 12h1" />
                     <path d="M4 12H3" />
                     <path d="M12 7a5 5 0 1 1 0 10H12z" />
                     <path d="M7 17l-1 1" />
                     <path d="M17 17l1 1" />
                     <path d="M17 7l1-1" />
                     <path d="M7 7L6 6" />
                   </svg>
                 </div>
              </div>
              <div className="p-8 flex-grow">
                <h3 className="text-[20px] font-bold text-slate-900 mb-4">Simplicity</h3>
                <p className="text-slate-600 text-[15px] leading-relaxed font-medium">
                  We believe member support should be easy to access, easy to understand, and simple to use.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm relative z-10 flex flex-col h-full">
              <div className="h-[220px] bg-[#F9FAF2] flex items-center justify-center p-8">
                 {/* Handshake Icon Placeholder */}
                 <div className="w-20 h-20 relative text-orange-500">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                     <path d="M8 12l-2 2a4.24 4.24 0 0 0 6 6l2-2" />
                     <path d="M16 12l2-2a4.24 4.24 0 0 0-6-6l-2 2" />
                     <path d="M15 9l-6 6" />
                     <path d="M9 15l-3 3" />
                     <path d="M15 9l3-3" />
                   </svg>
                 </div>
              </div>
              <div className="p-8 flex-grow">
                <h3 className="text-[20px] font-bold text-slate-900 mb-4">Accountability</h3>
                <p className="text-slate-600 text-[15px] leading-relaxed font-medium">
                  We help members stay engaged through consistent SMS check-ins, journaling, and structured learning.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm relative z-10 flex flex-col h-full">
              <div className="h-[220px] bg-[#FFFBF2] flex items-center justify-center p-8">
                 {/* Badge/Check Icon Placeholder */}
                 <div className="w-20 h-20 relative text-orange-500">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                     <path d="M12 15l-3-3 1.4-1.4 1.6 1.6 3.6-3.6 1.4 1.4z" />
                     <circle cx="12" cy="12" r="10" />
                     <path d="M12 22l-2-2-4 1 1-4-2-2 3-3" />
                   </svg>
                 </div>
              </div>
              <div className="p-8 flex-grow">
                <h3 className="text-[20px] font-bold text-slate-900 mb-4">Education</h3>
                <p className="text-slate-600 text-[15px] leading-relaxed font-medium">
                  We provide helpful educational resources, a 08-week curriculum, and monthly live classes to support personal growth.
                </p>
              </div>
            </div>

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
