"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   LineChart · Sparkline
   --------------------------------------------------------------------------
   Seven files draw their own SVG by hand, each recomputing a viewBox and a
   points string, each hardcoding a stroke colour.

   Two things this fixes beyond the duplication:

   1. A chart drawn as bare <svg> is invisible to a screen reader. Here the
      chart is role="img" with a real label, AND the same numbers are emitted
      as a visually-hidden <table>. For lab values and blood pressure that is
      not a nicety — the numbers ARE the content, and a member using a screen
      reader currently gets nothing at all from these pages.

   2. Series colours come from the token ramps, so a chart line and its
      legend swatch cannot drift apart, and dark mode has an answer.

   Deliberately small: no tooltips, no zoom, no animation. These are trend
   lines on a health log, not an analytics product. If real interaction is
   needed later, that is the point to reconsider a charting library.
   ========================================================================== */

/* Two kinds of tone, and the distinction matters.

   The status names say something is good or bad — use them when that is the
   point, as in a "recovery pattern" chart whose whole subject is better and
   worse.

   `cat-1` to `cat-8` say only "these differ". Any chart with more than two
   or three series wants these: they are held at one lightness and a moderate
   chroma so no line shouts louder than another, and so a green series does
   not read as the healthy one. */
export type SeriesTone =
  | "brand"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "cat-1"
  | "cat-2"
  | "cat-3"
  | "cat-4"
  | "cat-5"
  | "cat-6"
  | "cat-7"
  | "cat-8";

export const toneVar: Record<SeriesTone, string> = {
  brand: "var(--color-brand-600)",
  accent: "var(--color-accent-600)",
  success: "var(--color-success-600)",
  warning: "var(--color-warning-600)",
  danger: "var(--color-danger-600)",
  "cat-1": "var(--color-cat-1)",
  "cat-2": "var(--color-cat-2)",
  "cat-3": "var(--color-cat-3)",
  "cat-4": "var(--color-cat-4)",
  "cat-5": "var(--color-cat-5)",
  "cat-6": "var(--color-cat-6)",
  "cat-7": "var(--color-cat-7)",
  "cat-8": "var(--color-cat-8)",
};

/** The eight categorical tones in order, for charts that just need N. */
export const CATEGORICAL_TONES: SeriesTone[] = [
  "cat-1",
  "cat-2",
  "cat-3",
  "cat-4",
  "cat-5",
  "cat-6",
  "cat-7",
  "cat-8",
];

export type ChartSeries = {
  id: string;
  label: string;
  tone: SeriesTone;
  /** One value per x position. Use null for a gap in the line. */
  points: Array<number | null>;
};

export type LineChartProps = {
  series: ChartSeries[];
  /** One label per x position. Length defines the number of columns. */
  xLabels: string[];
  /** Y axis bounds. Ticks are drawn at evenly spaced steps between them. */
  yMin: number;
  yMax: number;
  yTicks?: number;
  /** Unit shown after each value in the accessible table. */
  unit?: string;
  /** What the chart is of. Required — it becomes the accessible name. */
  label: string;
  height?: number;
  /** Hides the legend when the caller draws its own. */
  showLegend?: boolean;
  className?: string;
};

/* The drawing grid is fixed; the SVG scales to its container. */
const VB_W = 640;
const VB_H = 200;
const PAD_X = 24;
const PAD_Y = 12;

export function LineChart({
  series,
  xLabels,
  yMin,
  yMax,
  yTicks = 5,
  unit,
  label,
  height = 200,
  showLegend = true,
  className,
}: LineChartProps) {
  const tableId = useId();
  const count = xLabels.length;

  const xFor = (i: number) =>
    count <= 1 ? VB_W / 2 : PAD_X + (i * (VB_W - PAD_X * 2)) / (count - 1);

  const yFor = (v: number) => {
    const span = yMax - yMin || 1;
    const clamped = Math.min(Math.max(v, yMin), yMax);
    return PAD_Y + ((yMax - clamped) / span) * (VB_H - PAD_Y * 2);
  };

  const ticks = Array.from({ length: yTicks }, (_, i) =>
    Math.round(yMax - (i * (yMax - yMin)) / (yTicks - 1)),
  );

  return (
    <figure className={cn("m-0", className)}>
      {showLegend ? (
        <div className="mb-stack-md flex flex-wrap items-center gap-inline-lg text-caption text-fg-secondary">
          {series.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-inline-xs">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-pill"
                style={{ background: toneVar[s.tone] }}
              />
              {s.label}
            </span>
          ))}
        </div>
      ) : null}

      <div
        className="grid gap-inline-md"
        style={{ gridTemplateColumns: "38px minmax(0,1fr)" }}
      >
        {/* Y axis */}
        <div
          aria-hidden="true"
          className="flex flex-col justify-between text-right text-caption text-fg-muted"
          style={{ height }}
        >
          {ticks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        <div
          className="relative overflow-hidden rounded-card"
          style={{ height }}
        >
          {/* Grid */}
          <div
            aria-hidden="true"
            className="absolute inset-0 flex flex-col justify-between"
          >
            {ticks.map((tick) => (
              <span key={tick} className="border-t border-dashed border-line" />
            ))}
          </div>

          <svg
            role="img"
            aria-label={label}
            aria-describedby={tableId}
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
          >
            {series.map((s) => {
              const line = s.points
                .map((v, i) => (v === null ? null : `${xFor(i)},${yFor(v)}`))
                .filter(Boolean)
                .join(" ");

              return (
                <React.Fragment key={s.id}>
                  <polyline
                    points={line}
                    fill="none"
                    stroke={toneVar[s.tone]}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    // Keeps the stroke even after non-uniform scaling.
                    vectorEffect="non-scaling-stroke"
                  />
                  {s.points.map((v, i) =>
                    v === null ? null : (
                      <circle
                        key={`${s.id}-${i}`}
                        cx={xFor(i)}
                        cy={yFor(v)}
                        r="4"
                        fill="var(--color-surface)"
                        stroke={toneVar[s.tone]}
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                      />
                    ),
                  )}
                </React.Fragment>
              );
            })}
          </svg>
        </div>

        {/* X axis */}
        <span />
        <div
          aria-hidden="true"
          className="mt-stack-sm flex justify-between text-caption text-fg-secondary"
        >
          {xLabels.map((x, i) => (
            <span key={`${x}-${i}`} className="text-center">
              {x}
            </span>
          ))}
        </div>
      </div>

      {/* The same numbers, reachable by a screen reader. Not decorative:
          on a lab or blood-pressure page the values are the whole point. */}
      <table id={tableId} className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Point</th>
            {series.map((s) => (
              <th key={s.id} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {xLabels.map((x, i) => (
            <tr key={`${x}-${i}`}>
              <th scope="row">{x}</th>
              {series.map((s) => (
                <td key={s.id}>
                  {s.points[i] === null || s.points[i] === undefined
                    ? "No reading"
                    : `${s.points[i]}${unit ? ` ${unit}` : ""}`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export type SparklineProps = {
  points: number[];
  tone?: SeriesTone;
  /** Required — a sparkline with no label is noise to a screen reader. */
  label: string;
  width?: number;
  height?: number;
  className?: string;
};

/** A trend line with no axes, for inside a card or a table cell. */
export function Sparkline({
  points,
  tone = "brand",
  label,
  width = 120,
  height = 32,
  className,
}: SparklineProps) {
  if (points.length === 0) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;

  const line = points
    .map((v, i) => {
      const x =
        points.length <= 1 ? width / 2 : (i * width) / (points.length - 1);
      const y = height - 2 - ((v - min) / span) * (height - 4);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      role="img"
      aria-label={`${label}. From ${points[0]} to ${points[points.length - 1]}.`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("shrink-0", className)}
    >
      <polyline
        points={line}
        fill="none"
        stroke={toneVar[tone]}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default LineChart;
