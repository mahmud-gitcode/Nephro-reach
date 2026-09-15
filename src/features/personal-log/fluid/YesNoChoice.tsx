"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { SegmentedChoice } from "@/components/ui";

/* ==========================================================================
   YesNoChoice
   --------------------------------------------------------------------------
   The symptom questions in the weight log — swelling, shortness of breath,
   rapid gain, dizziness, cramping, weakness, nausea — were seven copies of
   the same twenty-eight lines, differing only in the label and which pair
   of setters they called.

   The radiogroup semantics moved to SegmentedChoice once the dialysis day
   log turned out to have two more hand-written versions of the same thing.
   What stays here is this screen's look and its Yes/No wording.
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
  const isEs = language === "ES";

  return (
    <SegmentedChoice
      label={label}
      value={value}
      onChange={onChange}
      options={[
        { value: true, label: isEs ? "Sí" : "Yes" },
        { value: false, label: "No" },
      ]}
      className="flex items-center justify-between rounded-card border border-line-subtle bg-surface-sunken px-inset-sm py-inset-xs transition-colors duration-150 ease-standard"
      labelClassName="text-body-sm text-fg-secondary"
      trackClassName="flex items-center gap-inline-xs rounded-control bg-primary-soft p-1"
      optionClassName="cursor-pointer rounded-lg px-3.5 py-1 text-xs font-bold transition-all"
      selectedClassName="bg-surface text-fg shadow-control"
      unselectedClassName="text-fg-secondary hover:text-fg"
    />
  );
}

export default YesNoChoice;
