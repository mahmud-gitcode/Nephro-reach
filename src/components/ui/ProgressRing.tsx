"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   ProgressRing
   --------------------------------------------------------------------------
   One percentage, drawn as a ring with the figure in the middle.

   DonutChart is the wrong tool for this: it splits a whole into categories,
   so every slice gets its own hue and the eye reads two things being
   compared. A gauge has one measure and a remainder, and the remainder is
   not a category — it is the empty part of the track. So only the filled
   arc carries colour, on the neutral --track.

   Styled to the redesign (2026-09-28): the arc is an SVG stroke with ROUND
   ends, as the reference dashboard's gauges have — a conic gradient can
   only cut square. Thickness follows the size (a twelfth of it) unless set,
   so every ring in the product has the same proportions, and the figure in
   the middle scales with the ring: semibold, as on the stat cards.
   ========================================================================== */

export type ProgressRingTone = "primary" | "success" | "warning" | "danger";

/* The arc is a shape, so it takes the bright chart fills, not the text
   tones — see the chart block in color.css. */
const arcColor: Record<ProgressRingTone, string> = {
  primary: "var(--chart-brand)",
  success: "var(--chart-success)",
  warning: "var(--chart-warning)",
  danger: "var(--chart-danger)",
};

export type ProgressRingProps = {
  /** 0–100. Clamped, so a bad figure cannot draw a ring past full. */
  value: number;
  /**
   * What is being measured, in the reader's words — "Average curriculum
   * completion". Required: it is the accessible name, and a ring without
   * one is a coloured circle to a screen reader.
   */
  label: string;
  /** Overrides the figure in the middle. Defaults to `value` as a percent. */
  centerValue?: React.ReactNode;
  /** Small caption under the figure. */
  centerLabel?: React.ReactNode;
  /** Outer diameter in px. */
  size?: number;
  /** Ring thickness in px. Defaults to a twelfth of the size. */
  thickness?: number;
  tone?: ProgressRingTone;
  className?: string;
};

export function ProgressRing({
  value,
  label,
  centerValue,
  centerLabel,
  size = 140,
  thickness = Math.round(size / 12),
  tone = "primary",
  className,
}: ProgressRingProps) {
  const pct = Math.min(100, Math.max(0, value));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  /* The figure grows with the ring: a big ring gets the stat-card size. */
  const figure = size >= 112 ? "text-metric-md" : "text-metric-sm";

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        role="img"
        aria-label={`${label}: ${Math.round(pct)}%`}
        className="relative shrink-0"
        style={{ width: size, height: size }}
      >
        {/* Rotated so the arc starts at twelve o'clock. */}
        <svg
          aria-hidden="true"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            /* --track itself, not the --color-track alias: the alias is
               resolved on :root and would miss the canvas's grey. */
            stroke="var(--track)"
            strokeWidth={thickness}
          />
          {/* Nothing at 0%: a round cap on an empty arc would draw a dot. */}
          {pct > 0 ? (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arcColor[tone]}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
            />
          ) : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={cn(figure, "text-fg")}>
            {centerValue ?? `${Math.round(pct)}%`}
          </span>
          {centerLabel ? (
            <span className="text-caption text-fg-muted">{centerLabel}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ProgressRing;
