"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

import { useLanguage } from "@/context/LanguageContext";

const VIEWPORTS_PER_STEP = 0.9;

export default function Engagement() {
  const { t } = useLanguage();

  const steps = [
    {
      label: t("engagement.item1Badge"),
      labelColor: "#C77B00",
      title: t("engagement.item1Title"),
      desc: t("engagement.item1Desc"),
    },
    {
      label: t("engagement.item2Badge"),
      labelColor: "#497D7E",
      title: t("engagement.item2Title"),
      desc: t("engagement.item2Desc"),
    },
    {
      label: t("engagement.item3Badge"),
      labelColor: "#E34432",
      title: t("engagement.item3Title"),
      desc: t("engagement.item3Desc"),
    },
    {
      label: t("engagement.item4Badge"),
      labelColor: "#4C7A45",
      title: t("engagement.item4Title"),
      desc: t("engagement.item4Desc"),
    },
  ];

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const canPin = window.matchMedia(
      "(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)",
    );

    const sync = () => setIsPinned(canPin.matches);
    sync();
    canPin.addEventListener("change", sync);
    return () => canPin.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isPinned) {
      setActiveStep(0);
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const area = scrollAreaRef.current;
      if (!area) return;

      const { top, height } = area.getBoundingClientRect();
      const scrollable = height - window.innerHeight;
      if (scrollable <= 0) return;

      const progress = Math.min(Math.max(-top / scrollable, 0), 0.999);
      setActiveStep(Math.floor(progress * steps.length));
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isPinned]);

  const goToStep = useCallback(
    (index: number) => {
      const area = scrollAreaRef.current;
      if (!area || !isPinned) return;

      const scrollable = area.offsetHeight - window.innerHeight;
      const offset = ((index + 0.5) / steps.length) * scrollable;
      window.scrollTo({ top: area.offsetTop + offset, behavior: "smooth" });
    },
    [isPinned],
  );

  return (
    <section
      ref={scrollAreaRef}
      className="relative w-full bg-white"
      style={
        isPinned
          ? { height: `${steps.length * VIEWPORTS_PER_STEP * 100}vh` }
          : undefined
      }
    >
      <div
        className={[
          "flex w-full flex-col justify-center py-12",
          isPinned ? "sticky top-0 h-screen overflow-hidden" : "",
        ].join(" ")}
      >
        <div className="mx-auto flex w-full max-w-[1344px] flex-col items-center gap-12 px-5 min-[1344px]:px-0 sm:px-8 lg:px-12">
          <div className="flex w-full flex-col items-center gap-3 text-center">
            <h2 className="text-[28px] leading-10 font-semibold tracking-[0.72px] text-[#0F172A] sm:text-[36px]">
              {t("engagement.title")}
            </h2>
            <p className="text-lg leading-7 font-medium tracking-[0.1px] text-[#344056] sm:text-xl">
              {t("engagement.subtitle")}
            </p>
          </div>

          <div className="flex w-full flex-col items-center justify-between gap-10 lg:flex-row lg:items-center lg:gap-14">
            <div className="relative w-full max-w-[580px] shrink-0 lg:w-[560px] xl:w-[600px]">
              <div className="relative aspect-[1332/1072] w-full overflow-hidden rounded-[24px] opacity-90 blur-[1.5px]">
                <Image
                  src="/images/home/engagement.png"
                  alt="NephroReach dashboard preview"
                  fill
                  className="rounded-[24px] object-cover"
                  sizes="(max-width: 1024px) 100vw, 600px"
                />
                <div className="absolute inset-0 rounded-[24px] bg-[rgba(0,99,255,0.1)]" />
              </div>

              <div className="absolute top-1/2 left-1/2 flex w-[min(380px,88%)] -translate-x-1/2 -translate-y-1/2 flex-col gap-[7.915px] rounded-[12.861px] border-[0.989px] border-[rgba(37,34,30,0.18)] bg-white px-[0.989px] pt-[0.989px] pb-[9.893px] drop-shadow-[0_5.947px_7.434px_rgba(0,0,0,0.1)]">
                <div className="flex w-full flex-col gap-[7.915px] p-[11.872px]">
                  <p className="text-[15.829px] leading-[23.744px] font-medium tracking-[0.079px] text-[#0F172A]">
                    check-in
                  </p>
                  <p className="text-[13.851px] leading-[19.787px] font-medium tracking-[0.069px] text-[#344056]">
                    Have you Taken Medication
                  </p>
                </div>
                <div className="h-[0.989px] w-full bg-[rgba(37,34,30,0.18)]" />
                <div className="flex w-full items-center justify-end gap-[12.861px] px-[11.872px]">
                  <button
                    type="button"
                    className="flex h-[35.616px] items-center justify-center rounded-[7.915px] border-[0.989px] border-[#E2E8F0] bg-[#F9F9F9] p-[11.872px] text-[13.7px] leading-[19.575px] font-medium tracking-[0.069px] text-[#0F172A]"
                  >
                    Not yet
                  </button>
                  <button
                    type="button"
                    className="flex h-[35.616px] items-center justify-center rounded-[7.915px] bg-[#2563EB] p-[11.872px] text-[13.7px] leading-[19.575px] font-medium tracking-[0.069px] text-white shadow-[inset_0_-0.989px_0_0_#DBE9FE]"
                  >
                    Yes, I have
                  </button>
                </div>
              </div>
            </div>

            <div className="relative flex w-full flex-1 items-start lg:max-w-[620px] lg:self-stretch lg:py-16 lg:pr-0 lg:pl-12">
              {isPinned && (
                <div className="absolute top-[72px] left-0 flex shrink-0 flex-col gap-2">
                  {steps.map((step, index) => (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => goToStep(index)}
                      aria-label={`Go to step ${index + 1}: ${step.title}`}
                      aria-current={index === activeStep}
                      className="group flex h-8 w-4 items-center justify-center"
                    >
                      <span
                        className={[
                          "w-[3px] rounded-full transition-all duration-300",
                          index === activeStep
                            ? "h-8 bg-[#2563EB]"
                            : "h-4 bg-[#CBD5E1] group-hover:bg-[#94A3B8]",
                        ].join(" ")}
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="relative w-full">
                {steps.map((step, index) => (
                  <div
                    key={step.title}
                    aria-hidden={isPinned && index !== activeStep}
                    className={[
                      "flex w-full flex-col gap-4",
                      isPinned
                        ? "transition-all duration-500 ease-out"
                        : "mb-14 last:mb-0",
                      isPinned && index !== activeStep
                        ? "pointer-events-none absolute inset-0 translate-y-3 opacity-0"
                        : "relative translate-y-0 opacity-100",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-6">
                      <h3 className="text-[32px] leading-none font-normal tracking-[0.24px] text-[#0F172A] sm:text-[40px] xl:text-[48px]">
                        {step.title}
                      </h3>
                      <p className="font-inter text-lg leading-[32.8px] font-medium text-[rgba(37,34,30,0.66)] sm:text-[20.5px]">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
