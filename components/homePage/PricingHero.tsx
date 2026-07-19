"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function PricingHero() {
  const { t } = useLanguage();

  return (
    <section className="w-full bg-white py-10 md:py-16 lg:py-20">
      <div className="mx-auto max-w-[1404px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Text Content */}
          <div className="flex flex-col items-start text-left max-w-xl">
            <span className="text-[#2563EB] text-sm sm:text-base font-semibold mb-3">
              {t("pricingHero.badge")}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
              {t("pricingHero.titleLine1")} <br className="hidden sm:inline" />
              {t("pricingHero.titleLine2")}
            </h1>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-normal mb-8">
              {t("pricingHero.description")}
            </p>
            <div>
              <Link
                href="/registration"
                className="inline-flex items-center justify-center bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-lg shadow-sm transition-all text-sm sm:text-base active:scale-95"
              >
                {t("pricingHero.button")}
              </Link>
            </div>
          </div>

          {/* Right Column: Hero Image (pricing.png) */}
          <div className="relative w-full flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[640px]">
              <Image
                src="/images/pricing.png"
                alt="A space to reflect, learn, and grow"
                width={800}
                height={550}
                priority
                className="w-full h-auto object-contain rounded-2xl"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
