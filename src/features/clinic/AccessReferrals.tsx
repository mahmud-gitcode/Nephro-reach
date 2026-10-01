"use client";

import React, { useState } from "react";
import { CalendarPlus, Check, Send, UserPlus, X } from "lucide-react";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  Alert,
  Badge,
  Button,
  Card,
  Chip,
  ChipGroup,
  Composer,
  EmptyState,
  ErrorState,
  FormField,
  Modal,
  SegmentedChoice,
  Select,
  Skeleton,
  SwitchRow,
  Tabs,
  Textarea,
  type BadgeTone,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useNow } from "@/lib/utils/useNow";
import * as messaging from "@/features/messaging/messaging.rules";
import {
  ACCESS_CENTER_NAME,
  CONCERN_KINDS,
  REFERRAL_KINDS,
  SOURCE_LABEL,
  receiverOf,
  type AccessRecord,
  type AccessReferral,
  type ReferralInput,
  type ReferralKind,
  type ReferralSource,
  type ReferralStatus,
} from "@/features/vascular-access/vascularAccess.data";
import {
  useVascularAccess,
  type VascularAccessStore,
} from "@/features/vascular-access/useVascularAccess";
import { useAuth } from "@/features/auth/AuthContext";
import { userCan } from "@/features/staff/staff";
import { UpdatedBar } from "./UpdatedBar";

/* ==========================================================================
   Referrals and office messages — staff to staff, without the patient
   --------------------------------------------------------------------------
   The client (2026-10-01): a dialysis nurse who finds no thrill or bruit
   should alert the access center directly and get an appointment booked,
   not wait for the patient to ask. The access center also takes referrals
   from the nephrology office, and has a Messages page of its own to send
   and receive messages with both offices.

   Every one is a thread: who wrote first, about which patient (or none,
   for a general message), and the replies. The patient never sees them.

   Clinic portal: writes as the dialysis center or the nephrology office
   (which has no login of its own yet).
   Access center: acknowledges, schedules or closes; can write first.
   ========================================================================== */

export const referralTone: Record<ReferralStatus, BadgeTone> = {
  New: "warning",
  Acknowledged: "info",
  Scheduled: "success",
  Closed: "neutral",
};

type Side = "access" | "clinic";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function findingsLabel(ids: string[]) {
  return ids
    .map((id) => CONCERN_KINDS.find((kind) => kind.id === id)?.en ?? id)
    .join(", ");
}

/** The thread's name in a list: its patient, or "General message". */
function subjectOf(referral: AccessReferral) {
  return referral.memberName || "General message";
}

/** Who wrote first, as the thread's first message. */
function openerOf(referral: AccessReferral): "access" | ReferralSource {
  return referral.startedBy ?? referral.source;
}

function orgName(party: "access" | ReferralSource) {
  return party === "access" ? ACCESS_CENTER_NAME : SOURCE_LABEL[party];
}

/** Waiting on this side: new, and addressed to it. */
function waitingOn(referral: AccessReferral, side: Side) {
  const receiver = receiverOf(referral);
  return (
    referral.status === "New" &&
    (side === "access" ? receiver === "access" : receiver !== "access")
  );
}

/* ------------------------------------------------------------------ list */

function ReferralList({
  referrals,
  side,
  onOpen,
  empty,
}: {
  referrals: AccessReferral[];
  side: Side;
  onOpen: (id: string) => void;
  empty: string;
}) {
  const now = useNow();
  if (referrals.length === 0) {
    return <p className="text-body-sm text-fg-muted">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-line-subtle">
      {referrals.map((referral) => {
        const last = referral.replies.at(-1);
        const opener = openerOf(referral);
        const waiting = waitingOn(referral, side);
        return (
          <li key={referral.id} className="py-inset-xs first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => onOpen(referral.id)}
              className={cn(
                "group flex w-full cursor-pointer items-start gap-inline-lg rounded-control-small text-left",
                focusRing,
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-inline-sm">
                  <span
                    className={cn(
                      "text-label-lg group-hover:text-fg-brand group-hover:underline",
                      waiting ? "text-fg" : "text-fg-secondary",
                    )}
                  >
                    {subjectOf(referral)}
                  </span>
                  {referral.urgent ? <Badge tone="danger">Urgent</Badge> : null}
                </span>
                <span className="block text-body-sm text-fg-secondary">
                  {referral.kind}
                  {referral.findings.length > 0
                    ? ` — ${findingsLabel(referral.findings)}`
                    : ""}
                </span>
                <span className="block text-caption text-fg-muted">
                  {side === "access"
                    ? opener === "access"
                      ? `To ${SOURCE_LABEL[referral.source]}`
                      : `${SOURCE_LABEL[referral.source]} · ${referral.sentBy}`
                    : opener === "access"
                      ? `From ${ACCESS_CENTER_NAME} to ${SOURCE_LABEL[referral.source]}`
                      : `From ${SOURCE_LABEL[referral.source]}`}
                  {" · "}
                  {messaging.relativeLabel(
                    last?.sentAt ?? referral.sentAt,
                    now,
                  )}
                  {referral.replies.length > 0
                    ? ` · ${referral.replies.length} repl${referral.replies.length === 1 ? "y" : "ies"}`
                    : ""}
                </span>
              </span>
              <Badge tone={referralTone[referral.status]}>
                {referral.status}
              </Badge>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ----------------------------------------------------------------- panel */

export function ReferralsPanel({
  referrals,
  side,
  canSend,
  onSend,
  onOpen,
}: {
  referrals: AccessReferral[];
  /** "access" receives; "clinic" is the dialysis center / nephrology office. */
  side: Side;
  canSend: boolean;
  onSend: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <Card as="section" padding="small" className="h-full">
      <div className="mb-stack-sm flex items-center justify-between gap-inline-lg">
        <h2 className="text-heading-4 text-fg">
          {side === "access"
            ? "Referrals & Requests"
            : "Access Center Messages"}
        </h2>
        {canSend ? (
          <Button
            size="small"
            variant="neutral"
            appearance="fill-stroke"
            onClick={onSend}
            leadingIcon={<Send aria-hidden="true" />}
          >
            New
          </Button>
        ) : null}
      </div>
      <p className="mb-stack-md text-caption text-fg-muted">
        {side === "access"
          ? "Straight from the dialysis center and the nephrology office. Staff only — the patient does not see these."
          : `Concerns, referrals and messages with ${ACCESS_CENTER_NAME}. Staff only — the patient does not see these.`}
      </p>
      <ReferralList
        referrals={referrals.filter((r) => r.status !== "Closed")}
        side={side}
        onOpen={onOpen}
        empty={
          side === "access"
            ? "No open referrals."
            : "Nothing open with the access center."
        }
      />
    </Card>
  );
}

/* ------------------------------------------------------------- send form */

export function SendReferralModal({
  side,
  patients,
  initialMrn,
  initialKind,
  me,
  onSend,
  onClose,
}: {
  side: Side;
  patients: Array<{ name: string; mrn: string }>;
  initialMrn?: string;
  initialKind?: ReferralKind;
  /** Who is sending. */
  me: string;
  onSend: (input: ReferralInput) => void;
  onClose: () => void;
}) {
  const kinds =
    side === "access"
      ? (["General Message", "Appointment Request"] as ReferralKind[])
      : [...REFERRAL_KINDS];
  const [office, setOffice] = useState<ReferralSource>("dialysis");
  const [kind, setKind] = useState<ReferralKind>(initialKind ?? kinds[0]);
  const [mrn, setMrn] = useState(
    initialMrn ?? (kind === "General Message" ? "" : (patients[0]?.mrn ?? "")),
  );
  const [findings, setFindings] = useState<string[]>([]);
  const [detail, setDetail] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [tried, setTried] = useState(false);
  const general = kind === "General Message";
  const patient = patients.find((p) => p.mrn === mrn);
  const patientError =
    patient || (general && mrn === "") ? undefined : "Choose the patient.";
  const detailError = detail.trim() ? undefined : "Write your message.";

  function toggle(id: string) {
    setFindings((current) =>
      current.includes(id) ? current.filter((f) => f !== id) : [...current, id],
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={side === "access" ? "New Message" : "Message Access Center"}
      description={
        side === "access"
          ? "Goes to the office you choose. The patient does not see it."
          : `Goes straight to ${ACCESS_CENTER_NAME}. The patient does not see it.`
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            leadingIcon={<Send aria-hidden="true" />}
            onClick={() => {
              setTried(true);
              if (patientError || detailError) return;
              onSend({
                source: office,
                ...(side === "access" ? { startedBy: "access" as const } : {}),
                sentBy: me,
                memberName: patient?.name ?? "",
                mrn: patient?.mrn ?? "",
                kind,
                findings,
                detail,
                urgent,
              });
              onClose();
            }}
          >
            Send
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        <SegmentedChoice
          label={side === "access" ? "Send to" : "Sending from"}
          value={office}
          onChange={(next: ReferralSource) => setOffice(next)}
          options={[
            { value: "dialysis", label: "Dialysis Center" },
            { value: "nephrology", label: "Nephrology Office" },
          ]}
        />
        <div className="grid gap-stack-md sm:grid-cols-2">
          <FormField label="Type" required>
            {(field) => (
              <Select
                {...field}
                value={kind}
                onChange={(e) => setKind(e.target.value as ReferralKind)}
              >
                {kinds.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField
            label="Patient"
            required={!general}
            error={tried ? patientError : undefined}
          >
            {(field) => (
              <Select
                {...field}
                value={mrn}
                onChange={(e) => setMrn(e.target.value)}
              >
                {general || mrn === "" ? (
                  <option value="">
                    {general ? "No specific patient" : "Choose a patient"}
                  </option>
                ) : null}
                {patients.map((p) => (
                  <option key={p.mrn} value={p.mrn}>
                    {p.name} · MRN {p.mrn}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </div>
        {kind === "Access Concern" ? (
          <div>
            <p className="mb-stack-xs text-label-md text-fg">Findings</p>
            <ChipGroup label="Findings" selection="multiple">
              {CONCERN_KINDS.map((option) => (
                <Chip
                  key={option.id}
                  selected={findings.includes(option.id)}
                  onClick={() => toggle(option.id)}
                >
                  {option.en}
                </Chip>
              ))}
            </ChipGroup>
          </div>
        ) : null}
        <FormField
          label="Message"
          required
          error={tried ? detailError : undefined}
        >
          {(field) => (
            <Textarea
              {...field}
              rows={4}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={
                kind === "Access Concern"
                  ? "E.g. No thrill or bruit at cannulation this morning. Please evaluate and schedule."
                  : "Write your message."
              }
            />
          )}
        </FormField>
        <SwitchRow
          checked={urgent}
          onChange={setUrgent}
          title="Urgent"
          description="Puts it at the top of the other office's list."
        />
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------- detail popup */

export function ReferralModal({
  referral,
  record,
  side,
  me,
  canReply,
  canAct,
  store,
  onSchedule,
  onStartRecord,
  onClose,
}: {
  referral: AccessReferral;
  /** The patient's access record, when there is one. */
  record: AccessRecord | undefined;
  side: Side;
  me: string;
  canReply: boolean;
  /** The access center may acknowledge, schedule and close. */
  canAct: boolean;
  store: VascularAccessStore;
  /** Absent where the page cannot book (the Messages page). */
  onSchedule?: () => void;
  onStartRecord?: () => void;
  onClose: () => void;
}) {
  const now = useNow();
  const [draft, setDraft] = useState("");
  const open = referral.status !== "Closed";
  const thread = [
    {
      id: referral.id,
      author: openerOf(referral),
      authorName: referral.sentBy,
      body: referral.detail,
      sentAt: referral.sentAt,
    },
    ...referral.replies,
  ];
  const actions = side === "access" && open && canAct;
  const forPatient = referral.mrn !== "";

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={subjectOf(referral)}
      description={
        forPatient ? `MRN ${referral.mrn} · ${referral.kind}` : referral.kind
      }
      footer={
        actions ? (
          <>
            <Button
              variant="neutral"
              appearance="ghost"
              leadingIcon={<X aria-hidden="true" />}
              onClick={() => {
                store.setReferralStatus(referral.id, "Closed", me);
                onClose();
              }}
            >
              Close Thread
            </Button>
            {referral.status === "New" && receiverOf(referral) === "access" ? (
              <Button
                variant="neutral"
                appearance="fill-stroke"
                leadingIcon={<Check aria-hidden="true" />}
                onClick={() =>
                  store.setReferralStatus(referral.id, "Acknowledged", me)
                }
              >
                Acknowledge
              </Button>
            ) : null}
            {forPatient && record && onSchedule ? (
              <Button
                leadingIcon={<CalendarPlus aria-hidden="true" />}
                onClick={onSchedule}
              >
                Schedule Appointment
              </Button>
            ) : null}
            {forPatient && !record && onStartRecord ? (
              <Button
                leadingIcon={<UserPlus aria-hidden="true" />}
                onClick={onStartRecord}
              >
                Start Access Record
              </Button>
            ) : null}
          </>
        ) : undefined
      }
    >
      <div className="space-y-stack-lg">
        <dl className="grid gap-stack-sm text-body-sm sm:grid-cols-3">
          <div>
            <dt className="text-caption text-fg-muted">
              {side === "access" ? "Office" : "With"}
            </dt>
            <dd className="text-label-lg text-fg">
              {side === "access"
                ? SOURCE_LABEL[referral.source]
                : ACCESS_CENTER_NAME}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-fg-muted">Status</dt>
            <dd className="flex flex-wrap gap-inline-sm">
              <Badge tone={referralTone[referral.status]}>
                {referral.status}
              </Badge>
              {referral.urgent ? <Badge tone="danger">Urgent</Badge> : null}
            </dd>
          </div>
          {referral.findings.length > 0 ? (
            <div>
              <dt className="text-caption text-fg-muted">Findings</dt>
              <dd className="text-label-lg text-fg">
                {findingsLabel(referral.findings)}
              </dd>
            </div>
          ) : null}
        </dl>

        {forPatient && !record && side === "access" && onStartRecord ? (
          <p className="text-body-sm text-fg-muted">
            This patient has no access record yet. Start one to schedule.
          </p>
        ) : null}

        <section aria-label="Thread">
          <ol className="space-y-stack-md">
            {thread.map((entry) => {
              const mine =
                side === "access"
                  ? entry.author === "access"
                  : entry.author !== "access";
              return (
                <li
                  key={entry.id}
                  className={cn(
                    "rounded-card-nested p-inset-sm",
                    mine
                      ? "bg-surface-sunken"
                      : "border border-line bg-surface",
                  )}
                >
                  <p className="text-caption text-fg-muted">
                    <span className="text-label-md text-fg">
                      {entry.authorName}
                    </span>
                    {" · "}
                    {orgName(entry.author)}
                    {" · "}
                    {messaging.relativeLabel(entry.sentAt, now)}
                  </p>
                  <p className="mt-stack-xs text-body-sm whitespace-pre-line text-fg">
                    {entry.body}
                  </p>
                </li>
              );
            })}
          </ol>
          {referral.handledBy && referral.handledAt ? (
            <p className="mt-stack-sm text-caption text-fg-muted">
              {referral.status} by {referral.handledBy},{" "}
              {messaging.relativeLabel(referral.handledAt, now)}
            </p>
          ) : null}
        </section>

        {open && canReply ? (
          <Composer
            value={draft}
            onChange={setDraft}
            sending={store.isSaving}
            label={
              side === "access"
                ? `Reply to ${SOURCE_LABEL[referral.source]}`
                : `Reply to ${ACCESS_CENTER_NAME}`
            }
            placeholder={
              side === "access"
                ? `Reply to ${SOURCE_LABEL[referral.source]}…`
                : "Reply to the access center…"
            }
            onSend={(body) => {
              store.replyToReferral(
                referral.id,
                side === "access" ? "access" : referral.source,
                me,
                body,
              );
              setDraft("");
            }}
          />
        ) : !open ? (
          <EmptyState variant="bare" title="This thread is closed" />
        ) : null}
      </div>
    </Modal>
  );
}

/* ----------------------------------------------- access center: Messages */

type Folder = "all" | ReferralSource | "closed";

/** The access center's Messages page: every thread with the dialysis
 *  center and the nephrology office, and a way to start one. Booking
 *  stays on Access Patients. */
export function AccessCenterMessages() {
  const { user } = useAuth();
  const store = useVascularAccess();
  const me = user?.staffRole ? user.name : "Dr. Patel";
  const canReply = userCan(user, "messages.reply");
  const canAct = userCan(user, "access.schedule");
  const [folder, setFolder] = useState<Folder>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  const referrals = store.referrals;
  const count = (f: Folder) =>
    referrals.filter((r) =>
      f === "closed"
        ? r.status === "Closed"
        : r.status !== "Closed" && (f === "all" || r.source === f),
    ).length;
  const shown = referrals.filter((r) =>
    folder === "closed"
      ? r.status === "Closed"
      : r.status !== "Closed" && (folder === "all" || r.source === folder),
  );
  const reading = openId ? referrals.find((r) => r.id === openId) : undefined;
  /* Its own patients, and anyone an office has written about. */
  const patients = [
    ...store.records.map((r) => ({ name: r.memberName, mrn: r.mrn })),
    ...referrals
      .filter(
        (r) => r.mrn && !store.records.some((record) => record.mrn === r.mrn),
      )
      .map((r) => ({ name: r.memberName, mrn: r.mrn })),
  ].filter((p, i, all) => all.findIndex((q) => q.mrn === p.mrn) === i);

  let body: React.ReactNode;
  if (store.error) {
    body = (
      <ErrorState
        title="Messages could not be loaded"
        error={store.error}
        onRetry={store.refetch}
      />
    );
  } else if (store.isPending) {
    body = <Skeleton className="h-96 w-full" />;
  } else {
    body = (
      <Card as="section" padding="small">
        <Tabs
          label="Folders"
          value={folder}
          onChange={setFolder}
          className="mb-stack-lg"
          items={[
            { id: "all", label: `All Open (${count("all")})` },
            {
              id: "dialysis",
              label: `Dialysis Center (${count("dialysis")})`,
            },
            {
              id: "nephrology",
              label: `Nephrology Office (${count("nephrology")})`,
            },
            { id: "closed", label: `Closed (${count("closed")})` },
          ]}
        />
        <ReferralList
          referrals={shown}
          side="access"
          onOpen={setOpenId}
          empty={
            folder === "closed" ? "No closed threads." : "No open messages."
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <PageTitle
        href="/dashboard/access-center/messages"
        action={
          <div className="flex flex-wrap items-center gap-inline-md">
            <UpdatedBar
              updatedAt={store.updatedAt}
              isFetching={store.isFetching}
              refetch={store.refetch}
            />
            {canReply ? (
              <Button
                size="small"
                onClick={() => setComposing(true)}
                leadingIcon={<Send aria-hidden="true" />}
              >
                New Message
              </Button>
            ) : null}
          </div>
        }
      />
      {store.writeError ? (
        <Alert tone="danger" onDismiss={store.clearWriteError}>
          That change did not save. Try again.
        </Alert>
      ) : null}
      {body}
      {reading ? (
        <ReferralModal
          key={reading.id}
          referral={reading}
          record={store.records.find((r) => r.mrn === reading.mrn)}
          side="access"
          me={me}
          canReply={canReply}
          canAct={canAct}
          store={store}
          onClose={() => setOpenId(null)}
        />
      ) : null}
      {composing ? (
        <SendReferralModal
          side="access"
          patients={patients}
          me={me}
          onSend={store.sendReferral}
          onClose={() => setComposing(false)}
        />
      ) : null}
    </div>
  );
}
