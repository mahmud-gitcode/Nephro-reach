"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="flex w-full flex-col items-center justify-center p-5 sm:p-8 lg:p-12">
      <div className="relative mx-auto flex min-h-[420px] w-full max-w-[1344px] items-center justify-end overflow-hidden rounded-[24px] sm:min-h-[500px] lg:h-[570px] lg:px-[71px]">
        <Image
          src="/images/home/hero.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="relative z-10 flex w-full max-w-[500px] flex-col items-start gap-8 bg-white/70 p-6 backdrop-blur-sm sm:bg-transparent sm:p-8 sm:backdrop-blur-none lg:w-[486px] lg:bg-transparent lg:p-0">
          <div className="flex w-full flex-col gap-6">
            <h1 className="text-[36px] font-semibold leading-none tracking-[0.3px] text-[#0F172A] sm:text-[48px] lg:text-[60px]">
              <span className="block sm:whitespace-nowrap">A space to reflect,</span>
              <span className="block text-[#EF4444] sm:whitespace-nowrap">
                learn, and grow.
              </span>
            </h1>
            <p className="text-lg font-medium leading-7 tracking-[0.09px] text-[#344056]">
              Join Margin for daily SMS prompts, a private digital journal, and
              monthly classes designed to help you build a more intentional life.
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
