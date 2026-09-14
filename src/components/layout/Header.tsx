"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { useLanguage, LanguageCode } from "@/context/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import { homeForRole } from "@/features/auth/auth";

const USFlag = () => (
  <svg
    className="h-3 w-4 shrink-0 rounded-[2px] border border-slate-200/50 object-cover"
    viewBox="0 0 640 480"
  >
    <g fillRule="evenodd">
      <path fill="#bd3d44" d="M0 0h640v480H0z" />
      <path
        stroke="#fff"
        strokeWidth="37"
        d="M0 55.4h640M0 129.2h640M0 203h640M0 276.9h640M0 350.7h640M0 424.6h640"
      />
      <path fill="#192f5d" d="M0 0h284.8v258.5H0z" />
      <g fill="#fff">
        <circle cx="28" cy="24" r="7" />
        <circle cx="84" cy="24" r="7" />
        <circle cx="140" cy="24" r="7" />
        <circle cx="196" cy="24" r="7" />
        <circle cx="252" cy="24" r="7" />
        <circle cx="56" cy="56" r="7" />
        <circle cx="112" cy="56" r="7" />
        <circle cx="168" cy="56" r="7" />
        <circle cx="224" cy="56" r="7" />
        <circle cx="28" cy="88" r="7" />
        <circle cx="84" cy="88" r="7" />
        <circle cx="140" cy="88" r="7" />
        <circle cx="196" cy="88" r="7" />
        <circle cx="252" cy="88" r="7" />
        <circle cx="56" cy="120" r="7" />
        <circle cx="112" cy="120" r="7" />
        <circle cx="168" cy="120" r="7" />
        <circle cx="224" cy="120" r="7" />
        <circle cx="28" cy="152" r="7" />
        <circle cx="84" cy="152" r="7" />
        <circle cx="140" cy="152" r="7" />
        <circle cx="196" cy="152" r="7" />
        <circle cx="252" cy="152" r="7" />
      </g>
    </g>
  </svg>
);

const SpainFlag = () => (
  <svg
    className="h-3 w-4 shrink-0 rounded-[2px] border border-slate-200/50 object-cover"
    viewBox="0 0 640 480"
  >
    <path fill="#c60b1e" d="M0 0h640v480H0z" />
    <path fill="#ffc400" d="M0 120h640v240H0z" />
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

const navLinkClass = (active: boolean) =>
  [
    "text-[15.5px] leading-[20.93px] tracking-[0.155px] transition-colors",
    active
      ? "font-inter font-bold text-[#1D4ED8] underline decoration-solid [text-decoration-skip-ink:none] [text-underline-position:from-font]"
      : "font-medium text-[#25221E] hover:text-[#2563EB]",
  ].join(" ");

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user, logout, ready } = useAuth();
  const dashboardHref = user ? homeForRole(user.role) : "/login";
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        // Scrolling down & passed header height -> hide
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up -> show
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const selectedLang =
    languages.find((l) => l.code === language) || languages[0];

  const isLinkActive = (path: string) => {
    if (path === "/") return pathname === "/";
    if (path === "/about-us") return pathname === "/about-us";
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* Spacer to prevent layout shift since header is fixed */}
      <div className="h-[101px] w-full shrink-0" />
      <header
        className={`fixed top-0 left-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md transition-transform duration-300 ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-auto flex h-[101px] w-full max-w-[1344px] items-center justify-between px-5 min-[1344px]:px-0 sm:px-8 lg:px-12">
          {/* Left Group: Logo + Language Selector */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/"
              className="flex items-center transition-opacity hover:opacity-90"
            >
              <Image
                src="/images/home/nav-logo.svg"
                alt="NephroReach Logo"
                width={86}
                height={68}
                priority
                className="h-[68px] w-[86px] object-contain"
              />
            </Link>

            {/* Left-aligned Language Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border-b-2 border-[#111827] bg-[#F1F5FA] p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-colors hover:bg-slate-100 focus:outline-none"
                aria-label={t("header.changeLanguage") || "Change language"}
              >
                <span className="relative h-6 w-[33px] overflow-clip rounded-[2px]">
                  <img
                    src={
                      language === "ES"
                        ? "/images/dashboard-header/spain-flag.svg"
                        : "/images/dashboard-header/usa-flag.svg"
                    }
                    alt={
                      language === "ES"
                        ? t("header.spanish") || "Spanish"
                        : t("header.english") || "English"
                    }
                    className="size-full"
                  />
                </span>
                <span className="relative block size-6 overflow-clip">
                  <img
                    src="/images/dashboard-header/arrow-down.svg"
                    alt=""
                    className="size-full"
                  />
                </span>
              </button>

              {langDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setLangDropdownOpen(false)}
                  />
                  <div className="animate-in fade-in slide-in-from-top-1 absolute left-0 z-50 mt-2 w-32 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg duration-150">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setLanguage(lang.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold transition-colors ${
                          selectedLang.code === lang.code
                            ? "bg-blue-50/70 font-bold text-blue-600"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="relative h-4 w-[22px] shrink-0 overflow-clip rounded-[2px]">
                          <img
                            src={
                              lang.code === "ES"
                                ? "/images/dashboard-header/spain-flag.svg"
                                : "/images/dashboard-header/usa-flag.svg"
                            }
                            alt=""
                            className="size-full object-cover"
                          />
                        </span>
                        <span>
                          {lang.code === "ES"
                            ? t("header.spanish") || "Spanish"
                            : t("header.english") || "English"}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Grouped Nav Links and Action Buttons */}
          <div className="hidden items-center gap-8 md:flex">
            <nav className="flex items-center gap-8">
              <Link
                href="/"
                aria-current={isLinkActive("/") ? "page" : undefined}
                className={navLinkClass(isLinkActive("/"))}
              >
                {t("header.home")}
              </Link>
              <Link
                href="/faq"
                aria-current={isLinkActive("/faq") ? "page" : undefined}
                className={navLinkClass(isLinkActive("/faq"))}
              >
                {t("header.faq")}
              </Link>
              <Link
                href="/about-us"
                aria-current={isLinkActive("/about-us") ? "page" : undefined}
                className={navLinkClass(isLinkActive("/about-us"))}
              >
                {t("header.aboutUs")}
              </Link>
              <Link
                href="/pricing"
                aria-current={isLinkActive("/pricing") ? "page" : undefined}
                className={navLinkClass(isLinkActive("/pricing"))}
              >
                {t("header.pricing")}
              </Link>
            </nav>

            <div className="flex items-center gap-5">
              {ready && user ? (
                <>
                  <Link
                    href={dashboardHref}
                    className="px-1 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
                  >
                    {t("header.openDashboard")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98] active:bg-blue-800"
                  >
                    {t("header.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    aria-current={isLinkActive("/login") ? "page" : undefined}
                    className={`px-3.5 py-2 ${navLinkClass(isLinkActive("/login"))}`}
                  >
                    {t("header.login")}
                  </Link>
                  <Link
                    href="/registration"
                    className="inline-flex h-[52px] items-center justify-center rounded bg-[#2563EB] px-3.5 text-base font-bold text-white transition-colors hover:bg-[#1D4ED8]"
                  >
                    {t("header.tryItFree")}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="cursor-pointer rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden"
            aria-label={t("header.toggleMenu") || "Toggle Menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="space-y-3 border-b border-slate-100 bg-white px-4 pt-2 pb-6 shadow-lg md:hidden">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isLinkActive("/") ? "page" : undefined}
              className={`block py-2 ${navLinkClass(isLinkActive("/"))}`}
            >
              {t("header.home")}
            </Link>
            <Link
              href="/faq"
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isLinkActive("/faq") ? "page" : undefined}
              className={`block py-2 ${navLinkClass(isLinkActive("/faq"))}`}
            >
              {t("header.faq")}
            </Link>
            <Link
              href="/about-us"
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isLinkActive("/about-us") ? "page" : undefined}
              className={`block py-2 ${navLinkClass(isLinkActive("/about-us"))}`}
            >
              {t("header.aboutUs")}
            </Link>

            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isLinkActive("/pricing") ? "page" : undefined}
              className={`block py-2 ${navLinkClass(isLinkActive("/pricing"))}`}
            >
              {t("header.pricing")}
            </Link>

            {/* Mobile Language Select */}
            <div className="border-t border-b border-slate-100 py-2.5">
              <span className="mb-2 block text-xs font-semibold tracking-wider text-slate-400 uppercase">
                {t("header.language") || "Language"}
              </span>
              <div className="flex gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code)}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                      selectedLang.code === lang.code
                        ? "border-b-2 border-[#111827] bg-[#F1F5FA] font-bold text-blue-700 shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
                        : "border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="relative h-4 w-[22px] shrink-0 overflow-clip rounded-[2px]">
                      <img
                        src={
                          lang.code === "ES"
                            ? "/images/dashboard-header/spain-flag.svg"
                            : "/images/dashboard-header/usa-flag.svg"
                        }
                        alt=""
                        className="size-full object-cover"
                      />
                    </span>
                    <span>
                      {lang.code === "ES"
                        ? t("header.spanish") || "Spanish"
                        : t("header.english") || "English"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              {ready && user ? (
                <>
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 text-center font-semibold text-slate-700 hover:text-blue-600"
                  >
                    {t("header.openDashboard")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="rounded-xl bg-[#2563EB] py-3 text-center font-bold text-white shadow-md"
                  >
                    {t("header.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isLinkActive("/login") ? "page" : undefined}
                    className={`py-2.5 text-center ${navLinkClass(isLinkActive("/login"))}`}
                  >
                    {t("header.login")}
                  </Link>
                  <Link
                    href="/registration"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl bg-[#2563EB] py-3 text-center font-bold text-white shadow-md"
                  >
                    {t("header.tryItFree")}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
