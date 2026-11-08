"use client";

import type { CareTeamContact } from "@/features/messaging/messaging.types";
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
import { uploadErrorMessage, UploadError } from "@/lib/api/upload";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { saveErrorText } from "@/features/profile/saveError";
import { LoadMore } from "@/features/profile/LoadMore";
import { NewMessageModal } from "@/features/messaging/NewMessageModal";
import { OfficeShareOutside } from "@/features/secure-messages/ShareOutsideCard";
import { ClinicRideRequests } from "./RideRequests";
import { useCan } from "@/features/staff/useStaffAccounts";
import { TeamMessages } from "@/features/staff/TeamMessages";
import * as rules from "@/features/messaging/messaging.rules";
import { fromOfficeConversation } from "@/features/messaging/messaging.mappers";
import {
  useActiveOffice,
  useAttachmentLink,
  useClinicNote,
  useOfficeInbox,
  useOfficeInboxCount,
  useOfficeMessaging,
  useOfficeRecipients,
  useThread,
  withMessages,
  type ThreadTarget,
} from "@/features/messaging/useConversations";
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
   they are talking to.

   Phase 11: the inbox is the server's (`/organizations/:id/conversations`),
   read in the office context the staff member signed in to (the
   X-Organization-Id header), so an office only ever sees its own patients'
   threads. Every thread and patient is found by the server's id, never by
   a name or an MRN; flag, archive and read state are the office's own, per
   thread, on the server. The note in the rail is the office's private note
   (never shown to the patient).

   Below `xl` there is not room for three, so the rail folds under the
   thread; below `lg` the inbox and the thread take turns, with a back
   button returning to the list.
   ========================================================================== */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The patient a "Message" link names (`?patient=<id>`), or null. Only a
 *  server id is accepted: an MRN or a name in the URL is ignored. */
function linkedPatientId(): string | null {
  if (typeof window === "undefined") return null;
  const id = new URLSearchParams(window.location.search).get("patient");
  return id && UUID.test(id) ? id : null;
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

/** The clinic's private note on a patient. Staff only; the member never
 *  sees it. Closes once the server has it; a refusal keeps the text. */
function NoteModal({
  initial,
  onSave,
  onClose,
  saving,
  error,
}: {
  initial: string;
  onSave: (notes: string) => Promise<unknown>;
  onClose: () => void;
  saving: boolean;
  error?: string;
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
            loading={saving}
            onClick={() => {
              onSave(text).then(onClose, () => {
                /* The error shows above the field; the text stays. */
              });
            }}
          >
            Save Note
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {error ? <Alert tone="danger">{error}</Alert> : null}
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
      </div>
    </Modal>
  );
}

function PatientRail({
  conversation,
  organizationId,
  canWrite,
  onToggleFlag,
  onMarkUnread,
  onToggleArchive,
  onScheduleCall,
}: {
  conversation: Conversation;
  organizationId: string | null;
  canWrite: boolean;
  onToggleFlag: () => void;
  onMarkUnread: () => void;
  onToggleArchive: () => void;
  /** Starts a reply offering a call, for the staff member to finish. */
  onScheduleCall: () => void;
}) {
  const [editingNote, setEditingNote] = useState(false);
  const note = useClinicNote(organizationId, conversation.patientId ?? null);
  const mrn = conversation.patient?.mrn;

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
            </div>
          </div>
          <dl className="space-y-1.5">
            <RailRow label="MRN" value={mrn ?? "—"} />
          </dl>
          {note.error ? (
            <p className="mt-stack-sm border-t border-line pt-inset-xs text-body-sm text-fg-muted">
              {errorMessageFor(note.error, "The note did not load.", "en")}
            </p>
          ) : note.note ? (
            <p className="mt-stack-sm border-t border-line pt-inset-xs text-body-sm whitespace-pre-line text-fg-secondary">
              {note.note}
            </p>
          ) : null}
        </div>
      </RailSection>

      <RailSection title="Quick Actions">
        <ul className="space-y-0.5">
          {conversation.patientId ? (
            <RailActionItem
              label="View Patient Profile"
              icon={UserRound}
              href={`/dashboard/clinic/members?patient=${encodeURIComponent(conversation.patientId)}`}
            />
          ) : null}
          {canWrite ? (
            <RailActionItem
              label="Schedule Call"
              icon={CalendarClock}
              onClick={onScheduleCall}
            />
          ) : null}
          {canWrite && !note.error && !note.isPending ? (
            <RailActionItem
              label={note.note ? "Edit Note" : "Add Note"}
              icon={NotebookPen}
              onClick={() => setEditingNote(true)}
            />
          ) : null}
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
          initial={note.note}
          saving={note.save.isPending}
          error={
            note.save.error ? saveErrorText(note.save.error, "en") : undefined
          }
          onSave={(text) => note.save.mutateAsync(text)}
          onClose={() => {
            note.save.reset();
            setEditingNote(false);
          }}
        />
      ) : null}
    </div>
  );
}

/** @deprecated The prototype's roster row. The inbox writes to the office's
 *  roster from the server (by patient id); a passed list is ignored. Kept
 *  so callers in other lanes compile until they drop the prop. */
export type InboxPatient = {
  name: string;
  mrn: string;
  program: string;
  enrolledOn: string;
  status: string;
};

export default function ClinicMessages({
  office: officeOverride,
  href = "/dashboard/clinic/messages",
  showRides = true,
}: {
  /** The office's display name, when the signed-in context has none.
   *  Which inbox is read is the signed-in office context, never this. */
  office?: CareTeamContact;
  href?: string;
  /** @deprecated Ignored: recipients are the office's roster from the
   *  server, by patient id. */
  patients?: InboxPatient[];
  /** Ride requests belong to the dialysis center's inbox, not a
   *  hospital's (client, 2026-10-13). */
  showRides?: boolean;
} = {}) {
  const activeOffice = useActiveOffice();
  const organizationId = activeOffice.organizationId;
  const office = useMemo<CareTeamContact>(
    () =>
      activeOffice.contact.name
        ? activeOffice.contact
        : (officeOverride ?? activeOffice.contact),
    [activeOffice.contact, officeOverride],
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("all");
  const inbox = useOfficeInbox(organizationId, filter, office);
  const conversations = inbox.conversations;
  const unreadCount = useOfficeInboxCount(organizationId, "unread");
  const flaggedCount = useOfficeInboxCount(organizationId, "flagged");
  const messaging = useOfficeMessaging(organizationId);
  const { writeError, isSending, clearWriteError, markRead } = messaging;
  const [composing, setComposing] = useState(false);
  /* The patient a "Message" link named (by id), preselected in New Message. */
  const [composeTo, setComposeTo] = useState<string | undefined>();
  const canReply = useCan("messages.reply");
  const canTeam = useCan("messages.team");
  const recipients = useOfficeRecipients(composing ? organizationId : null);
  /* The open thread, kept as it was opened: a server filter (Unread) may
     drop it from the list the moment it is read, and the reader is still
     in it. The list's fresher copy wins while it has one. */
  const [opened, setOpened] = useState<Conversation | null>(null);
  const activeId = opened?.id ?? null;
  /* Drafts live up here, keyed by thread. A coordinator is interrupted
     mid-reply constantly — losing what they had typed because they glanced
     at another patient is the kind of small betrayal that stops people
     trusting a tool. */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  /* How many messages were unread when each thread was opened, so the
     "New" rule can stay put after the badge clears. */
  const [unreadAtOpen, setUnreadAtOpen] = useState<Record<string, number>>({});

  /* One instant for the whole screen, so every "2h" and every "Today" is
     measured against the same clock. A minute is as fine as these labels
     get. */
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const target = useMemo<ThreadTarget>(
    () => ({ kind: "office", organizationId }),
    [organizationId],
  );
  const thread = useThread(target, activeId);
  const attachmentLink = useAttachmentLink(target);
  const active = useMemo(
    () =>
      withMessages(
        conversations.find((c) => c.id === activeId) ?? opened,
        thread.messages,
      ),
    [conversations, activeId, opened, thread.messages],
  );

  /* The server filtered the folder; the search covers the loaded rows. */
  const visible = useMemo(
    () => rules.sortByRecent(rules.searchConversations(conversations, query)),
    [conversations, query],
  );
  const visibleIds = useMemo(() => visible.map((c) => c.id), [visible]);

  const open = useCallback(
    (conversation: Conversation) => {
      setOpened(conversation);
      setUnreadAtOpen((current) => ({
        ...current,
        [conversation.id]: conversation.unread,
      }));
      if (conversation.unread > 0) markRead(conversation.id);
    },
    [markRead],
  );

  /* A link here can name a thread (?thread=<id>), as Reports' Open
     Questions does, so "Reply" lands on the patient's conversation rather
     than the top of the inbox. Followed once, when the inbox has loaded. */
  const deepLinked = useRef(false);
  useEffect(() => {
    if (deepLinked.current || inbox.isPending) return;
    const id = new URLSearchParams(window.location.search).get("thread");
    const found = id ? conversations.find((c) => c.id === id) : undefined;
    if (!found) {
      deepLinked.current = true;
      return;
    }
    const timer = window.setTimeout(() => {
      deepLinked.current = true;
      open(found);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [inbox.isPending, conversations, open]);

  /* "Message" on a patient (?patient=<id>) opens that patient's thread, or
     New Message addressed to them when there is none yet. */
  const [linkedPatient] = useState(linkedPatientId);
  const linked = useOfficeInbox(
    linkedPatient ? organizationId : null,
    "all",
    office,
    { patientId: linkedPatient ?? undefined, enabled: linkedPatient !== null },
  );
  const addressed = useRef(false);
  useEffect(() => {
    if (addressed.current || !linkedPatient || linked.isPending) return;
    const existing = linked.conversations[0];
    const timer = window.setTimeout(() => {
      addressed.current = true;
      if (existing) open(existing);
      else if (canReply && !linked.error) {
        setComposeTo(linkedPatient);
        setComposing(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [
    linkedPatient,
    linked.isPending,
    linked.conversations,
    linked.error,
    open,
    canReply,
  ]);

  /* ↑/↓ walk the inbox and Escape leaves the thread, because a clinic
     working a queue of ninety messages should not have to aim at each one.
     Ignored while a field has focus, or the arrow keys would stop moving
     the text cursor. */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const el = event.target as HTMLElement | null;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el?.isContentEditable;

      if (event.key === "Escape" && !typing) {
        setOpened(null);
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

  const filters: FilterOption<InboxFilter>[] = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread", count: unreadCount },
    { id: "flagged", label: "Flagged", count: flaggedCount },
    { id: "archived", label: "Archived" },
  ];

  return (
    <div className="space-y-stack-md">
      <PageTitle
        href={href}
        action={
          /* Quiet status first, the page's one primary action last. */
          <div className="flex flex-wrap items-center gap-inline-md">
            {unreadCount > 0 ? (
              <Badge tone="info">{unreadCount} unread</Badge>
            ) : null}
            {/* People not on NephroReach — a rehab facility, an outside
                nephrology office — get a secure link (client,
                2026-10-18). */}
            {canReply ? <OfficeShareOutside sender={office.name} /> : null}
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
          {writeError instanceof UploadError
            ? uploadErrorMessage(writeError)
            : saveErrorText(writeError, "en")}
        </Alert>
      ) : null}

      <AsyncSection
        pending={inbox.isPending && filter === "all"}
        error={inbox.error}
        onRetry={canRetry(inbox.error) ? inbox.refetch : undefined}
        errorTitle={errorTitleFor(inbox.error, "Your inbox did not load", "en")}
        errorMessage={errorMessageFor(inbox.error, undefined, "en")}
        isEmpty={
          filter === "all" && !inbox.isPending && conversations.length === 0
        }
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
              {inbox.isPending ? (
                <Skeleton className="h-40 w-full" />
              ) : visible.length === 0 ? (
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
              <LoadMore read={inbox} />
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
                      active.patient?.mrn
                        ? `MRN ${active.patient.mrn}`
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
                    onBack={() => setOpened(null)}
                  />
                  <AsyncSection
                    pending={thread.isPending}
                    error={thread.error}
                    onRetry={
                      canRetry(thread.error) ? thread.refetch : undefined
                    }
                    errorTitle={errorTitleFor(
                      thread.error,
                      "The conversation did not load",
                      "en",
                    )}
                    errorMessage={errorMessageFor(
                      thread.error,
                      undefined,
                      "en",
                    )}
                    skeleton={<Skeleton className="m-inset-md h-40" />}
                  >
                    <MessageLog
                      conversation={active}
                      mine="clinic"
                      otherName={active.memberName}
                      firstUnreadId={firstUnreadIdOf(
                        active,
                        unreadAtOpen[active.id] ?? 0,
                      )}
                      now={now}
                      older={thread}
                      attachmentLink={(messageId) =>
                        attachmentLink(active.id, messageId)
                      }
                    />
                  </AsyncSection>
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
                        return messaging.send.mutateAsync({
                          conversationId: active.id,
                          body,
                          attachment,
                        });
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
                  key={active.id}
                  conversation={active}
                  organizationId={organizationId}
                  canWrite={canReply}
                  /* The explicit value, never a toggle. */
                  onToggleFlag={() =>
                    messaging.setFlagged(active.id, !active.flagged)
                  }
                  onScheduleCall={() =>
                    setDrafts((current) => ({
                      ...current,
                      [active.id]:
                        "We would like to set up a call with you. Would one of these times work for you? ",
                    }))
                  }
                  /* Marking unread or archiving is a decision to leave the
                     thread, so the pane closes rather than sitting open on
                     a conversation the list no longer shows. */
                  onMarkUnread={() => {
                    messaging.markUnread(active.id);
                    setOpened(null);
                  }}
                  onToggleArchive={() => {
                    messaging.setArchived(active.id, !active.archived);
                    setOpened(null);
                  }}
                />
              </aside>
            ) : null}
          </div>
        </Card>
      </AsyncSection>
      {/* Rides to access appointments: the social worker books them from
          here, beside the patients' messages (client, 2026-10-01). */}
      {showRides ? <ClinicRideRequests /> : null}
      {/* Staff to staff: nurses message the physicians (client,
          2026-10-06). */}
      {canTeam ? <TeamMessages /> : null}

      {composing ? (
        <NewMessageModal
          title="New Message"
          recipientLabel="Patient"
          initialRecipient={composeTo}
          recipients={recipients.patients.map((patient) => ({
            value: patient.patientId,
            label: patient.mrn
              ? `${patient.name} · MRN ${patient.mrn}`
              : patient.name,
          }))}
          recipientsPending={recipients.isPending}
          recipientsError={
            recipients.error
              ? saveErrorText(recipients.error, "en")
              : recipients.isPending || recipients.patients.length > 0
                ? undefined
                : "No patients are on this office's roster yet."
          }
          sending={messaging.start.isPending}
          sendError={
            messaging.start.error
              ? messaging.start.error instanceof UploadError
                ? uploadErrorMessage(messaging.start.error)
                : saveErrorText(messaging.start.error, "en")
              : undefined
          }
          onSend={async (patientId, body) => {
            const started = await messaging.start.mutateAsync({
              patientId,
              body,
            });
            setOpened(
              conversations.find((c) => c.id === started.id) ??
                fromOfficeConversation(started, office),
            );
          }}
          onClose={() => {
            messaging.start.reset();
            setComposing(false);
            setComposeTo(undefined);
          }}
        />
      ) : null}
    </div>
  );
}
