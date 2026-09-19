/* ==========================================================================
   The medication log — what the member actually records
   --------------------------------------------------------------------------
   Three separate things, kept apart because they are written at different
   moments and belong to different keys:

     doses    one status per scheduled dose per day, stamped when set
     refills  one flag per medication, so the care team can see who is low
     mood     one entry per day, how the member felt

   None of this existed before. The dose status was a coloured badge printed
   from seed data, the adherence chart was a fixed SVG path, and the mood
   form had a Save button wired to nothing — which is why the tracker at the
   bottom of the page was tracking nothing.
   ========================================================================== */

/**
 * `pending` is the honest starting state and is not the same as `missed`.
 * A dose due at 8pm is not missed at 9am, and colouring it red all day
 * would make an adherence figure that punishes members for the future.
 */
export type DoseStatus = "pending" | "taken" | "late" | "missed";

export interface DoseRecord {
  /** ISO `yyyy-mm-dd` of the day the dose was due. */
  date: string;
  /** Scheduled clock time, e.g. "08:00 AM". Part of the identity. */
  time: string;
  medication: string;
  status: DoseStatus;
  /**
   * When the member set the status, not when the dose was due. This is the
   * timestamp the Dose Schedule shows and the one a care team reads.
   */
  stampedAt?: string;
}

/** Medication name to whether the member says they are running low. */
export type RefillFlags = Record<string, boolean>;

/**
 * What the member noticed after one scheduled dose.
 *
 * Kept in its own record rather than on DoseRecord, because setting a dose
 * back to `pending` deletes that record — and a side effect must survive a
 * member changing their mind about whether they took the dose. The two are
 * also written at different moments: the status when the dose is taken, the
 * side effect hours later when something is felt.
 */
export type SideEffect =
  | "none"
  | "fatigue"
  | "nausea"
  | "dizziness"
  | "headache"
  | "cramps"
  | "itching"
  | "low-bp"
  | "upset-stomach"
  | "rash"
  | "other";

export interface SideEffectRecord {
  /** ISO `yyyy-mm-dd` of the day the dose was due. */
  date: string;
  /** Scheduled clock time. With date and medication, the dose's identity. */
  time: string;
  medication: string;
  effect: SideEffect;
  savedAt: string;
}

export interface MoodEntry {
  /** ISO `yyyy-mm-dd`. One entry per day. */
  date: string;
  /** 0 is the best of the five, matching the order shown on screen. */
  mood: number;
  notes: string;
  savedAt: string;
}

/** Red, amber, green — the band the adherence tracker colours by. */
export type AdherenceBand = "good" | "fair" | "poor";

export interface AdherenceSummary {
  taken: number;
  late: number;
  missed: number;
  /** Doses whose time has not passed yet. Excluded from the percentage. */
  pending: number;
  /** Taken and late over everything decided, 0-100. Null when nothing is. */
  percent: number | null;
  band: AdherenceBand | null;
}
