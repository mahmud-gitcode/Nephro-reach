/* ==========================================================================
   Dialysis: one function per server operation (Phase 7; ADR 0007 §1)
   --------------------------------------------------------------------------
   `/patients/:id/dialysis/...` for the prescription, schedule periods,
   extra treatments, treatments, treatment medications and PD exchanges.
   No whole-array writes, no browser storage. The scope's patient id goes
   in the path; the office header only ever comes from the API client in
   office mode.
   ========================================================================== */

import { api, isApiError } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import { patientPath } from "@/features/profile/patientScope";
import type { ApiPrescription, PrescriptionBody } from "./prescription.mapper";
import type { ApiSchedulePeriod, SchedulePeriodBody } from "./schedule.mapper";
import type { ApiTreatment, TreatmentBody } from "./treatment.mapper";
import type { ApiExtraTreatment, ExtraTreatmentBody } from "./extraTreatments";
import type {
  ApiTreatmentMedication,
  TreatmentMedicationBody,
} from "../treatmentMedications.types";
import type { ApiPdExchange, PdExchangeBody } from "./pdExchange.mapper";

const dialysis = (scope: PatientScope, rest = "") =>
  patientPath(scope, `/dialysis${rest}`);
const id = (value: string) => `/${encodeURIComponent(value)}`;

/* Prescription ------------------------------------------------------------ */

export const PRESCRIPTION_NOT_FOUND = "dialysis.prescription_not_found";

/** The prescription, or null when none is recorded (404 = "not set"). */
export async function getPrescription(
  scope: PatientScope,
): Promise<ApiPrescription | null> {
  try {
    return await api<ApiPrescription>(dialysis(scope, "/prescription"));
  } catch (error) {
    if (isApiError(error, { status: 404 })) return null;
    throw error;
  }
}

export const createPrescription = (
  scope: PatientScope,
  body: PrescriptionBody,
) =>
  api<ApiPrescription>(dialysis(scope, "/prescription"), {
    method: "POST",
    body,
  });

export const updatePrescription = (
  scope: PatientScope,
  body: PrescriptionBody,
) =>
  api<ApiPrescription>(dialysis(scope, "/prescription"), {
    method: "PATCH",
    body,
  });

/* Schedule periods (not paged: a patient has a handful) ------------------- */

export async function listSchedulePeriods(
  scope: PatientScope,
): Promise<ApiSchedulePeriod[]> {
  const data = await api<ApiSchedulePeriod[]>(dialysis(scope, "/schedule"));
  return Array.isArray(data) ? data : [];
}

export const addSchedulePeriod = (
  scope: PatientScope,
  body: SchedulePeriodBody,
) =>
  api<ApiSchedulePeriod>(dialysis(scope, "/schedule"), {
    method: "POST",
    body,
  });

/* Extra treatments (no PATCH on the server) ------------------------------- */

export const listExtraTreatments = (scope: PatientScope, params: PageParams) =>
  fetchPage<ApiExtraTreatment>(dialysis(scope, "/extra-treatments"), params);

export const createExtraTreatment = (
  scope: PatientScope,
  body: ExtraTreatmentBody,
) =>
  api<ApiExtraTreatment>(dialysis(scope, "/extra-treatments"), {
    method: "POST",
    body,
  });

export const removeExtraTreatment = (scope: PatientScope, extraId: string) =>
  api<unknown>(dialysis(scope, `/extra-treatments${id(extraId)}`), {
    method: "DELETE",
  });

/* Treatments -------------------------------------------------------------- */

export const listTreatments = (scope: PatientScope, params: PageParams) =>
  fetchPage<ApiTreatment>(dialysis(scope, "/treatments"), params);

export const getTreatment = (scope: PatientScope, treatmentId: string) =>
  api<ApiTreatment>(dialysis(scope, `/treatments${id(treatmentId)}`));

export const createTreatment = (
  scope: PatientScope,
  body: Partial<TreatmentBody> & Pick<TreatmentBody, "treatmentDate">,
) =>
  api<ApiTreatment>(dialysis(scope, "/treatments"), { method: "POST", body });

export const updateTreatment = (
  scope: PatientScope,
  treatmentId: string,
  body: Partial<TreatmentBody>,
) =>
  api<ApiTreatment>(dialysis(scope, `/treatments${id(treatmentId)}`), {
    method: "PATCH",
    body,
  });

export const removeTreatment = (scope: PatientScope, treatmentId: string) =>
  api<unknown>(dialysis(scope, `/treatments${id(treatmentId)}`), {
    method: "DELETE",
  });

/** A short-lived link to the treatment's photo, asked for on demand. */
export const treatmentPhotoLink = (scope: PatientScope, treatmentId: string) =>
  api<{ url: string; expiresIn: number }>(
    dialysis(scope, `/treatments${id(treatmentId)}/photo`),
  );

/* Medications given during a treatment ----------------------------------- */

export const listTreatmentMedications = (
  scope: PatientScope,
  params: PageParams & { treatmentId?: string },
) => {
  const { treatmentId, ...page } = params;
  return fetchPage<ApiTreatmentMedication>(
    dialysis(scope, "/treatment-medications"),
    page,
    treatmentId ? { query: { treatmentId } } : {},
  );
};

export const createTreatmentMedication = (
  scope: PatientScope,
  body: TreatmentMedicationBody,
) =>
  api<ApiTreatmentMedication>(dialysis(scope, "/treatment-medications"), {
    method: "POST",
    body,
  });

export const updateTreatmentMedication = (
  scope: PatientScope,
  medicationId: string,
  body: Partial<TreatmentMedicationBody>,
) =>
  api<ApiTreatmentMedication>(
    dialysis(scope, `/treatment-medications${id(medicationId)}`),
    { method: "PATCH", body },
  );

export const removeTreatmentMedication = (
  scope: PatientScope,
  medicationId: string,
) =>
  api<unknown>(dialysis(scope, `/treatment-medications${id(medicationId)}`), {
    method: "DELETE",
  });

/* PD exchanges ------------------------------------------------------------ */

export const listPdExchanges = (scope: PatientScope, params: PageParams) =>
  fetchPage<ApiPdExchange>(dialysis(scope, "/pd-exchanges"), params);

export const createPdExchange = (scope: PatientScope, body: PdExchangeBody) =>
  api<ApiPdExchange>(dialysis(scope, "/pd-exchanges"), {
    method: "POST",
    body,
  });

export const updatePdExchange = (
  scope: PatientScope,
  exchangeId: string,
  body: Partial<PdExchangeBody>,
) =>
  api<ApiPdExchange>(dialysis(scope, `/pd-exchanges${id(exchangeId)}`), {
    method: "PATCH",
    body,
  });

export const removePdExchange = (scope: PatientScope, exchangeId: string) =>
  api<unknown>(dialysis(scope, `/pd-exchanges${id(exchangeId)}`), {
    method: "DELETE",
  });
