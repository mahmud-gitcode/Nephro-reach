/* ==========================================================================
   A patient's lab chart, read and written by the office (Phase 9; ADR 0007)
   --------------------------------------------------------------------------
   GET /patients/{patientId}/labs as the active office: the server answers
   only when the patient shares labs with that office (403 otherwise, shown
   as "not shared", never as an empty chart). Provider results are typed by
   staff; a correction or removal needs a reason, and only rows this office
   entered can be changed (the server enforces both).

   The office never reads member storage or member hooks: this is its own
   repository, keyed by patient AND office.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type Page, type PageParams } from "@/lib/api/paging";
import { asOffice } from "./officeContext";

export type LabSource =
  | "PATIENT_ENTERED"
  | "PROVIDER_ENTERED"
  | "FACILITY_CSV_IMPORT"
  | "INTEGRATION";

export type AbnormalFlag = "H" | "L" | "HH" | "LL" | "A";

/** LabResultResponseDto (the fields this screen reads). */
export type OfficeLabResult = {
  id: string;
  patientId: string;
  collectedOn: string;
  resultedOn: string | null;
  testCode: string;
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  abnormalFlag: AbnormalFlag | null;
  notes: string | null;
  source: LabSource;
  enteredById: string | null;
  organizationId: string | null;
  hasReport: boolean;
  createdAt: string;
  updatedAt: string;
};

/** One typed result in a provider draw (ProviderLabEntryDto). */
export type ProviderLabEntry = {
  testCode: string;
  testName?: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  abnormalFlag?: AbnormalFlag | null;
};

export type ProviderDraw = {
  collectedOn: string;
  resultedOn?: string;
  notes?: string;
  reportFileId?: string;
  results: ProviderLabEntry[];
};

export const REASON_MAX = 500;

const labsPath = (patientId: string, rest = "") =>
  `/patients/${encodeURIComponent(patientId)}/labs${rest}`;
const providerPath = (patientId: string, id?: string) =>
  labsPath(
    patientId,
    `/provider-results${id ? `/${encodeURIComponent(id)}` : ""}`,
  );

function requireReason(reason: string): string {
  const trimmed = reason.trim();
  if (!trimmed) throw new RangeError("A reason is required.");
  if (trimmed.length > REASON_MAX)
    throw new RangeError(`Keep the reason to ${REASON_MAX} characters.`);
  return trimmed;
}

/** One page of the chart, newest first, for a window of days. */
export function listPatientLabs(
  orgId: string,
  patientId: string,
  params: PageParams & { source?: LabSource } = {},
): Promise<Page<OfficeLabResult>> {
  const { source, ...page } = params;
  return fetchPage<OfficeLabResult>(labsPath(patientId), page, {
    query: { source },
    ...asOffice(orgId),
  });
}

export function addProviderResults(
  orgId: string,
  patientId: string,
  draw: ProviderDraw,
): Promise<OfficeLabResult[]> {
  return api<OfficeLabResult[]>(providerPath(patientId), {
    method: "POST",
    body: draw,
    ...asOffice(orgId),
  });
}

export async function correctProviderResult(
  orgId: string,
  patientId: string,
  resultId: string,
  change: Partial<ProviderLabEntry> & { collectedOn?: string; notes?: string },
  reason: string,
): Promise<OfficeLabResult> {
  return api<OfficeLabResult>(providerPath(patientId, resultId), {
    method: "PATCH",
    body: { ...change, reason: requireReason(reason) },
    ...asOffice(orgId),
  });
}

export async function removeProviderResult(
  orgId: string,
  patientId: string,
  resultId: string,
  reason: string,
): Promise<unknown> {
  return api<unknown>(providerPath(patientId, resultId), {
    method: "DELETE",
    body: { reason: requireReason(reason) },
    ...asOffice(orgId),
  });
}

/** "H" → "High", "LL" → "Critical low", … for the result badge. */
export const FLAG_LABEL: Record<AbnormalFlag, string> = {
  H: "High",
  L: "Low",
  HH: "Critical high",
  LL: "Critical low",
  A: "Abnormal",
};

/** Who entered a result, as the chart's Source column says it. */
export const SOURCE_LABEL: Record<LabSource, string> = {
  PATIENT_ENTERED: "Patient entered (not verified)",
  PROVIDER_ENTERED: "Entered by staff",
  FACILITY_CSV_IMPORT: "CSV import",
  INTEGRATION: "Lab feed",
};
