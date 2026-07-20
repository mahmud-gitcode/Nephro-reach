"use client";

import React from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function HowItWorks() {
  const { t } = useLanguage();

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-12 w-full text-center scroll-mt-20">
      <div className="space-y-3 mb-16">
        <span className="text-blue-600 text-sm font-bold tracking-widest uppercase">{t("howItWorks.badge")}</span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{t("howItWorks.title")}</h2>
        <p className="text-slate-500 text-base max-w-2xl mx-auto font-medium">
          {t("howItWorks.subtitle")}
        </p>
      </div>

      {/* 4 Steps Container with connecting lines on desktop */}
      <div className="relative w-full">
        
        {/* Desktop dotted connection lines and arrow buttons positioned at the vertical center (129px from top) */}
        <div className="hidden lg:flex absolute top-[129px] -translate-y-1/2 left-[11%] right-[11%] items-center justify-between pointer-events-none z-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 flex items-center justify-center relative">
              {/* Dotted horizontal line */}
              <div className="absolute left-10 right-10 border-t-2 border-dotted border-slate-300 -translate-y-1/2 top-1/2" />
              {/* Circular Arrow Button */}
              <div className="relative z-10 w-9 h-9 rounded-full bg-[#1E293B] text-white flex items-center justify-center shadow-md">
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </div>
            </div>
          ))}
        </div>

        {/* Grid container with 48px gap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[48px] relative z-10 justify-center">
          
          {/* Step 1 */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col group hover:border-slate-200 transition-all hover:shadow-[0_15px_40px_rgba(0,0,0,0.04)] duration-300 min-h-[258px] w-full mx-auto">
            {/* Top circular icon area with light green background */}
            <div className="h-[120px] bg-[#E8F5E9] flex items-center justify-center p-4 transition-colors duration-300 group-hover:bg-[#E8F5E9]/80">
              <div className="relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-[#E8F5E9]">
                <Image
                  src="/images/signUp.png"
                  alt="Sign Up Icon"
                  width={64}
                  height={64}
                  className="object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
            {/* Details */}
            <div className="p-5 flex-1 flex flex-col justify-start text-left">
              <h3 className="text-base font-extrabold text-slate-900 mb-1">{t("howItWorks.step1Title")}</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                {t("howItWorks.step1Desc")}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col group hover:border-slate-200 transition-all hover:shadow-[0_15px_40px_rgba(0,0,0,0.04)] duration-300 min-h-[258px] w-full mx-auto">
            {/* Top circular icon area with light yellowish/green background */}
            <div className="h-[120px] bg-[#F1F8E9] flex items-center justify-center p-4 transition-colors duration-300 group-hover:bg-[#F1F8E9]/80">
              <div className="relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-[#F1F8E9]">
                <Image
                  src="/images/getYourMemberID.png"
                  alt="Get Your Member ID Icon"
                  width={64}
                  height={64}
                  className="object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
            {/* Details */}
            <div className="p-5 flex-1 flex flex-col justify-start text-left">
              <h3 className="text-base font-extrabold text-slate-900 mb-1">{t("howItWorks.step2Title")}</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                {t("howItWorks.step2Desc")}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col group hover:border-slate-200 transition-all hover:shadow-[0_15px_40px_rgba(0,0,0,0.04)] duration-300 min-h-[258px] w-full mx-auto">
            {/* Top circular icon area with light orange/cream background */}
            <div className="h-[120px] bg-[#FFF8E1] flex items-center justify-center p-4 transition-colors duration-300 group-hover:bg-[#FFF8E1]/80">
              <div className="relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-[#FFF8E1]">
                <Image
                  src="/images/learn&journal.png"
                  alt="Learn & Journal Icon"
                  width={64}
                  height={64}
                  className="object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
            {/* Details */}
            <div className="p-5 flex-1 flex flex-col justify-start text-left">
              <h3 className="text-base font-extrabold text-slate-900 mb-1">{t("howItWorks.step3Title")}</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                {t("howItWorks.step3Desc")}
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col group hover:border-slate-200 transition-all hover:shadow-[0_15px_40px_rgba(0,0,0,0.04)] duration-300 min-h-[258px] w-full mx-auto">
            {/* Top circular icon area with light peach background */}
            <div className="h-[120px] bg-[#FBE9E7] flex items-center justify-center p-4 transition-colors duration-300 group-hover:bg-[#FBE9E7]/80">
              <div className="relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-[#FBE9E7]">
                <Image
                  src="/images/receiveSMSCheck-ins.png"
                  alt="Receive SMS Check-Ins Icon"
                  width={64}
                  height={64}
                  className="object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
            {/* Details */}
            <div className="p-5 flex-1 flex flex-col justify-start text-left">
              <h3 className="text-base font-extrabold text-slate-900 mb-1">{t("howItWorks.step4Title")}</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                {t("howItWorks.step4Desc")}
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
