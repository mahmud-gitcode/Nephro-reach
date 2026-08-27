"use client";

import React from "react";
import Image from "next/image";

export default function Engagement() {
  return (
    <section className="w-full bg-white px-5 py-12 sm:px-10 lg:px-[71px] lg:py-12">
      <div className="mx-auto flex w-full max-w-[1298px] flex-col gap-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-[28px] font-semibold leading-10 tracking-tight text-[#0F172A] sm:text-[36px]">
            Your Health, All in One Place
          </h2>
          <p className="text-lg font-medium leading-7 text-[#344056] sm:text-xl">
            Track, learn, and stay on top of your kidney health with NephroReach.
          </p>
        </div>

        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-stretch lg:justify-between lg:gap-8">
          <div className="relative w-full max-w-[529px] overflow-hidden rounded-3xl">
            <div className="relative aspect-[529/426] w-full">
              <Image
                src="/images/home/engagement.png"
                alt="NephroReach dashboard preview"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 529px"
              />
            </div>
            <div className="absolute left-1/2 top-1/2 w-[min(363px,86%)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[13px] border border-white/60 bg-white/95 shadow-[0_16px_40px_rgba(15,23,42,0.18)] backdrop-blur-sm">
              <div className="space-y-2 px-4 py-3">
                <p className="text-base font-medium leading-6 text-[#0F172A]">
                  check-in
                </p>
                <p className="text-sm font-medium leading-5 text-[#344056]">
                  Have you Taken Medication
                </p>
              </div>
              <div className="mx-2 h-px bg-[#E2E8F0]" />
              <div className="flex items-center justify-end gap-3 px-3 py-3">
                <button
                  type="button"
                  className="rounded bg-[#F1F5FA] px-3 py-2 text-sm font-bold text-[#0F172A]"
                >
                  Not yet
                </button>
                <button
                  type="button"
                  className="rounded bg-[#2563EB] px-3 py-2 text-sm font-bold text-white"
                >
                  Yes, I have
                </button>
              </div>
            </div>
          </div>

          <div className="flex w-full max-w-[500px] flex-col justify-center gap-6 lg:pt-20">
            <h3 className="text-[32px] font-medium leading-[1.2] tracking-tight text-[#0F172A] sm:text-[40px] sm:leading-[48px]">
              Create your account in minutes
            </h3>
            <p className="text-lg font-medium leading-7 text-[#344056] sm:text-xl sm:leading-8">
              Sign up with your email and phone number, choose your membership
              level, and receive your unique NephroReach member ID.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
