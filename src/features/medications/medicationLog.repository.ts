/* ==========================================================================
   The medication log: one function per server operation (ADR 0007 §1)
   --------------------------------------------------------------------------
   Doses and side effects are read for a window of days (the schedule reads
   one day); adherence is the server's summary, never computed from pages
   of raw doses.
   ========================================================================== */

import { api } from "@/lib/api/client";
import {
  fetchPage,
  nextPageParams,
  type Page,
  type PageParams,
} from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import { patientPath } from "@/features/profile/patientScope";
import type { AdherenceReport } from "./medicationLog.types";
import type {
  ApiDose,
  ApiSideEffect,
  SetDoseBody,
  SetSideEffectBody,
} from "./medicationLog.mapper";

const base = (scope: PatientScope) => patientPath(scope, "/medications");
const one = (scope: PatientScope, id: string) =>
  `${base(scope)}/${encodeURIComponent(id)}`;

export type DayWindow = { from: string; to: string };

/** At most this many pages of one window (150 a page): a day of doses is
 *  a few dozen rows, so hitting it means something is wrong upstream. */
const MAX_PAGES = 5;

async function wholeWindow<T>(path: string, window: DayWindow): Promise<T[]> {
  const items: T[] = [];
  let params: PageParams | undefined = { ...window, limit: 150 };
  for (let n = 0; params && n < MAX_PAGES; n += 1) {
    const result: Page<T> = await fetchPage<T>(path, params);
    items.push(...result.items);
    params = nextPageParams(result.pagination, params);
  }
  return items;
}

export const listDoses = (scope: PatientScope, window: DayWindow) =>
  wholeWindow<ApiDose>(`${base(scope)}/doses`, window);

export const listSideEffects = (scope: PatientScope, window: DayWindow) =>
  wholeWindow<ApiSideEffect>(`${base(scope)}/side-effects`, window);

export const setDose = (
  scope: PatientScope,
  medicationId: string,
  body: SetDoseBody,
) => api<ApiDose>(`${one(scope, medicationId)}/doses`, { method: "PUT", body });

export const setSideEffect = (
  scope: PatientScope,
  medicationId: string,
  body: SetSideEffectBody,
) =>
  api<ApiSideEffect>(`${one(scope, medicationId)}/side-effects`, {
    method: "PUT",
    body,
  });

/** The server's adherence over the last `days` days (ending today in the
 *  patient's time zone). */
export const getAdherence = (scope: PatientScope, days: number) =>
  api<AdherenceReport>(`${base(scope)}/adherence`, { query: { days } });
