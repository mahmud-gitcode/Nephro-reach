"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function ContactUs() {
  const { t } = useLanguage();

  return (
    <section className="relative w-full overflow-hidden bg-white">
      <div className="pointer-events-none absolute top-0 left-1/2 h-full w-[1440px] -translate-x-1/2">
        <div className="absolute top-[-611px] left-[251px] size-[992px] rounded-full bg-[#55A8F5] opacity-70 blur-[198px]" />
        <div className="absolute top-[-536px] left-[1034px] size-[992px] rounded-full bg-[#FF0000] opacity-70 blur-[198px]" />
      </div>

      <div className="relative mx-auto flex min-h-[320px] w-full max-w-[1344px] items-center px-5 min-[1344px]:px-0 sm:px-8 lg:h-[376px] lg:px-12">
        <div className="flex flex-1 items-center justify-center">
          <div className="relative hidden h-[376px] w-[536px] shrink-0 overflow-hidden lg:block">
            <div className="absolute inset-0 -scale-x-100">
              <img
                src="/images/home/contact-people.png"
                alt=""
                className="absolute top-0 left-[-140.4%] h-full w-[240.4%] max-w-none"
              />
            </div>
          </div>

          <div className="landing-reveal flex flex-1 flex-col items-center justify-center gap-7 py-12 lg:py-0">
            <h2 className="max-w-[618px] text-center text-[32px] leading-none font-normal tracking-[0.24px] text-black sm:text-[48px]">
              {t("contactUs.title")}
            </h2>
            <Link
              href="/contact-us"
              className="inline-flex h-[52px] w-[163px] cursor-pointer items-center justify-center gap-2 rounded-[4px] bg-[#EF4444] px-3.5 py-3 text-base leading-6 font-bold tracking-[0.08px] text-white shadow-[inset_0_-1px_0_0_#DBE9FE] transition-all duration-300 hover:scale-105 hover:bg-[#DC2626] hover:shadow-lg hover:shadow-red-500/25 active:scale-95"
            >
              {t("contactUs.button")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
