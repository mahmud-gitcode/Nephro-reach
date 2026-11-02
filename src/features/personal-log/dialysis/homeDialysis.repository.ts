/* ==========================================================================
   Home dialysis: one function per server operation (Phase 7; ADR 0007 §1)
   --------------------------------------------------------------------------
   The member's home system, equipment events, home visits, supply months,
   provider orders and access photos. No whole-array writes and no browser
   storage. Photos travel as file ids; their pictures open through a
   short-lived link asked for on demand.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import { patientPath } from "@/features/profile/patientScope";
import type {
  AccessPhotoBody,
  ApiAccessPhoto,
  ApiEquipmentEvent,
  ApiHomeSystem,
  ApiHomeVisit,
  ApiProviderOrder,
  ApiSupplyMonth,
  EquipmentEventBody,
  HomeSystemBody,
  HomeVisitBody,
  ProviderOrderBody,
  SupplyMonthBody,
} from "./homeDialysis.mapper";

const path = (scope: PatientScope, rest: string) =>
  patientPath(scope, `/dialysis${rest}`);
const id = (value: string) => `/${encodeURIComponent(value)}`;

/* Home system (null = not set) -------------------------------------------- */

export const getHomeSystem = (scope: PatientScope, today: string) =>
  api<ApiHomeSystem | null>(path(scope, "/home-system"), { query: { today } });

export const saveHomeSystem = (scope: PatientScope, body: HomeSystemBody) =>
  api<ApiHomeSystem>(path(scope, "/home-system"), { method: "PUT", body });

/* Equipment events -------------------------------------------------------- */

export const listEquipmentEvents = (scope: PatientScope, params: PageParams) =>
  fetchPage<ApiEquipmentEvent>(path(scope, "/equipment-events"), params);

export const createEquipmentEvent = (
  scope: PatientScope,
  body: EquipmentEventBody,
) =>
  api<ApiEquipmentEvent>(path(scope, "/equipment-events"), {
    method: "POST",
    body,
  });

export const removeEquipmentEvent = (scope: PatientScope, eventId: string) =>
  api<unknown>(path(scope, `/equipment-events${id(eventId)}`), {
    method: "DELETE",
  });

/* Home visits ------------------------------------------------------------- */

export const listHomeVisits = (
  scope: PatientScope,
  params: PageParams & { modality?: "home-hd" | "pd" },
) => {
  const { modality, ...page } = params;
  return fetchPage<ApiHomeVisit>(
    path(scope, "/home-visits"),
    page,
    modality ? { query: { modality } } : {},
  );
};

export const createHomeVisit = (scope: PatientScope, body: HomeVisitBody) =>
  api<ApiHomeVisit>(path(scope, "/home-visits"), { method: "POST", body });

export const updateHomeVisit = (
  scope: PatientScope,
  visitId: string,
  body: Partial<HomeVisitBody>,
) =>
  api<ApiHomeVisit>(path(scope, `/home-visits${id(visitId)}`), {
    method: "PATCH",
    body,
  });

export const removeHomeVisit = (scope: PatientScope, visitId: string) =>
  api<unknown>(path(scope, `/home-visits${id(visitId)}`), { method: "DELETE" });

/* Supply months ----------------------------------------------------------- */

export const getSupplyMonth = (scope: PatientScope, monthKey: string) =>
  api<ApiSupplyMonth | null>(path(scope, `/supplies${id(monthKey)}`));

export const saveSupplyMonth = (
  scope: PatientScope,
  monthKey: string,
  body: SupplyMonthBody,
) =>
  api<ApiSupplyMonth>(path(scope, `/supplies${id(monthKey)}`), {
    method: "PUT",
    body,
  });

/* Provider orders --------------------------------------------------------- */

export const listProviderOrders = (scope: PatientScope, params: PageParams) =>
  fetchPage<ApiProviderOrder>(path(scope, "/provider-orders"), params);

export const createProviderOrder = (
  scope: PatientScope,
  body: ProviderOrderBody,
) =>
  api<ApiProviderOrder>(path(scope, "/provider-orders"), {
    method: "POST",
    body,
  });

export const updateProviderOrder = (
  scope: PatientScope,
  orderId: string,
  body: ProviderOrderBody,
) =>
  api<ApiProviderOrder>(path(scope, `/provider-orders${id(orderId)}`), {
    method: "PATCH",
    body,
  });

export const removeProviderOrder = (scope: PatientScope, orderId: string) =>
  api<unknown>(path(scope, `/provider-orders${id(orderId)}`), {
    method: "DELETE",
  });

/* Access photos ----------------------------------------------------------- */

export const listAccessPhotos = (scope: PatientScope, params: PageParams) =>
  fetchPage<ApiAccessPhoto>(path(scope, "/access-photos"), params);

export const createAccessPhoto = (scope: PatientScope, body: AccessPhotoBody) =>
  api<ApiAccessPhoto>(path(scope, "/access-photos"), { method: "POST", body });

export const updateAccessPhoto = (
  scope: PatientScope,
  photoId: string,
  body: { subject?: string; note?: string; sent?: boolean },
) =>
  api<ApiAccessPhoto>(path(scope, `/access-photos${id(photoId)}`), {
    method: "PATCH",
    body,
  });

export const removeAccessPhoto = (scope: PatientScope, photoId: string) =>
  api<unknown>(path(scope, `/access-photos${id(photoId)}`), {
    method: "DELETE",
  });

/** A short-lived link to one photo; fetched when it is shown, never stored. */
export const accessPhotoLink = (scope: PatientScope, photoId: string) =>
  api<{ url: string; expiresIn: number }>(
    path(scope, `/access-photos${id(photoId)}/download-link`),
  );
