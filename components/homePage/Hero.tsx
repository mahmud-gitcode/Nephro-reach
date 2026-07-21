"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative pt-6 pb-16 px-4 sm:px-6 lg:px-12 w-full">
      {/* Container Card with background image Container.png */}
      <div className="relative rounded-[24px] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.02)] overflow-hidden w-full min-h-[480px] sm:min-h-[550px] lg:h-[600px] flex items-center justify-end px-6 sm:px-12 md:px-16 lg:px-20">

        {/* Background Image Container.png */}
        <Image
          src="/images/Container.png"
          alt="NephroReach Banner Background"
          fill
          priority
          className="object-cover object-center"
        />

        {/* Text content aligned to the right */}
        <div className="relative z-10 w-full lg:w-1/2 flex flex-col justify-center">
          {/* Text Content */}
          <div className="space-y-6 text-left bg-white/70 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none p-6 sm:p-8 lg:p-0 rounded-3xl border border-white/50 lg:border-none shadow-xl lg:shadow-none">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              {t("hero.badge")}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              {t("hero.titleLine1")} <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{t("hero.titleLine2")}</span>
            </h1>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium whitespace-pre-wrap">
              {t("hero.description")}
            </p>
            <div className="pt-2">
              <Link
                href="/registration"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 py-4 rounded-xl shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 transition-all hover:translate-y-[-2px] active:translate-y-0 active:scale-98 text-base"
              >
                {t("hero.button")}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
