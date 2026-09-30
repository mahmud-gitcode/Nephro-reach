"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  CalendarClock,
  Flag,
  MailOpen,
  MessageSquare,
  NotebookPen,
  SquarePen,
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
  FormField,
  Modal,
  Skeleton,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { FACILITY } from "@/features/messaging/messaging.seed";
import { NewMessageModal } from "@/features/messaging/NewMessageModal";
import { useClinicData } from "./useClinicData";
import { useCan } from "@/features/staff/useStaffAccounts";
import * as rules from "@/features/messaging/messaging.rules";
import { useMessages } from "@/features/messaging/useMessages";
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
} from "@/features/messaging/MessagingUi";
import type {
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

/** The clinic's private note on a patient. Staff only; the member never
 *  sees it. */
function NoteModal({
  initial,
  onSave,
  onClose,
}: {
  initial: string;
  onSave: (notes: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(initial);
  return (
    <Modal
      open
      onClose={onClose}
      title="Patient Note"
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(text);
              onClose();
            }}
          >
            Save Note
          </Button>
        </>
      }
    >
      <FormField
        label="Note"
        hint="Visible to clinic staff only. The patient never sees it."
      >
        {(field) => (
          <Textarea
            {...field}
            rows={5}
            maxLength={1000}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        )}
      </FormField>
    </Modal>
  );
}

function PatientRail({
  conversation,
  onToggleFlag,
  onMarkUnread,
  onToggleArchive,
  onScheduleCall,
  onSaveNote,
}: {
  conversation: Conversation;
  onToggleFlag: () => void;
  onMarkUnread: () => void;
  onToggleArchive: () => void;
  /** Starts a reply offering a call, for the staff member to finish. */
  onScheduleCall: () => void;
  onSaveNote: (notes: string) => void;
}) {
  const { patient } = conversation;
  const [editingNote, setEditingNote] = useState(false);
  /* Every thread this screen lists has a chart — `clinicConversations`
     sees to that — so this is a type narrowing, not an expected state. */
  if (!patient) return null;

  return (
    <div className="space-y-stack-lg">
      <RailSection title="Patient Information">
        <div className="rounded-card-nested border border-line p-inset-sm">
          <div className="mb-stack-sm flex items-center gap-inline-md">
            <MessagingAvatar name={conversation.memberName} />
            <div className="min-w-0">
              <p className="truncate text-label-md text-fg">
                {conversation.memberName}
              </p>
              <Badge tone="success">{patient.status}</Badge>
            </div>
          </div>
          <dl className="space-y-1.5">
            <RailRow label="DOB" value={patient.dob} />
            <RailRow label="Age" value={patient.age ?? "—"} />
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
      </RailSection>

      <RailSection title="Quick Actions">
        <ul className="space-y-0.5">
          <RailActionItem
            label="View Patient Profile"
            icon={UserRound}
            href={`/dashboard/clinic/members?mrn=${encodeURIComponent(patient.mrn)}`}
          />
          <RailActionItem
            label="Schedule Call"
            icon={CalendarClock}
            onClick={onScheduleCall}
          />
          <RailActionItem
            label={patient.notes ? "Edit Note" : "Add Note"}
            icon={NotebookPen}
            onClick={() => setEditingNote(true)}
          />
          <RailActionItem
            label={
              conversation.flagged ? "Unflag Conversation" : "Flag Conversation"
            }
            icon={Flag}
            onClick={onToggleFlag}
          />
        </ul>
      </RailSection>

      <RailSection title="Conversation Tools">
        <ul className="space-y-0.5">
          <RailActionItem
            label="Mark as Unread"
            icon={MailOpen}
            onClick={onMarkUnread}
          />
          <RailActionItem
            label={
              conversation.archived
                ? "Restore Conversation"
                : "Archive Conversation"
            }
            icon={conversation.archived ? ArchiveRestore : Archive}
            onClick={onToggleArchive}
          />
        </ul>
      </RailSection>
      {editingNote ? (
        <NoteModal
          initial={patient.notes}
          onSave={onSaveNote}
          onClose={() => setEditingNote(false)}
        />
      ) : null}
    </div>
  );
}

export default function ClinicMessages() {
  const {
    conversations: allConversations,
    isLoading,
    error,
    sendMessage,
    startConversation,
    markRead,
    toggleFlag,
    markUnread,
    setArchived,
    setPatientNotes,
    writeError,
    isSending,
    clearWriteError,
  } = useMessages();
  /* One store holds every thread on the platform; this screen works the
     facility's queue, one row per patient. A member's thread with their
     own dietitian lives in the same store and belongs to the member
     portal, not here. */
  const conversations = useMemo(
    () => rules.clinicConversations(allConversations),
    [allConversations],
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [composing, setComposing] = useState(false);
  const canReply = useCan("messages.reply");
  /* Every patient on the clinic's list, newly enrolled ones included. */
  const clinicData = useClinicData();
  const patients = clinicData.data?.patients ?? [];
  const [activeId, setActiveId] = useState<string | null>(null);
  /* Drafts live up here, keyed by thread. A coordinator is interrupted
     mid-reply constantly — losing what they had typed because they glanced
     at another patient is the kind of small betrayal that stops people
     trusting a tool. */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  /* How many messages were unread when each thread was opened, so the
     "New" rule can stay put after the badge clears. */
  const [unreadAtOpen, setUnreadAtOpen] = useState<Record<string, number>>({});

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
  const visibleIds = useMemo(() => visible.map((c) => c.id), [visible]);

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
  const counts = rules.filterCounts(conversations);
  const filters: FilterOption<InboxFilter>[] = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread", count: counts.unread },
    { id: "flagged", label: "Flagged", count: counts.flagged },
    { id: "archived", label: "Archived" },
  ];

  return (
    <div className="space-y-stack-md">
      <PageTitle
        href="/dashboard/clinic/messages"
        action={
          /* Quiet status first, the page's one primary action last. */
          <div className="flex flex-wrap items-center gap-inline-md">
            {unread > 0 ? <Badge tone="info">{unread} unread</Badge> : null}
            {canReply ? (
              <Button
                leadingIcon={<SquarePen aria-hidden="true" />}
                onClick={() => setComposing(true)}
              >
                New Message
              </Button>
            ) : null}
          </div>
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

      <AsyncSection
        pending={isLoading}
        error={error}
        isEmpty={conversations.length === 0}
        skeleton={<Skeleton className={cn(PANE_HEIGHT, "w-full")} />}
        empty={
          <EmptyState
            icon={<MessageSquare aria-hidden="true" />}
            title="No conversations yet"
            description="Messages from your enrolled members will appear here."
          />
        }
      >
        <Card as="section" padding="none" className="overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[21rem_minmax(0,1fr)] xl:grid-cols-[21rem_minmax(0,1fr)_18rem]">
            {/* Below `lg` the inbox and the thread take turns. */}
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
                placeholder="Search patients or messages..."
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
                          <MessagingAvatar name={conversation.memberName} />
                        }
                        title={conversation.memberName}
                        titleExtra={
                          conversation.flagged ? (
                            <Flag
                              aria-label="Flagged"
                              className="size-3.5 shrink-0 text-warning"
                            />
                          ) : null
                        }
                        preview={previewOf(conversation, "clinic")}
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
                    avatar={<MessagingAvatar name={active.memberName} />}
                    title={active.memberName}
                    subtitle={
                      active.patient
                        ? `MRN ${active.patient.mrn} · ${active.patient.program}`
                        : undefined
                    }
                    extra={
                      active.flagged ? (
                        <Badge
                          tone="warning"
                          icon={<Flag aria-hidden="true" />}
                        >
                          Flagged
                        </Badge>
                      ) : null
                    }
                    onBack={() => setActiveId(null)}
                  />
                  <MessageLog
                    conversation={active}
                    mine="clinic"
                    otherName={active.memberName}
                    firstUnreadId={firstUnreadIdOf(
                      active,
                      unreadAtOpen[active.id] ?? 0,
                    )}
                    now={now}
                  />
                  {canReply ? (
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
                      onSend={(body, attachment) => {
                        clearWriteError();
                        sendMessage(active.id, body, "clinic", attachment);
                      }}
                      placeholder={`Message ${active.memberName.split(" ")[0]}...`}
                      label={`Message ${active.memberName}`}
                    />
                  ) : (
                    <p className="shrink-0 border-t border-line px-inset-md py-inset-sm text-body-sm text-fg-muted">
                      Your role can read patients&rsquo; messages but not reply.
                      A nurse, physician, social worker, care coordinator or
                      administrator can.
                    </p>
                  )}
                </>
              ) : (
                <NoThread
                  icon={<MessageSquare />}
                  title="Pick a conversation"
                  description="Choose a patient on the left to read and reply to their messages."
                />
              )}
            </div>

            {/* The rail has nothing to say without a patient, so it only
                exists once a thread is open. */}
            {active ? (
              <aside
                aria-label="Patient information"
                className="border-t border-line p-inset-md lg:col-span-2 xl:col-span-1 xl:h-[calc(100dvh-13rem)] xl:min-h-[560px] xl:overflow-y-auto xl:border-t-0 xl:border-l"
              >
                <PatientRail
                  conversation={active}
                  onToggleFlag={() => toggleFlag(active.id)}
                  onScheduleCall={() =>
                    setDrafts((current) => ({
                      ...current,
                      [active.id]:
                        "We would like to set up a call with you. Would one of these times work for you? ",
                    }))
                  }
                  onSaveNote={(notes) => setPatientNotes(active.id, notes)}
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
              </aside>
            ) : null}
          </div>
        </Card>
      </AsyncSection>
      {composing ? (
        <NewMessageModal
          title="New Message"
          recipientLabel="Patient"
          recipients={patients.map((patient) => ({
            value: patient.mrn,
            label: `${patient.name} · MRN ${patient.mrn}`,
          }))}
          onSend={(mrn, body) => {
            const patient = patients.find((p) => p.mrn === mrn);
            if (!patient) return;
            const existing = conversations.find(
              (c) => c.memberName === patient.name,
            );
            startConversation({
              memberName: patient.name,
              contact: FACILITY,
              category: "care-team",
              body,
              author: "clinic",
              patient: {
                dob: "—",
                mrn: patient.mrn,
                phone: "—",
                email: "—",
                program: patient.program,
                enrolledOn: patient.enrolledOn,
                status: patient.status,
                careTeam: "—",
                notes: "",
              },
            });
            setActiveId(
              existing?.id ??
                rules.conversationIdFor(patient.name, FACILITY.name),
            );
          }}
          onClose={() => setComposing(false)}
        />
      ) : null}
    </div>
  );
}
