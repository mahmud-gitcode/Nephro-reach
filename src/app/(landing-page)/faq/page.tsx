"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ContactUs from "@/components/homePage/ContactUs";
import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function FAQPage() {
  const { t } = useLanguage();
  const [openId, setOpenId] = useState<number | null>(1);

  const toggleFAQ = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  const faqItems = [
    { id: 1, question: t("faq.q1"), answer: t("faq.a1") },
    { id: 2, question: t("faq.q2"), answer: t("faq.a2") },
    { id: 3, question: t("faq.q3"), answer: t("faq.a3") },
    { id: 4, question: t("faq.q4"), answer: t("faq.a4") },
    { id: 5, question: t("faq.q5"), answer: t("faq.a5") },
    { id: 6, question: t("faq.q6"), answer: t("faq.a6") },
    { id: 7, question: t("faq.q7"), answer: t("faq.a7") },
    { id: 8, question: t("faq.q8"), answer: t("faq.a8") },
    { id: 9, question: t("faq.q9"), answer: t("faq.a9") },
    { id: 10, question: t("faq.q10"), answer: t("faq.a10") },
    { id: 11, question: t("faq.q11"), answer: t("faq.a11") },
    { id: 12, question: t("faq.q12"), answer: t("faq.a12") },
    { id: 13, question: t("faq.q13"), answer: t("faq.a13") },
    { id: 14, question: t("faq.q14"), answer: t("faq.a14") },
    { id: 15, question: t("faq.q15"), answer: t("faq.a15") },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans">
      <div>
        <Header />

        <main className="w-full">
          {/* FAQ Hero Banner */}
          <div className="relative overflow-hidden bg-[#E4F2FE] w-full">
            {/* Soft decorative background shape matching the diagonal gray-blue in screenshot */}
            <div className="absolute top-0 right-[-10%] w-[60%] h-full bg-[#DFE6F5] transform -skew-x-[35deg] pointer-events-none hidden md:block" />

            <div className="relative z-10 w-full px-4 sm:px-8 md:px-[60px] py-12 md:py-16 space-y-4">
              <h1 className="text-[28px] sm:text-[34px] lg:text-[40px] font-semibold text-slate-800 tracking-tight">
                {t("faq.title")}
              </h1>
              <p className="text-slate-600 text-sm sm:text-[15px] lg:text-base font-medium leading-relaxed max-w-md">
                {t("faq.subtitle")}
              </p>
              <div className="pt-2">
                <Link
                  href="/registration"
                  className="inline-block bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white font-medium px-5 py-2.5 rounded-md shadow-sm transition-all active:scale-95 text-sm"
                >
                  {t("faq.button")}
                </Link>
              </div>
            </div>
          </div>

          {/* FAQ Accordion List */}
          <div className="mx-auto flex w-full max-w-[990px] flex-col gap-4 px-4 py-10 sm:px-8 lg:px-0">
            {faqItems.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div
                  key={item.id}
                  className="flex flex-col items-start gap-[7px] rounded-lg border border-[#E2E8F0] bg-[#D9E4FF] px-5 py-4 sm:px-7"
                >
                  <button
                    onClick={() => toggleFAQ(item.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 text-left focus:outline-none"
                  >
                    <span className="font-poppins text-base font-medium leading-7 tracking-[0.1px] text-[#0F172A] sm:text-lg lg:text-xl">
                      {item.question}
                    </span>
                    <span
                      className={`flex size-12 shrink-0 items-center justify-center rounded-full shadow-[inset_0_-0.5px_0_0_#B8A4E3,inset_0_0.5px_0_0_rgba(255,255,255,0.12)] transition-colors duration-300 ${
                        isOpen
                          ? "bg-[#1D4ED8] text-white"
                          : "bg-white text-[#2563EB]"
                      }`}
                    >
                      {isOpen ? (
                        <ChevronDown className="size-4 stroke-2" />
                      ) : (
                        <ChevronRight className="size-4 stroke-2" />
                      )}
                    </span>
                  </button>

                  {/* Accordion Content */}
                  {isOpen && (
                    <div className="flex w-full items-center justify-center rounded-lg bg-white p-5 sm:p-6">
                      <p className="flex-1 whitespace-pre-wrap font-poppins text-base font-normal leading-7 tracking-[0.09px] text-[#344056] sm:text-lg">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>

        {/* ContactUs Banner */}
        <ContactUs />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
