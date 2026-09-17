"use client";

import React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  formatDayLabel,
  isValidIso,
  relativeDayLabel,
  todayIso,
} from "../check-in/checkIn.rules";
import { isFutureDay, shiftDay } from "./nutrition.rules";

/* The day the whole nutrition screen is showing. Back and forward step a
   day at a time; the date field jumps anywhere in the past. Forward stops
   at today, because nothing has been eaten tomorrow yet. */

const STEP_CLASS =
  "inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-fg-secondary transition-colors hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface";

export function NutritionDayPicker({
  date,
  onChange,
}: {
  date: string;
  onChange: (next: string) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const today = todayIso();
  const isToday = date === today;
  const relative = relativeDayLabel(date, isEs);
  const full = formatDayLabel(date, isEs);

  return (
    <section
      aria-label={isEs ? "Día mostrado" : "Day shown"}
      className="flex flex-col gap-3 rounded-[10px] border border-line bg-[var(--color-gray-100)] p-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(shiftDay(date, -1))}
          className={STEP_CLASS}
          aria-label={isEs ? "Día anterior" : "Previous day"}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div
          className="min-w-0 text-center sm:min-w-[180px]"
          aria-live="polite"
        >
          <p className="text-lg leading-7 font-medium tracking-[0.09px] text-fg">
            {relative}
          </p>
          {!isToday && relative !== full ? (
            <p className="text-sm leading-5 font-medium text-fg-muted">
              {full}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onChange(shiftDay(date, 1))}
          disabled={isToday || isFutureDay(shiftDay(date, 1))}
          className={STEP_CLASS}
          aria-label={isEs ? "Día siguiente" : "Next day"}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="relative flex-1 sm:flex-none">
          <span className="sr-only">
            {isEs ? "Elegir un día" : "Pick a day"}
          </span>
          <CalendarDays
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-fg-muted"
          />
          <input
            type="date"
            value={date}
            max={today}
            onChange={(event) => {
              const next = event.target.value;
              if (isValidIso(next) && !isFutureDay(next)) onChange(next);
            }}
            className="h-10 w-full cursor-pointer rounded-xl border border-line bg-surface py-2 pr-3 pl-9 text-sm font-medium text-fg transition-colors outline-none focus:border-primary-edge focus:ring-1 focus:ring-ring"
          />
        </label>
        {isToday ? null : (
          <button
            type="button"
            onClick={() => onChange(today)}
            className="h-10 shrink-0 cursor-pointer rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-fg-brand transition-colors hover:bg-surface-sunken"
          >
            {isEs ? "Hoy" : "Today"}
          </button>
        )}
      </div>
    </section>
  );
}
