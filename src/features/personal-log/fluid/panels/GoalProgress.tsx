"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";

/* NOTE: the figures in this panel are fixed demo values. It renders the same
   numbers whatever the member has logged — see the header of
   fluid-tracker/page.tsx. */

export function GoalProgress() {
  const { dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  const goalSlices = [
    {
      label: w?.goalProgress?.goalMet || "Goal Met",
      count: 29,
      percent: 50,
      color: "var(--color-brand-500)",
    },
    {
      label: w?.goalProgress?.aboveGoal || "Above Goal",
      count: 16,
      percent: 28,
      color: "var(--color-warning-500)",
    },
    {
      label: w?.goalProgress?.belowGoal || "Below Goal",
      count: 13,
      percent: 22,
      color: "var(--color-danger-500)",
    },
  ];

  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <section className="flex h-full flex-col rounded-xl border border-[var(--color-gray-200)] bg-surface p-4">
      <h2 className="text-heading-4 text-fg">
        {w?.goalProgress?.title || "Goal & Progress"}
      </h2>
      <div className="mt-4 flex flex-1 flex-col items-center gap-4 sm:flex-row">
        <div className="relative size-[226px] shrink-0">
          <svg viewBox="0 0 226 226" className="size-full -rotate-90">
            <circle
              cx="113"
              cy="113"
              r={radius}
              fill="none"
              stroke="var(--color-gray-200)"
              strokeWidth="28"
            />
            {goalSlices.map((slice) => {
              const dash = (slice.percent / 100) * circumference;
              const circle = (
                <circle
                  key={slice.label}
                  cx="113"
                  cy="113"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="28"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return circle;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[22px] font-medium text-fg">86%</p>
            <p className="text-sm text-[var(--color-gray-800)]">
              {w?.goalProgress?.overall || "Overall"}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-5">
          {goalSlices.map((slice) => (
            <div
              key={slice.label}
              className="flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2 text-lg font-medium text-[var(--color-gray-800)]">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                {slice.label}
              </span>
              <span className="text-lg font-medium text-[var(--color-gray-800)]">
                {slice.count} ({slice.percent}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
