"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

import { useLanguage } from "@/context/LanguageContext";

/* ==========================================================================
   "Your Health, All in One Place"
   --------------------------------------------------------------------------
   The client (2026-10-05): instead of four sentences that toggled as the
   page scrolled — which pinned the page and made it feel stuck — each
   topic has its own picture, and the pictures change on their own. The
   page scrolls freely. A member can still pick a topic, and the rotation
   pauses while the pointer or keyboard focus is on the section, and for
   anyone who prefers reduced motion.

   Pictures are the closest the site has today; the client can swap any
   of them by changing its path below.
   ========================================================================== */

const ROTATE_MS = 6000;

export default function Engagement() {
  const { t } = useLanguage();

  const topics = [
    {
      label: t("engagement.item1Badge"),
      title: t("engagement.item1Title"),
      desc: t("engagement.item1Desc"),
      image: "/images/home/how-1.png",
      alt: "Signing up for NephroReach",
    },
    {
      label: t("engagement.item2Badge"),
      title: t("engagement.item2Title"),
      desc: t("engagement.item2Desc"),
      image: "/images/home/how-4.png",
      alt: "A NephroReach check-in on a phone",
    },
    {
      label: t("engagement.item3Badge"),
      title: t("engagement.item3Title"),
      desc: t("engagement.item3Desc"),
      image: "/images/Class.jpg",
      alt: "The NephroReach classroom",
    },
    {
      label: t("engagement.item4Badge"),
      title: t("engagement.item4Title"),
      desc: t("engagement.item4Desc"),
      image: "/images/home/how-3.png",
      alt: "The NephroReach journal",
    },
    {
      label: t("engagement.item5Badge"),
      title: t("engagement.item5Title"),
      desc: t("engagement.item5Desc"),
      image: "/images/home/engagement.png",
      alt: "The NephroReach dashboard",
    },
  ];

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    const id = window.setInterval(
      () => setActive((current) => (current + 1) % topics.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(id);
  }, [paused, reduced, topics.length]);

  const topic = topics[active];

  return (
    <section
      id="your-health"
      className="w-full bg-white py-16 lg:py-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
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

        <div className="flex w-full flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-14">
          {/* The picture for the topic showing, cross-faded. */}
          <div className="relative aspect-[4/3] w-full max-w-[600px] shrink-0 overflow-hidden rounded-[24px] bg-[#F8FAFF] lg:w-[560px] xl:w-[600px]">
            {topics.map((item, index) => (
              <Image
                key={item.image}
                src={item.image}
                alt={index === active ? item.alt : ""}
                aria-hidden={index !== active}
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className={`object-cover transition-opacity duration-700 ease-out ${
                  index === active ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </div>

          <div className="flex w-full flex-1 flex-col gap-8 lg:max-w-[620px]">
            <div
              aria-live="polite"
              className="flex min-h-[220px] flex-col gap-4"
            >
              <span className="text-sm font-semibold tracking-[0.08em] text-[#2563EB] uppercase">
                {topic.label}
              </span>
              <h3 className="text-[32px] leading-tight font-normal tracking-[0.24px] text-[#0F172A] sm:text-[40px]">
                {topic.title}
              </h3>
              <p className="font-inter text-lg leading-[32.8px] font-medium whitespace-pre-line text-[rgba(37,34,30,0.66)]">
                {topic.desc}
              </p>
            </div>

            {/* Pick a topic; the bar under the chosen one fills as it waits. */}
            <div
              role="tablist"
              aria-label={t("engagement.title")}
              className="grid grid-cols-5 gap-2"
            >
              {topics.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  role="tab"
                  aria-selected={index === active}
                  aria-label={item.title}
                  onClick={() => setActive(index)}
                  className="group flex h-11 cursor-pointer items-center"
                >
                  <span className="relative block h-1.5 w-full overflow-hidden rounded-full bg-[#E2E8F0] group-hover:bg-[#CBD5E1]">
                    <span
                      key={index === active ? `${active}-on` : `${index}-off`}
                      className={`absolute inset-y-0 left-0 rounded-full bg-[#2563EB] ${
                        index === active
                          ? paused || reduced
                            ? "w-full"
                            : "landing-progress w-full"
                          : index < active
                            ? "w-full opacity-40"
                            : "w-0"
                      }`}
                      style={
                        index === active && !(paused || reduced)
                          ? { animationDuration: `${ROTATE_MS}ms` }
                          : undefined
                      }
                    />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
