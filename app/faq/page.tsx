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
          <div className="w-full px-4 sm:px-8 md:px-[60px] py-12 space-y-3">
            {faqItems.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div
                  key={item.id}
                  className="bg-[#E4F2FE] transition-colors rounded-lg px-6 py-4"
                >
                  <button
                    onClick={() => toggleFAQ(item.id)}
                    className="w-full flex items-center justify-between text-left gap-4 focus:outline-none group"
                  >
                    <span className="text-[15px] sm:text-base font-medium text-slate-800 transition-colors">
                      {item.question}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center transition-all duration-300 ${
                        isOpen
                          ? "bg-[#2563EB] text-white shadow-sm"
                          : "bg-white text-blue-600 shadow-sm"
                      }`}
                    >
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </div>
                  </button>

                  {/* Accordion Content */}
                  {isOpen && (
                    <div className="mt-3 text-slate-500 text-sm sm:text-[15px] leading-relaxed font-normal">
                      {item.answer}
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
