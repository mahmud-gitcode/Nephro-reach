"use client";

import React from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    {
      id: 1,
      titleKey: "howItWorks.step1Title",
      descKey: "howItWorks.step1Desc",
      bgColor: "#E8F5E9",
      iconSrc: "/images/signUp.png",
      alt: "Sign Up Icon",
    },
    {
      id: 2,
      titleKey: "howItWorks.step2Title",
      descKey: "howItWorks.step2Desc",
      bgColor: "#F1F8E9",
      iconSrc: "/images/getYourMemberID.png",
      alt: "Get Your Member ID Icon",
    },
    {
      id: 3,
      titleKey: "howItWorks.step3Title",
      descKey: "howItWorks.step3Desc",
      bgColor: "#FFF8E1",
      iconSrc: "/images/learn&journal.png",
      alt: "Learn & Journal Icon",
    },
    {
      id: 4,
      titleKey: "howItWorks.step4Title",
      descKey: "howItWorks.step4Desc",
      bgColor: "#FBE9E7",
      iconSrc: "/images/receiveSMSCheck-ins.png",
      alt: "Receive SMS Check-Ins Icon",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 w-full text-center scroll-mt-20">
      <div className="space-y-3 mb-16 px-4 sm:px-[60px]">
        <span className="text-blue-600 text-sm font-bold tracking-widest uppercase">{t("howItWorks.badge")}</span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{t("howItWorks.title")}</h2>
        <p className="text-slate-500 text-base max-w-2xl mx-auto font-medium">
          {t("howItWorks.subtitle")}
        </p>
      </div>

      {/* 4 Steps Container */}
      <div className="w-full px-4 sm:px-[60px]">
        {/* Grid container with 48px gap on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-[48px] relative justify-center w-full px-4 md:px-12">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="relative bg-white rounded-3xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-visible flex flex-col group hover:border-slate-200 transition-all hover:shadow-[0_15px_40px_rgba(0,0,0,0.04)] h-[258px] w-full"
            >
              {/* Top circular icon area */}
              <div
                style={{ backgroundColor: step.bgColor }}
                className="h-[120px] rounded-t-3xl flex items-center justify-center p-4 transition-colors duration-300"
              >
                <div
                  style={{ backgroundColor: step.bgColor }}
                  className="relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
                >
                  <Image
                    src={step.iconSrc}
                    alt={step.alt}
                    width={64}
                    height={64}
                    className="object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>

              {/* Details */}
              <div className="p-5 flex-1 flex flex-col justify-start text-left">
                <h3 className="text-base font-extrabold text-slate-900 mb-1">
                  {t(step.titleKey)}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                  {t(step.descKey)}
                </p>
              </div>

              {/* Dotted Line & Arrow Button to Next Card (Only between cards on desktop) */}
              {index < 3 && (
                <div className="hidden lg:flex absolute -right-[48px] top-[129px] -translate-y-1/2 w-[48px] items-center justify-center z-30 pointer-events-none">
                  {/* Dotted horizontal connecting line */}
                  <div className="absolute left-0 right-0 border-t-2 border-dotted border-slate-300 top-1/2 -translate-y-1/2" />
                  {/* Circular Arrow Button centered right in 48px gap */}
                  <div className="relative z-40 w-9 h-9 rounded-full bg-[#1E293B] text-white flex items-center justify-center shadow-md shrink-0">
                    <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
