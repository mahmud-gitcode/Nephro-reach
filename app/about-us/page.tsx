"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function AboutUsPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white overflow-hidden">
      <Header />
      
      <main className="flex-grow w-full">
        
        {/* HERO SECTION (Image already contains text) */}
        <section className="w-full px-4 sm:px-6 md:px-10">
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
                {t("aboutUsPage.founderTitle")}
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#E5A8A3]" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="transparent" />
                </svg>
              </h2>
              
              <div className="space-y-6 text-slate-600 text-[16px] md:text-[17px] leading-relaxed font-medium">
                <p>{t("aboutUsPage.founderP1")}</p>
                <p>{t("aboutUsPage.founderP2")}</p>
                <p className="font-bold text-[#1a7f80] text-lg">
                  {t("aboutUsPage.founderP3")}
                </p>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="relative w-full aspect-square lg:aspect-[4/5]">
                <Image
                  src="/images/aboutImage.png"
                  alt={t("aboutUsPage.founderImageAlt")}
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
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 text-center">{t("aboutUsPage.whatWeOfferTitle")}</h2>
            <p className="text-slate-600 text-[17px] leading-relaxed font-medium mb-10 text-center">
              {t("aboutUsPage.whatWeOfferSubtitle")}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {[
                t("aboutUsPage.offer1"),
                t("aboutUsPage.offer2"),
                t("aboutUsPage.offer3"),
                t("aboutUsPage.offer4"),
                t("aboutUsPage.offer5"),
                t("aboutUsPage.offer6")
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

        {/* PANELISTS SECTION */}
        <section className="w-full px-6 sm:px-12 md:px-[60px] lg:px-[120px] py-16 md:py-24 bg-white">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-[40px] font-bold text-slate-800 mb-4 inline-block relative">
              {t("aboutUsPage.panelistTitle")}
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#E5A8A3]" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="transparent" />
              </svg>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="order-1 lg:order-1 flex justify-center">
              <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-lg border border-slate-100 bg-slate-50 flex items-center justify-center p-2">
                <img
                  src="/images/panelListMember1.png"
                  alt={t("aboutUsPage.panelistName")}
                  className="w-full h-auto object-contain rounded-xl"
                />
              </div>
            </div>

            <div className="order-2 lg:order-2">
              <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">{t("aboutUsPage.panelistName")}</h3>
              <p className="text-[#1a7f80] font-semibold text-lg mb-6">
                {t("aboutUsPage.panelistDesignation")}
              </p>
              
              <div className="space-y-4 text-slate-600 text-[16px] md:text-[17px] leading-relaxed font-medium mb-8">
                <p>
                  {t("aboutUsPage.panelistP1")}
                </p>
                <p>
                  {t("aboutUsPage.panelistP2")}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-lg mb-4">{t("aboutUsPage.panelistTopicsTitle")}</h4>
                <ul className="space-y-3">
                  {[
                    t("aboutUsPage.panelistTopic1"),
                    t("aboutUsPage.panelistTopic2"),
                    t("aboutUsPage.panelistTopic3"),
                    t("aboutUsPage.panelistTopic4"),
                    t("aboutUsPage.panelistTopic5"),
                    t("aboutUsPage.panelistTopic6"),
                    t("aboutUsPage.panelistTopic7")
                  ].map((topic, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#3AA5A5] shrink-0 mt-0.5" />
                      <span className="text-slate-600 font-medium">{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ZIGZAG LIST: MISSION, VISION, NOTICE (Hidden until panelist photos/statements are ready) */}
        {false && (
        <section className="w-full px-6 sm:px-12 md:px-[60px] lg:px-[120px] py-20 lg:py-28 space-y-24">
          
          {/* Item 1: Mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative w-full aspect-[4/3] md:aspect-[2/1] rounded-2xl overflow-hidden shadow-xl border border-slate-100">
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
            <div className="order-1 md:order-2 relative w-full aspect-[4/3] md:aspect-[2/1] rounded-2xl overflow-hidden shadow-xl border border-slate-100">
              <Image src="/images/our-mission.png" alt="Our Vision" fill className="object-cover" />
            </div>
          </div>

          {/* Item 3: Important Notice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative w-full aspect-[4/3] md:aspect-[2/1] rounded-2xl overflow-hidden shadow-xl border border-slate-100">
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
        )}

      </main>

      <Footer />
    </div>
  );
}
