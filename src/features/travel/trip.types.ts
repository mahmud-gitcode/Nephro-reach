/* ==========================================================================
   Travel dialysis — a trip request
   --------------------------------------------------------------------------
   A member going away still needs dialysis while they are away, and they
   cannot book it themselves. The client brief sets out the workflow:

     patient submits a request
       -> their home facility is alerted
       -> the facility coordinates transient dialysis somewhere else
       -> the facility updates the request
       -> the patient sees the confirmed facility and times here

   So this is a request, not a booking. Everything under `placement` is the
   facility's to fill in, which is why nothing on the member's screen can
   write it: showing them a control that looks like it confirms their own
   chair would be the cruellest button in the app.
   ========================================================================== */

/** The statuses named in the brief, in the order a trip moves through them. */
export type TripStatus =
  | "submitted"
  | "facility-reviewing"
  | "records-sent"
  | "placement-pending"
  | "confirmed"
  | "closed";

/** Mon–Sun, as the member's usual schedule is written. */
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

/** When in the day they would rather be treated. */
export type TimePreference =
  "morning" | "midday" | "afternoon" | "evening" | "any";

/**
 * The paperwork a receiving unit asks for.
 *
 * These are ticked, not uploaded. Lab results, medication lists and insurance
 * cards are protected health information, and this app has no backend, no
 * encryption at rest and no audit trail to hold them in. The checklist tells
 * the member what to have ready and lets the coordinator see what is done;
 * the files move when there is somewhere safe for them to land.
 */
export type TravelDocumentKey =
  | "treatment-orders"
  | "recent-labs"
  | "medication-list"
  | "insurance"
  | "emergency-contact"
  | "other";

export interface EmergencyContact {
  name: string;
  phone: string;
  /** "Daughter", "Neighbour" — who they are to the member. */
  relationship: string;
}

export interface InsuranceDetails {
  /** Plan or carrier name, as written on the card. */
  plan: string;
  memberId: string;
}

/** One treatment the receiving unit has actually booked. */
export interface ConfirmedTreatment {
  id: string;
  /** ISO `yyyy-mm-dd`. */
  date: string;
  /** "07:00", as the unit gave it. */
  time: string;
}

/**
 * What the facility fills in once a chair is arranged. Absent until then —
 * an empty placement is honest; a half-filled one implies a booking.
 */
export interface TripPlacement {
  facilityName: string;
  address: string;
  phone: string;
  treatments: ConfirmedTreatment[];
}

export interface TripRequest {
  id: string;

  /* ---- what the member asks for ---------------------------------------- */
  destination: string;
  /** ISO `yyyy-mm-dd`. */
  departDate: string;
  returnDate: string;
  /** How many treatments they need while away. */
  treatmentsNeeded: number;
  /** Which days suit them at the other end. Empty means no preference. */
  preferredDays: Weekday[];
  preferredTime: TimePreference;
  /** A number the receiving facility can reach them on. */
  contactPhone: string;
  emergencyContact: EmergencyContact;
  insurance: InsuranceDetails;
  /** Which documents the member has ready. */
  documentsReady: TravelDocumentKey[];
  /** Anything the coordinator should know — access type, mobility, timing. */
  notes: string;

  /* ---- what the facility does with it ----------------------------------- */
  status: TripStatus;
  /** When the member submitted it. */
  submittedAt: string;
  /** Last time the facility touched it. */
  updatedAt: string;
  /**
   * What the facility has told the member. Empty until they say something —
   * never pre-filled with a reassuring guess.
   */
  facilityNote: string;
  placement?: TripPlacement;
}
