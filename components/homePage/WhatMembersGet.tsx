"use client";

import React from "react";
import { MessageSquare, BookOpen, Calendar, TrendingUp, Users, Shield } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function WhatMembersGet() {
  const { t } = useLanguage();

  return (
    <section id="features" className="w-full border-y border-slate-100 bg-[#EEF3FA] py-20 md:py-24">
      <div className="w-full px-4 sm:px-6 md:px-10 lg:px-12">
        <div className="mb-12 md:mb-16 text-center space-y-3 max-w-[760px] mx-auto">
          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[13px] font-semibold text-blue-600">
            {t("whatMembersGet.badge")}
          </span>
          <h2 className="text-[31px] leading-[1.06] sm:text-[40px] md:text-[46px] font-semibold text-slate-900 tracking-tight">
            {t("whatMembersGet.title")}
          </h2>
          <p className="mx-auto max-w-[540px] text-[15px] leading-6 md:text-[16px] md:leading-7 text-slate-600 font-normal">
            {t("whatMembersGet.subtitle")}
          </p>
        </div>

        {/* 3x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Card 1 */}
          <div className="rounded-[10px] border border-slate-200/70 bg-white p-6 md:p-7 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#DCEBFF] text-[#2F69E8]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="mb-3 text-[18px] font-semibold text-slate-900">
              {t("whatMembersGet.card1Title")}
            </h3>
            <p className="text-[15px] leading-6 text-slate-600 font-normal">
              {t("whatMembersGet.card1Desc")}
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-[10px] border border-slate-200/70 bg-white p-6 md:p-7 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#DCEBFF] text-[#2F69E8]">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="mb-3 text-[18px] font-semibold text-slate-900">
              {t("whatMembersGet.card2Title")}
            </h3>
            <p className="text-[15px] leading-6 text-slate-600 font-normal">
              {t("whatMembersGet.card2Desc")}
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-[10px] border border-slate-200/70 bg-white p-6 md:p-7 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#DCEBFF] text-[#2F69E8]">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="mb-3 text-[18px] font-semibold text-slate-900">
              {t("whatMembersGet.card3Title")}
            </h3>
            <p className="text-[15px] leading-6 text-slate-600 font-normal">
              {t("whatMembersGet.card3Desc")}
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-[10px] border border-slate-200/70 bg-white p-6 md:p-7 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#DCEBFF] text-[#2F69E8]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="mb-3 text-[18px] font-semibold text-slate-900">
              {t("whatMembersGet.card4Title")}
            </h3>
            <p className="text-[15px] leading-6 text-slate-600 font-normal">
              {t("whatMembersGet.card4Desc")}
            </p>
          </div>

          {/* Card 5 */}
          <div className="rounded-[10px] border border-slate-200/70 bg-white p-6 md:p-7 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#DCEBFF] text-[#2F69E8]">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="mb-3 text-[18px] font-semibold text-slate-900">
              {t("whatMembersGet.card5Title")}
            </h3>
            <p className="text-[15px] leading-6 text-slate-600 font-normal">
              {t("whatMembersGet.card5Desc")}
            </p>
          </div>

          {/* Card 6 */}
          <div className="rounded-[10px] border border-slate-200/70 bg-white p-6 md:p-7 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#DCEBFF] text-[#2F69E8]">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="mb-3 text-[18px] font-semibold text-slate-900">
              {t("whatMembersGet.card6Title")}
            </h3>
            <p className="text-[15px] leading-6 text-slate-600 font-normal">
              {t("whatMembersGet.card6Desc")}
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
