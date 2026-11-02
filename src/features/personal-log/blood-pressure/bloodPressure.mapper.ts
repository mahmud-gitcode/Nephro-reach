/* ==========================================================================
   Blood pressure <-> the API (Phase 5)
   --------------------------------------------------------------------------
   `/patients/:id/blood-pressure`. The screens keep their labels
   ("Sitting", "Not taken", "Stage 1"); the API takes lower/kebab case. The
   day and time are `takenOn` (YYYY-MM-DD) and `takenAt` (HH:mm, 24-hour).
   A pulse of 0 means "not taken" and is sent as null. A photo is a file id
   (`photoFileId`), never image data.
   ========================================================================== */

import type {
  BpDraft,
  BpReading,
  BpStatus,
  MedicationState,
  Position,
} from "./bloodPressure";

type ApiPosition = "sitting" | "standing";
type ApiMedication = "taken" | "late" | "not-taken";
export type ApiBpStatus =
  "normal" | "elevated" | "stage-1" | "stage-2" | "crisis";

export type ApiBpReading = {
  id: string;
  patientId: string;
  takenOn: string;
  takenAt: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  status: ApiBpStatus;
  position: ApiPosition;
  symptoms: string;
  medicationState: ApiMedication;
  mood: string | null;
  notes: string;
  photoFileId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BpBody = {
  takenOn: string;
  takenAt: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  position: ApiPosition;
  symptoms: string;
  medicationState: ApiMedication;
  mood: string | null;
  notes: string;
  photoFileId?: string | null;
};

export type BpTrendPoint = {
  date: string;
  time: string;
  systolic: number;
  diastolic: number;
  medicationCompliance: number;
};

export type BpSummary = {
  from: string;
  to: string;
  readingCount: number;
  latest: ApiBpReading | null;
  averages: {
    systolic: number | null;
    diastolic: number | null;
    pulse: number | null;
  };
  categories: { status: ApiBpStatus; count: number }[];
  /** The last seven readings of the window, oldest first. */
  trend: BpTrendPoint[];
};

const POSITIONS: Record<Position, ApiPosition> = {
  Sitting: "sitting",
  Standing: "standing",
};
const MEDICATION: Record<MedicationState, ApiMedication> = {
  Taken: "taken",
  Late: "late",
  "Not taken": "not-taken",
};
const STATUS: Record<ApiBpStatus, BpStatus> = {
  normal: "Normal",
  elevated: "Elevated",
  "stage-1": "Stage 1",
  "stage-2": "Stage 2",
  crisis: "Crisis",
};
const POSITION_LABEL: Record<ApiPosition, Position> = {
  sitting: "Sitting",
  standing: "Standing",
};
const MEDICATION_LABEL: Record<ApiMedication, MedicationState> = {
  taken: "Taken",
  late: "Late",
  "not-taken": "Not taken",
};

export const statusLabel = (status: ApiBpStatus): BpStatus =>
  STATUS[status] ?? "Normal";

export function fromApiReading(row: ApiBpReading): BpReading {
  return {
    id: row.id,
    date: row.takenOn,
    time: row.takenAt,
    systolic: row.systolic,
    diastolic: row.diastolic,
    pulse: row.pulse ?? 0,
    position: POSITION_LABEL[row.position] ?? "Sitting",
    symptoms: row.symptoms ?? "",
    medication: MEDICATION_LABEL[row.medicationState] ?? "Taken",
    ...(row.mood ? { mood: row.mood } : {}),
    notes: row.notes ?? "",
    status: statusLabel(row.status),
    photoFileId: row.photoFileId ?? null,
  };
}

/** The body for a POST or PATCH. `photoFileId` is sent only when the
 *  photo changed: a file id to attach, or null to remove. */
export function toReadingBody(
  draft: BpDraft,
  photoFileId?: string | null,
): BpBody {
  return {
    takenOn: draft.date,
    takenAt: draft.time,
    systolic: draft.systolic,
    diastolic: draft.diastolic,
    pulse: draft.pulse > 0 ? draft.pulse : null,
    position: POSITIONS[draft.position],
    symptoms: draft.symptoms.trim(),
    medicationState: MEDICATION[draft.medication],
    mood: draft.mood ? draft.mood : null,
    notes: draft.notes.trim(),
    ...(photoFileId !== undefined ? { photoFileId } : {}),
  };
}
