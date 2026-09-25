/* ==========================================================================
   Messaging — the shapes
   --------------------------------------------------------------------------
   Kept apart from the clinic screen that first uses it. A member, a
   provider and a caregiver all need the same thread; only the sidebar
   around it differs, so the data lives here and each portal brings its own
   view.
   ========================================================================== */

/**
 * Who wrote a message.
 *
 * Deliberately the *role*, not a user id. Frontend-only for now means
 * there is no account behind the clinic side of a thread, and a thread
 * still has to know which bubble is ours and which is theirs. When a server
 * arrives this becomes an author id and the rendering rule stays the same.
 */
export type MessageAuthor = "clinic" | "member";

/**
 * A file on a message.
 *
 * The size is a label rather than a byte count because nothing here
 * uploads yet — there is no file to measure. When uploads land this becomes
 * bytes plus a formatter, and the bubble stops caring either way.
 */
export type Attachment = {
  name: string;
  sizeLabel: string;
};

export type Message = {
  id: string;
  author: MessageAuthor;
  body: string;
  /** ISO 8601, always UTC. */
  sentAt: string;
  attachment?: Attachment;
};

/**
 * The care-team side of a thread.
 *
 * A thread always has two ends. The clinic screen only ever looks at the
 * member end, so it went unnamed until the member portal needed the other
 * one: from a chair, "Nurse Wilson" and "Sunshine Dialysis Center" are
 * different correspondents, not one clinic.
 *
 * `kind` drives the avatar alone — a facility gets a building mark, a
 * person their initials — and nothing else branches on it.
 */
export type CareTeamContact = {
  name: string;
  /** Shown under the name: "Dialysis Nurse", "Your Dialysis Care Team". */
  role: string;
  kind: "facility" | "person";
  /** Presence dot in the member inbox. Absent means unknown, not offline. */
  online?: boolean;
};

/**
 * What a thread is *about*, as the member files it.
 *
 * The clinic sorts its inbox by state — unread, flagged, archived — because
 * it is working a queue. A member has no queue; they have a handful of
 * standing conversations, so their filters are subjects. The two axes are
 * independent and a thread carries both.
 */
export type MessageCategory = "care-team" | "appointments";

/** The chart-side facts shown in the right rail while a thread is open. */
export type PatientProfile = {
  dob: string;
  age: number;
  mrn: string;
  phone: string;
  email: string;
  program: string;
  enrolledOn: string;
  status: string;
  careTeam: string;
  notes: string;
};

export type Conversation = {
  id: string;
  /** The member this thread is with. */
  memberName: string;
  /** The care-team end of the thread — who the member is talking to. */
  contact: CareTeamContact;
  /** The member's own filing of the thread. Ignored by the clinic inbox. */
  category: MessageCategory;
  /** Cleared when the thread's owner opens it. */
  unread: number;
  /** Raised by hand when a thread needs watching. Independent of unread. */
  flagged: boolean;
  /** Out of the inbox, not deleted — every filter but Archived hides it. */
  archived: boolean;
  /**
   * The chart behind the member end.
   *
   * Only threads the clinic holds carry one: a member messaging their
   * dietitian directly is not a thread anybody works from a chart, and
   * inventing a duplicate profile on each of those would mean five copies
   * of one person drifting apart. The clinic inbox only lists threads that
   * have it.
   */
  patient?: PatientProfile;
  messages: Message[];
};

/** Which slice of the clinic inbox the list is showing. */
export type InboxFilter = "all" | "unread" | "flagged" | "archived";

/** Which slice of the member inbox the list is showing. */
export type MemberInboxFilter =
  "all" | "care-team" | "appointments" | "archived";

export type MessagingState = {
  conversations: Conversation[];
};
