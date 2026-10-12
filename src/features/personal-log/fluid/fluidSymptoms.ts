import type { WeightFluidEntry } from "./fluid.types";

/* ==========================================================================
   Fluid status symptoms — counted from the member's own entries
   --------------------------------------------------------------------------
   The client (2026-10-12): swelling and shortness of breath were tracked,
   but nothing showed cramping or dizziness, and the tracker that counted
   them had gone. Every symptom the entry form asks about is counted here,
   over the member's recent entries. Counting, never interpreting: what a
   pattern means is for the care team.
   ========================================================================== */

export type FluidSymptomKey =
  | "swelling"
  | "sob"
  | "rapidGain"
  | "cramping"
  | "dizziness"
  | "weakness"
  | "nausea";

export const FLUID_SYMPTOMS: ReadonlyArray<{
  key: FluidSymptomKey;
  en: string;
  es: string;
  /** How the client grouped them on the call. */
  group: "extra" | "low" | "other";
}> = [
  { key: "swelling", en: "Swelling", es: "Hinchazón", group: "extra" },
  {
    key: "sob",
    en: "Shortness of breath",
    es: "Falta de aire",
    group: "extra",
  },
  {
    key: "rapidGain",
    en: "Rapid weight gain",
    es: "Aumento rápido de peso",
    group: "extra",
  },
  { key: "cramping", en: "Cramping", es: "Calambres", group: "low" },
  { key: "dizziness", en: "Dizziness", es: "Mareo", group: "low" },
  { key: "weakness", en: "Weakness", es: "Debilidad", group: "other" },
  { key: "nausea", en: "Nausea", es: "Náuseas", group: "other" },
];

const yes = (value: string | undefined) =>
  (value ?? "").trim().toUpperCase() === "YES";

/** The entries dated within the last `days` days (undated ones count). */
export function recentEntries(
  entries: WeightFluidEntry[],
  today: string,
  days: number,
): WeightFluidEntry[] {
  const [y, m, d] = today.split("-").map(Number);
  const since = new Date(y, m - 1, d - (days - 1));
  const sinceIso = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, "0")}-${String(since.getDate()).padStart(2, "0")}`;
  return entries.filter((e) => !e.date || e.date >= sinceIso);
}

/** How many of the entries recorded each symptom. */
export function symptomCounts(
  entries: WeightFluidEntry[],
): Record<FluidSymptomKey, number> {
  const counts = Object.fromEntries(
    FLUID_SYMPTOMS.map((s) => [s.key, 0]),
  ) as Record<FluidSymptomKey, number>;
  for (const entry of entries) {
    for (const symptom of FLUID_SYMPTOMS) {
      if (yes(entry[symptom.key])) counts[symptom.key] += 1;
    }
  }
  return counts;
}
