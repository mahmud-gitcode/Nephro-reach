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

   This component owns that correctness and nothing else. The look is the
   caller's, passed in as class names, because the two screens are drawn
   differently and unifying them is a visual decision nobody has made. What
   is not negotiable is the radiogroup: the question names the group, each
   option reports whether it is checked.

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

  return (
    <div className={className}>
      <span id={labelId} className={labelClassName}>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className={trackClassName}
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
                optionClassName,
                isSelected ? selectedClassName : unselectedClassName,
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
