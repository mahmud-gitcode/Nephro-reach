"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Card,
  ChartLegend,
  DonutChart,
  type SeriesTone,
} from "@/components/ui";

/* NOTE: the figures in this panel are fixed demo values. It renders the same
   numbers whatever the member has logged — see the header of
   fluid-tracker/page.tsx. */

export function GoalProgress() {
  const { dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  /* Days by how they ended against the fluid goal: one whole split into
     three, so the shared DonutChart and its legend — the same circle as
     every other split in the product. */
  const goalSlices: {
    label: string;
    count: number;
    percent: number;
    tone: SeriesTone;
  }[] = [
    {
      label: w?.goalProgress?.goalMet || "Goal Met",
      count: 29,
      percent: 50,
      tone: "brand",
    },
    {
      label: w?.goalProgress?.aboveGoal || "Above Goal",
      count: 16,
      percent: 28,
      tone: "warning",
    },
    {
      label: w?.goalProgress?.belowGoal || "Below Goal",
      count: 13,
      percent: 22,
      tone: "danger",
    },
  ];

  return (
    <Card as="section" className="flex h-full flex-col">
      <h2 className="text-heading-4 text-fg">
        {w?.goalProgress?.title || "Goal & Progress"}
      </h2>
      <div className="mt-stack-xl flex flex-1 flex-col items-center gap-inset-lg sm:flex-row">
        <DonutChart
          label={w?.goalProgress?.title || "Goal & Progress"}
          segments={goalSlices.map((slice) => ({
            label: slice.label,
            value: slice.count,
            tone: slice.tone,
          }))}
          centerValue="86%"
          centerLabel={w?.goalProgress?.overall || "Overall"}
          className="shrink-0"
        />
        <ChartLegend
          className="w-full"
          items={goalSlices.map((slice) => ({
            label: slice.label,
            tone: slice.tone,
            value: `${slice.count} (${slice.percent}%)`,
          }))}
        />
      </div>
    </Card>
  );
}
