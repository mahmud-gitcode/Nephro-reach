import React from "react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   Progress
   --------------------------------------------------------------------------
   Eight hand-written progress bars across the app — curriculum progress, a
   completion rate in a table, a day's journey through the 21-day course.
   Every one of them was a rounded track with a filled child and an inline
   `width: n%`, and four of them told a screen reader nothing at all: no
   role, no value, no name. A member using one heard "25% complete" only if
   the number happened to be written out beside the bar.

   So the value is required and the label is required. A progress bar with
   no accessible name is a decorative stripe, and this component refuses to
   be one.

   The number is not rendered by default: most callers already print it
   nearby, and printing it twice makes a screen reader say it twice.
   ========================================================================== */

export type ProgressTone =
  "primary" | "success" | "warning" | "danger" | "accent";

export type ProgressSize = "small" | "medium" | "large";

/* A bar is a shape, so status tones take the bright chart fills rather
   than the darker steps text needs — see the chart block in color.css. */
const tones: Record<ProgressTone, string> = {
  primary: "bg-primary-solid",
  success: "bg-chart-success",
  warning: "bg-chart-warning",
  danger: "bg-chart-danger",
  accent: "bg-accent-solid",
};

const sizes: Record<ProgressSize, string> = {
  small: "h-1.5",
  medium: "h-2.5",
  large: "h-3",
};

export type ProgressProps = {
  /** Current value, in the same unit as `max`. Clamped to 0…max. */
  value: number;
  /** Defaults to 100, so `value` reads as a percentage. */
  max?: number;
  /**
   * What is progressing, in the member's words — "Curriculum progress",
   * "Blood Pressure Log completion". Required: it becomes the accessible
   * name, and a bar without one says nothing.
   *
   * Pass `labelledBy` instead when visible text already names it.
   */
  label?: string;
  /** id of the element that names this bar, if one is already on screen. */
  labelledBy?: string;
  tone?: ProgressTone;
  size?: ProgressSize;
  /** Prints the percentage above the track, right-aligned. */
  showValue?: boolean;
  className?: string;
};

export function Progress({
  value,
  max = 100,
  label,
  labelledBy,
  tone = "primary",
  size = "medium",
  showValue = false,
  className,
}: ProgressProps) {
  if (process.env.NODE_ENV !== "production" && !label && !labelledBy) {
    console.warn(
      "<Progress> needs `label` or `labelledBy`; without one it is a decorative stripe.",
    );
  }

  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const percent = (clamped / safeMax) * 100;

  return (
    <div className={className}>
      {showValue ? (
        <p className="mb-stack-xs text-right text-label-sm text-fg-muted">
          {Math.round(percent)}%
        </p>
      ) : null}

      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        className={cn(
          "w-full overflow-hidden rounded-pill bg-surface-sunken",
          sizes[size],
        )}
      >
        {/* The fill is the only animated thing: width, not transform, so the
            rounded end of the track stays put. */}
        <div
          className={cn(
            "h-full rounded-pill transition-[width] duration-500 ease-standard",
            tones[tone],
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default Progress;
