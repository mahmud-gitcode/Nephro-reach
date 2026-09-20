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
  /** Cleared when the clinic opens the thread. */
  unread: number;
  /** Raised by hand when a thread needs watching. Independent of unread. */
  flagged: boolean;
  /** Out of the inbox, not deleted — every filter but Archived hides it. */
  archived: boolean;
  patient: PatientProfile;
  messages: Message[];
};

/** Which slice of the inbox the list is showing. */
export type InboxFilter = "all" | "unread" | "flagged" | "archived";

export type MessagingState = {
  conversations: Conversation[];
};
