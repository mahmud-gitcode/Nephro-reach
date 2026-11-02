/* ==========================================================================
   Dialysis treatments: wire shapes and transforms (Phase 7)
   --------------------------------------------------------------------------
   The form's state goes to `CreateDialysisTreatmentDto` here, and the
   server's row comes back as the `DialysisLogEntry` the pages already draw.

   - Times are sent as the raw HH:mm the time inputs hold, never the
     12-hour label (`clock12` is display only); a missed session sends null.
   - Weights are kilograms only (D7 open): a number with up to two decimals.
     Anything with letters ("165 lb") is refused here and never sent; the
     server computes preWeightKg/postWeightKg from the text.
   - Post-treatment symptoms and severity are sent (they were collected and
     dropped before: INT-12).
   - careTeam has no server field (D8 open): it is not sent.
   - Derived labels (attendance, duration, weightDiff, displayDate...) are
     rebuilt from the server's fields, never stored.
   ========================================================================== */

import type { DialysisLogEntry } from "../dialysisTreatmentData";
import {
  clock12,
  displayDate,
  durationLabel,
  type SessionStatus,
} from "./treatmentLog";

type Severity = "Yes" | "No" | "Mild" | "Moderate" | "Severe";
type YesNo = "Yes" | "No";
type HdModality = "in-center-hd" | "home-hd";

export const PRE_SYMPTOMS = [
  "Fatigue",
  "Swelling",
  "Shortness of Breath",
  "Nausea",
  "Itching",
  "Headache",
  "Dizziness",
  "Muscle Cramps",
  "Chest Pain",
  "Anxiety",
  "Poor Appetite",
] as const;
export const INTRA_SYMPTOMS = [
  "Nausea",
  "Vomiting",
  "Headache",
  "Chest Discomfort",
  "Itching",
] as const;
export const POST_SYMPTOMS = [
  "Fatigue",
  "Dizziness",
  "Nausea",
  "Headache",
  "Muscle Cramps",
  "Low BP",
  "Itching",
  "Swelling",
  "Better / No Symptoms",
] as const;
const PRE_SEVERITY_KEYS = [
  "Fatigue",
  "Nausea",
  "Pain",
  "Shortness of Breath",
  "Overall",
];
const POST_SEVERITY_KEYS = ["Fatigue", "Nausea", "Pain", "Overall"];
const SEVERITIES: Severity[] = ["Yes", "No", "Mild", "Moderate", "Severe"];

export type ApiTreatmentSymptoms = {
  preSymptoms?: string[];
  preOtherSymptom?: string | null;
  preSeverity?: Record<string, number>;
  sequentialFluidRemoval?: boolean;
  cramping?: Severity;
  dizziness?: Severity;
  swelling?: Severity;
  shortnessOfBreath?: Severity;
  lowBp?: Severity;
  highBp?: Severity;
  fatigue?: Severity;
  intraSymptoms?: string[];
  intraOtherSymptom?: string | null;
  intraNotes?: string | null;
  postSymptoms?: string[];
  postOtherSymptom?: string | null;
  postSeverity?: Record<string, number>;
  recoveryTime?: Severity;
};

/** One treatment as the API returns it (DialysisTreatmentResponseDto). */
export type ApiTreatment = {
  id: string;
  patientId: string;
  treatmentDate: string;
  modality: "CKD_NOT_ON_DIALYSIS" | "IN_CENTER_HD" | "HOME_HD" | "PD";
  status: "ATTENDED" | "MISSED" | "RESCHEDULED";
  makeupForDate: string | null;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  location: string | null;
  arrivedLate: boolean;
  endedEarly: boolean;
  preWeight: string | null;
  postWeight: string | null;
  preWeightKg: number | null;
  postWeightKg: number | null;
  preBloodPressure: string | null;
  postBloodPressure: string | null;
  preHeartRate: string | null;
  postHeartRate: string | null;
  temperature: string | null;
  ufGoal: string | null;
  fluidRemoved: string | null;
  extraRecoveryMinutes: number | null;
  preOverallFeel: number | null;
  postOverallFeel: number | null;
  feeling: string | null;
  medsTakenAsPrescribed: boolean | null;
  symptoms: ApiTreatmentSymptoms | null;
  complications: string | null;
  notes: string;
  photoFileId: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TreatmentBody = {
  treatmentDate: string;
  modality: "IN_CENTER_HD" | "HOME_HD";
  status: "ATTENDED" | "MISSED" | "RESCHEDULED";
  makeupForDate: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  arrivedLate: boolean;
  endedEarly: boolean;
  preWeight: string | null;
  postWeight: string | null;
  preBloodPressure: string | null;
  postBloodPressure: string | null;
  preHeartRate: string | null;
  postHeartRate: string | null;
  fluidRemoved: string | null;
  extraRecoveryMinutes: number | null;
  preOverallFeel: number;
  postOverallFeel: number;
  medsTakenAsPrescribed: boolean;
  symptoms: ApiTreatmentSymptoms;
  notes: string;
};

/** What the treatment form holds when the member saves. */
export type TreatmentDraft = {
  date: string;
  modality: HdModality;
  status: SessionStatus;
  makeupFor?: string;
  /** HH:mm from the time inputs. */
  startTime: string;
  endTime: string;
  arrivedLate: YesNo;
  endedEarly: YesNo;
  extraRecovery: YesNo;
  extraRecoveryMinutes?: number;
  preOverallFeel: number;
  postOverallFeel: number;
  medsTakenPrescribed: YesNo;
  preSymptoms: string[];
  preSeverity: Record<string, number>;
  sequentialFluidRemoval: YesNo;
  cramping: Severity;
  dizziness: Severity;
  swelling: Severity;
  shortnessOfBreath: Severity;
  lowBp: Severity;
  highBp: Severity;
  fatigue: Severity;
  recoveryTime: Severity;
  intraSymptoms: string[];
  intraNotes: string;
  postSymptoms: string[];
  postSeverity: Record<string, number>;
  /** Kilograms as typed. */
  preWeight: string;
  postWeight: string;
  /** Litres, worked out from the two weights; null when not both. */
  fluidRemoved: number | null;
  preBloodPressure: string;
  preHeartRate: string;
  bloodPressurePost: string;
  heartRatePost: string;
  otherNotes: string;
};

/* --------------------------------------------------------------------------
   Weights: kilograms only (D7 open; backend guard B7-1)
   -------------------------------------------------------------------------- */

const KG_ONLY = /^\d{1,3}([.,]\d{1,2})?$/;

/** True when a typed weight is acceptable: empty, or a kg number. */
export function isKgWeight(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === "" || KG_ONLY.test(trimmed);
}

/** The weight text sent: digits with a dot, or null when empty. Throws for
 *  anything else (letters, units): it is never sent. */
export function kgWeightText(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (!KG_ONLY.test(trimmed))
    throw new TreatmentValidationError("weight-not-kg");
  return trimmed.replace(",", ".");
}

export type TreatmentProblem = "weight-not-kg" | "time-not-hhmm";

export class TreatmentValidationError extends Error {
  constructor(readonly problem: TreatmentProblem) {
    super(problem);
    this.name = "TreatmentValidationError";
  }
}

/** The first problem with a draft, or null. */
export function treatmentDraftProblem(
  draft: Pick<
    TreatmentDraft,
    "preWeight" | "postWeight" | "status" | "startTime" | "endTime"
  >,
): TreatmentProblem | null {
  if (!isKgWeight(draft.preWeight) || !isKgWeight(draft.postWeight))
    return "weight-not-kg";
  if (draft.status !== "missed") {
    for (const t of [draft.startTime, draft.endTime])
      if (t && !HH_MM.test(t)) return "time-not-hhmm";
  }
  return null;
}

/* --------------------------------------------------------------------------
   Form → server
   -------------------------------------------------------------------------- */

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

function orNull(value: string | undefined | null, max = 20): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function inEnum(list: readonly string[], values: string[]) {
  const known = values.filter((v) => list.includes(v));
  const other = values.find((v) => !list.includes(v)) ?? null;
  return { known, other: other ? other.slice(0, 120) : null };
}

function severityMap(source: Record<string, number>, keys: string[]) {
  const out: Record<string, number> = {};
  for (const key of keys) {
    const n = Number(source[key]);
    if (Number.isFinite(n)) out[key] = Math.min(10, Math.max(0, Math.round(n)));
  }
  return out;
}

function feel(n: number): number {
  return Math.min(5, Math.max(1, Math.round(Number(n) || 3)));
}

export function toTreatmentBody(draft: TreatmentDraft): TreatmentBody {
  const missed = draft.status === "missed";
  const home = draft.modality === "home-hd";
  const problem = treatmentDraftProblem(draft);
  if (problem) throw new TreatmentValidationError(problem);
  const pre = inEnum(PRE_SYMPTOMS, draft.preSymptoms);
  const intra = inEnum(INTRA_SYMPTOMS, draft.intraSymptoms);
  const post = inEnum(POST_SYMPTOMS, draft.postSymptoms);
  const extra =
    draft.extraRecovery === "Yes" && draft.extraRecoveryMinutes
      ? Math.min(240, Math.max(0, Math.round(draft.extraRecoveryMinutes)))
      : null;
  return {
    treatmentDate: draft.date,
    modality: home ? "HOME_HD" : "IN_CENTER_HD",
    status: missed
      ? "MISSED"
      : draft.status === "rescheduled"
        ? "RESCHEDULED"
        : "ATTENDED",
    makeupForDate:
      draft.status === "rescheduled" && draft.makeupFor
        ? draft.makeupFor
        : null,
    startTime: missed || !draft.startTime ? null : draft.startTime,
    endTime: missed || !draft.endTime ? null : draft.endTime,
    location: null,
    arrivedLate: !home && draft.arrivedLate === "Yes",
    endedEarly: draft.endedEarly === "Yes",
    preWeight: kgWeightText(draft.preWeight),
    postWeight: kgWeightText(draft.postWeight),
    preBloodPressure: orNull(draft.preBloodPressure),
    postBloodPressure: orNull(draft.bloodPressurePost),
    preHeartRate: orNull(draft.preHeartRate),
    postHeartRate: orNull(draft.heartRatePost),
    fluidRemoved:
      draft.fluidRemoved === null ? null : String(draft.fluidRemoved),
    extraRecoveryMinutes: extra,
    preOverallFeel: feel(draft.preOverallFeel),
    postOverallFeel: feel(draft.postOverallFeel),
    medsTakenAsPrescribed: draft.medsTakenPrescribed === "Yes",
    symptoms: {
      preSymptoms: pre.known,
      preOtherSymptom: pre.other,
      preSeverity: severityMap(draft.preSeverity, PRE_SEVERITY_KEYS),
      sequentialFluidRemoval: draft.sequentialFluidRemoval === "Yes",
      cramping: draft.cramping,
      dizziness: draft.dizziness,
      swelling: draft.swelling,
      shortnessOfBreath: draft.shortnessOfBreath,
      lowBp: draft.lowBp,
      highBp: draft.highBp,
      fatigue: draft.fatigue,
      intraSymptoms: intra.known,
      intraOtherSymptom: intra.other,
      intraNotes: orNull(draft.intraNotes, 4000),
      postSymptoms: post.known,
      postOtherSymptom: post.other,
      postSeverity: severityMap(draft.postSeverity, POST_SEVERITY_KEYS),
      recoveryTime: draft.recoveryTime,
    },
    notes: draft.otherNotes.trim().slice(0, 4000),
  };
}

/** A scheduled day the member says they missed: nothing else to fill. */
export function missedTreatmentBody(
  date: string,
  modality: HdModality,
): Pick<
  TreatmentBody,
  "treatmentDate" | "modality" | "status" | "startTime" | "endTime"
> {
  return {
    treatmentDate: date,
    modality: modality === "home-hd" ? "HOME_HD" : "IN_CENTER_HD",
    status: "MISSED",
    startTime: null,
    endTime: null,
  };
}

/* --------------------------------------------------------------------------
   Server → the entry the pages draw
   -------------------------------------------------------------------------- */

const sev = (value: unknown): Severity =>
  SEVERITIES.includes(value as Severity) ? (value as Severity) : "No";
const yn = (value: boolean | null | undefined, fallback: YesNo): YesNo =>
  value === true ? "Yes" : value === false ? "No" : fallback;

function withOther(list: string[] | undefined, other?: string | null) {
  return other ? [...(list ?? []), other] : [...(list ?? [])];
}

export function fromApiTreatment(raw: ApiTreatment): DialysisLogEntry {
  const s = raw.symptoms ?? {};
  const date = raw.treatmentDate.slice(0, 10);
  const modality: HdModality =
    raw.modality === "HOME_HD" ? "home-hd" : "in-center-hd";
  const status: SessionStatus =
    raw.status === "MISSED"
      ? "missed"
      : raw.status === "RESCHEDULED"
        ? "rescheduled"
        : "attended";
  const missed = status === "missed";
  const arrivedLate = yn(raw.arrivedLate, "No");
  const endedEarly = yn(raw.endedEarly, "No");
  const diff =
    raw.preWeightKg !== null && raw.postWeightKg !== null
      ? Math.round((raw.preWeightKg - raw.postWeightKg) * 10) / 10
      : null;
  const intraSymptoms = withOther(s.intraSymptoms, s.intraOtherSymptom);
  const cramping = sev(s.cramping);
  const dizziness = sev(s.dizziness);
  const swelling = sev(s.swelling);
  const shortnessOfBreath = sev(s.shortnessOfBreath);
  return {
    id: raw.id,
    date,
    displayDate: displayDate(date),
    isDialysisDay: true,
    treatmentType:
      modality === "home-hd" ? "Home hemodialysis" : "In-center hemodialysis",
    modality,
    status,
    ...(raw.makeupForDate ? { makeupFor: raw.makeupForDate.slice(0, 10) } : {}),
    startTime: raw.startTime ? clock12(raw.startTime) : "",
    endTime: raw.endTime ? clock12(raw.endTime) : "",
    duration:
      raw.durationMinutes === null ? "" : durationLabel(raw.durationMinutes),
    location: raw.location ?? "",
    /* D8: not stored by the server. */
    careTeam: "",
    postWeightSummary: raw.postWeight ? `${raw.postWeight} kg` : "",
    attendance: missed
      ? "Missed"
      : endedEarly === "Yes"
        ? "Ended Early"
        : arrivedLate === "Yes"
          ? "Arrived Late"
          : "Attended",
    attended: missed ? "No" : "Yes",
    arrivedLate,
    endedEarly,
    missedTreatments: missed ? 1 : 0,
    rescheduled: status === "rescheduled" ? "Yes" : "No",
    preOverallFeel: raw.preOverallFeel ?? 3,
    preSymptoms: withOther(s.preSymptoms, s.preOtherSymptom),
    preSeverity: { ...(s.preSeverity ?? {}) },
    hadIntraSymptoms:
      intraSymptoms.length > 0 ||
      [cramping, dizziness, swelling, shortnessOfBreath].some(
        (v) => v !== "No",
      ),
    sequentialFluidRemoval: s.sequentialFluidRemoval ? "Yes" : "No",
    cramping,
    dizziness,
    swelling,
    shortnessOfBreath,
    lowBp: sev(s.lowBp),
    highBp: sev(s.highBp),
    fatigue: sev(s.fatigue),
    intraSymptoms,
    intraSeverity: {},
    intraNotes: s.intraNotes ?? "",
    postSymptoms: withOther(s.postSymptoms, s.postOtherSymptom),
    postSeverity: { ...(s.postSeverity ?? {}) },
    postOverallFeel: raw.postOverallFeel ?? 3,
    recoveryTime: sev(s.recoveryTime),
    medsTakenPrescribed: yn(raw.medsTakenAsPrescribed, "Yes"),
    extraRecovery: raw.extraRecoveryMinutes ? "Yes" : "No",
    ...(raw.extraRecoveryMinutes
      ? { extraRecoveryMinutes: raw.extraRecoveryMinutes }
      : {}),
    fluidRemoved: raw.fluidRemoved ? `${raw.fluidRemoved} L` : "",
    preWeight: raw.preWeight ?? "",
    postWeight: raw.postWeight ?? "",
    weightDiff: diff === null ? "" : `-${diff} kg`,
    preBloodPressure: raw.preBloodPressure ?? "",
    preHeartRate: raw.preHeartRate ?? "",
    bloodPressurePost: raw.postBloodPressure ?? "",
    heartRatePost: raw.postHeartRate ?? "",
    /* Medications given are their own rows, linked by treatment id. */
    medicationsGiven: [],
    otherNotes: raw.notes ?? "",
    hasPhoto: !!raw.photoFileId,
  };
}
