/* ==========================================================================
   The emergency contact: `GET/PUT/DELETE /patients/:id/emergency-contact`
   (Phase 4). One per patient; a PUT replaces it.
   ========================================================================== */

import { api } from "@/lib/api/client";
import type { PatientScope } from "@/lib/data/queryKeys";
import { patientPath } from "./patientScope";
import type { ProfileEmergencyContact } from "./emergencyContact";

type ApiEmergencyContact = ProfileEmergencyContact & {
  patientId: string;
  updatedAt: string;
};

const path = (scope: PatientScope) => patientPath(scope, "/emergency-contact");

export const getEmergencyContact = (scope: PatientScope) =>
  api<ApiEmergencyContact | null>(path(scope));

export const saveEmergencyContact = (
  scope: PatientScope,
  body: ProfileEmergencyContact,
) => api<ApiEmergencyContact>(path(scope), { method: "PUT", body });

export const removeEmergencyContact = (scope: PatientScope) =>
  api<unknown>(path(scope), { method: "DELETE" });
