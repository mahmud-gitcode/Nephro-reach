/* ==========================================================================
   Live classes: one function per server operation (Phase 13)
   --------------------------------------------------------------------------
   - Everyone signed in: the published schedule, GET /live-classes (no
     meeting links in it).
   - The patient (or a caregiver with the education grant): their
     registrations, register / unregister, attendance (which returns the
     meeting link, from 30 minutes before the start) and the rating.
   - The NephroReach team (platform `content`): the full list in a window,
     create / update / delete, and the six settings cards.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import { patientPath } from "@/features/profile/patientScope";
import type {
  ApiAttendance,
  ApiLiveClass,
  ApiLiveClassSetting,
  ApiLiveRegistration,
  ApiPlatformLiveClass,
  LiveClassBody,
} from "@/features/clinic/liveClass.mappers";
import type { SettingValues } from "@/features/clinic/liveClass.actions";

const enc = encodeURIComponent;

export type LivePeriod = "upcoming" | "past";

export const listLiveSchedule = (period: LivePeriod, params: PageParams) =>
  fetchPage<ApiLiveClass>("/live-classes", params, { query: { period } });

const mine = (scope: PatientScope) =>
  patientPath(scope, "/education/live-classes");

export const listMyRegistrations = (scope: PatientScope, params: PageParams) =>
  fetchPage<ApiLiveRegistration>(mine(scope), params);

export const registerForClass = (scope: PatientScope, liveClassId: string) =>
  api<ApiLiveRegistration>(`${mine(scope)}/${enc(liveClassId)}/registration`, {
    method: "POST",
  });

export const cancelRegistration = (scope: PatientScope, liveClassId: string) =>
  api<unknown>(`${mine(scope)}/${enc(liveClassId)}/registration`, {
    method: "DELETE",
  });

/** Records that the patient joined and returns the meeting link. */
export const attendClass = (scope: PatientScope, liveClassId: string) =>
  api<ApiAttendance>(`${mine(scope)}/${enc(liveClassId)}/attendance`, {
    method: "POST",
  });

export const rateClass = (
  scope: PatientScope,
  liveClassId: string,
  rating: number,
) =>
  api<ApiLiveRegistration>(`${mine(scope)}/${enc(liveClassId)}/rating`, {
    method: "PUT",
    body: { rating },
  });

/* ---- the NephroReach team --------------------------------------------- */

export const listPlatformLiveClasses = (
  window: { from: string; to: string },
  params: PageParams,
) =>
  fetchPage<ApiPlatformLiveClass>("/platform/live-classes", params, {
    query: window,
  });

export const createLiveClass = (body: LiveClassBody) =>
  api<ApiPlatformLiveClass>("/platform/live-classes", {
    method: "POST",
    body,
  });

export const updateLiveClass = (
  id: string,
  body: Partial<LiveClassBody> & { recordingUrl?: string | null },
) =>
  api<ApiPlatformLiveClass>(`/platform/live-classes/${enc(id)}`, {
    method: "PATCH",
    body,
  });

export const deleteLiveClass = (id: string) =>
  api<unknown>(`/platform/live-classes/${enc(id)}`, { method: "DELETE" });

export const getLiveClassSettings = () =>
  api<ApiLiveClassSetting[]>("/platform/live-class-settings");

export const putLiveClassSettings = (body: Record<string, SettingValues>) =>
  api<ApiLiveClassSetting[]>("/platform/live-class-settings", {
    method: "PUT",
    body,
  });
