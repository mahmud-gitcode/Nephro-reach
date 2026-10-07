"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useSafetyNotice } from "./useSafetyNotice";
import { useAfterHoursReply } from "./useAfterHoursReply";
import { ShareOutsideCard } from "@/features/secure-messages/ShareOutsideCard";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  CalendarPlus,
  CircleHelp,
  Headset,
  MessageSquarePlus,
  Phone,
  PhoneCall,
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
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import * as rules from "./messaging.rules";
import { useMessages } from "./useMessages";
import { useMemberName } from "@/features/auth/useMemberName";
import { FACILITY, NEPHROLOGY_OFFICE } from "./messaging.seed";
import { NewMessageModal } from "./NewMessageModal";
import {
  Composer,
  ConversationItem,
  EmptyList,
  InboxFilters,
  InboxSearch,
  MessageLog,
  MessagingAvatar,
  NoThread,
  PANE_HEIGHT,
  RailActionItem,
  RailSection,
  ThreadHeader,
  firstUnreadIdOf,
  previewOf,
  type FilterOption,
} from "./MessagingUi";
import type {
  CareTeamContact,
  Conversation,
  MemberInboxFilter,
  MessageCategory,
} from "./messaging.types";

/* ==========================================================================
   Member messages
   --------------------------------------------------------------------------
   The same panes as the clinic screen and the same store behind them, read
   from the other end: the list is the people on my care team rather than
   the patients in a queue, and the rail answers "what else can I do" and
   "who do I call if this is urgent".

   The inversion worth naming is authorship. Clinic-side a `clinic` message
   is mine; here a `member` message is. Everything else — rows, bubbles,
   composer — is the shared set in MessagingUi, so the two screens cannot
   drift apart again.

   Below `xl` the rail folds under the panes; below `lg` the list and the
   thread take turns, with a back button returning to the list.
   ========================================================================== */

/** The centre's own number, shown where a member may need a human now. */
const URGENT_PHONE = "(803) 555-0187";

function ContactAvatar({ contact }: { contact: CareTeamContact }) {
  /* A facility gets a building rather than initials: "RDC" reads as a
     person with an odd name, and a member thinks of the centre as a place. */
  return (
    <span className="relative shrink-0">
      <MessagingAvatar
        name={contact.name}
        icon={contact.kind === "facility" ? <Building2 /> : undefined}
      />
      {/* Only a known "online" is shown. Absent means unknown, and a grey
          dot would claim somebody is away when nobody knows. */}
      {contact.online ? (
        <span
          role="img"
          aria-label="Online"
          className="bg-chart-positive absolute right-0 bottom-0 size-3 rounded-pill ring-2 ring-surface"
        />
      ) : null}
    </span>
  );
}

/** What a rail shortcut pre-fills in the New Message dialog. */
type Compose = { body: string; category: MessageCategory };

/**
 * The rail: shortcuts that start a message, and the number to call when a
 * message is the wrong tool. The care team itself is the list on the left —
 * every name there is a thread — so it is not repeated here.
 */
function MemberRail({ onCompose }: { onCompose: (compose: Compose) => void }) {
  return (
    <div className="space-y-stack-lg">
      <RailSection title="Quick Actions">
        <ul className="space-y-0.5">
          <RailActionItem
            label="Request a Call"
            icon={PhoneCall}
            onClick={() =>
              onCompose({
                category: "care-team",
                body: "Could someone give me a call, please? The best time to reach me is ",
              })
            }
          />
          <RailActionItem
            label="Schedule an Appointment"
            icon={CalendarPlus}
            onClick={() =>
              onCompose({
                category: "appointments",
                body: "I would like to schedule an appointment. Days and times that work for me: ",
              })
            }
          />
          <RailActionItem
            label="View My Lab Results"
            icon={BarChart3}
            href="/dashboard/personal-log/lab-tracking"
          />
          <RailActionItem
            label="Ask a General Question"
            icon={CircleHelp}
            onClick={() => onCompose({ category: "care-team", body: "" })}
          />
        </ul>
      </RailSection>

      {/* Offices not on NephroReach (client, 2026-10-05). */}
      <ShareOutsideCard />

      {/* Messaging is not for emergencies and nothing here is watched out
          of hours, so the number sits on the screen rather than a click
          away behind "Support". */}
      <section className="rounded-card-nested bg-surface-sunken p-inset-md">
        <div className="flex items-start gap-inline-md">
          <Headset
            aria-hidden="true"
            className="size-5 shrink-0 text-fg-brand"
          />
          <div className="min-w-0">
            <h2 className="text-heading-5 text-fg">Need help now?</h2>
            <p className="mt-0.5 text-body-sm text-fg-secondary">
              Messages are not watched around the clock. For anything urgent,
              call your dialysis center.
            </p>
          </div>
        </div>
        {/* A real `tel:` link: on a phone this is the control that matters,
            and an anchor is what the OS and a long-press understand. */}
        <a
          href={`tel:${URGENT_PHONE.replace(/[^\d+]/g, "")}`}
          className={cn(
            buttonStyles({ size: "small", fullWidth: true }),
            "mt-stack-md",
          )}
        >
          <Phone aria-hidden="true" />
          Call {URGENT_PHONE}
        </a>
      </section>
    </div>
  );
}

export default function MemberMessages() {
  const {
    conversations: allConversations,
    isLoading,
    error,
    sendMessage,
    startConversation,
    markRead,
    writeError,
    isSending,
    clearWriteError,
  } = useMessages();
  const [composing, setComposing] = useState<Compose | null>(null);
  /* Not an emergency service: the safety notice before every send, and
     the automatic reply after hours (client, 2026-10-07). */
  const { language } = useLanguage();
  const safety = useSafetyNotice(language === "ES");
  const afterHoursReply = useAfterHoursReply();

  /* The member's slice of the one platform-wide store. Their thread with
     the centre is the same record the clinic screen works, so a reply
     typed here turns up in the clinic inbox and the other way round. */
  const memberName = useMemberName();
  const conversations = useMemo(
    () => rules.memberConversations(allConversations, memberName),
    [allConversations, memberName],
  );

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MemberInboxFilter>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
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

  const open = useCallback(
    (conversation: Conversation) => {
      setActiveId(conversation.id);
      setUnreadAtOpen(conversation.unread);
      if (conversation.unread > 0) markRead(conversation.id);
    },
    [markRead],
  );

  /* ↑/↓ walk the list as it is ordered on screen, and Escape leaves the
     thread. Ignored while a field has focus, or the arrow keys would stop
     moving the text cursor. */
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
      if (visible.length === 0) return;
      event.preventDefault();
      const current = activeId
        ? visible.findIndex((c) => c.id === activeId)
        : -1;
      const next =
        event.key === "ArrowDown"
          ? Math.min(current + 1, visible.length - 1)
          : Math.max(current - 1, 0);
      open(visible[next]);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, activeId, open]);

  const unread = rules.totalUnread(conversations);
  const filters: FilterOption<MemberInboxFilter>[] = [
    { id: "all", label: "All" },
    { id: "care-team", label: "Care Team" },
    { id: "appointments", label: "Appointments" },
    { id: "archived", label: "Archived" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-stack-md">
      {safety.notice}
      <PageTitle
        href="/dashboard/messages"
        action={
          /* Quiet status first, the page's one primary action last. */
          <div className="flex flex-wrap items-center gap-inline-md">
            {unread > 0 ? <Badge tone="info">{unread} unread</Badge> : null}
            <Button
              leadingIcon={<SquarePen aria-hidden="true" />}
              onClick={() => setComposing({ category: "care-team", body: "" })}
            >
              New Message
            </Button>
          </div>
        }
      />

      {writeError ? (
        <Alert
          tone="danger"
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
        skeleton={<Skeleton className={cn(PANE_HEIGHT, "w-full")} />}
        empty={
          <EmptyState
            icon={<MessageSquarePlus />}
            title="No messages yet"
            description="When your care team writes to you, their messages will appear here."
          />
        }
      >
        <Card as="section" padding="none" className="overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[21rem_minmax(0,1fr)] xl:grid-cols-[21rem_minmax(0,1fr)_17rem]">
            {/* Below `lg` the list and the thread take turns. */}
            <div
              className={cn(
                PANE_HEIGHT,
                "flex-col gap-stack-sm p-inset-md lg:flex lg:border-r lg:border-line",
                active ? "hidden" : "flex",
              )}
            >
              <InboxSearch
                value={query}
                onChange={setQuery}
                placeholder="Search messages..."
              />
              <InboxFilters
                options={filters}
                value={filter}
                onChange={setFilter}
              />
              {visible.length === 0 ? (
                <EmptyList searching={query.length > 0} />
              ) : (
                <ol
                  aria-label="Conversations"
                  className="-mx-inset-xs min-h-0 flex-1 space-y-0.5 overflow-y-auto px-inset-xs"
                >
                  {visible.map((conversation) => {
                    const last = rules.lastMessage(conversation);
                    return (
                      <ConversationItem
                        key={conversation.id}
                        avatar={
                          <ContactAvatar contact={conversation.contact} />
                        }
                        title={conversation.contact.name}
                        preview={previewOf(conversation, "member")}
                        time={
                          last ? rules.inboxTimeLabel(last.sentAt, now) : null
                        }
                        hasAttachment={rules.hasAttachment(conversation)}
                        unread={conversation.unread}
                        active={conversation.id === activeId}
                        onSelect={() => open(conversation)}
                      />
                    );
                  })}
                </ol>
              )}
            </div>

            <div
              className={cn(
                PANE_HEIGHT,
                "flex-col lg:flex",
                active ? "flex" : "hidden",
              )}
            >
              {active ? (
                <>
                  <ThreadHeader
                    avatar={<ContactAvatar contact={active.contact} />}
                    title={active.contact.name}
                    subtitle={
                      active.contact.online
                        ? `${active.contact.role} · Online`
                        : active.contact.role
                    }
                    onBack={() => setActiveId(null)}
                  />
                  <MessageLog
                    conversation={active}
                    mine="member"
                    otherName={active.contact.name}
                    firstUnreadId={firstUnreadIdOf(active, unreadAtOpen)}
                    now={now}
                  />
                  {!rules.memberCanMessage(active.contact) ? (
                    <p className="border-t border-line-subtle px-inset-md py-inset-sm text-body-sm text-fg-muted">
                      Physicians can&apos;t be messaged directly. Message your
                      nurse or care team and they will bring your physician in.
                    </p>
                  ) : (
                    <Composer
                      key={active.id}
                      draft={drafts[active.id] ?? ""}
                      onDraftChange={(next) =>
                        setDrafts((current) => ({
                          ...current,
                          [active.id]: next,
                        }))
                      }
                      sending={isSending}
                      confirmSend={safety.guard}
                      onSend={(body, attachment) =>
                        sendMessage(
                          active.id,
                          body,
                          "member",
                          attachment,
                          afterHoursReply(),
                        )
                      }
                      placeholder={`Message ${active.contact.name.split(",")[0]}...`}
                      label={`Message ${active.contact.name}`}
                    />
                  )}
                </>
              ) : (
                <NoThread
                  icon={<MessageSquarePlus />}
                  title="Pick a conversation"
                  description="Choose someone on your care team to read and reply, or start a new message."
                />
              )}
            </div>

            {/* On a phone the open thread gets the whole screen; the rail
                comes back with the list. */}
            <aside
              aria-label="Quick actions and help"
              className={cn(
                "border-t border-line p-inset-md lg:col-span-2 lg:block xl:col-span-1 xl:h-[calc(100dvh-13rem)] xl:min-h-[560px] xl:overflow-y-auto xl:border-t-0 xl:border-l",
                active && "hidden",
              )}
            >
              <MemberRail onCompose={setComposing} />
            </aside>
          </div>
        </Card>
      </AsyncSection>

      {composing ? (
        <NewMessageModal
          title="New Message"
          recipientLabel="To"
          withCategory
          initialBody={composing.body}
          initialCategory={composing.category}
          recipients={[
            FACILITY,
            NEPHROLOGY_OFFICE,
            ...rules.careTeamFor(conversations).filter(rules.memberCanMessage),
          ].map((contact) => ({
            value: contact.name,
            label: `${contact.name} · ${contact.role}`,
          }))}
          confirmSend={safety.guard}
          onSend={(to, body, category) => {
            const contact =
              [
                FACILITY,
                NEPHROLOGY_OFFICE,
                ...rules.careTeamFor(conversations),
              ].find((c) => c.name === to) ?? FACILITY;
            const existing = conversations.find(
              (c) => c.contact.name === contact.name,
            );
            startConversation(
              {
                memberName,
                contact,
                category,
                body,
                author: "member",
              },
              afterHoursReply(),
            );
            setActiveId(
              existing?.id ?? rules.conversationIdFor(memberName, contact.name),
            );
          }}
          onClose={() => setComposing(null)}
        />
      ) : null}
    </div>
  );
}
