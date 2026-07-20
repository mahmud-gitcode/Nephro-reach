"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { useLanguage, LanguageCode } from "@/context/LanguageContext";

const USFlag = () => (
  <svg className="w-4 h-3 rounded-[2px] object-cover shrink-0 border border-slate-200/50" viewBox="0 0 640 480">
    <g fillRule="evenodd">
      <path fill="#bd3d44" d="M0 0h640v480H0z"/>
      <path stroke="#fff" strokeWidth="37" d="M0 55.4h640M0 129.2h640M0 203h640M0 276.9h640M0 350.7h640M0 424.6h640"/>
      <path fill="#192f5d" d="M0 0h284.8v258.5H0z"/>
      <g fill="#fff">
        <circle cx="28" cy="24" r="7"/>
        <circle cx="84" cy="24" r="7"/>
        <circle cx="140" cy="24" r="7"/>
        <circle cx="196" cy="24" r="7"/>
        <circle cx="252" cy="24" r="7"/>
        <circle cx="56" cy="56" r="7"/>
        <circle cx="112" cy="56" r="7"/>
        <circle cx="168" cy="56" r="7"/>
        <circle cx="224" cy="56" r="7"/>
        <circle cx="28" cy="88" r="7"/>
        <circle cx="84" cy="88" r="7"/>
        <circle cx="140" cy="88" r="7"/>
        <circle cx="196" cy="88" r="7"/>
        <circle cx="252" cy="88" r="7"/>
        <circle cx="56" cy="120" r="7"/>
        <circle cx="112" cy="120" r="7"/>
        <circle cx="168" cy="120" r="7"/>
        <circle cx="224" cy="120" r="7"/>
        <circle cx="28" cy="152" r="7"/>
        <circle cx="84" cy="152" r="7"/>
        <circle cx="140" cy="152" r="7"/>
        <circle cx="196" cy="152" r="7"/>
        <circle cx="252" cy="152" r="7"/>
      </g>
    </g>
  </svg>
);

const SpainFlag = () => (
  <svg className="w-4 h-3 rounded-[2px] object-cover shrink-0 border border-slate-200/50" viewBox="0 0 640 480">
    <path fill="#c60b1e" d="M0 0h640v480H0z"/>
    <path fill="#ffc400" d="M0 120h640v240H0z"/>
  </svg>
);

interface LanguageOption {
  code: LanguageCode;
  label: string;
  FlagComponent: React.ComponentType;
}

const languages: LanguageOption[] = [
  { code: "EN", label: "English", FlagComponent: USFlag },
  { code: "ES", label: "Spanish", FlagComponent: SpainFlag },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const selectedLang = languages.find((l) => l.code === language) || languages[0];

  const isLinkActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 transition-all duration-300 w-full px-15">
      <div className="w-full px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between">
        
        {/* Left Group: Logo + Language Selector */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Image
              src="/images/logo.png"
              alt="NephroReach Logo"
              width={100}
              height={50}
              priority
              className="object-contain"
              style={{ height: "auto" }}
            />
          </Link>

          {/* Left-aligned Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 px-2.5 py-1.5 rounded-lg border border-slate-200/80 hover:border-blue-200 bg-slate-50/50 hover:bg-blue-50/30 transition-all focus:outline-none"
              aria-label="Select Language"
            >
              <selectedLang.FlagComponent />
              <span>{selectedLang.code}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {langDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setLangDropdownOpen(false)} 
                />
                <div className="absolute left-0 mt-2 w-32 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-left transition-colors ${
                        selectedLang.code === lang.code 
                          ? "text-blue-600 bg-blue-50/70 font-bold" 
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <lang.FlagComponent />
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Grouped Nav Links and Action Buttons */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-8 text-sm font-semibold">
            <Link 
              href="/" 
              className={`transition-colors ${
                isLinkActive("/") && !pathname.includes("#")
                  ? "text-blue-600 font-bold"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              {t("header.home")}
            </Link>
            <Link 
              href="/faq" 
              className={`transition-colors ${
                isLinkActive("/faq")
                  ? "text-blue-600 font-bold"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              {t("header.faq")}
            </Link>
            <Link 
              href="/about-us" 
              className={`transition-colors ${
                isLinkActive("/about-us")
                  ? "text-blue-600 font-bold"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              {t("header.aboutUs")}
            </Link>
            <Link 
              href="/pricing" 
              className={`transition-colors ${
                isLinkActive("/pricing")
                  ? "text-blue-600 font-bold"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              {t("header.pricing")}
            </Link>
          </nav>

          <div className="flex items-center gap-5">
            <Link 
              href="/login" 
              className={`text-sm font-semibold transition-colors px-1 py-2 ${
                isLinkActive("/login") ? "text-blue-600 font-bold" : "text-slate-700 hover:text-blue-600"
              }`}
            >
              {t("header.login")}
            </Link>
            <Link 
              href="/registration" 
              className="bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              {t("header.tryItFree")}
            </Link>
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <Link 
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-slate-700 hover:text-blue-600"
          >
            {t("header.home")}
          </Link>
          <Link 
            href="/faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-slate-700 hover:text-blue-600"
          >
            {t("header.faq")}
          </Link>
          <Link 
            href="/about-us"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-slate-700 hover:text-blue-600"
          >
            {t("header.aboutUs")}
          </Link>
          <Link 
            href="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-slate-700 hover:text-blue-600"
          >
            {t("header.pricing")}
          </Link>

          {/* Mobile Language Select */}
          <div className="py-2 border-t border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Language</span>
            <div className="flex gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    selectedLang.code === lang.code
                      ? "bg-blue-50 border-blue-200 text-blue-600 font-bold"
                      : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <lang.FlagComponent />
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link 
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-2.5 font-semibold text-slate-700 hover:text-blue-600"
            >
              {t("header.login")}
            </Link>
            <Link 
              href="/registration"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-3 bg-[#2563EB] text-white font-bold rounded-xl shadow-md"
            >
              {t("header.tryItFree")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
