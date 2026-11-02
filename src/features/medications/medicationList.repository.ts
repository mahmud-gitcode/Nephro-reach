/* ==========================================================================
   Medications: one function per server operation (ADR 0007 §1)
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import { patientPath } from "@/features/profile/patientScope";
import type {
  ApiMedication,
  ApiMedicationRevision,
  CreateMedicationBody,
  UpdateMedicationBody,
} from "./medications.mapper";

const base = (scope: PatientScope) => patientPath(scope, "/medications");
const one = (scope: PatientScope, id: string) =>
  `${base(scope)}/${encodeURIComponent(id)}`;

export const listMedications = (scope: PatientScope, params: PageParams) =>
  fetchPage<ApiMedication>(base(scope), params);

export const createMedication = (
  scope: PatientScope,
  body: CreateMedicationBody,
) => api<ApiMedication>(base(scope), { method: "POST", body });

export const updateMedication = (
  scope: PatientScope,
  id: string,
  body: UpdateMedicationBody,
) => api<ApiMedication>(one(scope, id), { method: "PATCH", body });

export const removeMedication = (scope: PatientScope, id: string) =>
  api<unknown>(one(scope, id), { method: "DELETE" });

/** A short-lived link to the medication's photo, asked for when the member
 *  opens it; never cached or stored. */
export const medicationPhotoLink = (scope: PatientScope, id: string) =>
  api<{ url: string; expiresIn?: number }>(`${one(scope, id)}/photo`);

export const listMedicationHistory = (
  scope: PatientScope,
  id: string,
  params: PageParams,
) => fetchPage<ApiMedicationRevision>(`${one(scope, id)}/history`, params);
