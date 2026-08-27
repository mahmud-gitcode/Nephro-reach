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
    <span className="relative block size-8 shrink-0 overflow-clip">
      <img
        src={
          included
            ? "/images/home/pricing-check.svg"
            : "/images/home/pricing-x.svg"
        }
        alt=""
        className="size-full"
      />
    </span>
  );
}

function PlanCard({
  name,
  price,
  included,
}: {
  name: string;
  price: string;
  included: boolean[];
}) {
  const list: Feature[] = features.map((label, index) => ({
    label,
    included: included[index],
  }));

  return (
    <div className="flex h-full flex-col rounded-[50px] border border-[#E2E8F0] bg-[#F1F5FA] p-8">
      <div className="space-y-2">
        <h3 className="text-xl font-medium text-[#0F172A]">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-[#0F172A]">{price}</span>
          <span className="text-base font-medium text-[#344056]">/Month</span>
        </div>
        <p className="text-base font-medium text-[#344056]">
          Complete access to all platform features
        </p>
      </div>

      <Link
        href="/registration"
        className="mt-6 inline-flex h-12 items-center justify-center rounded bg-[#2563EB] px-3.5 text-base font-bold text-white transition-colors hover:bg-[#1D4ED8]"
      >
        Get Started
      </Link>

      <ul className="mt-8 space-y-4">
        {list.map((feature) => (
          <li key={feature.label} className="flex items-center gap-3">
            <FeatureIcon included={feature.included} />
            <span className="text-base font-medium text-[#0F172A]">
              {feature.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="w-full scroll-mt-24 bg-white px-5 py-12 sm:px-10 lg:px-[71px] lg:py-[50px]"
    >
      <div className="mx-auto flex w-full max-w-[1298px] flex-col gap-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-[28px] font-semibold leading-10 text-[#0F172A] sm:text-[36px]">
            Membership Options
          </h2>
          <p className="text-lg font-medium leading-8 text-[#344056] sm:text-xl">
            Choose the path that fits your goals. Simple, transparent pricing.
          </p>
        </div>

        <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-3 lg:gap-[30px]">
          {plans.map((plan) =>
            plan.popular ? (
              <div key={plan.name} className="relative pt-10">
                <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#F52D2A] px-5 py-2 text-base font-bold text-white">
                  Most Popular
                </div>
                <div className="rounded-[54px] bg-gradient-to-b from-[#2563EB] to-[#F52D2A] p-[2px]">
                  <div className="h-full overflow-hidden rounded-[52px] bg-gradient-to-b from-white to-[#F2F7FF]">
                    <div className="p-2">
                      <PlanCard
                        name={plan.name}
                        price={plan.price}
                        included={plan.included}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <PlanCard
                key={plan.name}
                name={plan.name}
                price={plan.price}
                included={plan.included}
              />
            ),
          )}
        </div>
      </div>
    </section>
  );
}
