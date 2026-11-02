/* ==========================================================================
   Between Treatment Check-in: one function per server operation
   (`/patients/:id/check-ins`, Phase 5). No seed: an empty log is
   genuinely empty, and showing a member symptoms they never reported would
   be a lie about their own health record.
   ========================================================================== */

import { api, apiRequest } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import { patientPath } from "@/features/profile/patientScope";
import type { ApiCheckIn, CheckInBody } from "./checkIn.mapper";

const base = (scope: PatientScope) => patientPath(scope, "/check-ins");
const one = (scope: PatientScope, id: string) =>
  `${base(scope)}/${encodeURIComponent(id)}`;

export const listCheckIns = (scope: PatientScope, params: PageParams) =>
  fetchPage<ApiCheckIn>(base(scope), params);

/** The one check-in of a day, if any (the 409 recovery reads this). */
export async function findCheckInOn(
  scope: PatientScope,
  day: string,
): Promise<ApiCheckIn | null> {
  const page = await fetchPage<ApiCheckIn>(base(scope), {
    from: day,
    to: day,
    limit: 10,
  });
  return page.items.find((row) => row.checkInDate === day) ?? null;
}

export const createCheckIn = (
  scope: PatientScope,
  checkInDate: string,
  body: CheckInBody,
) =>
  api<ApiCheckIn>(base(scope), {
    method: "POST",
    body: { checkInDate, ...body },
  });

export const updateCheckIn = (
  scope: PatientScope,
  id: string,
  body: CheckInBody,
) => api<ApiCheckIn>(one(scope, id), { method: "PUT", body });

/** Deletes the day. Returns the server's sentence: when the clinic already
 *  received the day's notice, it says the clinic keeps it. */
export async function removeCheckIn(
  scope: PatientScope,
  id: string,
): Promise<string> {
  const reply = await apiRequest<unknown>(one(scope, id), {
    method: "DELETE",
  });
  return Array.isArray(reply.message)
    ? reply.message.join(" ")
    : (reply.message ?? "");
}
