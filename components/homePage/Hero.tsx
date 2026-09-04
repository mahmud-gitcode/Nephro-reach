"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

import nephroReachImg from "@/public/images/home/NephroReach-clean.png";

export default function Hero() {
  return (
    <section className="flex w-full flex-col items-center justify-center p-5 sm:p-8 lg:p-12">
      <div className="relative mx-auto flex min-h-[420px] w-full max-w-[1344px] items-center justify-end overflow-hidden rounded-[24px] sm:min-h-[500px] lg:h-[570px] px-6 sm:px-10 lg:px-[71px]">
        <Image
          src={nephroReachImg}
          alt="NephroReach - Understand your kidneys. Take control of your journey."
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="relative z-10 flex w-full max-w-[560px] flex-col items-start gap-7 bg-white/75 p-6 backdrop-blur-sm sm:bg-transparent sm:p-0 sm:backdrop-blur-none sm:mr-2 md:mr-6 lg:mr-8 xl:mr-12 lg:w-[560px]">
          <div className="flex w-full flex-col gap-5">
            <h1 className="text-[26px] font-semibold leading-[1.2] tracking-[0.2px] text-[#0F172A] sm:text-[34px] md:text-[38px] lg:text-[42px] xl:text-[44px]">
              <span className="block sm:whitespace-nowrap">Understand your kidneys.</span>
              <span className="block text-[#EF4444] sm:whitespace-nowrap">
                Take control of your journey.
              </span>
            </h1>
            <p className="text-base sm:text-lg font-normal leading-relaxed text-[#344056]">
              NephroReach gives you kidney education, personal health trackers,
              expert-led classes, and practical tools—all in one place to help
              you feel more informed, prepared, and confident.
            </p>
          </div>
          <Link
            href="/registration"
            className="inline-flex h-[52px] w-[194px] items-center justify-center rounded-[4px] bg-[#2563EB] px-6 py-3 text-base font-bold tracking-[0.08px] text-white shadow-[inset_0_-1px_0_0_#DBE9FE] transition-colors hover:bg-[#1D4ED8]"
          >
            Try it free
          </Link>
        </div>
      </div>
    </section>
  );
}
