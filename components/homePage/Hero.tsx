"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

import nephroReachImg from "@/public/images/home/NephroReach-clean.png";

export default function Hero() {
  const { t } = useLanguage();
  const line1 = t("hero.titleLine1");
  const line2 = t("hero.titleLine2");

  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [activeLine, setActiveLine] = useState<1 | 2>(1);
  const [showCursor, setShowCursor] = useState(true);
  const [, setIsTypingComplete] = useState(false);

  useEffect(() => {
    setText1("");
    setText2("");
    setActiveLine(1);
    setShowCursor(true);
    setIsTypingComplete(false);

    let timeoutId: NodeJS.Timeout;
    let idx1 = 0;
    let idx2 = 0;

    const typeFirstLine = () => {
      if (idx1 < line1.length) {
        idx1++;
        setText1(line1.slice(0, idx1));
        timeoutId = setTimeout(typeFirstLine, 45);
      } else {
        // Pause before typing Line 2
        timeoutId = setTimeout(() => {
          setActiveLine(2);
          typeSecondLine();
        }, 350);
      }
    };

    const typeSecondLine = () => {
      if (idx2 < line2.length) {
        idx2++;
        setText2(line2.slice(0, idx2));
        timeoutId = setTimeout(typeSecondLine, 45);
      } else {
        setIsTypingComplete(true);
        // Hide cursor shortly after typing completes
        timeoutId = setTimeout(() => {
          setShowCursor(false);
        }, 700);
      }
    };

    // Initial delay before typing begins
    timeoutId = setTimeout(typeFirstLine, 250);

    return () => clearTimeout(timeoutId);
  }, [line1, line2]);

  return (
    <section className="flex w-full flex-col items-center justify-center p-5 sm:p-8 lg:p-12">
      <div className="relative mx-auto flex min-h-[420px] w-full max-w-[1344px] items-center justify-end overflow-hidden rounded-[24px] sm:min-h-[500px] lg:h-[570px] px-6 sm:px-10 lg:px-[71px]">
        <Image
          src={nephroReachImg}
          alt={`NephroReach - ${line1} ${line2}`}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="relative z-10 flex w-full sm:w-[585px] max-w-[585px] flex-col items-start gap-7 bg-white/75 p-6 backdrop-blur-sm sm:bg-transparent sm:p-0 sm:backdrop-blur-none sm:mr-1 md:mr-3 lg:mr-5 xl:mr-8">
          <div className="flex w-full flex-col gap-5">
            <h1
              className="text-[26px] font-semibold leading-[1.25] tracking-[0.2px] text-[#0F172A] sm:text-[34px] md:text-[38px] lg:text-[42px] xl:text-[44px]"
              aria-label={`${line1} ${line2}`}
            >
              {/* Line 1 with typewriter effect */}
              <span className="block min-h-[1.25em] sm:whitespace-nowrap" aria-hidden="true">
                <span>{text1}</span>
                {activeLine === 1 && showCursor && (
                  <span
                    className="inline-block w-[3px] h-[0.82em] bg-[#0F172A] ml-1.5 align-middle rounded-sm animate-cursor-blink"
                    aria-hidden="true"
                  />
                )}
              </span>
              {/* Line 2 with typewriter effect in red */}
              <span className="block min-h-[1.25em] text-[#EF4444] sm:whitespace-nowrap" aria-hidden="true">
                <span>{text2}</span>
                {activeLine === 2 && showCursor && (
                  <span
                    className="inline-block w-[3px] h-[0.82em] bg-[#EF4444] ml-1.5 align-middle rounded-sm animate-cursor-blink"
                    aria-hidden="true"
                  />
                )}
              </span>
            </h1>
            <p className="w-full text-base sm:text-[17px] lg:text-lg font-normal leading-relaxed text-[#344056] animate-timed-subtext">
              {t("hero.description")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 pt-1 animate-timed-cta">
            <div className="relative group inline-flex">
              {/* Subtle light ambient glow */}
              <div
                className="absolute -inset-0.5 rounded-lg bg-blue-500/25 blur-[6px] opacity-70 transition-all duration-300 group-hover:opacity-100 group-hover:bg-blue-500/40 group-hover:blur-[8px]"
                aria-hidden="true"
              />
              <Link
                href="/pricing"
                className="relative inline-flex h-[52px] items-center justify-center rounded-lg bg-[#2563EB] px-7 py-3 text-base font-bold tracking-[0.08px] text-white shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all duration-300 hover:bg-[#1D4ED8] hover:shadow-[0_6px_20px_rgba(37,99,235,0.38)] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
              >
                <span>{t("hero.button")}</span>
              </Link>
            </div>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById("how-it-works");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                } else {
                  window.location.href = "/#how-it-works";
                }
              }}
              className="inline-flex h-[52px] items-center justify-center rounded-lg border border-[#CBD5E1] bg-white px-6 py-3 text-base font-bold tracking-[0.08px] text-[#0F172A] shadow-xs transition-all duration-300 hover:bg-slate-50 hover:border-slate-400 hover:text-[#2563EB] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
            >
              <span>{t("hero.howItWorks")}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
