"use client";

import React from "react";
import Image from "next/image";

export default function Engagement() {
  return (
    <section className="w-full bg-white px-5 py-12 sm:px-10 lg:px-[71px] lg:py-12">
      <div className="mx-auto flex w-full max-w-[1298px] flex-col items-center gap-12">
        <div className="flex w-full flex-col items-center gap-3 text-center">
          <h2 className="text-[28px] font-semibold leading-10 tracking-[0.72px] text-[#0F172A] sm:text-[36px]">
            Your Health, All in One Place
          </h2>
          <p className="text-lg font-medium leading-7 tracking-[0.1px] text-[#344056] sm:text-xl">
            Track, learn, and stay on top of your kidney health with NephroReach.
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-10 lg:flex-row lg:items-start lg:gap-8 lg:px-[109px]">
          <div className="relative w-full max-w-[529px] shrink-0 lg:h-[426px] lg:w-[529px]">
            <div className="relative aspect-[1332/1072] w-full overflow-hidden rounded-[24px] opacity-90 blur-[1.5px]">
              <Image
                src="/images/home/engagement.png"
                alt="NephroReach dashboard preview"
                fill
                className="rounded-[24px] object-cover"
                sizes="(max-width: 1024px) 100vw, 529px"
              />
              <div className="absolute inset-0 rounded-[24px] bg-[rgba(0,99,255,0.1)]" />
            </div>

            <div className="absolute left-1/2 top-1/2 flex w-[min(363px,88%)] -translate-x-1/2 -translate-y-1/2 flex-col gap-[7.915px] rounded-[12.861px] border-[0.989px] border-[rgba(37,34,30,0.18)] bg-white px-[0.989px] pb-[9.893px] pt-[0.989px] drop-shadow-[0_5.947px_7.434px_rgba(0,0,0,0.1)]">
              <div className="flex w-full flex-col gap-[7.915px] p-[11.872px]">
                <p className="text-[15.829px] font-medium leading-[23.744px] tracking-[0.079px] text-[#0F172A]">
                  check-in
                </p>
                <p className="text-[13.851px] font-medium leading-[19.787px] tracking-[0.069px] text-[#344056]">
                  Have you Taken Medication
                </p>
              </div>
              <div className="h-[0.989px] w-full bg-[rgba(37,34,30,0.18)]" />
              <div className="flex w-full items-center justify-end gap-[12.861px] px-[11.872px]">
                <button
                  type="button"
                  className="flex h-[35.616px] items-center justify-center rounded-[7.915px] border-[0.989px] border-[#E2E8F0] bg-[#F9F9F9] p-[11.872px] text-[13.7px] font-medium leading-[19.575px] tracking-[0.069px] text-[#0F172A]"
                >
                  Not yet
                </button>
                <button
                  type="button"
                  className="flex h-[35.616px] items-center justify-center rounded-[7.915px] bg-[#2563EB] p-[11.872px] text-[13.7px] font-medium leading-[19.575px] tracking-[0.069px] text-white shadow-[inset_0_-0.989px_0_0_#DBE9FE]"
                >
                  Yes, I have
                </button>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col items-center lg:w-[632px] lg:px-[66px] lg:pb-10 lg:pt-20">
            <div className="flex w-full max-w-[500px] flex-col gap-6">
              <h3 className="text-[32px] font-normal leading-none tracking-[0.24px] text-[#0F172A] sm:text-[48px]">
                Create your account in minutes
              </h3>
              <p className="text-lg font-medium leading-[32.8px] text-[rgba(37,34,30,0.66)] sm:text-[20.5px]">
                Sign up with your email and phone number, choose your membership
                level, and receive your unique NephroReach member ID.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
