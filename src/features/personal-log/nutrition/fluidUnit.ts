"use client";

import { usePreferences } from "@/features/profile/usePreferences";

/* ==========================================================================
   Fluid units — ounces by default
   --------------------------------------------------------------------------
   The client (2026-10-12): members in the US measure what they drink in
   ounces, so ounces come first and millilitres stay one tap away. The log
   itself keeps millilitres, so changing the unit never changes the record.
   The choice is saved on the account (`/me/preferences` `fluidUnit`,
   Phase 4); the server's default is ounces.
   ========================================================================== */

export type FluidUnit = "oz" | "ml";

export const ML_PER_OZ = 29.5735;

export const FLUID_PRESETS: Record<FluidUnit, number[]> = {
  oz: [4, 8, 12, 16],
  ml: [120, 240, 330, 500],
};

export function toMl(amount: number, unit: FluidUnit): number {
  return unit === "oz" ? Math.round(amount * ML_PER_OZ) : Math.round(amount);
}

export function fromMl(ml: number, unit: FluidUnit): number {
  return unit === "oz" ? Math.round((ml / ML_PER_OZ) * 10) / 10 : ml;
}

/** "36 oz" or "1,065 ml". */
export function formatFluid(ml: number, unit: FluidUnit): string {
  /* Whole ounces once there are ten or more: "51 oz", not "50.7 oz". */
  const raw = fromMl(ml, unit);
  const value = unit === "oz" && raw >= 10 ? Math.round(raw) : raw;
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })} ${unit === "oz" ? "oz" : "ml"}`;
}

/** The account's fluid unit. Ounces while the preference loads or when it
 *  could not be read: a display unit only, never a stored value. */
export function useFluidUnit() {
  const { preferences, update, error, isPending } = usePreferences();
  return {
    unit: preferences?.fluidUnit === "ml" ? ("ml" as const) : ("oz" as const),
    setUnit: (unit: FluidUnit) => update.mutate({ fluidUnit: unit }),
    isPending,
    isSaving: update.isPending,
    error,
    saveError: update.error,
  };
}
