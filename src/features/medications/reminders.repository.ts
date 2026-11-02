/* ==========================================================================
   Medication reminders: one function per server operation (ADR 0007 §1)
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import { patientPath } from "@/features/profile/patientScope";
import type {
  ApiReminder,
  CreateReminderBody,
  UpdateReminderBody,
} from "./reminders.mapper";

const base = (scope: PatientScope) => patientPath(scope, "/reminders");
const one = (scope: PatientScope, id: string) =>
  `${base(scope)}/${encodeURIComponent(id)}`;

/** The medication reminders (kind MEDICATION), one page. */
export const listMedicationReminders = (
  scope: PatientScope,
  params: PageParams,
) =>
  fetchPage<ApiReminder>(base(scope), params, {
    query: { kind: "MEDICATION" },
  });

export const createReminder = (scope: PatientScope, body: CreateReminderBody) =>
  api<ApiReminder>(base(scope), { method: "POST", body });

export const updateReminder = (
  scope: PatientScope,
  id: string,
  body: UpdateReminderBody,
) => api<ApiReminder>(one(scope, id), { method: "PATCH", body });

export const removeReminder = (scope: PatientScope, id: string) =>
  api<unknown>(one(scope, id), { method: "DELETE" });
