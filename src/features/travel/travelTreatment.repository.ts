/* ==========================================================================
   Travel treatment log and reflection: one function per server operation
   (Phase 8; ADR 0007)
   --------------------------------------------------------------------------
   Per trip: `/patients/:patientId/trips/:tripId/treatments` and
   `…/reflection`. No sample rows and no browser storage: the retired
   `nr:travel-treatments` and `nr:travel-reflections` stores are purged.
   Readings are free text on both sides (as typed off the machine): no unit
   is converted.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import { patientPath } from "@/features/profile/patientScope";
import type {
  TravelReflection,
  TravelTreatment,
} from "./travelTreatment.types";

export type ApiTravelTreatment = {
  id: string;
  tripId: string;
  date: string;
  facilityName: string;
  preWeight: string | null;
  postWeight: string | null;
  bloodPressure: string | null;
  treatmentTime: string | null;
  fluidRemoved: string | null;
  completed: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiTravelReflection = {
  tripId: string;
  body: string;
  updatedAt: string;
};

/** One trip's log, bounded (a trip has a handful of treatments). */
export const TREATMENT_WINDOW = 150;

const base = (scope: PatientScope, tripId: string) =>
  patientPath(scope, `/trips/${encodeURIComponent(tripId)}`);

const orUndefined = (value: string | null) => value ?? undefined;
const orNull = (value: string | undefined) =>
  value && value.trim() ? value.trim() : null;

export function toTreatment(raw: ApiTravelTreatment): TravelTreatment {
  return {
    id: raw.id,
    tripId: raw.tripId,
    date: raw.date.slice(0, 10),
    facilityName: raw.facilityName ?? "",
    preWeight: orUndefined(raw.preWeight),
    postWeight: orUndefined(raw.postWeight),
    bloodPressure: orUndefined(raw.bloodPressure),
    treatmentTime: orUndefined(raw.treatmentTime),
    fluidRemoved: orUndefined(raw.fluidRemoved),
    completed: raw.completed,
    notes: raw.notes ?? "",
    savedAt: raw.updatedAt,
  };
}

/** The fields the API takes (create and full replace on edit). */
export function toTreatmentBody(treatment: TravelTreatment) {
  return {
    date: treatment.date,
    facilityName: treatment.facilityName.trim(),
    preWeight: orNull(treatment.preWeight),
    postWeight: orNull(treatment.postWeight),
    bloodPressure: orNull(treatment.bloodPressure),
    treatmentTime: orNull(treatment.treatmentTime),
    fluidRemoved: orNull(treatment.fluidRemoved),
    completed: treatment.completed,
    notes: treatment.notes.trim(),
  };
}

export async function listTravelTreatments(
  scope: PatientScope,
  tripId: string,
): Promise<TravelTreatment[]> {
  const page = await fetchPage<ApiTravelTreatment>(
    `${base(scope, tripId)}/treatments`,
    { limit: TREATMENT_WINDOW },
  );
  return page.items.map(toTreatment);
}

/** 400 travel.treatment_date_in_future for a day not reached yet. */
export const addTravelTreatment = (
  scope: PatientScope,
  tripId: string,
  treatment: TravelTreatment,
) =>
  api<ApiTravelTreatment>(`${base(scope, tripId)}/treatments`, {
    method: "POST",
    body: toTreatmentBody(treatment),
  });

export const updateTravelTreatment = (
  scope: PatientScope,
  tripId: string,
  treatment: TravelTreatment,
) =>
  api<ApiTravelTreatment>(
    `${base(scope, tripId)}/treatments/${encodeURIComponent(treatment.id)}`,
    { method: "PUT", body: toTreatmentBody(treatment) },
  );

export const removeTravelTreatment = (
  scope: PatientScope,
  tripId: string,
  treatmentId: string,
) =>
  api<unknown>(
    `${base(scope, tripId)}/treatments/${encodeURIComponent(treatmentId)}`,
    { method: "DELETE" },
  );

/** null when nothing was written yet. */
export async function getTravelReflection(
  scope: PatientScope,
  tripId: string,
): Promise<TravelReflection | null> {
  const raw = await api<ApiTravelReflection | null>(
    `${base(scope, tripId)}/reflection`,
  );
  return raw
    ? { tripId: raw.tripId, body: raw.body, updatedAt: raw.updatedAt }
    : null;
}

export const saveTravelReflection = (
  scope: PatientScope,
  tripId: string,
  body: string,
) =>
  api<ApiTravelReflection>(`${base(scope, tripId)}/reflection`, {
    method: "PUT",
    body: { body },
  });
