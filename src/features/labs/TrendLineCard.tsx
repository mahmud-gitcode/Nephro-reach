"use client";

import React from "react";
import { Card, LineChart, type SeriesTone } from "@/components/ui";

/* ==========================================================================
   TrendLineCard
   --------------------------------------------------------------------------
   One test's readings over time, on the Labs page's Trends tab.

   Built on the shared LineChart (UI redesign, phase 6). It was a hand-drawn
   SVG with no accessible name and no data — a screen reader got nothing —
   and it labelled the unit "Ref Range", because the range itself was never
   passed in. Now the chart carries its readings as a hidden table, the
   hover tooltip reads each draw, and the card states the real range.
   ========================================================================== */

/* One lab panel, many series — these say "different test", not "good" or
   "bad", so they come off the categorical ramp. */
const THEME_TONE: Record<
  "purple" | "green" | "orange" | "blue" | "rose" | "teal",
  SeriesTone
> = {
  purple: "cat-7",
  green: "cat-4",
  orange: "cat-2",
  blue: "cat-6",
  rose: "cat-1",
  teal: "cat-5",
};

/**
 * A round top for the axis, a little above the highest reading — and an
 * even multiple of its magnitude, so the middle tick is round too (0 · 30 ·
 * 60, not 0 · 28 · 55).
 */
function axisTop(peak: number): number {
  if (peak <= 0) return 2;
  const magnitude = 10 ** Math.floor(Math.log10(peak));
  let steps = Math.ceil((peak * 1.1) / magnitude);
  if (steps % 2 === 1) steps += 1;
  return steps * magnitude;
}

export function TrendLineCard({
  testName,
  unit,
  data,
  dates,
  colorTheme = "purple",
  refRange,
  refRangeLabel,
  latestLabel,
}: {
  testName: string;
  unit: string;
  data: number[];
  dates: string[];
  colorTheme?: keyof typeof THEME_TONE;
  /** The test's reference range, e.g. "7 – 20 mg/dL". */
  refRange?: string;
  refRangeLabel?: string;
  latestLabel?: string;
}) {
  const latest = data[data.length - 1];
  const top = axisTop(Math.max(...data));
  /* One label per reading, even if the dates run short. */
  const xLabels = data.map((_, i) => dates[i] ?? "");

  return (
    <Card as="article" className="h-full">
      <div className="flex items-start justify-between gap-inline-md">
        <div className="min-w-0">
          <h4 className="text-heading-5 text-fg">{testName}</h4>
          {refRange ? (
            <p className="mt-stack-xs text-caption text-fg-muted">
              {refRangeLabel || "Ref Range"}: {refRange}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-metric-sm text-fg">
            {latest}
            {unit ? (
              <span className="text-caption text-fg-muted"> {unit}</span>
            ) : null}
          </p>
          <p className="text-caption text-fg-muted">
            {latestLabel || "Latest"}
          </p>
        </div>
      </div>

      <LineChart
        className="mt-stack-lg"
        label={`${testName} over time`}
        unit={unit}
        showLegend={false}
        height={110}
        yMin={0}
        yMax={top}
        yTicks={3}
        xLabels={xLabels}
        series={[
          {
            id: "reading",
            label: testName,
            tone: THEME_TONE[colorTheme],
            points: data,
          },
        ]}
      />
    </Card>
  );
}
