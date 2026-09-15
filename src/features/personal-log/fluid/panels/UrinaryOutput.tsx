"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { TrendIcon } from "../FluidIcons";

/* NOTE: the figures in this panel are fixed demo values. It renders the same
   numbers whatever the member has logged — see the header of
   fluid-tracker/page.tsx. */

export function UrinaryOutput() {
  const { language, dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  const urineTrends = [
    {
      date: language === "ES" ? "10 May, 2024" : "May 10, 2024",
      trendKey: "increasing",
      defaultTrend: "Increasing",
      icon: "up" as const,
    },
    {
      date: language === "ES" ? "31 May, 2024" : "May 31, 2024",
      trendKey: "decreasing",
      defaultTrend: "Decreasing",
      icon: "down" as const,
    },
    {
      date: language === "ES" ? "7 Jun, 2024" : "Jun 7, 2024",
      trendKey: "increasing",
      defaultTrend: "Increasing",
      icon: "up" as const,
    },
    {
      date: language === "ES" ? "5 Jul, 2024" : "Jul 5, 2024",
      trendKey: "noChange",
      defaultTrend: "No Change",
      icon: "level" as const,
    },
  ];

  const getTrendText = (trendKey: string, defaultTrend: string) => {
    if (trendKey === "increasing")
      return w?.urinaryOutput?.trends?.increasing || defaultTrend;
    if (trendKey === "decreasing")
      return w?.urinaryOutput?.trends?.decreasing || defaultTrend;
    if (trendKey === "noChange")
      return w?.urinaryOutput?.trends?.noChange || defaultTrend;
    return defaultTrend;
  };

  return (
    <section className="flex h-full flex-col rounded-xl border border-[var(--color-gray-200)] bg-surface p-[17px]">
      <h2 className="text-body-md text-fg">
        {w?.urinaryOutput?.title || "Urinary Output"}{" "}
        <span className="text-sm font-medium text-fg-muted">
          {w?.urinaryOutput?.subtitle || "(24 Hours)"}
        </span>
      </h2>
      <div className="mt-3.5 overflow-hidden rounded-lg border border-[var(--color-gray-300)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-gray-50)]">
            <tr>
              <th className="border-b border-[var(--color-gray-300)] px-3 py-3 font-medium text-fg">
                {w?.urinaryOutput?.date || "Date"}
              </th>
              <th className="border-b border-[var(--color-gray-300)] px-3 py-3 font-medium text-fg">
                {w?.urinaryOutput?.trend || "Trend"}
              </th>
            </tr>
          </thead>
          <tbody>
            {urineTrends.map((row) => (
              <tr
                key={row.date}
                className="border-b border-dashed border-[var(--color-gray-300)] last:border-b-0"
              >
                <td className="px-3 py-3 text-[var(--color-gray-950)]">
                  {row.date}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <TrendIcon type={row.icon} />
                    <span className="font-medium text-[var(--color-gray-950)]">
                      {getTrendText(row.trendKey, row.defaultTrend)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
