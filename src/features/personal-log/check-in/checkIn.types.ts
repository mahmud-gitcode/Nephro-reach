/* ==========================================================================
   Beyond the Chair — the shape of one day
   --------------------------------------------------------------------------
   Beyond the Chair is what happens after the member leaves the dialysis
   chair and until the next treatment. Per the client architecture guide it
   is one of three separate areas, and the boundary is strict:

     Dialysis Treatment Log   what happened during dialysis
     Beyond the Chair         what happened after it, and between treatments
     Dialysis Management      what is planned, prescribed and coordinated

   This replaces the interval model, where a log belonged to "Treatment 1 ➔
   Treatment 2" and each entry was "Day 1 (Post-Tx)", "Day 2 (Interdialytic)".
   Members do not think in numbered gaps. They know what day it is.

   So a check-in belongs to a date. One per day, picked from a calendar.
   ========================================================================== */

/** How the day went, overall. Drives the colour on the day strip. */
export type CheckInFeeling = "good" | "okay" | "rough";

export type CheckInSeverity = "mild" | "moderate" | "severe";

/**
 * Recovery windows exactly as the architecture guide lists them.
 *
 * `still-not-recovered` is the important one and the one most trackers
 * leave out: a member who never got back to baseline before the next run
 * has no honest answer in a list that stops at "more than 6 hours".
 */
export type RecoveryWindow =
  "under-1h" | "1-2h" | "2-4h" | "4-6h" | "over-6h" | "still-not-recovered";

/** Fatigue / energy, low to high. Kept as a scale so it can be averaged. */
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

/** Whether they could get back to their usual day. */
export type ActivityLevel = "yes" | "partly" | "no";

export type Appetite = "good" | "fair" | "poor";

export interface BetweenTreatmentCheckIn {
  /** ISO `yyyy-mm-dd`. Also the identity: one check-in per day. */
  date: string;

  /**
   * Whether this day had a treatment on it. Without this the guide's
   * "how the patient typically feels on treatment versus non-treatment
   * days" cannot be answered, and that comparison is the single most
   * clinically useful thing this tab produces.
   */
  treatmentDay: boolean;

  feeling: CheckInFeeling;

  /* --- Recovery check-in. Only meaningful on a treatment day. ----------- */
  recoveryWindow?: RecoveryWindow;
  /** Clock time they felt back to normal, e.g. "18:30". */
  backToNormalAt?: string;
  energyLevel?: EnergyLevel;
  resumedActivities?: ActivityLevel;

  /* --- Between-treatment tracking --------------------------------------- */
  symptoms: string[];
  severity: CheckInSeverity;
  /** Between-treatment reading, as typed: "128/74". */
  bloodPressure?: string;
  /** Between-treatment weight, in the member's own unit. */
  weight?: string;
  /** 24-hour urine output in mL, for members still making urine. */
  urineOutputMl?: string;
  appetite?: Appetite;

  /**
   * A treatment that should have happened and did not. Its own field, not a
   * symptom: a missed run is the single most useful thing a care team can
   * see, and burying it in a symptom list would hide it.
   */
  missedTreatment: boolean;

  notes: string;
  /** When the entry was written, which is not always the day it is about. */
  savedAt: string;
}
