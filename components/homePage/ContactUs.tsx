"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function ContactUs() {
  return (
    <section className="relative w-full overflow-hidden bg-[#D7EDFF]">
      <div className="relative mx-auto flex min-h-[320px] w-full max-w-[1440px] items-center justify-center px-5 py-16 sm:min-h-[421px]">
        <Image
          src="/images/home/contact-decor.png"
          alt=""
          width={601}
          height={420}
          className="pointer-events-none absolute bottom-0 left-[-33px] hidden h-auto w-[320px] object-contain opacity-90 md:block lg:w-[420px]"
        />
        <Image
          src="/images/home/contact-people.png"
          alt=""
          width={502}
          height={421}
          className="pointer-events-none absolute bottom-0 right-0 hidden h-auto w-[280px] object-contain md:block lg:w-[420px]"
        />
        <Image
          src="/images/home/contact-arc.png"
          alt=""
          width={57}
          height={121}
          className="pointer-events-none absolute left-[30%] top-[20%] hidden md:block"
        />

        <div className="relative z-10 flex max-w-[618px] flex-col items-center gap-7 text-center">
          <h2 className="text-[28px] font-semibold leading-[1.2] text-[#0F172A] sm:text-[36px] sm:leading-[48px]">
            Still have questions?
          </h2>
          <Link
            href="/contact-us"
            className="inline-flex h-[52px] items-center justify-center rounded bg-[#2563EB] px-3.5 text-base font-bold text-white transition-colors hover:bg-[#1D4ED8]"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}
