/* ==========================================================================
   The medication log: what the member actually records (Phase 6)
   --------------------------------------------------------------------------
   Two things, both on the API and both keyed by the medication's server
   id, the day and the scheduled time (HH:mm):

     doses         one status per scheduled dose per day, stamped by the
                   server when set (`PUT …/medications/:id/doses`)
     side effects  what the member felt after one dose
                   (`PUT …/medications/:id/side-effects`)

   The refill flag lives on the medication itself, and the adherence
   figures are the server's (`GET …/medications/adherence`). The mood
   section was retired (D8 open): nothing here stores it.
   ========================================================================== */

/**
 * `pending` is the honest starting state and is not the same as `missed`.
 * A dose due at 8pm is not missed at 9am. On the API, pending is "no
 * record": setting a dose back to pending deletes it (the server keeps the
 * revision).
 */
export type DoseStatus = "pending" | "taken" | "late" | "missed";

export interface DoseRecord {
  medicationId: string;
  /** The medication's name, for display ("" when it is not on the list). */
  medication: string;
  /** ISO `yyyy-mm-dd` of the day the dose was due. */
  date: string;
  /** Scheduled time, HH:mm (24-hour). Part of the identity. */
  time: string;
  status: DoseStatus;
  /** When the status was set, by the server's clock. */
  stampedAt?: string;
}

/**
 * What the member noticed after one scheduled dose. Kept apart from the
 * dose, because setting a dose back to `pending` deletes the dose record —
 * and a side effect must survive a member changing their mind.
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
  medicationId: string;
  /** For display ("" when it is not on the list). */
  medication: string;
  /** ISO `yyyy-mm-dd` of the day the dose was due. */
  date: string;
  /** Scheduled time, HH:mm. With date and medication id, the identity. */
  time: string;
  effect: SideEffect;
  savedAt: string;
}

/** Red, amber, green: the band the adherence tracker colours by. */
export type AdherenceBand = "good" | "fair" | "poor";

/** The server's `AdherenceSummaryResponseDto`. */
export interface AdherenceSummary {
  taken: number;
  late: number;
  missed: number;
  /** Scheduled doses not decided yet. Excluded from the percentage. */
  pending: number;
  /** Taken and late over everything decided, 0-100. Null when nothing is. */
  percent: number | null;
  band: AdherenceBand | null;
}

/** The server's `GetMedicationAdherenceResponseDto`. */
export interface AdherenceReport {
  from: string;
  to: string;
  days: number;
  overall: AdherenceSummary;
  /** Oldest first. */
  byDay: { date: string; summary: AdherenceSummary }[];
  medications: {
    medicationId: string;
    name: string;
    scheduledPerDay: number;
    summary: AdherenceSummary;
  }[];
  missedDoses: {
    threshold: number;
    windowDays: number;
    count: number;
    triggered: boolean;
    medicationIds: string[];
  };
}
