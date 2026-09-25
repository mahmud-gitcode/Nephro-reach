import { seedConversations } from "./messaging.seed";
import type {
  Attachment,
  Conversation,
  InboxFilter,
  MemberInboxFilter,
  Message,
  MessageAuthor,
  MessagingState,
} from "./messaging.types";

/* ==========================================================================
   Messaging — the rules
   --------------------------------------------------------------------------
   Everything here is pure: state in, state out, with `now` passed rather
   than read. That is what lets the seed produce "10:24 today" on whatever
   day the demo is opened, and lets the tests assert a timestamp without
   racing the clock.
   ========================================================================== */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export { seedConversations };

export function seedState(now: number): MessagingState {
  return { conversations: seedConversations(now) };
}

/** The most recent message in a thread, or null for an empty one. */
export function lastMessage(conversation: Conversation): Message | null {
  return conversation.messages[conversation.messages.length - 1] ?? null;
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
      if (patient.program.toLowerCase().includes(q)) return true;
      if (patient.mrn.includes(q)) return true;
    }
    return conversation.messages.some((message) =>
      message.body.toLowerCase().includes(q),
    );
  });
}

export function totalUnread(conversations: Conversation[]): number {
  return conversations.reduce((sum, c) => sum + c.unread, 0);
}

/**
 * Adds a message to a thread.
 *
 * Returns the state unchanged for an empty or whitespace-only body, so a
 * stray Enter cannot post a blank bubble. The id carries the timestamp
 * because two messages in the same thread in the same millisecond is not a
 * thing a person can do.
 */
export function appendMessage(
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

/** Opening a thread clears its unread count. */
export function markRead(
  state: MessagingState,
  conversationId: string,
): MessagingState {
  return {
    conversations: state.conversations.map((conversation) =>
      conversation.id === conversationId && conversation.unread !== 0
        ? { ...conversation, unread: 0 }
        : conversation,
    ),
  };
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
export function dayLabel(iso: string, now: number): string {
  const key = localDayKey(iso);
  const today = localDayKey(new Date(now).toISOString());
  const yesterday = localDayKey(new Date(now - DAY).toISOString());

  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** The clock time on a bubble. */
export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
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
export function inboxTimeLabel(iso: string, now: number): string {
  const key = localDayKey(iso);
  if (key === localDayKey(new Date(now).toISOString())) return timeLabel(iso);
  if (key === localDayKey(new Date(now - DAY).toISOString()))
    return "Yesterday";
  const elapsed = now - new Date(iso).getTime();
  if (elapsed < 7 * DAY) {
    return new Date(iso).toLocaleDateString(undefined, { weekday: "long" });
  }
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** The short elapsed form. Kept for anywhere a compact figure is wanted. */
export function relativeLabel(iso: string, now: number): string {
  const elapsed = now - new Date(iso).getTime();
  if (elapsed < MINUTE) return "Just now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h`;
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}d`;
  return new Date(iso).toLocaleDateString(undefined, {
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

/** Flips one field on one thread, leaving every other object identical. */
function updateConversation(
  state: MessagingState,
  conversationId: string,
  change: (conversation: Conversation) => Conversation,
): MessagingState {
  return {
    conversations: state.conversations.map((conversation) =>
      conversation.id === conversationId ? change(conversation) : conversation,
    ),
  };
}

export function toggleFlag(
  state: MessagingState,
  conversationId: string,
): MessagingState {
  return updateConversation(state, conversationId, (c) => ({
    ...c,
    flagged: !c.flagged,
  }));
}

export function setArchived(
  state: MessagingState,
  conversationId: string,
  archived: boolean,
): MessagingState {
  return updateConversation(state, conversationId, (c) => ({ ...c, archived }));
}

/**
 * Puts a thread back in the unread pile.
 *
 * One, not the number that were unread before it was opened — that figure
 * is gone, and "1" is the honest claim that something here needs another
 * look. A thread with no messages cannot be unread at all.
 */
export function markUnread(
  state: MessagingState,
  conversationId: string,
): MessagingState {
  return updateConversation(state, conversationId, (c) =>
    c.messages.length === 0 || c.unread > 0 ? c : { ...c, unread: 1 },
  );
}

/** Threads holding at least one attachment, for the list's paperclip. */
export function hasAttachment(conversation: Conversation): boolean {
  return conversation.messages.some((message) => message.attachment);
}

/* --------------------------------------------------------------------------
   Whose inbox is this
   --------------------------------------------------------------------------
   One store holds every thread on the platform, and each portal takes the
   slice it is entitled to. Keeping the split here rather than in the
   screens is what stops the two inboxes drifting: there is one definition
   of "the clinic's threads" and one of "mine", and both are testable
   without rendering anything.
   -------------------------------------------------------------------------- */

/**
 * The threads the clinic works.
 *
 * Only the ones addressed to the facility itself. A member writing to their
 * dietitian is not clinic queue work, and listing it there would put the
 * same member on screen five times over — the clinic inbox is one row per
 * patient, and that is the property this preserves.
 */
export function clinicConversations(
  conversations: Conversation[],
): Conversation[] {
  return conversations.filter((c) => c.contact.kind === "facility");
}

/** The threads belonging to one member, whichever end they are addressed to. */
export function memberConversations(
  conversations: Conversation[],
  memberName: string,
): Conversation[] {
  return conversations.filter((c) => c.memberName === memberName);
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

/**
 * The distinct care-team people behind a member's threads.
 *
 * Drives the Care Team rail. Derived from the threads rather than stored
 * beside them, so the rail can never list somebody the member has no way to
 * reach. The facility itself is left out: it is the header of the thread
 * below, not a person on the team.
 */
export function careTeamFor(conversations: Conversation[]) {
  const seen = new Map<string, Conversation["contact"]>();
  for (const conversation of conversations) {
    if (conversation.contact.kind !== "person") continue;
    if (!seen.has(conversation.contact.name)) {
      seen.set(conversation.contact.name, conversation.contact);
    }
  }
  return [...seen.values()];
}
