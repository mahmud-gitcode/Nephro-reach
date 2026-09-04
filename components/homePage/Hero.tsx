"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import nephroReachImg from "@/public/images/home/NephroReach-clean.png";

const LINE_1 = "Understand your kidneys.";
const LINE_2 = "Take control of your journey.";

export default function Hero() {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [activeLine, setActiveLine] = useState<1 | 2>(1);
  const [showCursor, setShowCursor] = useState(true);
  const [, setIsTypingComplete] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let idx1 = 0;
    let idx2 = 0;

    const typeFirstLine = () => {
      if (idx1 < LINE_1.length) {
        idx1++;
        setText1(LINE_1.slice(0, idx1));
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
      if (idx2 < LINE_2.length) {
        idx2++;
        setText2(LINE_2.slice(0, idx2));
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
  }, []);

  return (
    <section className="flex w-full flex-col items-center justify-center p-5 sm:p-8 lg:p-12">
      <div className="relative mx-auto flex min-h-[420px] w-full max-w-[1344px] items-center justify-end overflow-hidden rounded-[24px] sm:min-h-[500px] lg:h-[570px] px-6 sm:px-10 lg:px-[71px]">
        <Image
          src={nephroReachImg}
          alt="NephroReach - Understand your kidneys. Take control of your journey."
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="relative z-10 flex w-full sm:w-[585px] max-w-[585px] flex-col items-start gap-7 bg-white/75 p-6 backdrop-blur-sm sm:bg-transparent sm:p-0 sm:backdrop-blur-none sm:mr-1 md:mr-3 lg:mr-5 xl:mr-8">
          <div className="flex w-full flex-col gap-5">
            <h1
              className="text-[26px] font-semibold leading-[1.25] tracking-[0.2px] text-[#0F172A] sm:text-[34px] md:text-[38px] lg:text-[42px] xl:text-[44px]"
              aria-label={`${LINE_1} ${LINE_2}`}
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
              NephroReach gives you kidney education, personal health trackers,
              expert-led classes, and practical tools—all in one place to help
              you feel more informed, prepared, and confident.
            </p>
          </div>
          <Link
            href="/registration"
            className="inline-flex h-[52px] w-[194px] items-center justify-center rounded-[4px] bg-[#2563EB] px-6 py-3 text-base font-bold tracking-[0.08px] text-white shadow-[inset_0_-1px_0_0_#DBE9FE] transition-all duration-300 hover:bg-[#1D4ED8] hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 active:scale-[0.98] animate-timed-cta cursor-pointer"
          >
            <span>Try it free</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
