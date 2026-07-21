"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

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
                About the Founder
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#E5A8A3]" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="transparent" />
                </svg>
              </h2>
              
              <div className="space-y-6 text-slate-600 text-[16px] md:text-[17px] leading-relaxed font-medium">
                <p>
                  Hello, I’m Joni Gathers, MSN, APRN, FNP-C, a board-certified Family Nurse Practitioner with a decade of nephrology and dialysis experience. Throughout my career as both a Dialysis Nurse and Practitioner, I’ve cared for hundreds of patients living with chronic kidney disease (CKD), end-stage kidney disease (ESKD), hypertension, diabetes, and those receiving dialysis.
                </p>
                <p>
                  Working closely with patients and families, I recognized that many hospitalizations and emergency room visits happen because patients simply don’t have access to understandable, ongoing kidney education outside of their clinic visits. Many leave appointments overwhelmed, unsure of what their lab results mean, how to manage fluid intake, what symptoms require immediate attention, or how to confidently navigate life with kidney disease.
                </p>
                <p className="font-bold text-[#1a7f80] text-lg">
                  I created NephroReach to bridge that gap.
                </p>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="relative w-full aspect-square lg:aspect-[4/5]">
                <Image
                  src="/images/aboutImage.png"
                  alt="Joni Gathers, MSN, APRN, FNP-C"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* WHAT WE OFFER */}
        <section className="w-full bg-[#F8FAFC] px-6 sm:px-12 md:px-[60px] lg:px-[120px] py-16 md:py-24">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 text-center">What We Offer</h2>
            <p className="text-slate-600 text-[17px] leading-relaxed font-medium mb-10 text-center">
              NephroReach provides:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {[
                "On-demand educational videos covering CKD, dialysis, nutrition, medications, lab values, and kidney health.",
                "Live educational sessions with experienced kidney care professionals.",
                "Interactive health tracking tools, including blood pressure, weight, medications, labs, dialysis treatments, and symptoms.",
                "Resources designed specifically for caregivers.",
                "Educational programs that help patients prepare for dialysis and better understand treatment options.",
                "Practical guidance to help patients recognize concerning symptoms, know when to contact their dialysis or nephrology team, and understand when emergency care may be necessary."
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-[#3AA5A5] shrink-0 mt-0.5" />
                  <p className="text-slate-600 font-medium leading-relaxed">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ZIGZAG LIST: MISSION, VISION, NOTICE */}
        <section className="w-full px-6 sm:px-12 md:px-[60px] lg:px-[120px] py-20 lg:py-28 space-y-24">
          
          {/* Item 1: Mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-xl border border-slate-100">
              <Image src="/images/our-mission.png" alt="Our Mission" fill className="object-cover" />
            </div>
            <div>
              <h3 className="text-[28px] lg:text-3xl font-bold text-slate-900 mb-6">Our Mission</h3>
              <div className="space-y-4 text-slate-600 text-[16px] leading-relaxed font-medium">
                <p>
                  NephroReach is an educational platform dedicated to empowering individuals living with kidney disease and the caregivers who support them. Our mission is to provide easy-to-understand, reliable kidney education that helps people make informed decisions, build confidence, and better manage their health every day.
                </p>
                <p>
                  We believe education leads to empowerment, and empowered patients experience better outcomes.
                </p>
              </div>
            </div>
          </div>

          {/* Item 2: Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 md:order-1">
              <h3 className="text-[28px] lg:text-3xl font-bold text-slate-900 mb-6">Our Vision</h3>
              <p className="text-slate-600 text-[16px] leading-relaxed font-medium">
                Our vision is to become the leading kidney education platform that supports patients and caregivers through every stage of kidney disease. We strive to improve health literacy, reduce preventable hospitalizations, encourage active participation in care, and help individuals live healthier, more confident lives.
              </p>
            </div>
            <div className="order-1 md:order-2 relative w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-xl border border-slate-100">
              <Image src="/images/our-mission.png" alt="Our Vision" fill className="object-cover" />
            </div>
          </div>

          {/* Item 3: Important Notice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-xl border border-slate-100">
              <Image src="/images/our-mission.png" alt="Important Notice" fill className="object-cover" />
            </div>
            <div>
              <h3 className="text-[28px] lg:text-3xl font-bold text-[#bd3d44] mb-6">Important Notice</h3>
              <p className="text-slate-600 text-[16px] leading-relaxed font-medium">
                NephroReach is an educational platform only. The information provided on this website is intended for educational purposes and should not replace medical advice, diagnosis, or treatment from your physician, nephrologist, dialysis care team, or other qualified healthcare provider. Always consult your healthcare provider regarding your individual medical care.
              </p>
            </div>
          </div>
          
        </section>

      </main>

      <Footer />
    </div>
  );
}
