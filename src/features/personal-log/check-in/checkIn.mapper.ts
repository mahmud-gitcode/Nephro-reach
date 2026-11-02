/* ==========================================================================
   Check-ins and clinic notices <-> the API (Phase 5)
   --------------------------------------------------------------------------
   `/patients/:id/check-ins`. A check-in has a server id; its day is
   `checkInDate` (one per day: a second POST for the day is 409
   `check_ins.check_in_exists`). The clinic notice is built by the server
   (reasons, hold to the clinic's next open day, delivery), from the linked
   dialysis center's settings; the member only says "tell my clinic"
   (`notifyClinic`). Optional fields are sent as null to clear them.
   ========================================================================== */

import type {
  ActivityLevel,
  Appetite,
  BetweenTreatmentCheckIn,
  CheckInFeeling,
  CheckInSeverity,
  EnergyLevel,
  RecoveryWindow,
} from "./checkIn.types";
import type { ClinicNotice, ClinicNoticeReason } from "./clinicNotice.types";

export type ApiClinicNotice = {
  reasons: ClinicNoticeReason[];
  raisedAt: string;
  deliverOn: string;
  status: "held" | "sending" | "delivered";
};

export type ApiCheckIn = {
  id: string;
  patientId: string;
  checkInDate: string;
  treatmentDay: boolean;
  feeling: CheckInFeeling;
  recoveryWindow: RecoveryWindow | null;
  backToNormalAt: string | null;
  energyLevel: EnergyLevel | null;
  resumedActivities: ActivityLevel | null;
  symptoms: string[];
  severity: CheckInSeverity;
  bloodPressure: string | null;
  weight: string | null;
  urineOutputMl: string | null;
  appetite: Appetite | null;
  missedTreatment: boolean;
  notes: string;
  clinicNotice: ApiClinicNotice | null;
  createdAt: string;
  updatedAt: string;
};

export type CheckInBody = {
  treatmentDay: boolean;
  feeling: CheckInFeeling;
  recoveryWindow: RecoveryWindow | null;
  backToNormalAt: string | null;
  energyLevel: EnergyLevel | null;
  resumedActivities: ActivityLevel | null;
  symptoms: string[];
  severity: CheckInSeverity;
  bloodPressure: string | null;
  weight: string | null;
  urineOutputMl: string | null;
  appetite: Appetite | null;
  missedTreatment: boolean;
  notes: string;
  notifyClinic?: boolean;
};

export function fromApiCheckIn(row: ApiCheckIn): BetweenTreatmentCheckIn {
  return {
    id: row.id,
    date: row.checkInDate,
    treatmentDay: row.treatmentDay,
    feeling: row.feeling,
    ...(row.recoveryWindow ? { recoveryWindow: row.recoveryWindow } : {}),
    ...(row.backToNormalAt ? { backToNormalAt: row.backToNormalAt } : {}),
    ...(row.energyLevel ? { energyLevel: row.energyLevel } : {}),
    ...(row.resumedActivities
      ? { resumedActivities: row.resumedActivities }
      : {}),
    symptoms: row.symptoms ?? [],
    severity: row.severity,
    ...(row.bloodPressure ? { bloodPressure: row.bloodPressure } : {}),
    ...(row.weight ? { weight: row.weight } : {}),
    ...(row.urineOutputMl ? { urineOutputMl: row.urineOutputMl } : {}),
    ...(row.appetite ? { appetite: row.appetite } : {}),
    missedTreatment: row.missedTreatment,
    notes: row.notes ?? "",
    savedAt: row.updatedAt,
  };
}

/** The server's notice on a check-in, as the screens read notices. */
export function noticeFromApi(row: ApiCheckIn): ClinicNotice | null {
  const notice = row.clinicNotice;
  if (!notice) return null;
  return {
    checkInDate: row.checkInDate,
    raisedOn: notice.raisedAt.slice(0, 10),
    raisedAt: notice.raisedAt,
    deliverOn: notice.deliverOn,
    reasons: notice.reasons,
    status: notice.status,
  };
}

const orNull = (value: string | undefined) =>
  value && value.trim() !== "" ? value.trim() : null;

/** Every field of the day; empty optional fields are sent as null so an
 *  edit clears them on the server. */
export function toCheckInBody(
  entry: BetweenTreatmentCheckIn,
  notifyClinic?: boolean,
): CheckInBody {
  return {
    treatmentDay: entry.treatmentDay,
    feeling: entry.feeling,
    recoveryWindow: entry.treatmentDay ? (entry.recoveryWindow ?? null) : null,
    backToNormalAt: entry.treatmentDay ? orNull(entry.backToNormalAt) : null,
    energyLevel: entry.treatmentDay ? (entry.energyLevel ?? null) : null,
    resumedActivities: entry.treatmentDay
      ? (entry.resumedActivities ?? null)
      : null,
    symptoms: entry.symptoms,
    severity: entry.severity,
    bloodPressure: orNull(entry.bloodPressure),
    weight: orNull(entry.weight),
    urineOutputMl: orNull(entry.urineOutputMl),
    appetite: entry.appetite ?? null,
    missedTreatment: entry.treatmentDay ? false : entry.missedTreatment,
    notes: entry.notes.trim(),
    ...(notifyClinic !== undefined ? { notifyClinic } : {}),
  };
}
