"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Download,
  FileText,
  Paperclip,
  Search,
  Send,
} from "lucide-react";
import { Badge, Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import * as rules from "./messaging.rules";
import { AttachButton, PendingAttachment } from "./AttachControls";
import { downloadAttachment } from "./attachments";
import type { Attachment, Conversation, Message } from "./messaging.types";

/* ==========================================================================
   Messaging — the parts both inboxes share
   --------------------------------------------------------------------------
   The member screen and the clinic screen are the same conversation read
   from two ends. They used to carry two copies of every piece — row,
   bubble, composer — and the copies had drifted: a red unread badge on one
   side and a blue one on the other, wrapping filter chips, a 28px download
   button. One set of parts here keeps them identical; each screen passes
   only what differs (whose message is "mine", who the other party is).
   ========================================================================== */

/** The column height for the inbox and the thread: tall enough to read a
 *  conversation, never taller than the window so the composer stays put. */
export const PANE_HEIGHT = "h-[calc(100dvh-13rem)] min-h-[560px]";

/* --------------------------------------------------------------------------
   Avatar
   -------------------------------------------------------------------------- */

export function MessagingAvatar({
  name,
  icon,
  className,
}: {
  name: string;
  /** Replaces the initials, e.g. a building for the dialysis centre. */
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-pill",
        "bg-primary-soft text-label-sm text-fg-brand [&_svg]:size-4",
        className,
      )}
    >
      {icon ?? rules.initials(name)}
    </span>
  );
}

/* --------------------------------------------------------------------------
   Inbox: filters, search, rows
   -------------------------------------------------------------------------- */

export type FilterOption<T extends string> = {
  id: T;
  label: string;
  /** Shown beside the label when above zero — "Unread 2", not "Unread 0". */
  count?: number;
};

/**
 * One row of folders, never wrapping.
 *
 * A toggle group rather than a tablist: `role="tab"` obliges a matching
 * panel and arrow-key roving, and the list below is a list. `aria-pressed`
 * says the true thing. Each segment is 40px tall, the floor for a small
 * control.
 */
export function InboxFilters<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<FilterOption<T>>;
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Message filters"
      className="flex shrink-0 gap-0.5 overflow-x-auto rounded-field bg-surface-sunken p-0.5"
    >
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex min-h-10 flex-auto cursor-pointer items-center justify-center gap-inline-xs rounded-field px-2.5",
              "text-label-sm whitespace-nowrap transition-colors duration-150 ease-standard",
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
              selected
                ? "bg-surface text-fg-brand shadow-(--card-shadow)"
                : "text-fg-secondary hover:text-fg",
            )}
          >
            {option.label}
            {option.count ? (
              <span
                className={cn(
                  "min-w-5 rounded-pill px-1 text-center tabular-nums",
                  selected
                    ? "bg-primary-soft text-fg-brand"
                    : "bg-surface text-fg-muted",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function InboxSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
}) {
  return (
    <Input
      type="search"
      inputSize="small"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label="Search conversations"
      leadingIcon={<Search aria-hidden="true" />}
      className="shrink-0"
    />
  );
}

/**
 * One conversation in the list.
 *
 * Unread reads three ways at once — the count, the darker preview and the
 * weight of the name — so it survives a glance, colour blindness and a
 * screen reader. The open one carries a bar on its edge, not just a tint.
 */
export function ConversationItem({
  avatar,
  title,
  titleExtra,
  preview,
  time,
  hasAttachment,
  unread,
  active,
  onSelect,
}: {
  avatar: React.ReactNode;
  title: string;
  /** Beside the name, e.g. a flag. */
  titleExtra?: React.ReactNode;
  preview: string;
  time: string | null;
  hasAttachment: boolean;
  unread: number;
  active: boolean;
  onSelect: () => void;
}) {
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
        aria-label={unread > 0 ? `${title}, ${unread} unread` : undefined}
        className={cn(
          "relative flex w-full cursor-pointer items-center gap-inline-md rounded-card-nested px-inset-sm py-inset-sm text-left",
          "transition-colors duration-150 ease-standard",
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
          active
            ? "bg-primary-soft before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-pill before:bg-brand-600"
            : "hover:bg-surface-sunken",
        )}
      >
        {avatar}
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-inline-md">
            <span className="flex min-w-0 items-center gap-inline-xs">
              <span
                className={cn(
                  "truncate text-label-md",
                  unread > 0 || active ? "text-fg" : "text-fg-secondary",
                )}
              >
                {title}
              </span>
              {titleExtra}
            </span>
            {time ? (
              <span
                className={cn(
                  "shrink-0 text-caption",
                  unread > 0 ? "text-fg-brand" : "text-fg-muted",
                )}
              >
                {time}
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 flex items-center gap-inline-sm">
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-body-sm",
                unread > 0 ? "text-fg" : "text-fg-muted",
              )}
            >
              {preview}
            </span>
            {hasAttachment ? (
              <Paperclip
                aria-label="Has an attachment"
                className="size-3.5 shrink-0 text-fg-muted"
              />
            ) : null}
            {unread > 0 ? (
              <Badge tone="info" variant="solid" className="shrink-0">
                {unread}
              </Badge>
            ) : null}
          </span>
        </span>
      </button>
    </li>
  );
}

/** "You: …" for my own last message, the text otherwise. */
export function previewOf(conversation: Conversation, mine: Message["author"]) {
  const last = rules.lastMessage(conversation);
  if (!last) return "No messages yet";
  const text =
    last.body || (last.attachment ? `📎 ${last.attachment.name}` : "");
  return last.author === mine ? `You: ${text}` : text;
}

export function EmptyList({ searching }: { searching: boolean }) {
  return (
    <p className="px-inset-sm py-inset-md text-center text-body-sm text-fg-muted">
      {searching
        ? "No conversations match that search."
        : "Nothing in this folder."}
    </p>
  );
}

/* --------------------------------------------------------------------------
   Thread
   -------------------------------------------------------------------------- */

export function ThreadHeader({
  avatar,
  title,
  subtitle,
  extra,
  onBack,
}: {
  avatar: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  extra?: React.ReactNode;
  onBack: () => void;
}) {
  return (
    <header className="flex shrink-0 items-center gap-inline-md border-b border-line px-inset-md py-inset-sm">
      <Button
        variant="neutral"
        appearance="ghost"
        size="small"
        iconOnly
        onClick={onBack}
        aria-label="Back to all conversations"
        className="lg:hidden"
      >
        <ArrowLeft aria-hidden="true" />
      </Button>
      {avatar}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-heading-5 text-fg">{title}</h2>
        {subtitle ? (
          <p className="truncate text-caption text-fg-muted">{subtitle}</p>
        ) : null}
      </div>
      {extra}
    </header>
  );
}

export function AttachmentCard({
  attachment,
  onBrand,
}: {
  attachment: Attachment;
  /* Inside a brand-filled bubble the usual borders vanish, so the card
     switches to translucent white rather than a second colour scheme. */
  onBrand: boolean;
}) {
  /* A photo is the point of the message, so it shows as itself; a file row
     would make the nurse click to see a red exit site. */
  if (attachment.imageUrl) {
    return (
      <div
        className={cn(
          "mt-stack-sm overflow-hidden rounded-card-nested border",
          onBrand ? "border-white/25" : "border-line",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a data URL, nothing to optimise */}
        <img
          src={attachment.imageUrl}
          alt={attachment.name}
          className="block max-h-64 w-full max-w-xs object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mt-stack-sm flex items-center gap-inline-md rounded-card-nested border p-inset-xs",
        onBrand ? "border-white/25 bg-white/10" : "border-line bg-surface",
      )}
    >
      <FileText
        aria-hidden="true"
        className={cn("size-5 shrink-0", !onBrand && "text-fg-muted")}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-label-sm">{attachment.name}</span>
        <span
          className={cn(
            "block text-caption",
            onBrand ? "text-white/80" : "text-fg-muted",
          )}
        >
          {attachment.sizeLabel}
        </span>
      </span>
      <Button
        disabled={!attachment.dataUrl}
        title={
          attachment.dataUrl
            ? undefined
            : "This sample file was never stored, so there is nothing to download"
        }
        onClick={() => downloadAttachment(attachment)}
        variant="neutral"
        appearance="fill-stroke"
        size="small"
        iconOnly
        aria-label={`Download ${attachment.name}`}
      >
        <Download aria-hidden="true" />
      </Button>
    </div>
  );
}

/**
 * The conversation itself.
 *
 * Messages from one person in a row are a run: the name shows once at its
 * head instead of on every bubble, and the runs sit further apart than the
 * bubbles inside them, so who-said-what reads from the shape alone. Every
 * bubble keeps its own time — in a care conversation "when" matters.
 */
export function MessageLog({
  conversation,
  mine,
  otherName,
  firstUnreadId,
  now,
}: {
  conversation: Conversation;
  /** The author on this side of the screen. */
  mine: Message["author"];
  /** How the other side's messages are signed. */
  otherName: string;
  firstUnreadId: string | null;
  now: number;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const groups = useMemo(
    () => rules.groupByDay(conversation.messages),
    [conversation.messages],
  );

  /* Land on the newest message when a thread opens, and follow it down as
     it grows — the newest is the one being read, never the oldest. */
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [conversation.id, conversation.messages.length]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-inset-md py-inset-md">
      <ol className="space-y-stack-lg" aria-label="Messages">
        {groups.map((group) => (
          <li key={group.dayKey}>
            <p className="mb-stack-md flex items-center gap-inline-md text-caption text-fg-muted">
              <span aria-hidden="true" className="h-px flex-1 bg-line" />
              {rules.dayLabel(group.messages[0].sentAt, now)}
              <span aria-hidden="true" className="h-px flex-1 bg-line" />
            </p>
            <ol>
              {group.messages.map((message, index) => {
                const isMine = message.author === mine;
                const previous = group.messages[index - 1];
                const startsRun =
                  !previous ||
                  previous.author !== message.author ||
                  message.id === firstUnreadId;
                return (
                  <li
                    key={message.id}
                    className={cn(
                      "flex flex-col",
                      isMine ? "items-end" : "items-start",
                      startsRun && index > 0 ? "mt-stack-md" : "mt-1",
                    )}
                  >
                    {message.id === firstUnreadId ? (
                      <p className="mb-stack-sm flex w-full items-center gap-inline-md text-caption text-fg-brand">
                        <span
                          aria-hidden="true"
                          className="h-px flex-1 bg-brand-600"
                        />
                        New messages
                        <span
                          aria-hidden="true"
                          className="h-px flex-1 bg-brand-600"
                        />
                      </p>
                    ) : null}
                    {startsRun && !isMine ? (
                      <p className="mb-1 px-1 text-caption text-fg-muted">
                        {otherName}
                      </p>
                    ) : null}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-card-nested px-inset-sm py-inset-xs sm:max-w-[70%]",
                        isMine
                          ? "rounded-br-status bg-brand-600 text-white"
                          : "rounded-bl-status bg-surface-sunken text-fg",
                      )}
                    >
                      {message.body ? (
                        <p className="text-body-sm whitespace-pre-wrap">
                          {message.body}
                        </p>
                      ) : null}
                      {message.attachment ? (
                        <AttachmentCard
                          attachment={message.attachment}
                          onBrand={isMine}
                        />
                      ) : null}
                      <p
                        className={cn(
                          "mt-0.5 text-right text-caption",
                          isMine ? "text-white/80" : "text-fg-muted",
                        )}
                      >
                        <span className="sr-only">
                          {isMine ? "You" : otherName},{" "}
                        </span>
                        {message.automated ? "Automated reply · " : ""}
                        {rules.timeLabel(message.sentAt)}
                      </p>
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
  );
}

/** The first message still unread when the thread was opened, so the "New
 *  messages" rule stays put after the badge clears. */
export function firstUnreadIdOf(
  conversation: Conversation,
  unreadAtOpen: number,
): string | null {
  return unreadAtOpen > 0
    ? (conversation.messages[conversation.messages.length - unreadAtOpen]?.id ??
        null)
    : null;
}

/**
 * The reply box: one rounded field holding the paperclip, the text and the
 * send button, so it reads as a single control.
 *
 * Enter sends and Shift+Enter breaks the line — what every chat does and
 * what anyone typing here will assume; the hint under it says so for the
 * people who would not. The field grows with the reply up to a limit.
 */
export function Composer({
  draft,
  onDraftChange,
  sending,
  onSend,
  placeholder,
  label,
  confirmSend,
}: {
  /** Runs before the send, e.g. the safety notice; it calls `send` when
   *  the member confirms, so a cancel keeps what they typed. */
  confirmSend?: (send: () => void) => void;
  /** Owned by the parent, so switching threads does not lose what was typed. */
  draft: string;
  onDraftChange: (next: string) => void;
  sending: boolean;
  onSend: (body: string, attachment?: Attachment) => void;
  placeholder: string;
  label: string;
}) {
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [pending, setPending] = useState<Attachment | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);

  useEffect(() => {
    const node = fieldRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 160)}px`;
  }, [draft]);

  const canSend = (draft.trim().length > 0 || pending !== null) && !sending;

  function submit() {
    if (!canSend) return;
    const body = draft.trim();
    const attachment = pending ?? undefined;
    const send = () => {
      onSend(body, attachment);
      onDraftChange("");
      setPending(null);
      setAttachError(null);
    };
    if (confirmSend) confirmSend(send);
    else send();
  }

  return (
    <div className="shrink-0 border-t border-line px-inset-md pt-inset-sm pb-inset-sm">
      {pending || attachError ? (
        <div className="mb-stack-sm space-y-stack-xs">
          {pending ? (
            <PendingAttachment
              attachment={pending}
              onRemove={() => setPending(null)}
            />
          ) : null}
          {attachError ? (
            <p role="alert" className="text-caption text-danger">
              {attachError}
            </p>
          ) : null}
        </div>
      ) : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className={cn(
          "flex items-end gap-inline-sm rounded-field border border-line bg-surface p-1",
          "transition-colors duration-150 ease-standard",
          "focus-within:border-brand-600 focus-within:outline-2 focus-within:outline-ring",
        )}
      >
        <AttachButton
          appearance="ghost"
          disabled={sending}
          onAttach={(attachment) => {
            setPending(attachment);
            setAttachError(null);
          }}
          onError={setAttachError}
        />
        <textarea
          ref={fieldRef}
          rows={1}
          value={draft}
          maxLength={2000}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          aria-label={label}
          aria-describedby="composer-hint"
          className="min-h-10 flex-1 resize-none bg-transparent px-1 py-2.5 text-body-sm text-fg placeholder:text-fg-muted focus:outline-none"
        />
        <Button
          type="submit"
          size="small"
          iconOnly
          disabled={!canSend}
          loading={sending}
          aria-label="Send message"
        >
          <Send aria-hidden="true" />
        </Button>
      </form>
      <p
        id="composer-hint"
        className="mt-stack-xs hidden text-caption text-fg-muted sm:block"
      >
        Enter to send · Shift + Enter for a new line
      </p>
    </div>
  );
}

/** What the thread pane says when nothing is open. */
export function NoThread({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-stack-sm p-inset-md text-center">
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-pill bg-primary-soft text-fg-brand [&_svg]:size-6"
      >
        {icon}
      </span>
      <h2 className="text-heading-5 text-fg">{title}</h2>
      <p className="max-w-xs text-body-sm text-fg-muted">{description}</p>
    </div>
  );
}

/* --------------------------------------------------------------------------
   The side rail
   -------------------------------------------------------------------------- */

export function RailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-stack-xs px-inset-sm text-heading-5 text-fg">
        {title}
      </h2>
      {children}
    </section>
  );
}

const RAIL_ITEM_CLASS = cn(
  "flex min-h-11 w-full cursor-pointer items-center gap-inline-md rounded-card-nested px-inset-sm text-left",
  "text-label-md transition-colors duration-150 ease-standard",
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
  "[&_svg]:size-4 [&_svg]:shrink-0",
);

/**
 * One action in the rail: a quiet row with an icon, not a stack of
 * outlined buttons — six bordered boxes in a column read as six equally
 * loud choices. A link when it goes somewhere, a button when it acts.
 */
export function RailActionItem({
  label,
  icon: Icon,
  onClick,
  href,
}: {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick?: () => void;
  href?: string;
}) {
  const className = cn(
    RAIL_ITEM_CLASS,
    "text-fg hover:bg-surface-sunken [&_svg]:text-fg-brand",
  );
  const content = (
    <>
      <Icon aria-hidden="true" />
      {label}
    </>
  );
  return (
    <li>
      {href ? (
        <Link href={href} className={className}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={className}>
          {content}
        </button>
      )}
    </li>
  );
}
