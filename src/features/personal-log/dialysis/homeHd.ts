/* ==========================================================================
   Home haemodialysis: the machine, the water, and the numbers either side
   --------------------------------------------------------------------------
   At a centre a technician owns the machine and a nurse takes the
   observations. At home both jobs move to the member, so the log has to ask
   for things the in-center log never did: when the system was last
   disinfected, when the water filter is due, and what the weight and blood
   pressure were before and after the run.

   These live on the treatment page, not on management: they are facts about
   a session, recorded while it happens.
   ========================================================================== */

export type MachineType = "nxstage" | "fresenius" | "outset" | "other";

export const MACHINE_TYPES: {
  value: MachineType;
  labelEn: string;
  labelEs: string;
}[] = [
  { value: "nxstage", labelEn: "NxStage", labelEs: "NxStage" },
  { value: "fresenius", labelEn: "Fresenius", labelEs: "Fresenius" },
  { value: "outset", labelEn: "Outset Tablo", labelEs: "Outset Tablo" },
  { value: "other", labelEn: "Other", labelEs: "Otra" },
];

export interface HomeSystem {
  machine: MachineType;
  serial: string;
  /** yyyy-mm-dd, or empty when never recorded. */
  lastDisinfection: string;
  lastFilterChange: string;
  /** How often the filter is due, in days. Units differ, so it is editable. */
  filterIntervalDays: number;
  /** How often the system is disinfected, in days. */
  disinfectionIntervalDays: number;
  updatedAt: string;
}

export const DEFAULT_SYSTEM: HomeSystem = {
  machine: "nxstage",
  serial: "",
  lastDisinfection: "",
  lastFilterChange: "",
  filterIntervalDays: 30,
  disinfectionIntervalDays: 7,
  updatedAt: "",
};

export function machineLabel(value: MachineType, isEs: boolean): string {
  const option = MACHINE_TYPES.find((entry) => entry.value === value);
  if (!option) return value;
  return isEs ? option.labelEs : option.labelEn;
}

/* --------------------------------------------------------------------------
   When maintenance is due
   -------------------------------------------------------------------------- */

/** Add days to a yyyy-mm-dd date, or "" when there is nothing to add to. */
export function addDays(iso: string, days: number): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return "";

  const date = new Date(year, month - 1, day + days);
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export type DueState = "unknown" | "ok" | "due-soon" | "overdue";

/**
 * Where a dated task stands against today.
 *
 * "Unknown" is deliberately not "ok": a member who has never recorded a
 * disinfection has not thereby disinfected the machine, and a green tick
 * over a blank field is the kind of reassurance that gets somebody hurt.
 */
export function dueState(
  dueIso: string,
  todayIso: string,
  soonDays = 3,
): DueState {
  if (!dueIso) return "unknown";
  if (dueIso < todayIso) return "overdue";
  return dueIso <= addDays(todayIso, soonDays) ? "due-soon" : "ok";
}

export interface SystemCheck {
  id: "disinfection" | "filter";
  dueIso: string;
  state: DueState;
}

/** The two dated jobs on a home system, with where each one stands. */
export function systemChecks(
  system: HomeSystem,
  todayIso: string,
): SystemCheck[] {
  const disinfectionDue = addDays(
    system.lastDisinfection,
    system.disinfectionIntervalDays,
  );
  const filterDue = addDays(system.lastFilterChange, system.filterIntervalDays);

  return [
    {
      id: "disinfection",
      dueIso: disinfectionDue,
      state: dueState(disinfectionDue, todayIso),
    },
    { id: "filter", dueIso: filterDue, state: dueState(filterDue, todayIso) },
  ];
}

/** True when anything is overdue or unrecorded — worth saying at the top. */
export function needsAttention(system: HomeSystem, todayIso: string): boolean {
  return systemChecks(system, todayIso).some(
    (check) => check.state === "overdue" || check.state === "unknown",
  );
}

/* --------------------------------------------------------------------------
   Vitals either side of a run
   -------------------------------------------------------------------------- */

export type Feeling = "great" | "good" | "okay" | "unwell" | "poor";

export const FEELINGS: { value: Feeling; labelEn: string; labelEs: string }[] =
  [
    { value: "great", labelEn: "Great", labelEs: "Excelente" },
    { value: "good", labelEn: "Good", labelEs: "Bien" },
    { value: "okay", labelEn: "Okay", labelEs: "Regular" },
    { value: "unwell", labelEn: "Not well", labelEs: "Mal" },
    { value: "poor", labelEn: "Poor", labelEs: "Muy mal" },
  ];

export function feelingLabel(value: Feeling, isEs: boolean): string {
  const option = FEELINGS.find((entry) => entry.value === value);
  if (!option) return value;
  return isEs ? option.labelEs : option.labelEn;
}

/**
 * One session's observations.
 *
 * Every number is free text rather than a number type. Members type "74.8",
 * "74,8" and "74.8 kg", and a field that silently refuses the second two is
 * a field that loses the reading rather than records it.
 */
export interface TreatmentVitals {
  /** yyyy-mm-dd. One set per session, keyed by the day it ran. */
  date: string;
  preWeightKg: string;
  postWeightKg: string;
  preBp: string;
  postBp: string;
  preHeartRate: string;
  postHeartRate: string;
  temperature: string;
  feeling: Feeling;
  updatedAt: string;
}

export function emptyVitals(date: string): TreatmentVitals {
  return {
    date,
    preWeightKg: "",
    postWeightKg: "",
    preBp: "",
    postBp: "",
    preHeartRate: "",
    postHeartRate: "",
    temperature: "",
    feeling: "good",
    updatedAt: "",
  };
}

/** Read a typed weight, tolerating a comma decimal. Null when unusable. */
export function parseWeight(value: string): number | null {
  const cleaned = value.replace(",", ".").replace(/[^0-9.]/g, "");
  if (!cleaned) return null;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Litres taken off, from the weight either side.
 *
 * A kilogram of body weight lost across a run is a litre of fluid, which is
 * the arithmetic every unit uses. Null when either weight is missing, and
 * null rather than a negative when the member gained: that is a mistyped
 * figure, not a negative ultrafiltration.
 */
export function fluidRemovedL(vitals: TreatmentVitals): number | null {
  const pre = parseWeight(vitals.preWeightKg);
  const post = parseWeight(vitals.postWeightKg);
  if (pre === null || post === null) return null;

  const removed = pre - post;
  return removed >= 0 ? Math.round(removed * 100) / 100 : null;
}

export type BpFlag = "unknown" | "low" | "normal" | "high";

/**
 * How a blood pressure reads, from "120/80" and its near variants.
 *
 * Flagged rather than judged: the page says what it sees and leaves the
 * decision to the care team. Low matters as much as high here — dropping
 * pressure during a run is the common emergency at home.
 */
export function bpFlag(value: string): BpFlag {
  const match = value.match(/(\d{2,3})\s*[/\-]\s*(\d{2,3})/);
  if (!match) return "unknown";

  const systolic = Number(match[1]);
  const diastolic = Number(match[2]);
  if (!Number.isFinite(systolic) || !Number.isFinite(diastolic))
    return "unknown";

  if (systolic < 90 || diastolic < 60) return "low";
  if (systolic >= 140 || diastolic >= 90) return "high";
  return "normal";
}

/** Read a stored system back, repairing anything unusable. */
export function normaliseSystem(stored: unknown): HomeSystem {
  if (!stored || typeof stored !== "object") return DEFAULT_SYSTEM;
  const raw = stored as Partial<HomeSystem>;

  const days = (value: unknown, fallback: number) =>
    Number.isFinite(value) && Number(value) > 0 ? Number(value) : fallback;

  return {
    machine: MACHINE_TYPES.some((entry) => entry.value === raw.machine)
      ? (raw.machine as MachineType)
      : DEFAULT_SYSTEM.machine,
    serial: typeof raw.serial === "string" ? raw.serial : "",
    lastDisinfection:
      typeof raw.lastDisinfection === "string" ? raw.lastDisinfection : "",
    lastFilterChange:
      typeof raw.lastFilterChange === "string" ? raw.lastFilterChange : "",
    filterIntervalDays: days(
      raw.filterIntervalDays,
      DEFAULT_SYSTEM.filterIntervalDays,
    ),
    disinfectionIntervalDays: days(
      raw.disinfectionIntervalDays,
      DEFAULT_SYSTEM.disinfectionIntervalDays,
    ),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : "",
  };
}

/** Read one day's stored vitals back. */
export function normaliseVitals(
  stored: unknown,
  date: string,
): TreatmentVitals {
  const base = emptyVitals(date);
  if (!stored || typeof stored !== "object") return base;

  const raw = stored as Partial<TreatmentVitals>;
  const text = (value: unknown) => (typeof value === "string" ? value : "");

  return {
    date: text(raw.date) || date,
    preWeightKg: text(raw.preWeightKg),
    postWeightKg: text(raw.postWeightKg),
    preBp: text(raw.preBp),
    postBp: text(raw.postBp),
    preHeartRate: text(raw.preHeartRate),
    postHeartRate: text(raw.postHeartRate),
    temperature: text(raw.temperature),
    feeling: FEELINGS.some((entry) => entry.value === raw.feeling)
      ? (raw.feeling as Feeling)
      : "good",
    updatedAt: text(raw.updatedAt),
  };
}
