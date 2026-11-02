/* ==========================================================================
   Weight and fluid log <-> the API (Phase 5)
   --------------------------------------------------------------------------
   `/patients/:id/weight-fluid`. One entry per day: its identity is the day
   (`entryDate`), and `PUT …/weight-fluid/:entryDate` creates or replaces
   it, so saving the same day twice updates it (no 409). A PUT replaces the
   whole day (an omitted field becomes empty), so every save sends the full
   entry. The weight is sent as typed with the unit the form used; the
   server works out `weightKg` (the one number the care team's
   weight-change alert reads). The display dates and the status sentence
   are derived here, never stored.
   ========================================================================== */

import type { WeightFluidEntry } from "./fluid.types";

type ApiFluidStatus = "above-edw" | "near-edw" | "below-edw";

export type ApiWeightFluidEntry = {
  id: string;
  patientId: string;
  entryDate: string;
  weightKg: number | null;
  morningWeight: string;
  eveningWeight: string;
  urineOutput: string;
  intake: string;
  goal: string;
  swelling: string;
  shortnessOfBreath: string;
  weakness: string;
  rapidGain: string | null;
  dizziness: string | null;
  cramping: string | null;
  nausea: string | null;
  fluidStatus: ApiFluidStatus | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type WeightFluidBody = {
  morningWeight: string;
  weightUnit: "kg" | "lbs";
  eveningWeight: string;
  urineOutput: string;
  intake: string;
  goal: string;
  swelling: string;
  shortnessOfBreath: string;
  weakness: string;
  rapidGain: string | null;
  dizziness: string | null;
  cramping: string | null;
  nausea: string | null;
  fluidStatus: ApiFluidStatus | null;
  notes: string;
};

type Status = NonNullable<WeightFluidEntry["fluidStatus"]>;

const STATUS: Record<Status, ApiFluidStatus> = {
  "Above EDW": "above-edw",
  "Near EDW": "near-edw",
  "Below EDW": "below-edw",
};
const STATUS_LABEL: Record<ApiFluidStatus, Status> = {
  "above-edw": "Above EDW",
  "near-edw": "Near EDW",
  "below-edw": "Below EDW",
};
const STATUS_MESSAGE: Record<Status, string> = {
  "Above EDW": "Possible Fluid Overload",
  "Near EDW": "Appears On Target",
  "Below EDW": "Possible Too Much Fluid Removed",
};

const MONTHS_EN = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
const MONTHS_ES = "Ene Feb Mar Abr May Jun Jul Ago Sep Oct Nov Dic".split(" ");

export function displayDates(day: string): { dateEn: string; dateEs: string } {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return { dateEn: day, dateEs: day };
  return {
    dateEn: `${MONTHS_EN[m - 1]} ${d}, ${y}`,
    dateEs: `${d} ${MONTHS_ES[m - 1]}, ${y}`,
  };
}

export function fromApiWeightFluid(row: ApiWeightFluidEntry): WeightFluidEntry {
  const status = row.fluidStatus ? STATUS_LABEL[row.fluidStatus] : undefined;
  return {
    id: row.id,
    date: row.entryDate,
    ...(row.weightKg !== null ? { weightKg: row.weightKg } : {}),
    ...displayDates(row.entryDate),
    morning: row.morningWeight || "--",
    evening: row.eveningWeight || "--",
    uo: row.urineOutput,
    intake: row.intake,
    goal: row.goal,
    swelling: row.swelling,
    sob: row.shortnessOfBreath,
    weakness: row.weakness,
    rapidGain: row.rapidGain ?? undefined,
    dizziness: row.dizziness ?? undefined,
    cramping: row.cramping ?? undefined,
    nausea: row.nausea ?? undefined,
    ...(status
      ? { fluidStatus: status, fluidStatusMsg: STATUS_MESSAGE[status] }
      : {}),
    notes: row.notes || "--",
    noteKey: null,
  };
}

const typed = (value: string | undefined) =>
  value && value.trim() !== "--" ? value.trim() : "";

/** The full day, as a PUT replaces it. */
export function toWeightFluidBody(
  entry: WeightFluidEntry,
  weightUnit: "kg" | "lbs",
): WeightFluidBody {
  return {
    morningWeight: typed(entry.morning),
    weightUnit,
    eveningWeight: typed(entry.evening),
    urineOutput: entry.uo ?? "",
    intake: entry.intake ?? "",
    goal: entry.goal ?? "",
    swelling: entry.swelling ?? "",
    shortnessOfBreath: entry.sob ?? "",
    weakness: entry.weakness ?? "",
    rapidGain: entry.rapidGain ?? null,
    dizziness: entry.dizziness ?? null,
    cramping: entry.cramping ?? null,
    nausea: entry.nausea ?? null,
    fluidStatus: entry.fluidStatus ? STATUS[entry.fluidStatus] : null,
    notes: typed(entry.notes),
  };
}
