import type {
  Attachment,
  CareTeamContact,
  Conversation,
  InboxFilter,
  MemberInboxFilter,
  Message,
  MessageAuthor,
  MessageCategory,
  MessagingState,
  PatientProfile,
} from "./messaging.types";

/* ==========================================================================
   Messaging — the rules
   --------------------------------------------------------------------------
   Pure: the inbox filters, search, counts and labels the two inboxes share.
   Since Phase 11 the threads, their state and the after-hours reply are the
   server's; nothing here decides what is stored, and no thread is ever
   found by a person's name.
   ========================================================================== */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** The most recent message in a thread, or null for an empty one: the
 *  loaded messages when the thread is open, else the list's last message. */
export function lastMessage(conversation: Conversation): Message | null {
  return (
    conversation.messages[conversation.messages.length - 1] ??
    conversation.last ??
    null
  );
}

/**
 * Threads in inbox order: most recently active first.
 *
 * Sorts a copy — the caller is usually rendering the array it passed in,
 * and a sort in place would mutate React state.
 */
export function sortByRecent(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => {
    const aAt = lastMessage(a)?.sentAt ?? "";
    const bAt = lastMessage(b)?.sentAt ?? "";
    return bAt.localeCompare(aAt);
  });
}

/** Search covers the member and the words in the thread, not just names. */
export function searchConversations(
  conversations: Conversation[],
  query: string,
): Conversation[] {
  const q = query.trim().toLowerCase();
  if (!q) return conversations;
  return conversations.filter((conversation) => {
    if (conversation.memberName.toLowerCase().includes(q)) return true;
    /* Both ends of the thread are searchable, because which end the reader
       thinks of it by depends on which end they are: the clinic hunts for
       "Sandra", the member for "dietitian". */
    if (conversation.contact.name.toLowerCase().includes(q)) return true;
    if (conversation.contact.role.toLowerCase().includes(q)) return true;
    /* Chart fields only exist on threads the clinic holds; a member-only
       thread simply has nothing to match here. */
    const patient = conversation.patient;
    if (patient) {
      if (patient.program?.toLowerCase().includes(q)) return true;
      if (patient.mrn?.includes(q)) return true;
    }
    /* Only what is loaded: the open thread's messages, else the last one
       the list carries (the API has no message search). */
    const loaded = conversation.messages.length
      ? conversation.messages
      : conversation.last
        ? [conversation.last]
        : [];
    return loaded.some((message) => message.body.toLowerCase().includes(q));
  });
}

export function totalUnread(conversations: Conversation[]): number {
  return conversations.reduce((sum, c) => sum + c.unread, 0);
}

/* --------------------------------------------------------------------------
   Formatting
   -------------------------------------------------------------------------- */

/** The day part of an ISO timestamp, in the reader's own timezone. */
function localDayKey(iso: string): string {
  const date = new Date(iso);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/**
 * The separator above a run of messages: Today, Yesterday, or the date.
 *
 * Compared by calendar day rather than by elapsed hours — a message sent at
 * 11pm is "Yesterday" at 1am, not "2 hours ago".
 */
export function dayLabel(iso: string, now: number, isEs = false): string {
  const key = localDayKey(iso);
  const today = localDayKey(new Date(now).toISOString());
  const yesterday = localDayKey(new Date(now - DAY).toISOString());

  if (key === today) return isEs ? "Hoy" : "Today";
  if (key === yesterday) return isEs ? "Ayer" : "Yesterday";
  return new Date(iso).toLocaleDateString(isEs ? "es" : undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** The clock time on a bubble. */
export function timeLabel(iso: string, isEs = false): string {
  return new Date(iso).toLocaleTimeString(isEs ? "es" : undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * The "when" beside a thread in the inbox.
 *
 * An inbox is scanned, not measured: for something that arrived this
 * morning the clinic wants 10:24 AM, because that is what they will say on
 * the phone — "you wrote at twenty past ten". "2h" makes them do the
 * subtraction. Past today the clock stops mattering and the day takes
 * over, then the date.
 */
export function inboxTimeLabel(
  iso: string,
  now: number,
  /** The member inbox in Spanish; the clinic's is English only. */
  isEs = false,
): string {
  const locale = isEs ? "es" : undefined;
  const key = localDayKey(iso);
  if (key === localDayKey(new Date(now).toISOString()))
    return timeLabel(iso, isEs);
  if (key === localDayKey(new Date(now - DAY).toISOString()))
    return isEs ? "Ayer" : "Yesterday";
  const elapsed = now - new Date(iso).getTime();
  if (elapsed < 7 * DAY) {
    return new Date(iso).toLocaleDateString(locale, { weekday: "long" });
  }
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** The short elapsed form. Kept for anywhere a compact figure is wanted. */
export function relativeLabel(iso: string, now: number, isEs = false): string {
  const elapsed = now - new Date(iso).getTime();
  if (elapsed < MINUTE) return isEs ? "Justo ahora" : "Just now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h`;
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}d`;
  return new Date(iso).toLocaleDateString(isEs ? "es" : undefined, {
    day: "numeric",
    month: "short",
  });
}

/** Messages split into consecutive runs that share a calendar day. */
export function groupByDay(
  messages: Message[],
): Array<{ dayKey: string; messages: Message[] }> {
  const groups: Array<{ dayKey: string; messages: Message[] }> = [];
  for (const message of messages) {
    const dayKey = localDayKey(message.sentAt);
    const current = groups[groups.length - 1];
    if (current && current.dayKey === dayKey) current.messages.push(message);
    else groups.push({ dayKey, messages: [message] });
  }
  return groups;
}

/** Up to two letters for the avatar. "Mary S. Johnson" gives MJ. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

/* --------------------------------------------------------------------------
   The inbox filters
   -------------------------------------------------------------------------- */

/**
 * The slice of the inbox a filter shows.
 *
 * Archived is an exit, not a label: every other filter hides an archived
 * thread, and Archived shows nothing else. That is what makes archiving
 * worth doing — a thread that still turned up under All would just be a
 * thread with an extra word on it.
 */
export function applyFilter(
  conversations: Conversation[],
  filter: InboxFilter,
  /**
   * A thread to keep listed even when it no longer matches.
   *
   * Opening an unread thread marks it read, which would drop it out of the
   * Unread filter the instant it was clicked — the row vanishes from under
   * the pointer while its contents fill the pane beside it. Every mail
   * client keeps the open message visible until the reader leaves it, and
   * so does this.
   */
  keepId?: string | null,
): Conversation[] {
  const matches = (c: Conversation) => {
    if (c.id === keepId) return true;
    if (filter === "archived") return c.archived;
    if (c.archived) return false;
    if (filter === "unread") return c.unread > 0;
    if (filter === "flagged") return c.flagged;
    return true;
  };
  return conversations.filter(matches);
}

/**
 * The number beside each filter.
 *
 * Unread counts *threads*, not messages — the list shows one row per
 * thread, so a count of messages would not match what it sits beside.
 */
export function filterCounts(conversations: Conversation[]) {
  /* No `keepId` here on purpose: the badge counts what is in the folder,
     not what the list happens to be showing. */
  return {
    all: applyFilter(conversations, "all").length,
    unread: applyFilter(conversations, "unread").length,
    flagged: applyFilter(conversations, "flagged").length,
    archived: applyFilter(conversations, "archived").length,
  };
}

/** Threads holding an attachment that is loaded, for the list's paperclip. */
export function hasAttachment(conversation: Conversation): boolean {
  return (
    conversation.messages.some((message) => message.attachment) ||
    Boolean(conversation.last?.attachment)
  );
}

/**
 * @deprecated The office's threads come from its own inbox route now
 * (`useOfficeInbox`), already limited to that office by the server. Kept
 * for the read-only `useMessages` adapter's consumers (Reports) until they
 * move; with no name it filters nothing.
 */
export function clinicConversations(
  conversations: Conversation[],
  officeName?: string,
): Conversation[] {
  return conversations.filter(
    (c) =>
      c.contact.kind === "facility" &&
      (officeName === undefined || c.contact.name === officeName),
  );
}

/** A patient's message to the office still waiting for a reply. */
export type OpenQuestion = {
  conversationId: string;
  memberName: string;
  mrn?: string;
  program?: string;
  /** The message itself, or the attachment's name when it was only a file. */
  body: string;
  /** ISO 8601 */
  sentAt: string;
};

/**
 * The questions an office owes an answer to: every thread in its inbox
 * whose last word is the patient's. Longest waiting first.
 *
 * What Reports' "Open Questions" counts (client, 2026-10-09: the count must
 * lead to the question). A member's private "questions for my care team"
 * list is not here — it is never sent anywhere.
 */
export function openQuestions(
  conversations: Conversation[],
  officeName?: string,
): OpenQuestion[] {
  return clinicConversations(conversations, officeName)
    .filter((c) => !c.archived)
    .flatMap((c) => {
      const last = lastMessage(c);
      if (!last || last.author !== "member") return [];
      return [
        {
          conversationId: c.id,
          memberName: c.memberName,
          mrn: c.patient?.mrn,
          program: c.patient?.program,
          body: last.body || last.attachment?.name || "",
          sentAt: last.sentAt,
        },
      ];
    })
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
}

/**
 * The slice of the member inbox a filter shows.
 *
 * Same archive rule as the clinic — an archived thread appears under
 * Archived and nowhere else — over a subject axis rather than a state one.
 * `keepId` does the same job it does clinic-side: the open thread stays put
 * until the reader leaves it.
 */
export function applyMemberFilter(
  conversations: Conversation[],
  filter: MemberInboxFilter,
  keepId?: string | null,
): Conversation[] {
  const matches = (c: Conversation) => {
    if (c.id === keepId) return true;
    if (filter === "archived") return c.archived;
    if (c.archived) return false;
    if (filter === "all") return true;
    return c.category === filter;
  };
  return conversations.filter(matches);
}

/** The number beside each member filter. Counts the folder, not the view. */
export function memberFilterCounts(conversations: Conversation[]) {
  return {
    all: applyMemberFilter(conversations, "all").length,
    "care-team": applyMemberFilter(conversations, "care-team").length,
    appointments: applyMemberFilter(conversations, "appointments").length,
    archived: applyMemberFilter(conversations, "archived").length,
  };
}

/* --------------------------------------------------------------------------
   Deprecated: the prototype's browser store
   --------------------------------------------------------------------------
   No screen calls these any more (Phase 11: the server starts and finds
   threads by id). They stay, pure and unused by the app, only because the
   OFFICE lane's tests (features/clinic/newPatientFlows.test.ts) still
   import them; delete them when those tests move to the API.
   -------------------------------------------------------------------------- */

/** @deprecated See above. A thread's id from who it is between. */
export function conversationIdFor(memberName: string, contactName: string) {
  const slug = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `${slug(memberName)}--${slug(contactName)}`;
}

/** @deprecated See above. */
export type NewConversation = {
  memberName: string;
  contact: CareTeamContact;
  category: MessageCategory;
  /** The chart, for a thread the clinic holds. */
  patient?: PatientProfile;
  body: string;
  author: MessageAuthor;
  attachment?: Attachment;
};

/**
 * @deprecated See above.
 * "New Message": writes into the member's existing thread with that
 * contact if there is one (bringing it back from the archive), otherwise
 * opens a new thread. Either way the message lands where both sides
 * already look. Nothing at all is not a message.
 */
export function startConversation(
  state: MessagingState,
  input: NewConversation,
  now: number,
): MessagingState {
  if (!input.body.trim() && !input.attachment) return state;
  const existing = state.conversations.find(
    (c) =>
      c.memberName === input.memberName &&
      c.contact.name === input.contact.name,
  );
  const id =
    existing?.id ?? conversationIdFor(input.memberName, input.contact.name);
  const withThread: MessagingState = existing
    ? {
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, archived: false } : c,
        ),
      }
    : {
        conversations: [
          ...state.conversations,
          {
            id,
            memberName: input.memberName,
            contact: input.contact,
            category: input.category,
            unread: 0,
            flagged: false,
            archived: false,
            ...(input.patient ? { patient: input.patient } : {}),
            messages: [],
          },
        ],
      };
  return appendMessage(
    withThread,
    id,
    input.body,
    input.author,
    now,
    input.attachment,
  );
}

function appendMessage(
  state: MessagingState,
  conversationId: string,
  body: string,
  author: MessageAuthor,
  now: number,
  attachment?: Attachment,
): MessagingState {
  const text = body.trim();
  /* An attachment with no words is still a message worth sending; words
     with no attachment obviously are. Nothing at all is not. */
  if (!text && !attachment) return state;

  return {
    conversations: state.conversations.map((conversation) =>
      conversation.id === conversationId
        ? {
            ...conversation,
            /* The clinic replying is also the clinic having read it. */
            unread: author === "clinic" ? 0 : conversation.unread + 1,
            messages: [
              ...conversation.messages,
              {
                id: `${conversationId}-${now}`,
                author,
                body: text,
                sentAt: new Date(now).toISOString(),
                ...(attachment ? { attachment } : {}),
              },
            ],
          }
        : conversation,
    ),
  };
}
