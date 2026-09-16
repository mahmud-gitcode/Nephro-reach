"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

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
    <section className="relative flex min-h-[calc(100vh-101px)] w-full items-center justify-center overflow-hidden lg:h-[calc(100vh-101px)]">
      <Image
        src="/images/home/NephroReach-clean.jpg"
        alt={`NephroReach - ${line1} ${line2}`}
        fill
        priority
        className="object-cover object-[30%_center] xl:object-[35%_center] 2xl:object-center"
        sizes="100vw"
      />
      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] items-center justify-end px-6 py-8 sm:px-10 sm:py-10 lg:px-12 xl:max-w-[1680px] xl:px-16">
        <div className="relative z-10 flex w-full max-w-[550px] flex-col items-start gap-7 rounded-2xl bg-white/80 p-6 backdrop-blur-sm sm:mr-[164px] sm:w-[550px] sm:rounded-none sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <div className="flex w-full flex-col gap-5">
            <h1
              className="text-[26px] leading-[1.25] font-semibold tracking-[0.2px] text-[#0F172A] sm:text-[34px] md:text-[38px] lg:text-[42px] xl:text-[44px]"
              aria-label={`${line1} ${line2}`}
            >
              {/* Line 1 with typewriter effect */}
              <span
                className="block min-h-[1.25em] sm:whitespace-nowrap"
                aria-hidden="true"
              >
                <span>{text1}</span>
                {activeLine === 1 && showCursor && (
                  <span
                    className="animate-cursor-blink ml-1.5 inline-block h-[0.82em] w-[3px] rounded-sm bg-[#0F172A] align-middle"
                    aria-hidden="true"
                  />
                )}
              </span>
              {/* Line 2 with typewriter effect in red */}
              <span
                className="block min-h-[1.25em] text-[#EF4444] sm:whitespace-nowrap"
                aria-hidden="true"
              >
                <span>{text2}</span>
                {activeLine === 2 && showCursor && (
                  <span
                    className="animate-cursor-blink ml-1.5 inline-block h-[0.82em] w-[3px] rounded-sm bg-[#EF4444] align-middle"
                    aria-hidden="true"
                  />
                )}
              </span>
            </h1>
            <p className="animate-timed-subtext w-full text-base leading-relaxed font-normal text-[#344056] sm:text-[17px] lg:text-lg">
              {t("hero.description")}
            </p>
          </div>
          <div className="animate-timed-cta flex flex-wrap items-center gap-6 pt-1">
            <div className="group relative inline-flex">
              {/* Subtle light ambient glow */}
              <div
                className="absolute -inset-0.5 rounded-lg bg-blue-500/25 opacity-70 blur-[6px] transition-all duration-300 group-hover:bg-blue-500/40 group-hover:opacity-100 group-hover:blur-[8px]"
                aria-hidden="true"
              />
              <Link
                href="/pricing"
                className="relative inline-flex h-[52px] cursor-pointer items-center justify-center rounded-lg bg-[#2563EB] px-7 py-3 text-base font-bold tracking-[0.08px] text-white shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-[0_6px_20px_rgba(37,99,235,0.38)] active:scale-[0.98]"
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
              className="inline-flex h-[52px] cursor-pointer items-center justify-center rounded-lg border border-[#CBD5E1] bg-white px-6 py-3 text-base font-bold tracking-[0.08px] text-[#0F172A] shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:text-[#2563EB] active:scale-[0.98]"
            >
              <span>{t("hero.howItWorks")}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
