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
   not a category — it is the empty part of the track. So it takes --track,
   the one colour every unfilled progress uses, and only the filled arc
   carries colour.

   The ring is a conic gradient rather than an SVG arc for the same reason
   DonutChart is: two hard colour stops and a punched-out centre need no
   path maths, and they stay crisp at any size.
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
  /** Ring thickness in px. */
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
  thickness = 14,
  tone = "primary",
  className,
}: ProgressRingProps) {
  const pct = Math.min(100, Math.max(0, value));
  const degrees = (pct / 100) * 360;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        role="img"
        aria-label={`${label}: ${Math.round(pct)}%`}
        className="relative shrink-0 rounded-pill"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${arcColor[tone]} 0deg ${degrees}deg, var(--color-track) ${degrees}deg 360deg)`,
        }}
      >
        <div
          className="absolute rounded-pill bg-surface"
          style={{ inset: thickness }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-metric-sm text-fg">
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
