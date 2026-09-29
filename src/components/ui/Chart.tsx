"use client";

import React, { useId, useState } from "react";
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

   Styled after the client's reference dashboard (UI redesign, phase 3):
   a faint gradient under the lead line, an optional dashed comparison
   series ("last month"), no dot on every point, and on hover a guide line,
   dots and a small tooltip card. Still deliberately small: no zoom, no
   animation. The tooltip is a mouse nicety; the hidden table is the data.
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
  | "neutral"
  | "cat-1"
  | "cat-2"
  | "cat-3"
  | "cat-4"
  | "cat-5"
  | "cat-6"
  | "cat-7"
  | "cat-8";

/* Status tones draw from the --chart-* fills, not the -600 text steps: a
   slice or a line is a shape and only needs 3:1, so it can be as bright
   as the brand blue beside it. See the chart block in color.css. */
export const toneVar: Record<SeriesTone, string> = {
  brand: "var(--chart-brand)",
  accent: "var(--color-accent-600)",
  success: "var(--chart-success)",
  warning: "var(--chart-warning)",
  danger: "var(--chart-danger)",
  neutral: "var(--chart-neutral)",
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
  /** A thinner dashed line — for a comparison, e.g. "last month". */
  dashed?: boolean;
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
  /** A faint gradient under the first series. Defaults to on for a single
      line, or a line and a dashed comparison; off for peer series. */
  area?: boolean;
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
  area,
  className,
}: LineChartProps) {
  const tableId = useId();
  const gradientId = useId();
  const count = xLabels.length;
  /* The column under the pointer. The tooltip, the guide line and the dots
     are for a mouse only; the same numbers are always in the hidden table. */
  const [active, setActive] = useState<number | null>(null);

  const xFor = (i: number) =>
    count <= 1 ? VB_W / 2 : PAD_X + (i * (VB_W - PAD_X * 2)) / (count - 1);

  const yFor = (v: number) => {
    const span = yMax - yMin || 1;
    const clamped = Math.min(Math.max(v, yMin), yMax);
    return PAD_Y + ((yMax - clamped) / span) * (VB_H - PAD_Y * 2);
  };

  /* As a share of the plot, for the HTML drawn over the stretched SVG. */
  const xPct = (i: number) => (xFor(i) / VB_W) * 100;
  const yPct = (v: number) => (yFor(v) / VB_H) * 100;

  const ticks = Array.from({ length: yTicks }, (_, i) =>
    Math.round(yMax - (i * (yMax - yMin)) / (yTicks - 1)),
  );

  const lead = series[0];
  /* The fill marks THE line — so by default only when there is one, or one
     and a dashed comparison. Under the first of several peers (systolic
     over diastolic, four engagement lines) it shades across the others and
     reads as muddle. It also needs an unbroken line. */
  const filled =
    (area ??
      (series.length === 1 ||
        (series.length === 2 && series[1].dashed === true))) &&
    lead !== undefined &&
    lead.points.every((v) => v !== null);

  const withUnit = (v: number) => `${v}${unit ? ` ${unit}` : ""}`;

  return (
    <figure className={cn("m-0", className)}>
      {showLegend ? (
        <div className="mb-stack-md flex flex-wrap items-center gap-inline-lg text-caption text-fg-secondary">
          {series.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-inline-xs">
              <Swatch tone={s.tone} dashed={s.dashed} />
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

        <div className="relative" style={{ height }}>
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
            className="absolute inset-0 h-full w-full overflow-visible"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
          >
            {filled ? (
              <>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={toneVar[lead.tone]}
                      stopOpacity="0.16"
                    />
                    <stop
                      offset="100%"
                      stopColor={toneVar[lead.tone]}
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                <polygon
                  fill={`url(#${gradientId})`}
                  points={[
                    `${xFor(0)},${VB_H - PAD_Y}`,
                    ...lead.points.map((v, i) => `${xFor(i)},${yFor(v ?? 0)}`),
                    `${xFor(count - 1)},${VB_H - PAD_Y}`,
                  ].join(" ")}
                />
              </>
            ) : null}

            {active !== null ? (
              <line
                x1={xFor(active)}
                x2={xFor(active)}
                y1={PAD_Y}
                y2={VB_H - PAD_Y}
                stroke="var(--color-fg-icon-quiet)"
                strokeWidth="1"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}

            {series.map((s) => (
              <polyline
                key={s.id}
                points={s.points
                  .map((v, i) => (v === null ? null : `${xFor(i)},${yFor(v)}`))
                  .filter(Boolean)
                  .join(" ")}
                fill="none"
                stroke={toneVar[s.tone]}
                strokeWidth={s.dashed ? 1.5 : 2}
                strokeDasharray={s.dashed ? "5 4" : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
                // Keeps the stroke even after non-uniform scaling.
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {/* The dots at the hovered column. HTML, not SVG circles: the SVG
              stretches to fit, and a circle inside it would be an ellipse. */}
          {active !== null
            ? series.map((s) => {
                const v = s.points[active];
                return v === null || v === undefined ? null : (
                  <span
                    key={s.id}
                    aria-hidden="true"
                    className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 bg-surface"
                    style={{
                      left: `${xPct(active)}%`,
                      top: `${yPct(v)}%`,
                      borderColor: toneVar[s.tone],
                    }}
                  />
                );
              })
            : null}

          {/* Pointer tracking: the nearest column to the pointer is active.
              Presentational — it adds nothing a keyboard or screen reader
              needs, since every value is in the hidden table. */}
          <div
            role="presentation"
            className="absolute inset-0"
            onMouseMove={(event) => {
              const box = event.currentTarget.getBoundingClientRect();
              const x = ((event.clientX - box.left) / box.width) * VB_W;
              const step = count <= 1 ? 1 : (VB_W - PAD_X * 2) / (count - 1);
              const i = Math.round((x - PAD_X) / step);
              setActive(Math.min(Math.max(i, 0), count - 1));
            }}
            onMouseLeave={() => setActive(null)}
          />

          {/* The tooltip: beside the point, never over it, so the dot and
              the guide stay visible. Right of it, or left past the middle. */}
          {active !== null ? (
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute top-1 z-10 w-max max-w-56 rounded-[10px] border border-line bg-surface px-inset-sm py-inset-xs shadow-md",
                active > (count - 1) / 2
                  ? "-translate-x-[calc(100%+12px)]"
                  : "translate-x-3",
              )}
              style={{ left: `${xPct(active)}%` }}
            >
              <p className="text-label-sm text-fg">{xLabels[active]}</p>
              {series.map((s) => {
                const v = s.points[active];
                return (
                  <p
                    key={s.id}
                    className="mt-stack-xs flex items-center gap-inline-sm text-caption text-fg-muted"
                  >
                    <Swatch tone={s.tone} dashed={s.dashed} />
                    <span className="font-semibold text-fg tabular-nums">
                      {v === null || v === undefined ? "—" : withUnit(v)}
                    </span>
                    {s.label}
                  </p>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* X axis */}
        <span />
        <div
          aria-hidden="true"
          className="mt-stack-sm flex justify-between text-caption text-fg-muted"
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
      {/* sr-only sits on a wrapper, not the table: a table ignores the
          1px width sr-only sets and keeps its natural width, which on a
          phone pushed the page wider than the screen. */}
      <div className="sr-only">
        <table id={tableId}>
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
                      : withUnit(s.points[i] as number)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

/** A legend or tooltip key: a short line, dashed for a comparison series. */
function Swatch({ tone, dashed }: { tone: SeriesTone; dashed?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="w-3 shrink-0"
      style={
        dashed
          ? { borderTop: `2px dashed ${toneVar[tone]}` }
          : { height: 2, borderRadius: 9999, background: toneVar[tone] }
      }
    />
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
