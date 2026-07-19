"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ContactUs from "@/components/homePage/ContactUs";
import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "Are all suppliers really based in the UK?",
    answer: "Can I use this with my existing store? Yes, NephroReach operates with verified global suppliers while ensuring strict local compliance and high quality standards.",
  },
  {
    id: 2,
    question: "How does VAT work with DropClicker?",
    answer: "VAT calculations and tax compliance are automatically processed based on your billing region during account setup.",
  },
  {
    id: 3,
    question: "Average shipping time?",
    answer: "Average processing and delivery time ranges between 3 to 5 business days depending on your target location.",
  },
  {
    id: 4,
    question: "Can I use this with my existing store?",
    answer: "Yes, our platform seamlessly integrates with popular digital platforms, e-commerce stores, and member portals.",
  },
  {
    id: 5,
    question: "What payment methods are accepted?",
    answer: "We accept all major credit cards, Visa, Mastercard, PayPal, and direct secure bank transfers.",
  },
  {
    id: 6,
    question: "Is there a trial period available?",
    answer: "Yes! You can start with our 14-day free trial on any membership tier without entering credit card details.",
  },
  {
    id: 7,
    question: "How do I track my order status?",
    answer: "You can track your real-time status, journal updates, and active check-ins anytime inside your NephroReach dashboard.",
  },
];

export default function FAQPage() {
  // Item 1 open by default as shown in the mockup screenshot
  const [openId, setOpenId] = useState<number | null>(1);

  const toggleFAQ = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

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
                Frequently Asked Questions
              </h1>
              <p className="text-slate-600 text-sm sm:text-base lg:text-lg font-medium leading-relaxed">
                Simple answers about privacy, data, and how tracking works.
              </p>
              <div className="pt-2">
                <Link
                  href="/registration"
                  className="inline-block bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white font-bold px-6 py-3.5 rounded-xl shadow-md transition-all active:scale-95 text-sm"
                >
                  Start Tracking
                </Link>
              </div>
            </div>
          </div>

          {/* FAQ Accordion List */}
          <div className="space-y-4">
            {faqData.map((item) => {
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
