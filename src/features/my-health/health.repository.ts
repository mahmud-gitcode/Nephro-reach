/* ==========================================================================
   Allergies and medical conditions: one function per server operation
   (ADR 0007 §1). Every call names the patient in its path.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import { patientPath } from "@/features/profile/patientScope";
import type {
  AllergyBody,
  ApiAllergy,
  ApiCondition,
  ConditionBody,
} from "./health.mapper";

/* A profile list is short; one page of the maximum, with "load more"
   offered when the server says there is more. */
export const PROFILE_LIST_PAGE: PageParams = { limit: 150 };

export const listAllergies = (scope: PatientScope, page = PROFILE_LIST_PAGE) =>
  fetchPage<ApiAllergy>(patientPath(scope, "/allergies"), page);

export const createAllergy = (scope: PatientScope, body: AllergyBody) =>
  api<ApiAllergy>(patientPath(scope, "/allergies"), { method: "POST", body });

export const updateAllergy = (
  scope: PatientScope,
  id: string,
  patch: Partial<AllergyBody>,
) =>
  api<ApiAllergy>(patientPath(scope, `/allergies/${encodeURIComponent(id)}`), {
    method: "PATCH",
    body: patch,
  });

export const removeAllergy = (scope: PatientScope, id: string) =>
  api<unknown>(patientPath(scope, `/allergies/${encodeURIComponent(id)}`), {
    method: "DELETE",
  });

export const listConditions = (scope: PatientScope, page = PROFILE_LIST_PAGE) =>
  fetchPage<ApiCondition>(patientPath(scope, "/medical-conditions"), page);

export const createCondition = (scope: PatientScope, body: ConditionBody) =>
  api<ApiCondition>(patientPath(scope, "/medical-conditions"), {
    method: "POST",
    body,
  });

export const updateCondition = (
  scope: PatientScope,
  id: string,
  patch: Partial<ConditionBody>,
) =>
  api<ApiCondition>(
    patientPath(scope, `/medical-conditions/${encodeURIComponent(id)}`),
    { method: "PATCH", body: patch },
  );

export const removeCondition = (scope: PatientScope, id: string) =>
  api<unknown>(
    patientPath(scope, `/medical-conditions/${encodeURIComponent(id)}`),
    { method: "DELETE" },
  );
