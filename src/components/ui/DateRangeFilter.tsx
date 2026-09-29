"use client";

import React from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   DateRangeFilter
   --------------------------------------------------------------------------
   The reference dashboard's toolbar filter: the dates in view and the
   period that sets them, joined in one pill with a hairline between.

     ( 📅 Jan 1, 2025 – Feb 1, 2025 │ Last 30 days ⌄ )

   The period is a real <select> — keyboard, screen reader and the phone's
   own picker come free — drawn without its box so the pill is the only
   edge. The dates are text; pass `onRangeClick` to make them a button that
   opens a picker of the caller's choosing.
   ========================================================================== */

export type DateRangeOption = { value: string; label: string };

export type DateRangeFilterProps = {
  /** The dates in view, already written out: "Jan 1 – Feb 1, 2025". */
  rangeLabel: string;
  period: string;
  periods: DateRangeOption[];
  onPeriodChange: (period: string) => void;
  /** Makes the dates a button, e.g. to open a custom-range picker. */
  onRangeClick?: () => void;
  /** The select's accessible name. */
  periodLabel?: string;
  className?: string;
};

const part =
  "flex items-center gap-inline-sm px-inset-sm " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring";

export function DateRangeFilter({
  rangeLabel,
  period,
  periods,
  onPeriodChange,
  onRangeClick,
  periodLabel = "Period",
  className,
}: DateRangeFilterProps) {
  const range = (
    <>
      <Calendar
        aria-hidden="true"
        className="h-icon-small w-icon-small shrink-0 text-fg-secondary"
      />
      <span className="whitespace-nowrap">{rangeLabel}</span>
    </>
  );

  return (
    <div
      className={cn(
        "inline-flex h-control-small max-w-full items-stretch overflow-hidden rounded-pill border border-line bg-surface text-body-sm text-fg",
        className,
      )}
    >
      {onRangeClick ? (
        <button
          type="button"
          onClick={onRangeClick}
          className={cn(part, "cursor-pointer hover:bg-surface-sunken")}
        >
          {range}
        </button>
      ) : (
        <span className={part}>{range}</span>
      )}

      <span aria-hidden="true" className="w-px shrink-0 bg-line" />

      <span className="relative flex items-center">
        <select
          aria-label={periodLabel}
          value={period}
          onChange={(event) => onPeriodChange(event.target.value)}
          className={cn(
            part,
            "h-full cursor-pointer appearance-none bg-transparent pr-8 hover:bg-surface-sunken [&_option]:bg-surface [&_option]:text-fg",
          )}
        >
          {periods.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 h-icon-small w-icon-small text-fg-icon-quiet"
        />
      </span>
    </div>
  );
}

export default DateRangeFilter;
