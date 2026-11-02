/* ==========================================================================
   Member labs <-> the API (Phase 6, ADR 0007 §1)
   --------------------------------------------------------------------------
   A draw the member types in becomes ONE `POST /patients/:id/labs` with one
   `results[]` item per filled test: each save adds a draw, it never
   overwrites the last one (INT-12). The form keys values by the panel's
   display name; the API keys them by test code (the panel ids, which the
   backend's LAB_TESTS mirrors). A name that is not on a panel goes as
   `testCode: "custom"` with its `testName`. Values stay strings, as typed:
   the server parses the number.
   ========================================================================== */

import { LAB_CATEGORIES } from "./labs.panels.seed";

export type LabSource =
  | "PATIENT_ENTERED"
  | "PROVIDER_ENTERED"
  | "FACILITY_CSV_IMPORT"
  | "INTEGRATION";

/** `LabResultResponseDto` (backend labs module). */
export type ApiLabResult = {
  id: string;
  patientId: string;
  collectedOn: string;
  resultedOn: string | null;
  testCode: string;
  testName: string;
  value: string;
  valueNumeric: number | null;
  unit: string;
  referenceRange: string;
  referenceLow: number | null;
  referenceHigh: number | null;
  abnormalFlag: string | null;
  notes: string | null;
  source: LabSource;
  enteredById: string | null;
  organizationId: string | null;
  hasReport: boolean;
  seenByPatientAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** `GetLabTrendsResponseDto`: one card, numeric readings oldest first. */
export type ApiLabTrend = {
  testCode: string;
  testName: string;
  category: string;
  unit: string;
  referenceRange: string;
  referenceLow: number | null;
  referenceHigh: number | null;
  latest: number;
  points: {
    id: string;
    collectedOn: string;
    value: number;
    source: LabSource;
  }[];
  sources: LabSource[];
};

export type LabEntryBody = {
  testCode: string;
  testName?: string;
  value: string;
  unit?: string;
  referenceRange?: string;
};

export type CreateDrawBody = {
  collectedOn: string;
  notes?: string | null;
  reportFileId?: string;
  results: LabEntryBody[];
};

export type UpdateResultBody = {
  value?: string;
  notes?: string | null;
};

export const CUSTOM_TEST_CODE = "custom";
/** The API's limit on one draw. */
export const MAX_RESULTS_PER_DRAW = 40;

/** Panel display name (lower case) → test code, for every panel test. */
export const TEST_CODE_BY_NAME: ReadonlyMap<string, string> = new Map(
  LAB_CATEGORIES.flatMap((category) =>
    category.tests.map((test) => [test.name.toLowerCase(), test.id] as const),
  ),
);

export const PANEL_TEST_CODES: readonly string[] = LAB_CATEGORIES.flatMap(
  (category) => category.tests.map((test) => test.id),
);

export function testCodeFor(name: string): string {
  return TEST_CODE_BY_NAME.get(name.trim().toLowerCase()) ?? CUSTOM_TEST_CODE;
}

/** The member's typed draw. */
export type LabDraft = {
  /** yyyy-mm-dd */
  collectedOn: string;
  /** Display name → value as typed. Blank values are not sent. */
  values: Record<string, string>;
  notes: string;
};

/** One draw → one POST body. Throws when nothing was filled in or the draw
 *  holds more tests than the API takes. */
export function toDrawBody(
  draft: LabDraft,
  reportFileId?: string,
): CreateDrawBody {
  const results: LabEntryBody[] = [];
  for (const [name, raw] of Object.entries(draft.values)) {
    const value = raw.trim();
    if (!value) continue;
    const testCode = testCodeFor(name);
    results.push(
      testCode === CUSTOM_TEST_CODE
        ? { testCode, testName: name.trim(), value }
        : { testCode, value },
    );
  }
  if (results.length === 0) throw new RangeError("A draw needs one value.");
  if (results.length > MAX_RESULTS_PER_DRAW)
    throw new RangeError("Too many results for one draw.");
  return {
    collectedOn: draft.collectedOn,
    ...(draft.notes.trim() ? { notes: draft.notes.trim() } : {}),
    ...(reportFileId ? { reportFileId } : {}),
    results,
  };
}

/** Only the member's own typed rows can be changed or removed; a result
 *  from the care team is read-only (the API answers 403). */
export function isOwnEntry(row: Pick<ApiLabResult, "source">): boolean {
  return row.source === "PATIENT_ENTERED";
}

/** A result the care team entered or imported. */
export function isClinicResult(row: Pick<ApiLabResult, "source">): boolean {
  return row.source !== "PATIENT_ENTERED";
}
