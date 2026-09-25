"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CalendarPlus,
  CircleHelp,
  Download,
  FileText,
  FileUp,
  Headset,
  MessageSquarePlus,
  Paperclip,
  Phone,
  PhoneCall,
  Search,
  Send,
  SquarePen,
} from "lucide-react";

import { PageTitle } from "@/components/layout/PageTitle";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  buttonStyles,
  Card,
  EmptyState,
  Input,
  Skeleton,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";
import * as rules from "./messaging.rules";
import { useMessages } from "./useMessages";
import { DEMO_MEMBER } from "./messaging.seed";
import type {
  Attachment,
  CareTeamContact,
  Conversation,
  MemberInboxFilter,
} from "./messaging.types";

/* ==========================================================================
   Member messages
   --------------------------------------------------------------------------
   The same three panes as the clinic screen and the same store behind them,
   read from the other end: the list is the people on my care team rather
   than the patients in a queue, and the right rail answers "who can I
   reach" rather than "who am I talking to".

   The inversion worth naming is authorship. Clinic-side a `clinic` message
   is mine; here a `member` message is. Nothing else about the thread
   changes, which is why both screens share `messaging.rules` rather than
   each carrying a copy with the sides swapped.

   Below `xl` the rail folds under the thread; below `lg` the list and the
   thread take turns, with a back button returning to the list.
   ========================================================================== */

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const FILTERS: Array<{ id: MemberInboxFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "care-team", label: "Care Team" },
  { id: "appointments", label: "Appointments" },
  { id: "archived", label: "Archived" },
];

/** The centre's own number, shown where a member may need a human now. */
const URGENT_PHONE = "(803) 555-0187";

/**
 * A contact's mark.
 *
 * A facility gets a building glyph rather than initials: "RDC" reads as a
 * person with an odd name, and a member's mental model of the centre is a
 * building, not a colleague.
 */
function ContactAvatar({
  contact,
  className,
}: {
  contact: CareTeamContact;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-pill",
        "bg-surface-brand-subtle text-label-sm text-brand-600",
        className,
      )}
    >
      {contact.kind === "facility" ? (
        <Building2 className="h-4 w-4" />
      ) : (
        rules.initials(contact.name)
      )}
    </span>
  );
}

/**
 * The presence dot.
 *
 * `online` is optional on a contact and absent means unknown, so an absent
 * value renders nothing rather than claiming somebody is away.
 */
function PresenceDot({
  contact,
  className,
}: {
  contact: CareTeamContact;
  className?: string;
}) {
  if (contact.online === undefined) return null;
  return (
    <span
      role="img"
      aria-label={contact.online ? "Online" : "Offline"}
      className={cn(
        "h-2.5 w-2.5 shrink-0 rounded-pill ring-2 ring-surface",
        contact.online ? "bg-chart-positive" : "bg-line",
        className,
      )}
    />
  );
}

function AttachmentCard({
  attachment,
  onLight,
}: {
  attachment: Attachment;
  /* Inside a brand-filled bubble the usual borders vanish, so the card
     switches to a translucent white rather than inventing a second
     colour scheme. */
  onLight: boolean;
}) {
  return (
    <div
      className={cn(
        "mt-stack-sm flex items-center gap-inline-md rounded-control p-inset-xs",
        onLight
          ? "border border-line bg-surface"
          : "border border-white/25 bg-white/10",
      )}
    >
      <FileText
        aria-hidden="true"
        className={cn("h-5 w-5 shrink-0", onLight && "text-fg-muted")}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-label-sm">{attachment.name}</span>
        <span
          className={cn(
            "block text-caption",
            onLight ? "text-fg-muted" : "text-white/75",
          )}
        >
          {attachment.sizeLabel}
        </span>
      </span>
      <Button
        {...notBuiltYet("Downloading an attachment")}
        variant="neutral"
        appearance="fill-stroke"
        size="small"
        iconOnly
        className="h-7 min-h-0 w-7 min-w-0 shrink-0 p-0 [&_svg]:h-4 [&_svg]:w-4"
        aria-label={`Download ${attachment.name}`}
      >
        <Download aria-hidden="true" />
      </Button>
    </div>
  );
}

function ConversationRow({
  conversation,
  active,
  now,
  onSelect,
}: {
  conversation: Conversation;
  active: boolean;
  now: number;
  onSelect: () => void;
}) {
  const last = rules.lastMessage(conversation);
  const ref = useRef<HTMLButtonElement>(null);

  /* Arrow keys can move the selection past the edge of a scrolled list.
     `nearest` keeps a row that is already visible exactly where it is. */
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <li>
      <button
        ref={ref}
        type="button"
        onClick={onSelect}
        aria-current={active ? "true" : undefined}
        className={cn(
          "flex w-full cursor-pointer items-start gap-inline-md rounded-control p-inset-sm text-left",
          "transition-colors duration-150 ease-standard",
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
          active ? "bg-surface-sunken" : "hover:bg-surface-sunken",
        )}
      >
        <span className="relative shrink-0">
          <ContactAvatar contact={conversation.contact} />
          <PresenceDot
            contact={conversation.contact}
            className="absolute right-0 bottom-0"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-inline-md">
            <span className="truncate text-label-md text-fg">
              {conversation.contact.name}
            </span>
            {last ? (
              <span className="shrink-0 text-caption text-fg-muted">
                {rules.inboxTimeLabel(last.sentAt, now)}
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 flex items-center gap-inline-md">
            <span className="min-w-0 flex-1 truncate text-body-sm text-fg-muted">
              {last
                ? `${last.author === "member" ? "You: " : ""}${last.body}`
                : "No messages yet"}
            </span>
            {rules.hasAttachment(conversation) ? (
              <Paperclip
                aria-label="Has an attachment"
                className="h-3.5 w-3.5 shrink-0 text-fg-muted"
              />
            ) : null}
            {conversation.unread > 0 ? (
              <Badge tone="danger" variant="solid">
                {conversation.unread}
              </Badge>
            ) : null}
          </span>
        </span>
      </button>
    </li>
  );
}

function Inbox({
  conversations,
  activeId,
  filter,
  onFilterChange,
  query,
  onQueryChange,
  now,
  onSelect,
  onVisibleChange,
}: {
  conversations: Conversation[];
  activeId: string | null;
  filter: MemberInboxFilter;
  onFilterChange: (next: MemberInboxFilter) => void;
  query: string;
  onQueryChange: (next: string) => void;
  now: number;
  onSelect: (conversation: Conversation) => void;
  /** Reports the list as ordered on screen, so ↑/↓ can walk it. */
  onVisibleChange: (ids: string[]) => void;
}) {
  const counts = rules.memberFilterCounts(conversations);
  const visible = useMemo(
    () =>
      rules.sortByRecent(
        rules.searchConversations(
          rules.applyMemberFilter(conversations, filter, activeId),
          query,
        ),
      ),
    [conversations, filter, query, activeId],
  );

  /* The parent owns the keyboard, but only the list knows its own order —
     filter, then search, then sort. Reported after paint so the arrow keys
     always walk what is actually on screen. */
  const visibleIds = visible.map((c) => c.id).join(",");
  useEffect(() => {
    onVisibleChange(visibleIds ? visibleIds.split(",") : []);
  }, [visibleIds, onVisibleChange]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Button
        {...notBuiltYet("Starting a new message")}
        className="mb-stack-sm w-full shrink-0"
      >
        <SquarePen aria-hidden="true" />
        New Message
      </Button>

      {/* A toggle group, not a tablist: `role="tab"` obliges a matching
          `tabpanel` and arrow-key roving, and the list below is a list,
          not a panel. `aria-pressed` says the true thing without the debt. */}
      <div
        role="group"
        aria-label="Message filters"
        className="mb-stack-sm flex shrink-0 flex-wrap gap-inline-xs"
      >
        {FILTERS.map((entry) => {
          const selected = entry.id === filter;
          return (
            <button
              key={entry.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onFilterChange(entry.id)}
              className={cn(
                "flex cursor-pointer items-center gap-inline-xs rounded-pill px-inset-xs py-1 text-label-sm",
                "transition-colors duration-150 ease-standard",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                selected
                  ? "bg-brand-600 text-white"
                  : "bg-surface-sunken text-fg-secondary hover:bg-line",
              )}
            >
              {entry.label}
              <span
                className={cn(
                  "tabular-nums",
                  selected ? "text-white/80" : "text-fg-muted",
                )}
              >
                {counts[entry.id]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative mb-stack-sm shrink-0">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-fg-muted"
        />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search messages..."
          aria-label="Search messages"
          className="pl-9"
        />
      </div>

      {visible.length === 0 ? (
        <p className="px-inset-sm py-inset-md text-body-sm text-fg-muted">
          {query
            ? "No conversations match that search."
            : "Nothing in this folder."}
        </p>
      ) : (
        <ol className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {visible.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              active={conversation.id === activeId}
              now={now}
              onSelect={() => onSelect(conversation)}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function Thread({
  conversation,
  now,
  draft,
  onDraftChange,
  unreadAtOpen,
  sending,
  onSend,
  onBack,
}: {
  conversation: Conversation;
  now: number;
  /** Owned by the parent, so switching threads does not lose what was typed. */
  draft: string;
  onDraftChange: (next: string) => void;
  /** How many messages were unread when this thread was opened. */
  unreadAtOpen: number;
  sending: boolean;
  onSend: (body: string) => void;
  onBack: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const groups = useMemo(
    () => rules.groupByDay(conversation.messages),
    [conversation.messages],
  );

  /* The id of the first message still unread when the thread was opened.
     Everything from there down gets the "new" rule above it, and it stays
     put while the thread is open rather than disappearing the moment the
     unread count is cleared. */
  const firstUnreadId =
    unreadAtOpen > 0
      ? (conversation.messages[conversation.messages.length - unreadAtOpen]
          ?.id ?? null)
      : null;

  /* The composer grows with the reply instead of scrolling a two-line
     window. Reset first, or it can only ever get taller. */
  useEffect(() => {
    const node = composerRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 160)}px`;
  }, [draft]);

  /* Follow the conversation down as it grows, and land at the bottom when
     a different thread is opened — the newest message is the one being
     read, never the oldest. */
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [conversation.id, conversation.messages.length]);

  function submit() {
    const body = draft.trim();
    if (!body || sending) return;
    onSend(body);
    onDraftChange("");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-inline-md border-b border-line pb-inset-sm">
        <Button
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          iconOnly
          onClick={onBack}
          aria-label="Back to all conversations"
          className="lg:hidden"
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
        <ContactAvatar contact={conversation.contact} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-inline-xs text-label-md text-fg">
            <span className="truncate">{conversation.contact.name}</span>
            {conversation.contact.online ? (
              <Badge tone="success">Online</Badge>
            ) : null}
          </p>
          <p className="truncate text-caption text-fg-muted">
            {conversation.contact.role}
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto py-inset-sm">
        <ol className="space-y-stack-md">
          {groups.map((group) => (
            <li key={group.dayKey}>
              <p className="mb-stack-md text-center text-caption text-fg-muted">
                {rules.dayLabel(group.messages[0].sentAt, now)}
              </p>
              <ol className="space-y-stack-sm">
                {group.messages.map((message) => {
                  /* The one line that differs from the clinic screen: on
                     this side of the thread, the member is "me". */
                  const mine = message.author === "member";
                  return (
                    <li
                      key={message.id}
                      className={cn(
                        "flex flex-col",
                        mine ? "items-end" : "items-start",
                      )}
                    >
                      {message.id === firstUnreadId ? (
                        <p className="mb-stack-sm flex w-full items-center gap-inline-md text-caption text-primary-edge">
                          <span
                            aria-hidden="true"
                            className="h-px flex-1 bg-primary-edge/40"
                          />
                          New
                          <span
                            aria-hidden="true"
                            className="h-px flex-1 bg-primary-edge/40"
                          />
                        </p>
                      ) : null}
                      <div
                        className={cn(
                          "max-w-[85%] rounded-card px-inset-sm py-inset-xs sm:max-w-[75%]",
                          mine
                            ? "bg-brand-600 text-white"
                            : "bg-surface-sunken text-fg",
                        )}
                      >
                        <p
                          className={cn(
                            "text-caption",
                            mine ? "text-white/75" : "text-fg-muted",
                          )}
                        >
                          {mine ? "You" : conversation.contact.name} ·{" "}
                          {rules.timeLabel(message.sentAt)}
                        </p>
                        <p className="mt-0.5 text-body-sm whitespace-pre-wrap">
                          {message.body}
                        </p>
                        {message.attachment ? (
                          <AttachmentCard
                            attachment={message.attachment}
                            onLight={!mine}
                          />
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </li>
          ))}
        </ol>
        <div ref={endRef} />
      </div>

      <form
        className="flex shrink-0 items-end gap-inline-md border-t border-line pt-inset-sm"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Button
          {...notBuiltYet("Attaching a file")}
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          iconOnly
          aria-label="Attach a file"
        >
          <Paperclip aria-hidden="true" />
        </Button>
        <Textarea
          ref={composerRef}
          rows={2}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            /* Enter sends, Shift+Enter breaks the line — what every chat
               does, and what anyone typing here will assume. */
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Type your message here..."
          aria-label={`Message ${conversation.contact.name}`}
          className="flex-1 resize-none"
        />
        <Button
          type="submit"
          size="small"
          disabled={draft.trim().length === 0 || sending}
          loading={sending}
        >
          <Send aria-hidden="true" />
          Send
        </Button>
      </form>
    </div>
  );
}

function QuickAction({ label, icon: Icon }: { label: string; icon: IconType }) {
  return (
    <li>
      <button
        {...notBuiltYet(label)}
        type="button"
        className={cn(
          "flex w-full items-center gap-inline-md rounded-control px-inset-xs py-2 text-left",
          "text-body-sm transition-colors duration-150 ease-standard",
          "enabled:cursor-pointer enabled:text-fg enabled:hover:bg-surface-sunken",
          "disabled:cursor-not-allowed disabled:text-fg-muted",
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        )}
      >
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
        {label}
      </button>
    </li>
  );
}

/**
 * The rail: who is on my team, and what else can I do from here.
 *
 * The team is derived from the member's own threads rather than stored
 * beside them, so it can never list somebody with no way to be reached —
 * every name here opens a conversation that already exists.
 */
function CareTeamRail({
  conversations,
  onSelectContact,
}: {
  conversations: Conversation[];
  onSelectContact: (contact: CareTeamContact) => void;
}) {
  const team = useMemo(() => rules.careTeamFor(conversations), [conversations]);

  return (
    <div className="space-y-stack-md">
      <Card as="section" padding="small">
        <h2 className="mb-stack-sm text-label-md text-fg">Care Team</h2>
        {team.length === 0 ? (
          <p className="text-body-sm text-fg-muted">
            Your care team will appear here once they message you.
          </p>
        ) : (
          <ul className="space-y-1">
            {team.map((contact) => (
              <li key={contact.name}>
                <button
                  type="button"
                  onClick={() => onSelectContact(contact)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-inline-md rounded-control p-inset-xs text-left",
                    "transition-colors duration-150 ease-standard hover:bg-surface-sunken",
                    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                  )}
                >
                  <ContactAvatar contact={contact} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-label-sm text-fg">
                      {contact.name}
                    </span>
                    <span className="block truncate text-caption text-fg-muted">
                      {contact.role}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card as="section" padding="small">
        <h2 className="mb-stack-sm text-label-md text-fg">Quick Actions</h2>
        <ul className="space-y-0.5">
          <QuickAction label="Request a Call" icon={PhoneCall} />
          <QuickAction label="Schedule an Appointment" icon={CalendarPlus} />
          <QuickAction label="Send a Document" icon={FileUp} />
          <QuickAction label="View My Lab Results" icon={BarChart3} />
          <QuickAction label="Ask a General Question" icon={CircleHelp} />
        </ul>
      </Card>

      {/* Messaging is not for emergencies and nothing here is watched out
          of hours, so the number sits on the screen rather than a click
          away behind "Support". */}
      <Card as="section" padding="small" tone="sunken">
        <div className="flex items-start gap-inline-md">
          <Headset
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-brand-600"
          />
          <div className="min-w-0">
            <h2 className="text-label-md text-fg">Need Help?</h2>
            <p className="mt-0.5 text-body-sm text-fg-secondary">
              If this is an urgent issue, please call your dialysis center
              directly.
            </p>
          </div>
        </div>
        {/* A real `tel:` link rather than a Button with a handler: on a
            phone this is the control that actually matters, and an anchor
            is what the OS, the context menu and a long-press understand. */}
        <a
          href={`tel:${URGENT_PHONE.replace(/[^\d+]/g, "")}`}
          className={cn(buttonStyles(), "mt-stack-sm w-full")}
        >
          <Phone aria-hidden="true" />
          Call {URGENT_PHONE}
        </a>
      </Card>
    </div>
  );
}

export default function MemberMessages() {
  const {
    conversations: allConversations,
    isLoading,
    error,
    sendMessage,
    markRead,
    writeError,
    isSending,
    clearWriteError,
  } = useMessages();

  /* The member's slice of the one platform-wide store. Their thread with
     the centre is the same record the clinic screen works, so a reply
     typed here turns up in the clinic inbox and the other way round. */
  const conversations = useMemo(
    () => rules.memberConversations(allConversations, DEMO_MEMBER),
    [allConversations],
  );

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MemberInboxFilter>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [unreadAtOpen, setUnreadAtOpen] = useState(0);
  /* Drafts are keyed by thread, so switching away and back does not lose
     what was typed. Losing a half-written question to a stray click on
     another name is the kind of small betrayal that stops people asking. */
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  /* One clock for the whole screen, so every relative label agrees. */
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const open = useCallback(
    (conversation: Conversation) => {
      setActiveId(conversation.id);
      setUnreadAtOpen(conversation.unread);
      if (conversation.unread > 0) markRead(conversation.id);
    },
    [markRead],
  );

  /* ↑/↓ walk the list as it is actually ordered on screen — filtered,
     searched, then sorted — which only the list itself knows. */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (visibleIds.length === 0) return;
      event.preventDefault();
      const current = activeId ? visibleIds.indexOf(activeId) : -1;
      const next =
        event.key === "ArrowDown"
          ? Math.min(current + 1, visibleIds.length - 1)
          : Math.max(current - 1, 0);
      const conversation = conversations.find((c) => c.id === visibleIds[next]);
      if (conversation) open(conversation);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visibleIds, activeId, conversations, open]);

  const selectContact = useCallback(
    (contact: CareTeamContact) => {
      const thread = conversations.find((c) => c.contact.name === contact.name);
      if (thread) open(thread);
    },
    [conversations, open],
  );

  const unread = rules.totalUnread(conversations);

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <PageTitle
        href="/dashboard/messages"
        action={
          unread > 0 ? (
            <Badge tone="danger" variant="solid">
              {unread} unread
            </Badge>
          ) : null
        }
      />

      {writeError ? (
        <Alert
          tone="danger"
          className="mb-stack-md"
          onDismiss={clearWriteError}
          title="Your message was not saved"
        >
          Messages are kept in this browser, which can refuse them in a private
          window or when site data is full. Nothing was sent to your care team.
        </Alert>
      ) : null}

      <AsyncSection
        pending={isLoading}
        error={error}
        isEmpty={conversations.length === 0}
        skeleton={<Skeleton className="h-[70vh] w-full" />}
        empty={
          <EmptyState
            icon={<MessageSquarePlus />}
            title="No messages yet"
            description="When your care team writes to you, their messages will appear here."
          />
        }
      >
        <div className="grid min-h-0 gap-stack-md lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)_18rem]">
          {/* Below `lg` the list and the thread take turns in one column. */}
          <Card
            padding="small"
            className={cn(
              "h-[70vh] min-h-0 lg:h-[76vh]",
              active && "hidden lg:block",
            )}
          >
            <Inbox
              conversations={conversations}
              activeId={activeId}
              filter={filter}
              onFilterChange={setFilter}
              query={query}
              onQueryChange={setQuery}
              now={now}
              onSelect={open}
              onVisibleChange={setVisibleIds}
            />
          </Card>

          <Card
            padding="small"
            className={cn(
              "h-[70vh] min-h-0 lg:h-[76vh]",
              !active && "hidden lg:block",
            )}
          >
            {active ? (
              <Thread
                conversation={active}
                now={now}
                draft={drafts[active.id] ?? ""}
                onDraftChange={(next) =>
                  setDrafts((current) => ({ ...current, [active.id]: next }))
                }
                unreadAtOpen={unreadAtOpen}
                sending={isSending}
                onSend={(body) => sendMessage(active.id, body, "member")}
                onBack={() => setActiveId(null)}
              />
            ) : (
              <EmptyState
                variant="bare"
                icon={<MessageSquarePlus />}
                title="No conversation selected"
                description="Choose someone on your care team to read and reply to their messages."
              />
            )}
          </Card>

          {/* The rail is useful with or without a thread open, so unlike
              the clinic's patient rail it is always rendered. */}
          <div className="xl:h-[76vh] xl:min-h-0 xl:overflow-y-auto">
            <CareTeamRail
              conversations={conversations}
              onSelectContact={selectContact}
            />
          </div>
        </div>
      </AsyncSection>
    </div>
  );
}
