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

        <main className="max-w-[1404px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          {/* FAQ Hero Banner */}
          <div className="relative rounded-[24px] overflow-hidden bg-gradient-to-r from-[#DDE9FA] via-[#E8F1FC] to-[#D5E4F9] p-8 sm:p-12 lg:p-16 border border-blue-100/50 shadow-sm">
            {/* Soft decorative background shape */}
            <div className="absolute top-0 right-0 w-[45%] h-full bg-white/20 backdrop-blur-3xl rounded-l-full pointer-events-none hidden md:block" />

            <div className="relative z-10 max-w-xl space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
                {t("faq.title")}
              </h1>
              <p className="text-slate-600 text-sm sm:text-base lg:text-lg font-medium leading-relaxed">
                {t("faq.subtitle")}
              </p>
              <div className="pt-2">
                <Link
                  href="/registration"
                  className="inline-block bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white font-bold px-6 py-3.5 rounded-xl shadow-md transition-all active:scale-95 text-sm"
                >
                  {t("faq.button")}
                </Link>
              </div>
            </div>
          </div>

          {/* FAQ Accordion List */}
          <div className="space-y-4">
            {faqItems.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div
                  key={item.id}
                  className="bg-[#EAF3FE] hover:bg-[#E3EFFE] transition-colors rounded-2xl p-5 sm:p-6 border border-blue-100/40 shadow-sm"
                >
                  <button
                    onClick={() => toggleFAQ(item.id)}
                    className="w-full flex items-center justify-between text-left gap-4 focus:outline-none group"
                  >
                    <span className="text-base sm:text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {item.question}
                    </span>
                    <div
                      className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center transition-all duration-300 shadow-sm ${
                        isOpen
                          ? "bg-[#2563EB] text-white"
                          : "bg-white text-blue-600 group-hover:bg-blue-50"
                      }`}
                    >
                      {isOpen ? (
                        <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ChevronRight className="w-5 h-5 stroke-[2.5] text-blue-600" />
                      )}
                    </div>
                  </button>

                  {/* Accordion Content */}
                  {isOpen && (
                    <div className="mt-4 pt-3 border-t border-blue-200/50 text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
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
