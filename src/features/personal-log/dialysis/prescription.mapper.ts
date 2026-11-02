/* ==========================================================================
   Dialysis prescription: wire shapes and transforms (Phase 7)
   --------------------------------------------------------------------------
   The member's dialysis type lives on the prescription
   (`/patients/:id/dialysis/prescription`). A 404 is "not set yet", never an
   error. Who may change it is the server's call (`memberCanEdit`, D16); the
   UI reads that flag and never works the rule out itself.
   ========================================================================== */

import {
  DEFAULT_MODALITY_SETTINGS,
  type DialysisModality,
  type ModalitySettings,
  type PdSchedule,
} from "./modality";

/** The server's modality enum. */
export type ApiModality =
  "CKD_NOT_ON_DIALYSIS" | "IN_CENTER_HD" | "HOME_HD" | "PD";

/** GET/POST/PATCH /dialysis/prescription (DialysisPrescriptionResponseDto). */
export type ApiPrescription = {
  patientId: string;
  modality: ApiModality;
  pdSchedule: PdSchedule | null;
  exchangesPerDay: number | null;
  pdFillVolumeMl: number | null;
  pdDwellMinutes: number | null;
  pdSolutions: string[];
  bloodFlowRate: number | null;
  dialysateFlowRate: number | null;
  dialysateBath: string | null;
  dryWeightKg: number | null;
  accessType: string | null;
  facilityOrganizationId: string | null;
  facilityName: string | null;
  nephrologistName: string | null;
  memberCanEdit: boolean;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
};

/** The fields the member's screens send (create and update). */
export type PrescriptionBody = {
  modality?: ApiModality;
  pdSchedule?: PdSchedule | null;
  exchangesPerDay?: number | null;
};

const TO_API: Record<DialysisModality, ApiModality> = {
  "in-center-hd": "IN_CENTER_HD",
  "home-hd": "HOME_HD",
  pd: "PD",
};

/** UI → server modality. */
export function toApiModality(modality: DialysisModality): ApiModality {
  return TO_API[modality];
}

/** Server → UI modality; null for "CKD, not on dialysis", which the UI has
 *  no tab for (shown read-only, never mapped onto one of the three). */
export function fromApiModality(
  modality: ApiModality,
): DialysisModality | null {
  if (modality === "IN_CENTER_HD") return "in-center-hd";
  if (modality === "HOME_HD") return "home-hd";
  if (modality === "PD") return "pd";
  return null;
}

/** What the member's screens know about the prescription. */
export type PrescriptionView = {
  /** False when the server answered 404: nothing recorded yet. */
  isSet: boolean;
  settings: ModalitySettings;
  /** The server's modality is "not on dialysis" (no tab for it). */
  notOnDialysis: boolean;
  /** The server's flag. True only when the server says so, or when no
   *  prescription exists yet (the first save is a POST the server judges). */
  memberCanEdit: boolean;
  facilityName: string | null;
  nephrologistName: string | null;
  /** Estimated dry weight from the prescription (D7: display only). */
  dryWeightKg: number | null;
  accessType: string | null;
};

/** No prescription yet (404): the default type, editable by the member. */
export const NOT_SET: PrescriptionView = {
  isSet: false,
  settings: DEFAULT_MODALITY_SETTINGS,
  notOnDialysis: false,
  memberCanEdit: true,
  facilityName: null,
  nephrologistName: null,
  dryWeightKg: null,
  accessType: null,
};

export function fromApiPrescription(raw: ApiPrescription): PrescriptionView {
  const modality = fromApiModality(raw.modality);
  const exchanges = raw.exchangesPerDay;
  return {
    isSet: true,
    settings: {
      modality: modality ?? DEFAULT_MODALITY_SETTINGS.modality,
      pdSchedule: raw.pdSchedule === "apd" ? "apd" : "capd",
      exchangesPerDay:
        typeof exchanges === "number" && exchanges >= 1 && exchanges <= 10
          ? exchanges
          : DEFAULT_MODALITY_SETTINGS.exchangesPerDay,
      updatedAt: raw.updatedAt,
    },
    notOnDialysis: modality === null,
    memberCanEdit: raw.memberCanEdit === true,
    facilityName: raw.facilityName,
    nephrologistName: raw.nephrologistName,
    dryWeightKg: raw.dryWeightKg,
    accessType: raw.accessType,
  };
}

/**
 * The body for a member's change. Only the fields that changed are sent;
 * the first save (no prescription yet) always carries the modality, which
 * the server requires on create.
 */
export function toPrescriptionBody(
  patch: Partial<
    Pick<ModalitySettings, "modality" | "pdSchedule" | "exchangesPerDay">
  >,
  current: ModalitySettings,
  isCreate: boolean,
): PrescriptionBody {
  const body: PrescriptionBody = {};
  if (patch.modality !== undefined || isCreate)
    body.modality = toApiModality(patch.modality ?? current.modality);
  if (patch.pdSchedule !== undefined) body.pdSchedule = patch.pdSchedule;
  if (patch.exchangesPerDay !== undefined) {
    const n = Math.round(patch.exchangesPerDay);
    if (n >= 1 && n <= 10) body.exchangesPerDay = n;
  }
  return body;
}
