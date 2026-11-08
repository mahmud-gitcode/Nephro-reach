/* ==========================================================================
   Messaging — the shapes
   --------------------------------------------------------------------------
   A member, a caregiver and an office read the same thread from two ends;
   only the panes around it differ. Since Phase 11 the threads are the
   server's (`/patients/:id/conversations`, `/organizations/:id/
   conversations`): messaging.mappers.ts turns its answers into these
   shapes, and nothing here is stored in the browser.
   ========================================================================== */

/**
 * Which end of the thread wrote a message: the patient's side (the patient
 * or a caregiver) or the office's side (staff, or NephroReach's automated
 * reply). The server's `side`, MEMBER or OFFICE.
 */
export type MessageAuthor = "clinic" | "member";

/**
 * A file on a message.
 *
 * On a sent message it is the server's file record (`id`), downloaded
 * through the message's short-lived attachment link. In the composer it is
 * the picked `file`, uploaded through /files when the message is sent; it
 * never becomes a data: URL and is never stored.
 */
export type Attachment = {
  /** The server's file id, on a message that was sent. */
  id?: string;
  name: string;
  sizeLabel: string;
  contentType?: string;
  /** The picked file, before it is sent (composer only). */
  file?: File;
  /** An object URL for the picked image's preview (composer only). */
  previewUrl?: string;
};

export type Message = {
  id: string;
  author: MessageAuthor;
  body: string;
  /** ISO 8601, always UTC. */
  sentAt: string;
  attachment?: Attachment;
  /** Sent by NephroReach itself, not a person: the after-hours
   *  confirmation (client, 2026-10-07), written by the server. */
  automated?: boolean;
  /** Written by a caregiver on the patient's behalf (D1: every caregiver
   *  action is recorded under the caregiver's own identity). */
  byCaregiver?: boolean;
};

/**
 * The care-team side of a thread, as the member sees it: always an office
 * (members write to an office's inbox, never to a person).
 *
 * `kind` drives the avatar alone — a facility gets a building mark, a
 * person their initials — and nothing else branches on it.
 */
export type CareTeamContact = {
  name: string;
  /** Shown under the name: "Your Dialysis Care Team". */
  role: string;
  kind: "facility" | "person";
  /** Presence dot. The API has no presence, so it is never set now. */
  online?: boolean;
};

/**
 * What a thread is *about*, as the member files it.
 *
 * The clinic sorts its inbox by state — unread, flagged, archived — because
 * it is working a queue. A member has no queue; they have a handful of
 * standing conversations, so their filters are subjects.
 */
export type MessageCategory = "care-team" | "appointments";

/** The chart-side facts shown in the office's rail while a thread is open.
 *  The inbox carries only the name and MRN; the rest is the office
 *  roster's, so every field may be missing. */
export type PatientProfile = {
  dob?: string;
  age?: number;
  mrn?: string;
  phone?: string;
  email?: string;
  program?: string;
  enrolledOn?: string;
  status?: string;
  careTeam?: string;
  notes?: string;
};

export type Conversation = {
  id: string;
  /** The patient this thread is with ("First Last"; office view). */
  memberName: string;
  /** The care-team end of the thread — the office the member writes to. */
  contact: CareTeamContact;
  /** The member's own filing of the thread. */
  category: MessageCategory;
  /** Unread messages for the side reading it. */
  unread: number;
  /** Raised by hand when a thread needs watching (office side only). */
  flagged: boolean;
  /** Out of the inbox, not deleted — every filter but Archived hides it. */
  archived: boolean;
  /** The chart behind the member end (office view). */
  patient?: PatientProfile;
  /** The messages loaded for this thread, oldest first. A list row holds
   *  none: the thread reads its messages page by page when it opens. */
  messages: Message[];
  /** The newest message, as the list sends it. */
  last?: Message | null;
  /** The server's ids, for links and calls (never a name). */
  patientId?: string;
  organizationId?: string;
  subject?: string | null;
};

/** Which slice of the clinic inbox the list is showing. */
export type InboxFilter = "all" | "unread" | "flagged" | "archived";

/** Which slice of the member inbox the list is showing. */
export type MemberInboxFilter =
  "all" | "care-team" | "appointments" | "archived";

/** @deprecated The prototype's whole-store shape. Kept only for the OFFICE
 *  lane's pure tests until they move off it; no screen uses it. */
export type MessagingState = {
  conversations: Conversation[];
};
