import type {
  ActivityLevel,
  Appetite,
  EnergyLevel,
  RecoveryWindow,
} from "./checkIn.types";

/* ==========================================================================
   Beyond the Chair — the option lists
   --------------------------------------------------------------------------
   Worded as the client architecture guide words them, and ordered as it
   orders them. Every label ships in both languages here rather than inside a
   component, so a new option cannot be added in English only.
   ========================================================================== */

export const RECOVERY_WINDOWS: {
  value: RecoveryWindow;
  labelEn: string;
  labelEs: string;
  /** Midpoint in hours, for averaging. Null where there is no sensible one. */
  hours: number | null;
}[] = [
  {
    value: "under-1h",
    labelEn: "Less than 1 hour",
    labelEs: "Menos de 1 hora",
    hours: 0.5,
  },
  { value: "1-2h", labelEn: "1–2 hours", labelEs: "1–2 horas", hours: 1.5 },
  { value: "2-4h", labelEn: "2–4 hours", labelEs: "2–4 horas", hours: 3 },
  { value: "4-6h", labelEn: "4–6 hours", labelEs: "4–6 horas", hours: 5 },
  {
    value: "over-6h",
    labelEn: "More than 6 hours",
    labelEs: "Más de 6 horas",
    hours: 7,
  },
  {
    /* Deliberately has no hour value. Averaging "never recovered" as a
       number would flatter the average and hide the worst days, so it is
       counted separately instead. */
    value: "still-not-recovered",
    labelEn: "Still not recovered",
    labelEs: "Aún no me recupero",
    hours: null,
  },
];

export const ENERGY_LEVELS: {
  value: EnergyLevel;
  labelEn: string;
  labelEs: string;
}[] = [
  { value: 1, labelEn: "Wiped out", labelEs: "Agotado" },
  { value: 2, labelEn: "Low", labelEs: "Baja" },
  { value: 3, labelEn: "Middling", labelEs: "Media" },
  { value: 4, labelEn: "Good", labelEs: "Buena" },
  { value: 5, labelEn: "Full energy", labelEs: "Con toda la energía" },
];

export const ACTIVITY_LEVELS: {
  value: ActivityLevel;
  labelEn: string;
  labelEs: string;
}[] = [
  { value: "yes", labelEn: "Yes, as usual", labelEs: "Sí, como siempre" },
  { value: "partly", labelEn: "Some of them", labelEs: "Algunas" },
  { value: "no", labelEn: "No", labelEs: "No" },
];

export const APPETITES: {
  value: Appetite;
  labelEn: string;
  labelEs: string;
}[] = [
  { value: "good", labelEn: "Good", labelEs: "Bueno" },
  { value: "fair", labelEn: "Fair", labelEs: "Regular" },
  { value: "poor", labelEn: "Poor", labelEs: "Malo" },
];

export function recoveryLabel(
  value: RecoveryWindow | undefined,
  isEs: boolean,
): string | null {
  const match = RECOVERY_WINDOWS.find((entry) => entry.value === value);
  if (!match) return null;
  return isEs ? match.labelEs : match.labelEn;
}

export function energyLabel(
  value: EnergyLevel | undefined,
  isEs: boolean,
): string | null {
  const match = ENERGY_LEVELS.find((entry) => entry.value === value);
  if (!match) return null;
  return isEs ? match.labelEs : match.labelEn;
}
