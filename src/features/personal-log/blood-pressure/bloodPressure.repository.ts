/* ==========================================================================
   Blood pressure: one function per server operation (ADR 0007 §1)
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import { patientPath } from "@/features/profile/patientScope";
import type { ApiBpReading, BpBody, BpSummary } from "./bloodPressure.mapper";

const base = (scope: PatientScope) => patientPath(scope, "/blood-pressure");
const one = (scope: PatientScope, id: string) =>
  `${base(scope)}/${encodeURIComponent(id)}`;

export const listReadings = (scope: PatientScope, params: PageParams) =>
  fetchPage<ApiBpReading>(base(scope), params);

export const getSummary = (
  scope: PatientScope,
  window: { from: string; to: string },
) =>
  api<BpSummary>(`${base(scope)}/summary`, {
    query: { from: window.from, to: window.to },
  });

export const createReading = (scope: PatientScope, body: BpBody) =>
  api<ApiBpReading>(base(scope), { method: "POST", body });

export const updateReading = (
  scope: PatientScope,
  id: string,
  body: Partial<BpBody>,
) => api<ApiBpReading>(one(scope, id), { method: "PATCH", body });

export const removeReading = (scope: PatientScope, id: string) =>
  api<unknown>(one(scope, id), { method: "DELETE" });

/** A short-lived link to the reading's photo, asked for when the member
 *  opens it; never cached or stored. */
export const photoLink = (scope: PatientScope, id: string) =>
  api<{ url: string; expiresIn?: number }>(`${one(scope, id)}/photo`);
