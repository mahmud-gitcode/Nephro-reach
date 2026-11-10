/* ==========================================================================
   Member appointments <-> the API (P15c, INT-P15-1): `/patients/:id/appointments`
   --------------------------------------------------------------------------
   One call per server operation (ADR 0007 §1). The patient comes from the
   portal context's scope (patientScope.ts), never from browser storage, so
   a caregiver reads only the patient whose grant they act under and the
   server checks that grant (area personal-logs) on every call.

   Visits the access center books are copied in by the server
   (`sourceAccessAppointmentId`): read-only here except "did you go?".
   No seed and no local copy: `nr:member-appointments` is retired.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import { patientPath } from "@/features/profile/patientScope";
import {
  REMINDER_LEADS,
  type Appointment,
  type AppointmentDraft,
  type Attendance,
  type ReminderLead,
} from "./appointments";

/** `AppointmentResponseDto`. */
export type ApiAppointment = {
  id: string;
  patientId: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  doctor: string;
  location: string;
  address: string;
  notes: string;
  attendance: Attendance | null;
  rescheduled: boolean;
  reminderLeadMinutes: number | null;
  sourceAccessAppointmentId: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
};

/** `CreateAppointmentDto` (and, every field optional, `UpdateAppointmentDto`). */
export type AppointmentBody = {
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  doctor: string;
  location: string;
  address: string;
  notes: string;
  reminderLeadMinutes: number | null;
};

/** The minutes the API takes for a reminder choice; null is "No reminder". */
export function toLeadMinutes(lead: ReminderLead | undefined): number | null {
  const minutes = REMINDER_LEADS.find((l) => l.value === lead)?.minutes ?? 0;
  return minutes > 0 ? minutes : null;
}

/** The reminder choice for the API's minutes (an unknown value: none). */
export function fromLeadMinutes(
  minutes: number | null | undefined,
): ReminderLead | undefined {
  if (!minutes) return undefined;
  return REMINDER_LEADS.find((l) => l.minutes === minutes)?.value;
}

export function fromApiAppointment(row: ApiAppointment): Appointment {
  const appointment: Appointment = {
    id: row.id,
    date: row.date,
    start: row.startTime,
    end: row.endTime ?? "",
    title: row.title,
    doctor: row.doctor,
    location: row.location ?? "",
    address: row.address ?? "",
    notes: row.notes ?? "",
  };
  if (row.attendance === "attended" || row.attendance === "missed")
    appointment.attendance = row.attendance;
  if (row.sourceAccessAppointmentId) {
    appointment.source = "vascular-access";
    appointment.sourceId = row.sourceAccessAppointmentId;
  }
  const reminder = fromLeadMinutes(row.reminderLeadMinutes);
  if (reminder) appointment.reminder = reminder;
  if (row.rescheduled) appointment.rescheduled = true;
  return appointment;
}

export function toAppointmentBody(draft: AppointmentDraft): AppointmentBody {
  return {
    date: draft.date,
    startTime: draft.start,
    endTime: draft.end ?? "",
    title: draft.title.trim(),
    doctor: draft.doctor.trim(),
    location: draft.location.trim(),
    address: draft.address.trim(),
    notes: draft.notes.trim(),
    reminderLeadMinutes: toLeadMinutes(draft.reminder),
  };
}

const base = (scope: PatientScope) => patientPath(scope, "/appointments");
const one = (scope: PatientScope, id: string) =>
  `${base(scope)}/${encodeURIComponent(id)}`;

/** The window the screens read: what is ahead (soonest first) and the past
 *  year (most recent first). Each is one full page (the API's maximum). */
export const APPOINTMENT_PAGE_LIMIT = 150;
export const PAST_WINDOW_DAYS = 365;

export const listAppointmentsAhead = (scope: PatientScope, today: string) =>
  fetchPage<ApiAppointment>(
    base(scope),
    { from: today, limit: APPOINTMENT_PAGE_LIMIT },
    { query: { order: "asc" } },
  );

export const listAppointmentsBetween = (
  scope: PatientScope,
  from: string,
  to: string,
) =>
  fetchPage<ApiAppointment>(
    base(scope),
    { from, to, limit: APPOINTMENT_PAGE_LIMIT },
    { query: { order: "desc" } },
  );

export const createAppointment = (scope: PatientScope, body: AppointmentBody) =>
  api<ApiAppointment>(base(scope), { method: "POST", body });

export const updateAppointment = (
  scope: PatientScope,
  id: string,
  body: Partial<AppointmentBody>,
) => api<ApiAppointment>(one(scope, id), { method: "PATCH", body });

export const setAppointmentAttendance = (
  scope: PatientScope,
  id: string,
  attendance: Attendance,
) =>
  api<ApiAppointment>(`${one(scope, id)}/attendance`, {
    method: "PATCH",
    body: { attendance },
  });

export const markAppointmentRescheduled = (scope: PatientScope, id: string) =>
  api<ApiAppointment>(`${one(scope, id)}/rescheduled`, { method: "POST" });

export const removeAppointment = (scope: PatientScope, id: string) =>
  api<unknown>(one(scope, id), { method: "DELETE" });
