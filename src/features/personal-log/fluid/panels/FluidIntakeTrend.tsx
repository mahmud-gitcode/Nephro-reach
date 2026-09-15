"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";

/* NOTE: the figures in this panel are fixed demo values. It renders the same
   numbers whatever the member has logged — see the header of
   fluid-tracker/page.tsx. */

export function FluidIntakeTrend() {
  const { language, dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  const fluidIntakeBars = [
    72, 67, 31, 73, 59, 31, 91, 31, 57, 81, 52, 56, 71, 57, 33,
  ];

  const labels =
    language === "ES"
      ? ["1 May", "2 May", "3 May", "4 May", "5 May", "6 May"]
      : ["May 1", "May 2", "May 3", "May 4", "May 5", "May 6"];

  return (
    <section className="h-full rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-3.5">
      <div className="flex items-center gap-inline-sm">
        <h2 className="text-body-md text-fg">
          {w?.fluidIntakeTrend?.title || "Fluid Intake Trend"}
        </h2>
        <span className="text-xs text-fg-muted">
          {w?.fluidIntakeTrend?.subtitle || "(30 Day)"}
        </span>
      </div>
      <div className="mt-3 flex min-h-[250px] gap-2">
        <div className="flex flex-col justify-between pb-6 text-right text-xs text-black/70">
          {["100", "80", "60", "40", "20", "0"].map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="border-t border-dashed border-line" />
            ))}
          </div>
          <div className="absolute inset-x-0 top-1 bottom-6 flex items-end justify-between gap-0.5">
            {fluidIntakeBars.map((value, index) => (
              <div
                key={index}
                className="relative flex h-full min-w-0 flex-1 items-end justify-center"
              >
                <div className="absolute inset-y-0 w-[18px] bg-[rgba(214,219,237,0.4)]" />
                <div
                  className="relative w-[18px] bg-[var(--color-accent-500)]/80"
                  style={{ height: `${value}%` }}
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex justify-between pl-2 text-[12px] text-black/70">
            {labels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
