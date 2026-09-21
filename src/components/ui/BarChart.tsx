"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils/cn";
import { CATEGORICAL_TONES, SeriesTone, toneVar } from "./Chart";

/* ==========================================================================
   BarChart
   --------------------------------------------------------------------------
   Four files draw vertical bars by hand: missed doses per weekday, weekly
   earnings, fluid intake, calories. Each one recomputes a pixel height from
   a percentage, hardcodes a fill, and — in every case — renders bars with
   no text in them, which means a screen reader gets nothing.

   Same contract as LineChart: role="img" with a required label, and the
   numbers repeated as a visually-hidden table. The bars are divs rather
   than SVG because a bar chart is a row of rectangles, and CSS draws
   rectangles better than a viewBox does — the labels stay real text at real
   sizes instead of scaled SVG glyphs.

   Deliberately small: no stacking, no grouping, no tooltips.
   ========================================================================== */

export type Bar = {
  /** Category name — the x-axis label and the accessible table's row name. */
  label: string;
  value: number;
  /** Defaults to one tone for the whole chart; set per bar to distinguish. */
  tone?: SeriesTone;
};

export type BarChartProps = {
  bars: Bar[];
  /** What the chart is of. Required — it becomes the accessible name. */
  label: string;
  /** Top of the scale. Defaults to the tallest bar, rounded up. */
  yMax?: number;
  /** Number of horizontal gridlines, including zero. */
  yTicks?: number;
  /** Unit shown after each value in the accessible table. */
  unit?: string;
  /** Applies to bars that do not set their own. */
  tone?: SeriesTone;
  /** `categorical` gives each bar the next tone off the categorical ramp. */
  colorBy?: "single" | "categorical";
  height?: number;
  className?: string;
};

/** A round number at or above the tallest bar, so the top gridline is tidy. */
function niceMax(values: number[]): number {
  const peak = Math.max(...values, 0);
  if (peak <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(peak));
  return Math.ceil(peak / magnitude) * magnitude;
}

export function BarChart({
  bars,
  label,
  yMax,
  yTicks = 5,
  unit,
  tone = "brand",
  colorBy = "single",
  height = 160,
  className,
}: BarChartProps) {
  const tableId = useId();
  const top = yMax ?? niceMax(bars.map((b) => b.value));

  const ticks = Array.from({ length: yTicks }, (_, i) =>
    Math.round((top / (yTicks - 1)) * (yTicks - 1 - i)),
  );

  return (
    <div className={className}>
      <div role="img" aria-label={label} aria-describedby={tableId}>
        <div
          className="grid gap-inline-md"
          style={{ gridTemplateColumns: "2.5rem minmax(0, 1fr)" }}
        >
          {/* y axis */}
          <div
            className="flex flex-col justify-between text-right text-caption text-fg-muted"
            style={{ height }}
          >
            {ticks.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>

          {/* plot */}
          <div className="relative" style={{ height }}>
            <div
              aria-hidden="true"
              className="absolute inset-0 flex flex-col justify-between"
            >
              {ticks.map((t) => (
                <span key={t} className="border-t border-dashed border-line" />
              ))}
            </div>

            <div className="absolute inset-x-0 bottom-0 flex h-full items-end justify-around gap-inline-sm">
              {bars.map((bar, index) => {
                const barTone =
                  bar.tone ??
                  (colorBy === "categorical"
                    ? CATEGORICAL_TONES[index % CATEGORICAL_TONES.length]
                    : tone);
                return (
                  <span
                    key={`${bar.label}-${index}`}
                    className="w-full max-w-[22px] rounded-t-control-small"
                    style={{
                      // A zero bar still shows a sliver, so the category
                      // reads as present-and-empty rather than missing.
                      height: `${Math.max((bar.value / top) * 100, 1)}%`,
                      backgroundColor: toneVar[barTone],
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* x axis */}
        <div
          className="mt-stack-sm grid gap-inline-md"
          style={{ gridTemplateColumns: "2.5rem minmax(0, 1fr)" }}
        >
          <span />
          <div className="flex justify-around gap-inline-sm text-caption text-fg-secondary">
            {bars.map((bar, index) => (
              <span
                key={`${bar.label}-${index}`}
                className="w-full truncate text-center"
              >
                {bar.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* The same numbers, for anyone who cannot see the bars. */}
      {/* sr-only sits on a wrapper, not the table: a table ignores the
          1px width sr-only sets and keeps its natural width, which on a
          phone pushed the page wider than the screen. */}
      <div className="sr-only">
        <table id={tableId}>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {bars.map((bar, index) => (
              <tr key={`${bar.label}-${index}`}>
                <th scope="row">{bar.label}</th>
                <td>
                  {bar.value}
                  {unit ? ` ${unit}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Legend — shared by BarChart and DonutChart when the caller wants one.
   -------------------------------------------------------------------------- */

export type ChartLegendItem = {
  label: string;
  tone: SeriesTone;
  /** Right-hand column: a count, a percentage, whatever the chart measures. */
  value?: React.ReactNode;
  /** A second line under the label. */
  detail?: React.ReactNode;
};

export function ChartLegend({
  items,
  className,
}: {
  items: ChartLegendItem[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-stack-md", className)}>
      {items.map((item) => (
        <li
          key={item.label}
          className="grid grid-cols-[1fr_auto] items-start gap-inline-md text-body-sm"
        >
          <span className="flex items-start gap-inline-md">
            <span
              aria-hidden="true"
              className="mt-1 h-3 w-3 shrink-0 rounded-pill"
              style={{ backgroundColor: toneVar[item.tone] }}
            />
            <span>
              <span className="block text-label-md text-fg">{item.label}</span>
              {item.detail ? (
                <span className="block text-caption text-fg-muted">
                  {item.detail}
                </span>
              ) : null}
            </span>
          </span>
          {item.value ? (
            <span className="text-label-md text-fg-muted">{item.value}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default BarChart;
