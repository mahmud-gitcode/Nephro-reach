"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function WhatMembersGet() {
  const { t } = useLanguage();

  const features = [
    {
      title: t("whatMembersGet.card1Title"),
      desc: t("whatMembersGet.card1Desc"),
      icon: "/images/home/feat-sms.svg",
    },
    {
      title: t("whatMembersGet.card2Title"),
      desc: t("whatMembersGet.card2Desc"),
      icon: "/images/home/feat-book.svg",
    },
    {
      title: t("whatMembersGet.card3Title"),
      desc: t("whatMembersGet.card3Desc"),
      icon: "/images/home/feat-calendar.svg",
    },
    {
      title: t("whatMembersGet.card4Title"),
      desc: t("whatMembersGet.card4Desc"),
      icon: "/images/home/feat-chart.svg",
    },
    {
      title: t("whatMembersGet.card5Title"),
      desc: t("whatMembersGet.card5Desc"),
      icon: "/images/home/feat-users.svg",
    },
    {
      title: t("whatMembersGet.card6Title"),
      desc: t("whatMembersGet.card6Desc"),
      icon: "/images/home/feat-lock.svg",
    },
  ];

  return (
    <section
      id="features"
      className="w-full scroll-mt-24 bg-[#F8FAFF] py-16 lg:py-20"
    >
      <div className="mx-auto flex w-full max-w-[1344px] flex-col gap-10 px-5 min-[1344px]:px-0 sm:px-8 lg:px-12">
        <div className="landing-reveal flex flex-col items-center gap-3 text-center">
          <h2 className="text-[28px] leading-10 font-semibold tracking-[0.18px] text-[#0F172A] sm:text-[36px]">
            {t("whatMembersGet.title")}
          </h2>
          <p className="text-lg leading-8 font-normal tracking-[0.12px] text-[#344056] sm:text-2xl">
            {t("whatMembersGet.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const delays = [
              "delay-75",
              "delay-150",
              "delay-225",
              "delay-300",
              "delay-375",
              "delay-450",
            ];
            return (
              <div
                key={feature.title}
                className={`group landing-reveal card-smooth-hover flex cursor-pointer flex-col items-start gap-4 rounded-[16px] border border-[#E2E8F0] bg-white p-6 hover:border-blue-300 hover:shadow-xl sm:p-7 ${delays[index] || ""}`}
              >
                <div className="flex items-center rounded-xl bg-[#D7EDFF] p-3 transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-100">
                  <span className="relative block size-7 overflow-clip">
                    <img src={feature.icon} alt="" className="size-full" />
                  </span>
                </div>
                <div className="flex w-full flex-col gap-2.5">
                  <h3 className="text-xl leading-7 font-semibold tracking-tight text-[#0F172A] transition-colors group-hover:text-blue-600">
                    {feature.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed font-normal text-[#475467] sm:text-base">
                    {feature.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
