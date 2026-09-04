"use client";

import React from "react";
import Link from "next/link";

type Feature = { label: string; included: boolean };

const features = [
  "Digital Journal",
  "8-week educational curriculum",
  "Monthly live classes",
  "Weekly SMS check-ins",
  "Community support",
] as const;

const plans: Array<{
  name: string;
  price: string;
  popular?: boolean;
  included: boolean[];
}> = [
  {
    name: "Class Purchase",
    price: "$10",
    included: [false, false, true, false, false],
  },
  {
    name: "Full Membership",
    price: "$10",
    popular: true,
    included: [true, true, true, true, true],
  },
  {
    name: "Journal Only",
    price: "$5",
    included: [true, false, false, false, false],
  },
];

function FeatureIcon({ included }: { included: boolean }) {
  return (
    <span className="relative block size-8 shrink-0 overflow-clip rounded-[20px] border border-[#F4F4F5] bg-[#FCFCFC]">
      <span className="absolute left-1/2 top-1/2 block size-6 -translate-x-1/2 -translate-y-1/2">
        {included ? (
          <span className="absolute inset-[22.92%_16.67%] block">
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
            className="absolute inset-0 block size-full max-w-none"
          />
        )}
      </span>
    </span>
  );
}

function PlanCard({
  name,
  price,
  included,
  popular = false,
  ctaVariant = "primary",
}: {
  name: string;
  price: string;
  included: boolean[];
  popular?: boolean;
  ctaVariant?: "primary" | "outline";
}) {
  const list: Feature[] = features.map((label, index) => ({
    label,
    included: included[index],
  }));

  return (
    <div
      className={[
        "flex w-full flex-col gap-6 overflow-clip rounded-[50px] border border-[#E2E8F0] p-6 sm:p-7",
        popular
          ? "bg-gradient-to-b from-white to-[#F2F7FF]"
          : "bg-[#F1F5FA]",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4">
        <h3
          className={[
            "flex h-8 items-center text-xl font-semibold leading-7 tracking-[0.1px]",
            popular ? "text-[#2563EB]" : "text-[#344056]",
          ].join(" ")}
        >
          {name}
        </h3>

        <div className="flex flex-wrap items-baseline gap-1">
          <span className="font-inter text-[36px] font-bold leading-[52px] text-[#0F172A]">
            {price}
          </span>
          <span className="text-lg font-medium leading-7 tracking-[0.09px] text-[#344056]">
            /Month
          </span>
        </div>

        <p className="text-base font-medium leading-6 tracking-[0.08px] text-[#344056]">
          Complete access to all platform features
        </p>

        <Link
          href="/registration"
          className={[
            "inline-flex w-full items-center justify-center gap-2 rounded px-3.5 py-3",
            "text-base font-bold leading-6 tracking-[0.08px] transition-all duration-200",
            ctaVariant === "outline"
              ? "border border-[#0F172A] bg-white text-[#0F172A] hover:bg-slate-50 hover:border-slate-800 shadow-xs"
              : "bg-[#2563EB] text-white shadow-[inset_0px_-1px_0px_0px_#DBE9FE] hover:bg-[#1D4ED8]",
          ].join(" ")}
        >
          Get Started
        </Link>
      </div>

      <div className="h-px w-full border-t border-dashed border-[#E2E8F0]" />

      <ul className="flex flex-col gap-5">
        {list.map((feature) => (
          <li key={feature.label} className="flex items-center gap-3">
            <FeatureIcon included={feature.included} />
            <span className="text-lg font-medium leading-7 tracking-[0.09px] text-[#0F172A]">
              {feature.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Pricing({
  eyebrow,
  sideCtaVariant = "primary",
}: {
  eyebrow?: string;
  sideCtaVariant?: "primary" | "outline";
}) {
  return (
    <section
      id="pricing"
      className={[
        "w-full scroll-mt-24 bg-white px-5 sm:px-10 lg:px-[71px]",
        eyebrow ? "py-16 lg:py-20" : "py-12 lg:py-[50px]",
      ].join(" ")}
    >
      <div className="mx-auto flex w-full max-w-[1298px] flex-col gap-10">
        <div className="flex flex-col items-center justify-center gap-6 landing-reveal">
          {eyebrow ? (
            <p className="text-lg font-bold leading-7 tracking-[0.09px] text-[#2563EB]">
              {eyebrow}
            </p>
          ) : null}
          <div className="flex w-full flex-col items-center gap-3 text-center">
            <h2 className="text-[28px] font-semibold leading-10 tracking-[0.18px] text-[#0F172A] sm:text-[36px]">
              Membership Options
            </h2>
            <p className="text-lg font-normal leading-8 tracking-[0.12px] text-[#344056] sm:text-2xl">
              Choose the path that fits your goals. Simple, transparent pricing.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-stretch justify-center gap-8 lg:flex-row lg:items-center lg:gap-[30px]">
          {plans.map((plan, index) => {
            const delays = ["delay-75", "delay-150", "delay-225"];
            return plan.popular ? (
              <div
                key={plan.name}
                className={`flex flex-1 flex-col items-center justify-end gap-2 rounded-[54px] px-1 pb-1 pt-2 drop-shadow-[0px_1px_2px_rgba(0,0,0,0.1)] hover:shadow-2xl landing-reveal card-smooth-hover ${delays[index] || ""}`}
                style={{
                  backgroundImage:
                    "linear-gradient(133.85deg, #2563EB 0.83%, #F52D2A 82.15%)",
                }}
              >
                <p className="text-2xl font-semibold leading-8 tracking-[0.12px] text-white">
                  Most Popular
                </p>
                <PlanCard
                  name={plan.name}
                  price={plan.price}
                  included={plan.included}
                  popular
                />
              </div>
            ) : (
              <div
                key={plan.name}
                className={`flex flex-1 hover:shadow-xl rounded-[50px] landing-reveal card-smooth-hover ${delays[index] || ""}`}
              >
                <PlanCard
                  name={plan.name}
                  price={plan.price}
                  included={plan.included}
                  ctaVariant={sideCtaVariant}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
