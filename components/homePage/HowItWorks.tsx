"use client";

import React from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

export default function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    {
      id: 1,
      title: t("howItWorks.step1Title"),
      desc: t("howItWorks.step1Desc"),
      image: "/images/home/how-1.png",
    },
    {
      id: 2,
      title: t("howItWorks.step2Title"),
      desc: t("howItWorks.step2Desc"),
      image: "/images/home/how-2.png",
    },
    {
      id: 3,
      title: t("howItWorks.step3Title"),
      desc: t("howItWorks.step3Desc"),
      image: "/images/home/how-3.png",
    },
    {
      id: 4,
      title: t("howItWorks.step4Title"),
      desc: t("howItWorks.step4Desc"),
      image: "/images/home/how-4.png",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="w-full scroll-mt-24 bg-[#F8FAFF] pt-8 pb-16 lg:pt-10 lg:pb-20"
    >
      <div className="mx-auto flex w-full max-w-[1344px] flex-col gap-10 px-5 sm:px-8 lg:px-12 min-[1344px]:px-0">
        <div className="flex flex-col items-center gap-2 text-center landing-reveal">
          <h2 className="text-[28px] font-semibold leading-10 tracking-[0.72px] text-[#0F172A] sm:text-[36px]">
            How <span className="text-[#EF4444]">Nephro</span>
            <span className="text-[#2563EB]">Reach</span> Works
          </h2>
          <p className="text-lg font-medium leading-7 tracking-[0.1px] text-[#344056] sm:text-xl">
            {t("howItWorks.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-11">
          {steps.map((step, index) => {
            const delays = ["delay-75", "delay-150", "delay-225", "delay-300"];
            return (
              <div
                key={step.id}
                className={`group flex flex-col items-center gap-6 rounded-lg border border-[#BBCFFD] bg-white px-6 py-4 sm:flex-row hover:shadow-xl hover:border-blue-400 hover:bg-blue-50/10 cursor-pointer landing-reveal card-smooth-hover ${delays[index] || ""}`}
              >
                <div className="relative size-[150px] shrink-0 overflow-hidden rounded">
                  <Image
                    src={step.image}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="150px"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <h3 className="pl-0 text-xl font-medium leading-7 tracking-[0.1px] text-[#0F172A] sm:pl-10 group-hover:text-blue-600 transition-colors">
                    {step.title}
                  </h3>
                  <div className="flex items-start gap-4">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#EF4444] text-base font-medium leading-6 text-white transition-transform duration-300 group-hover:scale-110 shadow-xs">
                      {step.id}
                    </span>
                    <p className="text-lg font-medium leading-7 tracking-[0.09px] text-[#344056]">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
