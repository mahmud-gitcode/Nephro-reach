"use client";

import React from "react";
import Link from "next/link";

export default function ContactUs() {
  return (
    <section className="relative w-full overflow-hidden bg-white">
      <div className="pointer-events-none absolute left-1/2 top-0 h-full w-[1440px] -translate-x-1/2">
        <div className="absolute left-[251px] top-[-611px] size-[992px] rounded-full bg-[#55A8F5] opacity-70 blur-[198px]" />
        <div className="absolute left-[1034px] top-[-536px] size-[992px] rounded-full bg-[#FF0000] opacity-70 blur-[198px]" />
      </div>

      <div className="relative mx-auto flex min-h-[320px] w-full max-w-[1344px] items-center px-5 sm:px-8 lg:px-12 min-[1344px]:px-0 lg:h-[376px]">
        <div className="flex flex-1 items-center justify-center">
          <div className="relative hidden h-[376px] w-[536px] shrink-0 overflow-hidden lg:block">
            <div className="absolute inset-0 -scale-x-100">
              <img
                src="/images/home/contact-people.png"
                alt=""
                className="absolute left-[-140.4%] top-0 h-full w-[240.4%] max-w-none"
              />
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-7 py-12 lg:py-0 landing-reveal">
            <h2 className="max-w-[618px] text-center text-[32px] font-normal leading-none tracking-[0.24px] text-black sm:text-[48px]">
              Still have questions?
            </h2>
            <Link
              href="/contact-us"
              className="inline-flex h-[52px] w-[163px] items-center justify-center gap-2 rounded-[4px] bg-[#EF4444] px-3.5 py-3 text-base font-bold leading-6 tracking-[0.08px] text-white shadow-[inset_0_-1px_0_0_#DBE9FE] transition-all duration-300 hover:bg-[#DC2626] hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-red-500/25 cursor-pointer"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
