/* ==========================================================================
   Travel dialysis — what actually happened in the chair, away from home
   --------------------------------------------------------------------------
   The trip request is what the member asked for and the placement is what
   the facility booked. Neither says how the treatment went.

   That gap matters more on the road than at home. A member treating at an
   unfamiliar unit has no history there: the staff do not know their usual
   post weight, their usual pull, or what their pressure normally runs. This
   log is the record they carry between those units, and the one they bring
   home to their own team afterwards.

   Every clinical field is optional and stored as typed. A member copying
   numbers off a machine in a strange unit should never be blocked by a
   format, and a log that refused "3.5 hrs" would simply go unwritten.
   ========================================================================== */

export interface TravelTreatment {
  id: string;
  /** The trip this happened on. */
  tripId: string;

  /** ISO `yyyy-mm-dd`. The only field that is required. */
  date: string;
  /** The unit that ran it, as the member knows it. */
  facilityName: string;

  /* --- as read off the machine, in the member's own units --------------- */
  preWeight?: string;
  postWeight?: string;
  /** Written as taken: "142/78". */
  bloodPressure?: string;
  /** "3.5 hrs", "4h", "210 min" — whatever the unit told them. */
  treatmentTime?: string;
  /** Litres removed. */
  fluidRemoved?: string;

  /**
   * Whether the treatment was finished.
   *
   * Its own field rather than an inference from the numbers: a run cut
   * short is the single most useful thing on this log for the team back
   * home, and a blank row would read as "not logged yet" instead.
   */
  completed: boolean;

  notes: string;
  savedAt: string;
}

/**
 * How the trip felt, written after the fact.
 *
 * Separate from the request's `notes`, which the coordinating facility
 * reads. These are the member's own, and capped so the box stays a
 * reflection rather than turning into a second medical record.
 */
export interface TravelReflection {
  tripId: string;
  body: string;
  updatedAt: string;
}

export const REFLECTION_MAX = 500;
