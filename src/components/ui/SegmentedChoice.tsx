"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   SegmentedChoice
   --------------------------------------------------------------------------
   A row of buttons where exactly one is chosen. The app had four of these
   written by hand — the seven symptom questions in the weight log, the
   Yes/No and the five-point severity rows in the dialysis day log — and
   every one of them had the same hole: plain <button>s, no group, no tie
   between the question and its options, and nothing saying which was
   picked. A screen reader heard "Yes button, No button" and could not tell
   that Yes was already selected.

   This component owns that correctness, and a default look: the question
   set like a form field's label, the options in the same white pill track
   as Tabs, the chosen one tinted brand. A caller may still pass its own
   class names (the personal-log screens do); each one it leaves out falls
   back to the default. What is not negotiable is the radiogroup: the
   question names the group, each option reports whether it is checked.

   Values are compared by identity, so anything with a stable equality works
   as a value — usually a string union.
   ========================================================================== */

export type SegmentedChoiceOption<T> = {
  value: T;
  /** What the option says. Also its accessible name. */
  label: React.ReactNode;
  /** Overrides the accessible name when `label` is not plain text. */
  srLabel?: string;
};

export type SegmentedChoiceProps<T> = {
  /** The question. Becomes the group's accessible name. */
  label: React.ReactNode;
  options: SegmentedChoiceOption<T>[];
  value: T;
  onChange: (next: T) => void;
  /** Wrapper around the label and the track. */
  className?: string;
  labelClassName?: string;
  /** The container the options sit in. */
  trackClassName?: string;
  /** Applied to every option. */
  optionClassName?: string;
  /** Added to the chosen option. */
  selectedClassName?: string;
  /** Added to every other option. */
  unselectedClassName?: string;
};

const defaults = {
  wrapper: "flex flex-col gap-stack-xs",
  label: "text-label-lg text-fg",
  track:
    "inline-flex w-fit flex-wrap gap-inline-xs rounded-control border border-line bg-surface p-1",
  option:
    "inline-flex min-h-9 cursor-pointer items-center justify-center rounded-control-small px-inset-md text-label-md whitespace-nowrap transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  selected: "bg-primary-soft text-fg-brand",
  unselected: "text-fg-secondary hover:bg-surface-sunken hover:text-fg",
};

export function SegmentedChoice<T>({
  label,
  options,
  value,
  onChange,
  className,
  labelClassName,
  trackClassName,
  optionClassName,
  selectedClassName,
  unselectedClassName,
}: SegmentedChoiceProps<T>) {
  const labelId = useId();
  /* A caller that styles the track styles the whole control; one that
     passes nothing gets the house look. */
  const custom = trackClassName !== undefined;

  return (
    <div className={className ?? (custom ? undefined : defaults.wrapper)}>
      <span
        id={labelId}
        className={labelClassName ?? (custom ? undefined : defaults.label)}
      >
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className={trackClassName ?? defaults.track}
      >
        {options.map((option, index) => {
          const isSelected = option.value === value;
          return (
            <button
              key={index}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={option.srLabel}
              onClick={() => onChange(option.value)}
              className={cn(
                optionClassName ?? defaults.option,
                isSelected
                  ? (selectedClassName ??
                      (custom ? undefined : defaults.selected))
                  : (unselectedClassName ??
                      (custom ? undefined : defaults.unselected)),
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SegmentedChoice;
