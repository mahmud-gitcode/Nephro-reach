"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   MonthCalendar
   --------------------------------------------------------------------------
   A month grid you pick one day from, taken out of the extra-treatment
   form where it was written inline with the month arithmetic in the JSX.

   The reason it is a component and not a tidy-up is what it replaced: days
   rendered as plain <button>s with the chosen one styled blue and nothing
   else. A screen reader heard thirty-one buttons named "1" to "31", with
   no way to tell which day was selected, what month was on screen, or that
   pressing the arrow had changed anything.

   There is a second, different picker in the notification scheduler
   (sms-analytics). That one is already accessible and is drawn to a
   different design — a compact popover with pill day cells — so it is
   deliberately not folded in here. Unifying them is a visual decision,
   not a refactor.

   Here the grid is a `grid` of `gridcell`s, the chosen day carries
   aria-selected, each day's accessible name is its full date rather than a
   bare number, and the month heading is a live region so stepping through
   months is announced.

   `isMarked` is for days that mean something in the caller's world — a
   prescribed treatment day, a day with an entry. It only decorates; it
   never blocks selection.
   ========================================================================== */

export type MonthCalendarProps = {
  /** The month on screen. */
  year: number;
  month: number;
  /** The chosen day of that month, or null. */
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
  /** Called with the next month to show. */
  onMonthChange: (year: number, month: number) => void;
  /** "June 2026", already in the member's language. */
  monthLabel: string;
  /** Seven short labels, starting at Sunday. */
  weekdayLabels: string[];
  /** Long weekday + month names, for the day cells' accessible names. */
  formatDayLabel: (date: Date) => string;
  /** Days worth pointing out. Decorative only. */
  isMarked?: (date: Date) => boolean;
  previousMonthLabel?: string;
  nextMonthLabel?: string;
  className?: string;
};

export function MonthCalendar({
  year,
  month,
  selectedDay,
  onSelectDay,
  onMonthChange,
  monthLabel,
  weekdayLabels,
  formatDayLabel,
  isMarked,
  previousMonthLabel = "Previous month",
  nextMonthLabel = "Next month",
  className,
}: MonthCalendarProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  /* Weeks, not a flat list of days: a gridcell has to sit inside a row, and
     axe is right to insist — without rows a screen reader cannot navigate
     the grid in two dimensions, which is the only reason to use a grid. */
  const weeks: Array<Array<number | null>> = [];
  const cells: Array<number | null> = [
    ...Array.from({ length: firstDayIndex }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  const step = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    onMonthChange(next.getFullYear(), next.getMonth());
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between px-2">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label={previousMonthLabel}
          className="cursor-pointer rounded-xl border border-line bg-surface p-2 text-fg-secondary shadow-control transition-colors hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ChevronLeft aria-hidden="true" className="h-5 w-5" />
        </button>

        {/* Live, because stepping month changes nothing else on screen. */}
        <h3 aria-live="polite" className="text-heading-5 text-fg">
          {monthLabel}
        </h3>

        <button
          type="button"
          onClick={() => step(1)}
          aria-label={nextMonthLabel}
          className="cursor-pointer rounded-xl border border-line bg-surface p-2 text-fg-secondary shadow-control transition-colors hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      <div role="grid" aria-label={monthLabel}>
        <div
          role="row"
          className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-fg-subtle"
        >
          {weekdayLabels.map((label) => (
            <div key={label} role="columnheader" className="py-1">
              {label}
            </div>
          ))}
        </div>

        {weeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            role="row"
            className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2"
          >
            {week.map((day, dayIndex) => {
              if (day === null) {
                return (
                  <div
                    key={`blank-${dayIndex}`}
                    role="presentation"
                    className="h-9 sm:h-11"
                  />
                );
              }

              const date = new Date(year, month, day);
              const isSelected = day === selectedDay;
              const marked = isMarked?.(date) ?? false;

              return (
                <button
                  key={day}
                  type="button"
                  role="gridcell"
                  aria-selected={isSelected}
                  aria-label={formatDayLabel(date)}
                  onClick={() => onSelectDay(day)}
                  className={cn(
                    "relative flex h-9 cursor-pointer items-center justify-center rounded-xl text-sm font-bold transition-all select-none sm:h-11 sm:text-base",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    isSelected
                      ? "scale-105 bg-action text-white shadow-card"
                      : "border border-line/70 bg-surface text-fg-secondary hover:border-primary-soft-line hover:bg-primary-soft",
                  )}
                >
                  {day}
                  {marked && !isSelected ? (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1 h-1 w-1 rounded-pill bg-action"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MonthCalendar;
