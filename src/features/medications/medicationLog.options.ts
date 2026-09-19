import type { SideEffect } from "./medicationLog.types";

/* ==========================================================================
   Side effects a member can record against a dose
   --------------------------------------------------------------------------
   A short, tappable list rather than a free-text box: the column sits in a
   table row and the point is that recording one takes a second, not that it
   reads well. The list is the effects a dialysis member is most likely to
   meet on these medications, with "Other" so nothing is unrecordable.

   Paired with their Spanish so an effect cannot be recorded in one language
   and read back missing in the other.
   ========================================================================== */

export interface SideEffectOption {
  value: SideEffect;
  labelEn: string;
  labelEs: string;
}

export const SIDE_EFFECT_OPTIONS: SideEffectOption[] = [
  { value: "none", labelEn: "None", labelEs: "Ninguno" },
  { value: "fatigue", labelEn: "Fatigue", labelEs: "Fatiga" },
  { value: "nausea", labelEn: "Nausea", labelEs: "Náuseas" },
  { value: "dizziness", labelEn: "Dizziness", labelEs: "Mareos" },
  { value: "headache", labelEn: "Headache", labelEs: "Dolor de cabeza" },
  { value: "cramps", labelEn: "Muscle cramps", labelEs: "Calambres" },
  { value: "itching", labelEn: "Itching", labelEs: "Picazón" },
  { value: "low-bp", labelEn: "Low blood pressure", labelEs: "Presión baja" },
  {
    value: "upset-stomach",
    labelEn: "Upset stomach",
    labelEs: "Malestar estomacal",
  },
  { value: "rash", labelEn: "Rash", labelEs: "Sarpullido" },
  { value: "other", labelEn: "Other", labelEs: "Otro" },
];

export function sideEffectLabel(effect: SideEffect, isEs: boolean): string {
  const option = SIDE_EFFECT_OPTIONS.find((item) => item.value === effect);
  if (!option) return effect;
  return isEs ? option.labelEs : option.labelEn;
}
