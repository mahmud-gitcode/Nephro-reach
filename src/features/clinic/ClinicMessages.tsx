"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Ban,
  CalendarClock,
  Download,
  FileText,
  Flag,
  FlaskConical,
  Info,
  MailOpen,
  MessageSquare,
  NotebookPen,
  Paperclip,
  Search,
  Send,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { PageTitle } from "@/components/layout/PageTitle";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Skeleton,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";
import * as rules from "@/features/messaging/messaging.rules";
import { useMessages } from "@/features/messaging/useMessages";
import type {
  Attachment,
  Conversation,
  InboxFilter,
} from "@/features/messaging/messaging.types";

/* ==========================================================================
   Clinic messages
   --------------------------------------------------------------------------
   Three panes: the inbox, the thread, and the patient beside it. The right
   rail is the point of the layout — a coordinator answering a question
   about swelling should not have to leave the conversation to find out who
   they are talking to or what programme they are on.

   Below `xl` there is not room for three, so the rail folds under the
   thread; below `lg` the inbox and the thread take turns, with a back
   button returning to the list.
   ========================================================================== */

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const FILTERS: Array<{ id: InboxFilter; label: string }> = [
  { id: "all", label: "All Messages" },
  { id: "unread", label: "Unread" },
  { id: "flagged", label: "Flagged" },
  { id: "archived", label: "Archived" },
];

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-pill",
        "bg-surface-brand-subtle text-label-sm text-brand-600",
        className,
      )}
    >
      {rules.initials(name)}
    </span>
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
        <Avatar name={conversation.memberName} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-inline-md">
            <span className="flex min-w-0 items-center gap-inline-xs">
              <span className="truncate text-label-md text-fg">
                {conversation.memberName}
              </span>
              {conversation.flagged ? (
                <Flag
                  aria-label="Flagged"
                  className="h-3.5 w-3.5 shrink-0 text-warning"
                />
              ) : null}
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
                ? `${last.author === "clinic" ? "You: " : ""}${last.body}`
                : "No messages yet"}
            </span>
            {rules.hasAttachment(conversation) ? (
              <Paperclip
                aria-label="Has an attachment"
                className="h-3.5 w-3.5 shrink-0 text-fg-muted"
              />
            ) : null}
            {conversation.unread > 0 ? (
              <Badge tone="info" variant="solid">
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
  filter: InboxFilter;
  onFilterChange: (next: InboxFilter) => void;
  query: string;
  onQueryChange: (next: string) => void;
  now: number;
  onSelect: (conversation: Conversation) => void;
  /** Reports the list as ordered on screen, so ↑/↓ can walk it. */
  onVisibleChange: (ids: string[]) => void;
}) {
  const counts = rules.filterCounts(conversations);
  const visible = useMemo(
    () =>
      rules.sortByRecent(
        rules.searchConversations(
          rules.applyFilter(conversations, filter, activeId),
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
    <div className="flex min-h-0 flex-col">
      {/* A toggle group, not a tablist: `role="tab"` obliges a matching
          `tabpanel` and arrow-key roving, and the list below is a list, not
          a panel. `aria-pressed` says the true thing without the debt. */}
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
              {/* A zero is worth showing on a filter: it is the answer to
                  "is anything flagged", not an empty slot. */}
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

      <Input
        type="search"
        inputSize="small"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search patients, messages, or keywords..."
        aria-label="Search conversations"
        leadingIcon={<Search aria-hidden="true" />}
        className="mb-stack-sm shrink-0"
      />

      {visible.length === 0 ? (
        <p className="p-inset-sm text-body-sm text-fg-muted">
          {query
            ? "No conversations match that search."
            : "Nothing in this folder."}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {visible.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              active={conversation.id === activeId}
              now={now}
              onSelect={() => onSelect(conversation)}
            />
          ))}
        </ul>
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

  /* The id of the first message that was still unread when the thread was
     opened. Everything from there down gets the "new" rule above it, and
     it stays put while the thread is open rather than disappearing the
     moment the unread count is cleared. */
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

  const firstName = conversation.memberName.split(" ")[0];

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
        <Avatar name={conversation.memberName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-label-md text-fg">
            {conversation.memberName}
          </p>
          <p className="truncate text-caption text-fg-muted">
            {conversation.patient.status} Member ·{" "}
            {conversation.patient.program}
          </p>
        </div>
        {conversation.flagged ? (
          <Badge tone="warning" icon={<Flag aria-hidden="true" />}>
            Flagged
          </Badge>
        ) : null}
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
                  const mine = message.author === "clinic";
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
                          {mine ? "Staff" : conversation.memberName} ·{" "}
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
               does, and what a clinic typing all day will assume. */
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={`Type a message to ${firstName}...`}
          aria-label={`Message ${conversation.memberName}`}
          className="flex-1 resize-none"
        />
        <Button
          type="submit"
          size="small"
          iconOnly
          disabled={draft.trim().length === 0 || sending}
          loading={sending}
          aria-label="Send message"
        >
          <Send aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}

function RailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-inline-md">
      <dt className="shrink-0 text-caption text-fg-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right text-body-sm text-fg">
        {value}
      </dd>
    </div>
  );
}

function RailAction({
  label,
  icon: Icon,
  onClick,
  feature,
  tone = "neutral",
}: {
  label: string;
  icon: IconType;
  /** Omit, and pass `feature`, to mark the action as not built yet. */
  onClick?: () => void;
  feature?: string;
  tone?: "neutral" | "danger";
}) {
  return (
    <Button
      {...(onClick ? { onClick } : notBuiltYet(feature ?? label))}
      variant={tone}
      appearance="fill-stroke"
      size="small"
      fullWidth
      className="justify-start"
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Button>
  );
}

function PatientRail({
  conversation,
  onToggleFlag,
  onMarkUnread,
  onToggleArchive,
}: {
  conversation: Conversation;
  onToggleFlag: () => void;
  onMarkUnread: () => void;
  onToggleArchive: () => void;
}) {
  const { patient } = conversation;

  return (
    <div className="min-h-0 space-y-stack-lg overflow-y-auto pr-1">
      <section>
        <h3 className="mb-stack-sm flex items-center gap-inline-xs text-label-md text-fg">
          <Info aria-hidden="true" className="h-4 w-4 shrink-0 text-fg-muted" />
          Patient Information
        </h3>
        <div className="rounded-control border border-line p-inset-sm">
          <div className="mb-stack-sm flex items-center gap-inline-md">
            <Avatar name={conversation.memberName} />
            <div className="min-w-0">
              <p className="truncate text-label-md text-fg">
                {conversation.memberName}
              </p>
              <Badge tone="success">{patient.status}</Badge>
            </div>
          </div>
          <dl className="space-y-1.5">
            <RailRow label="DOB" value={patient.dob} />
            <RailRow label="Age" value={patient.age} />
            <RailRow label="MRN" value={patient.mrn} />
            <RailRow label="Phone" value={patient.phone} />
            <RailRow label="Email" value={patient.email} />
            <RailRow label="Program" value={patient.program} />
            <RailRow label="Enrolled" value={patient.enrolledOn} />
            <RailRow label="Care Team" value={patient.careTeam} />
          </dl>
          {patient.notes ? (
            <p className="mt-stack-sm border-t border-line pt-inset-xs text-body-sm text-fg-secondary">
              {patient.notes}
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <h3 className="mb-stack-sm text-label-md text-fg">Quick Actions</h3>
        <div className="space-y-1">
          <RailAction
            label="View Patient Profile"
            icon={UserRound}
            feature="The patient profile"
          />
          <RailAction
            label="View Latest Labs"
            icon={FlaskConical}
            feature="Viewing labs"
          />
          <RailAction
            label="Send Education Resource"
            icon={FileText}
            feature="Sending a resource"
          />
          <RailAction
            label="Schedule Call"
            icon={CalendarClock}
            feature="Scheduling a call"
          />
          <RailAction
            label="Add Note"
            icon={NotebookPen}
            feature="Adding a note"
          />
          <RailAction
            label={
              conversation.flagged ? "Unflag Conversation" : "Flag Conversation"
            }
            icon={Flag}
            onClick={onToggleFlag}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-stack-sm text-label-md text-fg">
          Conversation Tools
        </h3>
        <div className="space-y-1">
          <RailAction
            label="Mark as Unread"
            icon={MailOpen}
            onClick={onMarkUnread}
          />
          <RailAction
            label={
              conversation.archived
                ? "Restore Conversation"
                : "Archive Conversation"
            }
            icon={conversation.archived ? ArchiveRestore : Archive}
            onClick={onToggleArchive}
          />
          <RailAction
            label="Report Concern"
            icon={ShieldAlert}
            feature="Reporting a concern"
          />
          <RailAction
            label="Block Patient"
            icon={Ban}
            tone="danger"
            feature="Blocking a patient"
          />
        </div>
      </section>
    </div>
  );
}

export default function ClinicMessages() {
  const {
    conversations,
    isLoading,
    error,
    sendMessage,
    markRead,
    toggleFlag,
    markUnread,
    setArchived,
    writeError,
    isSending,
    clearWriteError,
  } = useMessages();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  /* Drafts live up here, keyed by thread. A coordinator is interrupted
     mid-reply constantly — losing what they had typed because they glanced
     at another patient is the kind of small betrayal that stops people
     trusting a tool. */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  /* How many messages were unread when each thread was opened, so the
     "New" rule can stay put after the badge clears. */
  const [unreadAtOpen, setUnreadAtOpen] = useState<Record<string, number>>({});
  const [visibleIds, setVisibleIds] = useState<string[]>([]);

  /* One instant for the whole screen, so every "2h" and every "Today" is
     measured against the same clock rather than each reading it fresh.
     Held in state because `Date.now()` in a render body is impure — it
     would hand two renders different answers for the same data. The tick
     keeps the labels honest during a long session; a minute is as fine as
     these labels get. */
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
      setUnreadAtOpen((current) => ({
        ...current,
        [conversation.id]: conversation.unread,
      }));
      if (conversation.unread > 0) markRead(conversation.id);
    },
    [markRead],
  );

  /* ↑/↓ walk the inbox and Escape leaves the thread, because a clinic
     working a queue of ninety messages should not have to aim at each one.
     Ignored while a field has focus, or the arrow keys would stop moving
     the text cursor. */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (event.key === "Escape" && !typing) {
        setActiveId(null);
        return;
      }
      if (typing) return;
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      if (visibleIds.length === 0) return;

      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      const current = activeId ? visibleIds.indexOf(activeId) : -1;
      /* From nowhere, ↓ starts at the top and ↑ at the bottom. */
      const next =
        current === -1
          ? step === 1
            ? 0
            : visibleIds.length - 1
          : Math.min(Math.max(current + step, 0), visibleIds.length - 1);
      const conversation = conversations.find((c) => c.id === visibleIds[next]);
      if (conversation) open(conversation);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visibleIds, activeId, conversations, open]);

  const unread = rules.totalUnread(conversations);

  return (
    <div className="space-y-4">
      <PageTitle
        href="/dashboard/clinic/messages"
        action={
          unread > 0 ? (
            <Badge tone="info">
              {unread} unread message{unread === 1 ? "" : "s"}
            </Badge>
          ) : null
        }
      />

      {writeError ? (
        <Alert
          tone="danger"
          title="That change was not saved"
          onDismiss={clearWriteError}
        >
          Your browser refused to store it — this can happen in a private window
          or when site data is full. Nothing was sent to the patient.
        </Alert>
      ) : null}

      <Card as="section" padding="small" className="overflow-hidden">
        <AsyncSection
          pending={isLoading}
          error={error}
          isEmpty={conversations.length === 0}
          skeleton={
            <div className="space-y-stack-md">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          }
          empty={
            <EmptyState
              icon={<MessageSquare aria-hidden="true" />}
              title="No conversations yet"
              description="Messages from your enrolled members will appear here."
            />
          }
        >
          <div className="grid h-[680px] grid-cols-1 gap-inset-md lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_296px]">
            <div
              className={cn(
                "min-h-0 lg:border-r lg:border-line lg:pr-inset-sm",
                active ? "hidden lg:block" : "block",
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
            </div>

            <div
              className={cn("min-h-0", active ? "block" : "hidden lg:block")}
            >
              {active ? (
                <Thread
                  conversation={active}
                  now={now}
                  draft={drafts[active.id] ?? ""}
                  onDraftChange={(next) =>
                    setDrafts((current) => ({ ...current, [active.id]: next }))
                  }
                  unreadAtOpen={unreadAtOpen[active.id] ?? 0}
                  sending={isSending}
                  onSend={(body) => {
                    clearWriteError();
                    sendMessage(active.id, body);
                  }}
                  onBack={() => setActiveId(null)}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <EmptyState
                    variant="bare"
                    icon={<MessageSquare aria-hidden="true" />}
                    title="Pick a conversation"
                    description="Choose a patient on the left to read and reply to their messages."
                  />
                </div>
              )}
            </div>

            {/* The rail has nothing to say without a patient, so it only
                exists once a thread is open. */}
            {active ? (
              <div className="min-h-0 xl:border-l xl:border-line xl:pl-inset-sm">
                <PatientRail
                  conversation={active}
                  onToggleFlag={() => toggleFlag(active.id)}
                  /* Marking unread or archiving is a decision to leave the
                     thread, so the pane closes rather than sitting open on
                     a conversation the list no longer shows. */
                  onMarkUnread={() => {
                    markUnread(active.id);
                    setActiveId(null);
                  }}
                  onToggleArchive={() => {
                    setArchived(active.id, !active.archived);
                    setActiveId(null);
                  }}
                />
              </div>
            ) : null}
          </div>
        </AsyncSection>
      </Card>
    </div>
  );
}
