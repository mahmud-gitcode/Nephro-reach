"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  SubscriptionPlan,
  DEFAULT_SUBSCRIPTION_PLANS,
  getStoredSubscriptionPlans,
} from "@/lib/subscriptions";
import { useLanguage } from "@/context/LanguageContext";

function FeatureIcon({ included }: { included: boolean }) {
  return (
    <span className="relative block size-7 shrink-0 overflow-clip rounded-full border border-[#F4F4F5] bg-[#FCFCFC]">
      <span className="absolute left-1/2 top-1/2 block size-5 -translate-x-1/2 -translate-y-1/2">
        {included ? (
          <span className="absolute inset-[20%_15%] block">
            <img
              src="/images/home/pricing-check.svg"
              alt=""
              className="block size-full max-w-none"
            />
          </span>
        ) : (
          <img
            src="/images/home/pricing-x.svg"
            alt=""
            className="absolute inset-0 block size-full max-w-none opacity-60"
          />
        )}
      </span>
    </span>
  );
}

function PlanCard({
  plan,
  ctaVariant = "primary",
  ctaText = "Get Started",
  className = "",
}: {
  plan: SubscriptionPlan;
  ctaVariant?: "primary" | "outline";
  ctaText?: string;
  className?: string;
}) {
  return (
    <div
      className={[
        "flex w-full flex-1 flex-col justify-between gap-5 overflow-clip rounded-[36px] border border-[#E2E8F0] p-6 transition-all duration-300",
        plan.popular
          ? "bg-gradient-to-b from-white to-[#F2F7FF] shadow-lg shadow-blue-500/10"
          : "bg-[#F8FAFC]",
        className,
      ].join(" ")}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <div>
            <h3
              className={[
                "text-lg font-bold leading-6 tracking-[0.1px]",
                plan.popular ? "text-[#2563EB]" : "text-[#0F172A]",
              ].join(" ")}
            >
              {plan.name}
            </h3>
          </div>

          <div className="flex flex-wrap items-baseline gap-1">
            <span className="font-inter text-[34px] font-bold leading-none text-[#0F172A]">
              {plan.price}
            </span>
            {plan.billing && (
              <span className="text-sm font-medium text-[#475467]">
                {plan.billing}
              </span>
            )}
          </div>

          <Link
            href="/registration"
            className={[
              "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3",
              "text-sm font-bold leading-5 tracking-[0.05px] transition-all duration-200 cursor-pointer",
              ctaVariant === "outline" && !plan.popular
                ? "border border-[#0F172A] bg-white text-[#0F172A] hover:bg-slate-50 hover:border-slate-800 shadow-xs"
                : "bg-[#2563EB] text-white shadow-[inset_0px_-1px_0px_0px_#DBE9FE] hover:bg-[#1D4ED8] hover:shadow-md hover:shadow-blue-500/20",
            ].join(" ")}
          >
            {ctaText}
          </Link>
        </div>

        <div className="h-px w-full border-t border-dashed border-[#E2E8F0]" />

        <ul className="flex flex-col gap-3">
          {plan.features.map((feature) => (
            <li key={feature.label} className="flex items-start gap-2.5">
              <FeatureIcon included={feature.included} />
              <span
                className={[
                  "text-[13px] font-medium leading-5",
                  feature.included ? "text-[#0F172A]" : "text-[#94A3B8]",
                ].join(" ")}
              >
                {feature.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Pricing({
  eyebrow,
  sideCtaVariant = "outline",
}: {
  eyebrow?: string;
  sideCtaVariant?: "primary" | "outline";
}) {
  const { t, language } = useLanguage();
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_SUBSCRIPTION_PLANS);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [equalHeight, setEqualHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    setPlans(getStoredSubscriptionPlans());
  }, []);

  useEffect(() => {
    const syncHeights = () => {
      // Synchronize heights on screens where cards are in multi-column layout (>= 768px)
      if (typeof window === "undefined" || window.innerWidth < 768) {
        setEqualHeight(undefined);
        return;
      }

      let maxH = 0;
      cardRefs.current.forEach((el) => {
        if (el) {
          const prev = el.style.minHeight;
          el.style.minHeight = "auto";
          const h = el.offsetHeight;
          if (h > maxH) maxH = h;
          el.style.minHeight = prev;
        }
      });

      if (maxH > 0) {
        setEqualHeight(maxH);
      }
    };

    const timer = setTimeout(syncHeights, 50);
    window.addEventListener("resize", syncHeights);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", syncHeights);
    };
  }, [plans, language]);

  const translatePlan = (plan: SubscriptionPlan) => {
    if (language !== "ES") return plan;
    const nameMap: Record<string, string> = {
      "Essential Membership": "Membresía Esencial",
      "Full Membership": "Membresía Completa",
      "Live Class Only": "Solo Clase en Vivo",
      "21-Day Dialysis Journey": "Viaje de Diálisis de 21 Días",
    };
    const billingMap: Record<string, string> = {
      "/Month": "/Mes",
      "/Class": "/Clase",
      "One-time purchase": "Compra única",
      "One-time pass": "Pase único",
    };
    return {
      ...plan,
      name: nameMap[plan.name] || plan.name,
      billing: plan.billing ? billingMap[plan.billing] || plan.billing : plan.billing,
      badge: plan.badge === "Most Popular" ? "Más Popular" : plan.badge,
    };
  };

  return (
    <section
      id="pricing"
      className="w-full scroll-mt-24 bg-white py-16 lg:py-20"
    >
      <div className="mx-auto flex w-full max-w-[1344px] flex-col gap-12 px-5 sm:px-8 lg:px-12 min-[1344px]:px-0">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="inline-flex rounded-full bg-[#EFF6FF] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#2563EB]">
            {eyebrow || t("pricing.badge")}
          </span>
          <div className="flex flex-col gap-2 max-w-[700px]">
            <h2 className="text-[28px] font-semibold leading-10 tracking-[0.18px] text-[#0F172A] sm:text-[36px]">
              {t("pricing.title")}
            </h2>
            <p className="text-base font-normal leading-7 tracking-[0.12px] text-[#344056] sm:text-xl">
              {t("pricing.description")}
            </p>
          </div>
        </div>

        {/* 4-Card Responsive Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 items-stretch">
          {plans.map((p, idx) => {
            const plan = translatePlan(p);
            return plan.popular ? (
              <div
                key={plan.id || plan.name}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                className="flex h-full flex-col items-stretch rounded-[40px] p-1 pt-2 drop-shadow-[0px_2px_8px_rgba(37,99,235,0.15)] hover:shadow-2xl card-smooth-hover"
                style={{
                  backgroundImage:
                    "linear-gradient(133.85deg, #2563EB 0.83%, #EF4444 82.15%)",
                  minHeight: equalHeight ? `${equalHeight}px` : undefined,
                }}
              >
                <p className="mb-2 text-center text-sm font-bold uppercase tracking-wider text-white">
                  {plan.badge || t("pricing.mostPopular")}
                </p>
                <div className="flex h-full flex-1 flex-col">
                  <PlanCard
                    plan={plan}
                    ctaText={t("pricing.getStarted")}
                    className="h-full flex-1"
                  />
                </div>
              </div>
            ) : (
              <div
                key={plan.id || plan.name}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                style={{
                  minHeight: equalHeight ? `${equalHeight}px` : undefined,
                }}
                className="flex h-full flex-col items-stretch hover:shadow-xl rounded-[36px] card-smooth-hover"
              >
                <PlanCard
                  plan={plan}
                  ctaVariant={sideCtaVariant}
                  ctaText={t("pricing.getStarted")}
                  className="h-full flex-1"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
