/* ==========================================================================
   Member labs: one function per server operation (ADR 0007 §1)
   --------------------------------------------------------------------------
   Rows are read for a window of days, a page at a time; charts read the
   server's trend series for the same window, never pages of raw rows.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import { patientPath } from "@/features/profile/patientScope";
import type {
  ApiLabResult,
  ApiLabTrend,
  CreateDrawBody,
  LabSource,
  UpdateResultBody,
} from "./labs.mapper";

const base = (scope: PatientScope) => patientPath(scope, "/labs");
const one = (scope: PatientScope, id: string) =>
  `${base(scope)}/${encodeURIComponent(id)}`;

export type LabFilters = {
  source?: LabSource;
  unseen?: boolean;
  testCode?: string;
};

export const listLabResults = (
  scope: PatientScope,
  params: PageParams,
  filters: LabFilters = {},
) =>
  fetchPage<ApiLabResult>(base(scope), params, {
    query: {
      ...(filters.source ? { source: filters.source } : {}),
      ...(filters.unseen !== undefined ? { unseen: filters.unseen } : {}),
      ...(filters.testCode ? { testCode: filters.testCode } : {}),
    },
  });

/** Every panel test's numeric readings in the window, one series each. */
export const getLabTrends = (
  scope: PatientScope,
  window: { from: string; to: string },
) =>
  api<ApiLabTrend[]>(`${base(scope)}/trends`, {
    query: { from: window.from, to: window.to },
  });

/** One typed draw: one row per test, returned as rows. */
export const createDraw = (scope: PatientScope, body: CreateDrawBody) =>
  api<ApiLabResult[]>(base(scope), { method: "POST", body });

export const updateLabResult = (
  scope: PatientScope,
  id: string,
  body: UpdateResultBody,
) => api<ApiLabResult>(one(scope, id), { method: "PATCH", body });

export const removeLabResult = (scope: PatientScope, id: string) =>
  api<unknown>(one(scope, id), { method: "DELETE" });

/** The patient has seen the care team's new results (patient only). */
export const markLabsSeen = (scope: PatientScope) =>
  api<{ markedCount: number }>(`${base(scope)}/seen`, { method: "POST" });

/** A short-lived link to a result's report, asked for when it is opened. */
export const labReportLink = (scope: PatientScope, id: string) =>
  api<{ url: string; expiresIn?: number }>(`${one(scope, id)}/report`);
