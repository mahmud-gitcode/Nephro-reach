import {
  labFlag,
  labsFor,
  type LabResult,
  type LabsState,
} from "@/features/clinic/labs.data";

/* ==========================================================================
   The clinic's labs, as the member's latest results
   --------------------------------------------------------------------------
   The client (2026-10-12): a result the dialysis center uploads should not
   sit in a table of its own. It fills in the member's own lab panels as the
   latest value for that test, and the member is told a new result came in.
   ========================================================================== */

/** The clinic's test names, as the member's panels name them. */
export const PANEL_ID_BY_TEST: Record<string, string> = {
  potassium: "potassium",
  phosphorus: "phosphorus",
  albumin: "albumin",
  hemoglobin: "hemoglobin",
  "kt/v": "ktv",
  ktv: "ktv",
  bun: "bun",
  creatinine: "creatinine",
  calcium: "calcium",
  sodium: "sodium",
  chloride: "chloride",
  co2: "co2",
  bicarbonate: "bicarbonate",
  ferritin: "ferritin",
  pth: "pth",
  hematocrit: "hematocrit",
  tsat: "tsat",
  egfr: "egfr",
  "vitamin d": "vitamind",
};

export function panelIdOf(test: string): string | undefined {
  return PANEL_ID_BY_TEST[test.trim().toLowerCase()];
}

export type ClinicLatest = {
  value: string;
  unit: string;
  /** yyyy-mm-dd, the draw date. */
  date: string;
  flag: "High" | "Low" | null;
};

/** The newest clinic result for each test on the member's panels. */
export function latestByPanel(
  state: LabsState,
  mrn: string | null,
): Record<string, ClinicLatest> {
  if (!mrn) return {};
  const out: Record<string, ClinicLatest> = {};
  /* labsFor is newest first, so the first one seen per test wins. */
  for (const result of labsFor(state, mrn)) {
    const id = panelIdOf(result.test);
    if (!id || out[id]) continue;
    out[id] = {
      value: result.value,
      unit: result.unit,
      date: result.date,
      flag: labFlag(result),
    };
  }
  return out;
}

/** The newest upload on the member's chart, or null. */
export function newestUpload(
  state: LabsState,
  mrn: string | null,
): LabResult | null {
  if (!mrn) return null;
  const mine = labsFor(state, mrn);
  if (mine.length === 0) return null;
  return mine.reduce((a, b) => (b.uploadedAt > a.uploadedAt ? b : a));
}

/** Uploaded since the member last opened My Labs. */
export function hasUnseen(
  newest: LabResult | null,
  seenAt: string | null,
): boolean {
  return !!newest && (!seenAt || newest.uploadedAt > seenAt);
}
