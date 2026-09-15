"use client";

import React, { useId } from "react";
import { useLanguage } from "@/context/LanguageContext";

/* ==========================================================================
   YesNoChoice
   --------------------------------------------------------------------------
   The symptom questions in the weight log — swelling, shortness of breath,
   rapid gain, dizziness, cramping, weakness, nausea — were seven copies of
   the same twenty-eight lines, differing only in the label and which pair
   of setters they called.

   They were also not a choice as far as assistive technology was concerned:
   two plain <button>s, no group, no label tying them to the question, and
   nothing announcing which one was picked. Someone using a screen reader
   heard "Yes button, No button" with no way to tell that Yes was already
   selected — on a form where the answers describe fluid overload.

   The markup is unchanged, so the screen looks exactly as it did. What is
   added is the radiogroup: the question names the group, each option says
   whether it is checked, and the pair is reachable and operable as one
   control.
   ========================================================================== */

export function YesNoChoice({
  label,
  value,
  onChange,
}: {
  /** The question, e.g. "Swelling". Becomes the group's accessible name. */
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  const { language } = useLanguage();
  const labelId = useId();
  const isEs = language === "ES";

  const option = (optionValue: boolean, text: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={value === optionValue}
      onClick={() => onChange(optionValue)}
      className={`cursor-pointer rounded-lg px-3.5 py-1 text-xs font-bold transition-all ${
        value === optionValue
          ? "bg-surface text-fg shadow-control"
          : "text-fg-secondary hover:text-fg"
      }`}
    >
      {text}
    </button>
  );

  return (
    <div className="flex items-center justify-between rounded-card border border-line-subtle bg-surface-sunken px-inset-sm py-inset-xs transition-colors duration-150 ease-standard">
      <span id={labelId} className="text-body-sm text-fg-secondary">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="flex items-center gap-inline-xs rounded-control bg-primary-soft p-1"
      >
        {option(true, isEs ? "Sí" : "Yes")}
        {option(false, "No")}
      </div>
    </div>
  );
}

export default YesNoChoice;
