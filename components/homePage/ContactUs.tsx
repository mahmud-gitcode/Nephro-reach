"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function ContactUs() {
  const { t } = useLanguage();

  return (
    <section className="relative w-full bg-[#DDE9FA] pt-12 pb-0">
      <div className="w-full">
        {/* Container with Section.png background & Footer matching background color */}
        <div className="relative overflow-hidden w-full min-h-[220px] sm:min-h-[320px] md:min-h-[420px] flex items-center justify-center rounded-none bg-[#DDE9FA]">

          {/* Background Banner Image Section.png */}
          <Image
            src="/images/Section.png"
            alt="Still have questions banner background"
            fill
            priority
            className="object-contain sm:object-cover object-center"
          />

          {/* Center Overlay Content */}
          <div className="relative z-10 text-center flex flex-col items-center justify-center gap-4 px-4 py-8 mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t("contactUs.title")}
            </h2>
            <Link
              href="/contact-us"
              className="bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 text-sm tracking-wide"
            >
              {t("footer.contact")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
