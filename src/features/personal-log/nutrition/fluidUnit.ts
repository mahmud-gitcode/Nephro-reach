"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";

/* ==========================================================================
   Fluid units — ounces by default
   --------------------------------------------------------------------------
   The client (2026-10-12): members in the US measure what they drink in
   ounces, so ounces come first and millilitres stay one tap away. The log
   itself keeps millilitres, so changing the unit never changes the record.
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

const KEY = storageKey("fluid-unit");
const queryKey = ["nutrition", "fluid-unit"] as const;

export function useFluidUnit() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey,
    queryFn: () => readJson<FluidUnit>(KEY, "oz"),
  });
  const write = useMutation({
    mutationFn: (unit: FluidUnit) => writeJson(KEY, unit),
    onSuccess: (unit) => queryClient.setQueryData(queryKey, unit),
  });
  return {
    unit: query.data === "ml" ? ("ml" as const) : ("oz" as const),
    setUnit: (unit: FluidUnit) => write.mutate(unit),
  };
}
