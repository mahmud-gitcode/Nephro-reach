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

/**
 * Getting-ready steps that are not paperwork.
 *
 * Kept apart from `TravelDocumentKey` because they are a different kind of
 * thing: a document is something a unit needs sent, these are things the
 * member does. Folding them into the document list would put "book a taxi"
 * in a panel about medical records.
 */
export type TravelPrepKey = "transportation" | "personal-items";

/**
 * A file the member attached to one of their travel documents.
 *
 * The bytes are NOT kept. Only the name, size and type are stored, and the
 * file itself lives as an object URL for as long as the tab is open — the
 * same shape the class media uploader already uses.
 *
 * Two reasons, and both survive the arrival of a backend. `localStorage`
 * holds about 5MB in total, so one photo of an insurance card would evict
 * somebody's treatment log. And a lab report sitting in browser storage is
 * a medical record at rest with nothing guarding it. When there is an API
 * to put files behind, `url` becomes the link it returns and nothing else
 * here changes.
 */
export interface TravelDocumentFile {
  id: string;
  /** Which checklist document this file belongs to. */
  key: TravelDocumentKey;
  fileName: string;
  sizeBytes: number;
  /** MIME type as the browser reported it. */
  contentType: string;
  attachedAt: string;
}

/**
 * Where they are going, in the parts a receiving unit needs.
 *
 * A single free-text line was enough to name a trip and useless for
 * arranging one: a coordinator ringing round for a chair needs a street and
 * a zip, not "Orlando".
 */
export interface TripAddress {
  street: string;
  city: string;
  /** Two-letter state code, as written on an address. */
  state: string;
  zip: string;
}

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

/**
 * When the request reached each rung of the ladder.
 *
 * `updatedAt` alone only ever remembers the last touch, so a timeline built
 * from it can date the step a request is on and nothing before it. A member
 * watching a request move wants to know when it moved, and a facility
 * answering "how long has this been sitting" needs the same record.
 */
export interface TripStatusEvent {
  status: TripStatus;
  /** Full ISO timestamp — the time of day matters here, not just the day. */
  at: string;
}

/**
 * Asking the facility to move the times they booked.
 *
 * Not an edit. Once a placement is confirmed the member cannot change it —
 * a chair at the other end is held by a unit that has no idea this app
 * exists, and letting someone rewrite their own times would desync what
 * they believe is booked from what is actually held.
 *
 * So this is a message with a shape: what they want instead, why, and a
 * record of when they asked. The facility answers it the same way it
 * answers the original request.
 */
export interface TimeChangeRequest {
  requestedAt: string;
  /** The slot they would rather have. */
  preferredTime: TimePreference;
  /** Which days, if that is what needs to move. Empty means times only. */
  preferredDays: Weekday[];
  /** Why, in their own words. This is the part a coordinator reads first. */
  note: string;
  /** Set by the facility once they have acted. Absent while it is open. */
  resolvedAt?: string;
  /** What the facility said back. */
  facilityReply?: string;
}

export interface TripRequest {
  id: string;

  /* ---- what the member asks for ---------------------------------------- */
  destination: TripAddress;
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
  /** Which non-paperwork preparations the member has done. */
  prepDone: TravelPrepKey[];
  /** Files attached against those documents. Names only — see the type. */
  documentFiles: TravelDocumentFile[];
  /** Anything the coordinator should know — access type, mobility, timing. */
  notes: string;

  /* ---- what the facility does with it ----------------------------------- */
  status: TripStatus;
  /** When the member submitted it. */
  submittedAt: string;
  /** Last time the facility touched it. */
  updatedAt: string;
  /** Every rung it has reached, oldest first. */
  statusHistory: TripStatusEvent[];
  /**
   * What the facility has told the member. Empty until they say something —
   * never pre-filled with a reassuring guess.
   */
  facilityNote: string;
  placement?: TripPlacement;
  /** An open or answered request to move the booked times. */
  timeChange?: TimeChangeRequest;
}
