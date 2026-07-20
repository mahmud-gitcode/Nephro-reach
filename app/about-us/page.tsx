"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function AboutUsPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    source: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Message sent successfully!");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans overflow-hidden">
      <div>
        <Header />

        <main className="relative w-full px-4 sm:px-6 md:px-10 lg:px-12 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            
            {/* Left Column - Contact Form */}
            <div className="space-y-8 max-w-xl relative">
              {/* Soft curved background graphic decoration */}
              <div className="absolute -left-16 top-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
              
              <div className="space-y-3">
                <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-none">
                  {t("contactUs.getInTouchTitle")}
                </h1>
                <p className="text-slate-600 text-sm sm:text-base font-semibold leading-relaxed">
                  {t("contactUs.getInTouchDesc")}
                </p>
                <p className="text-slate-400 text-xs sm:text-sm font-semibold pt-1">
                  {t("contactUs.niceHearing")}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    name="name"
                    placeholder={t("contactUs.namePlaceholder")}
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800 text-sm font-semibold placeholder-slate-400 shadow-sm transition-all bg-white"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder={t("contactUs.emailPlaceholder")}
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800 text-sm font-semibold placeholder-slate-400 shadow-sm transition-all bg-white"
                  />
                </div>

                <div>
                  <textarea
                    name="message"
                    placeholder={t("contactUs.messagePlaceholder")}
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800 text-sm font-semibold placeholder-slate-400 shadow-sm transition-all bg-white resize-none"
                  />
                </div>

                <div className="relative">
                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-500 text-sm font-semibold placeholder-slate-400 shadow-sm transition-all bg-white appearance-none cursor-pointer"
                  >
                    <option value="" disabled>{t("contactUs.sourcePlaceholder")}</option>
                    <option value="search">{t("contactUs.sourceOption1")}</option>
                    <option value="social">{t("contactUs.sourceOption2")}</option>
                    <option value="referral">{t("contactUs.sourceOption3")}</option>
                    <option value="other">{t("contactUs.sourceOption4")}</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] uppercase tracking-wider"
                >
                  {t("contactUs.sendButton")}
                </button>
              </form>
            </div>

            {/* Right Column - Illustration Images with exact Figma dimensions */}
            <div className="relative flex justify-center lg:justify-end items-center min-h-[600px] lg:min-h-[743px] w-full">
              
              {/* Bottom Image / Accent (aboutUs-bottom.png: Width 419px, Height 900px) */}
              <div className="absolute right-[-100vw] lg:right-[-40px] top-1/2 -translate-y-1/2 w-full lg:w-[419px] h-[900px] hidden lg:block -z-10 overflow-hidden">
                <Image
                  src="/images/aboutUs-bottom.png"
                  alt="About Us Bottom Graphic"
                  fill
                  className="object-cover object-right"
                />
              </div>

              {/* Top Main Image (aboutUs-top.png: Width 550px, Height 743px) */}
              <div className="relative w-full max-w-[550px] lg:w-[550px] h-[500px] lg:h-[743px] rounded-[32px] lg:rounded-[48px] overflow-hidden shadow-2xl z-10 border-4 border-white/10">
                <Image
                  src="/images/aboutUs-top.png"
                  alt="About Us Top Illustration"
                  fill
                  priority
                  className="object-cover object-center"
                />
              </div>

            </div>

          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
