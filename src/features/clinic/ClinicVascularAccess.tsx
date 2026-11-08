"use client";

import React, { useEffect, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  BellRing,
  CalendarPlus,
  Check,
  Eye,
  MessageSquareText,
  Search,
  Send,
  UserPlus,
} from "lucide-react";
import {
  AlertTriangleSolid,
  ClockSolid,
  UsersSolid,
} from "@/components/icons/solid";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  Alert,
  Badge,
  Button,
  buttonStyles,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  KeyCard,
  Modal,
  SegmentedChoice,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tabs,
  TabPanel,
} from "@/components/ui";
import { isApiError } from "@/lib/api/client";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { cn } from "@/lib/utils/cn";
import { useNow } from "@/lib/utils/useNow";
import * as messaging from "@/features/messaging/messaging.rules";
import { useDirectory } from "@/features/profile/directory";
import {
  ACCESS_STATUSES,
  ACCESS_TYPES,
  APPOINTMENT_TYPES,
  CONCERN_KINDS,
  TEAM_LABEL,
  addDays,
  dayKey,
  formatDay,
  formatTime,
  openConcerns,
  sortedHistory,
  sortedUpdates,
  transportFor,
  upcomingAppointments,
  type AccessRosterRow,
  type AccessStatus,
  type AccessTeam,
  type ReferralKind,
  type ReferralSource,
} from "@/features/vascular-access/vascularAccess.data";
import {
  AccessConversationView,
  AccessPicture,
  AccessStatusBadge,
  AppointmentRow,
  HistoryTable,
  UpdatesTimeline,
  TransportStatusBadge,
} from "@/features/vascular-access/AccessUi";
import {
  listConcerns,
  type AccessTarget,
} from "@/features/vascular-access/access.repository";
import { toConcern } from "@/features/vascular-access/access.mapper";
import {
  accessKey,
  useAccessActions,
  useAccessRecord,
  useAccessRoster,
  useOfficeOrgId,
  useOfficeTarget,
  type AccessActions,
} from "@/features/vascular-access/useAccess";
import { useAuth } from "@/features/auth/AuthContext";
import { userCan } from "@/features/staff/staff";
import { tableIconButton } from "./tableButton";
import { RideRequestsPanel } from "./RideRequests";
import { ShareLogCard } from "@/features/personal-log/ShareLogCard";
import { UpdatedBar } from "./UpdatedBar";
import {
  ReferralModal,
  ReferralsPanel,
  SendReferralModal,
} from "./AccessReferrals";
import {
  useOfficePatients,
  useReferralActions,
  useReferrals,
} from "./useAccessReferrals";

/* ==========================================================================
   Vascular Access — the staff side
   --------------------------------------------------------------------------
   The other end of the member's Vascular Access tab, for both
   organisations that care for the access, each from its own login:

     dialysis   the Dialysis Center (clinic role): refers concerns to the
                access center directly, and joins the conversation when
                allowed. Its rides live on its Messages page too.
     access     the Vascular Access Center (access role): its own
                organisation; manages privacy and who may post

   On the API (Phase 10): the roster is
   `GET /organizations/:orgId/access-profiles` (only records naming this
   office, only patients with an ACTIVE relationship), each record's parts
   are read when it is opened, and every response says which party this
   office is on it. Writes are the server's to allow: the access center
   books and sets the status, the dialysis center works the rides.
   ========================================================================== */

export type StaffParty = "dialysis" | "access";

const STAFF_HREF: Record<StaffParty, string> = {
  dialysis: "/dashboard/clinic/vascular-access",
  access: "/dashboard/access-center",
};

const iconControl = cn(
  buttonStyles({
    variant: "neutral",
    appearance: "fill-stroke",
    size: "small",
    iconOnly: true,
  }),
  tableIconButton,
);

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function PanelHeading({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-stack-lg flex items-center justify-between gap-inline-lg">
      <h2 className="text-heading-4 text-fg">{title}</h2>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function concernLabel(ids: string[]) {
  return ids
    .map((id) => CONCERN_KINDS.find((kind) => kind.id === id)?.en ?? id)
    .join(", ");
}

/** What the signed-in person may do here: hints from their membership's
 *  server levels (D4). The server decides every write. */
type Perms = {
  /** Their role, for the read-only notice. */
  role: string;
  reply: boolean;
  schedule: boolean;
  /** May write in the patient's three-way conversation. */
  converse: boolean;
  /* The access center's finer permissions (client, 2026-10-06). The other
     offices have them all. */
  coordination: boolean;
  concerns: boolean;
  photos: boolean;
  referrals: boolean;
  referralStatus: boolean;
  replyNephrology: boolean;
  replyDialysis: boolean;
  /** Why not, when they may not. */
  readOnlyReason?: string;
};

/** The server's refusal, as a short line in a modal. */
function refusal(error: unknown): string {
  return isApiError(error) && error.messages[0]
    ? error.messages[0]
    : "That change did not save. Try again.";
}

/* -------------------------------------------------------- schedule form */

function ScheduleModal({
  rows,
  actions,
  initialProfileId,
  onScheduled,
  onClose,
}: {
  rows: AccessRosterRow[];
  actions: AccessActions;
  initialProfileId: string;
  /** After booking, e.g. to mark the referral that asked for it. */
  onScheduled?: () => void;
  onClose: () => void;
}) {
  const now = useNow();
  const today = dayKey(now);
  const [profileId, setProfileId] = useState(initialProfileId);
  const [title, setTitle] = useState<string>(APPOINTMENT_TYPES[0]);
  const [date, setDate] = useState(addDays(today, 7));
  const [time, setTime] = useState("10:00");
  const [place, setPlace] = useState("Vascular Access Center");
  const [team, setTeam] = useState<AccessTeam>("vascular");
  const [failed, setFailed] = useState<unknown>(null);
  const valid =
    profileId !== "" && date >= today && time !== "" && place.trim() !== "";

  return (
    <Modal
      open
      onClose={onClose}
      title="Schedule Appointment"
      footer={
        <>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            size="small"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="small"
            disabled={!valid || actions.isSaving}
            onClick={async () => {
              setFailed(null);
              const ok = await actions.bookAppointment(profileId, {
                title,
                date,
                time,
                place: place.trim(),
                team,
              });
              if (!ok) {
                setFailed(actions.error ?? true);
                return;
              }
              onScheduled?.();
              onClose();
            }}
          >
            Schedule
          </Button>
        </>
      }
    >
      <div className="grid gap-stack-md sm:grid-cols-2">
        {failed ? (
          <Alert
            tone="danger"
            className="sm:col-span-2"
            onDismiss={() => setFailed(null)}
          >
            {refusal(failed)}
          </Alert>
        ) : null}
        <FormField label="Patient" required className="sm:col-span-2">
          {(field) => (
            <Select
              {...field}
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
            >
              {rows.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.memberName}
                  {row.mrn ? ` · MRN ${row.mrn}` : ""}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField label="Appointment" required>
          {(field) => (
            <Select
              {...field}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            >
              {APPOINTMENT_TYPES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField label="Location" required>
          {(field) => (
            <Input
              {...field}
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          )}
        </FormField>
        <FormField
          label="Date"
          required
          error={date < today ? "Pick a future date" : undefined}
        >
          {(field) => (
            <Input
              {...field}
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          )}
        </FormField>
        <FormField label="Time" required>
          {(field) => (
            <Input
              {...field}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          )}
        </FormField>
        <SegmentedChoice
          className="sm:col-span-2"
          label="With"
          value={team}
          onChange={(next: AccessTeam) => setTeam(next)}
          options={[
            { value: "vascular", label: TEAM_LABEL.vascular },
            { value: "dialysis", label: TEAM_LABEL.dialysis },
          ]}
        />
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------- patient modal */

type PatientTab = "overview" | "appointments" | "messages" | "history";

function CompleteForm({
  onSave,
  onCancel,
}: {
  onSave: (result: string, performedBy: string) => void;
  onCancel: () => void;
}) {
  const [result, setResult] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const valid = result.trim() !== "" && performedBy.trim() !== "";
  return (
    <div className="mt-stack-sm grid gap-inline-md rounded-control border border-line bg-surface-sunken p-inset-sm sm:grid-cols-[1fr_1fr_auto]">
      <Input
        inputSize="small"
        aria-label="Result"
        placeholder="Result, e.g. Normal flow"
        value={result}
        onChange={(e) => setResult(e.target.value)}
      />
      <Input
        inputSize="small"
        aria-label="Performed by"
        placeholder="Performed by"
        value={performedBy}
        onChange={(e) => setPerformedBy(e.target.value)}
      />
      <span className="flex gap-inline-sm">
        <Button
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="small"
          disabled={!valid}
          onClick={() => onSave(result.trim(), performedBy.trim())}
        >
          Save
        </Button>
      </span>
    </div>
  );
}

/** One patient's record, read when the popup opens (the roster row says
 *  who; the record's own reads say what). */
function PatientModal({
  row,
  target,
  actions,
  perms,
  initialTab,
  onSchedule,
  onRefer,
  onClose,
}: {
  row: AccessRosterRow;
  target: AccessTarget | null;
  actions: AccessActions;
  perms: Perms;
  initialTab: PatientTab;
  onSchedule: () => void;
  /** The dialysis side's straight line to the access center. */
  onRefer?: () => void;
  onClose: () => void;
}) {
  const now = useNow();
  const today = dayKey(now);
  const [tab, setTab] = useState<PatientTab>(initialTab);
  const [completing, setCompleting] = useState<string | null>(null);
  const reads = useAccessRecord(target, row.id, {
    memberName: row.memberName,
    mrn: row.mrn,
  });
  const record = reads.record;
  /* What the record says this office is on it (server), not the page. */
  const party = record?.party ?? row.party;
  const upcoming = record ? upcomingAppointments(record, today) : [];
  /* The server lists only the reports sent to this office. */
  const concerns = record ? openConcerns(record) : [];
  const unread = record?.unread ?? row.unread;

  function showTab(next: PatientTab) {
    setTab(next);
    if (next === "messages" && unread > 0) void actions.markRead(row.id);
  }

  let content: React.ReactNode;
  if (reads.error) {
    content = (
      <ErrorState
        title={errorTitleFor(reads.error, "This record could not be loaded")}
        message={errorMessageFor(reads.error, undefined)}
        error={reads.error}
        onRetry={canRetry(reads.error) ? reads.refetch : undefined}
      />
    );
  } else if (!record) {
    content = <Skeleton height={320} className="rounded-card" />;
  } else {
    content = (
      <>
        <TabPanel id="overview" value={tab} className="space-y-stack-lg">
          <div className="flex flex-wrap items-end gap-inline-lg">
            <FormField label="Access status">
              {(field) => (
                <Select
                  {...field}
                  selectSize="small"
                  className="w-52"
                  disabled={
                    !perms.coordination ||
                    party !== "access" ||
                    actions.isSaving
                  }
                  value={record.overview.status}
                  onChange={(e) =>
                    void actions.setStatus(
                      record.id,
                      e.target.value as AccessStatus,
                    )
                  }
                >
                  {ACCESS_STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </Select>
              )}
            </FormField>
            <dl className="flex flex-wrap gap-inline-lg text-body-sm">
              <div>
                <dt className="text-caption text-fg-muted">Created</dt>
                <dd className="text-label-lg text-fg">
                  {record.overview.createdOn
                    ? formatDay(record.overview.createdOn)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-caption text-fg-muted">Last Assessment</dt>
                <dd className="text-label-lg text-fg">
                  {record.overview.lastAssessment
                    ? formatDay(record.overview.lastAssessment)
                    : "—"}
                </dd>
              </div>
            </dl>
            {onRefer ? (
              <Button
                size="small"
                className="sm:ml-auto"
                onClick={onRefer}
                leadingIcon={<BellRing aria-hidden="true" />}
              >
                Alert Access Center
              </Button>
            ) : null}
          </div>

          <section hidden={!perms.concerns}>
            <h3 className="mb-stack-sm text-heading-5 text-fg">
              Open Concerns
            </h3>
            {concerns.length === 0 ? (
              <p className="text-body-sm text-fg-muted">No open concerns.</p>
            ) : (
              <ul className="space-y-stack-sm">
                {concerns.map((concern) => (
                  <li
                    key={concern.id}
                    className="flex flex-wrap items-start gap-inline-lg rounded-control border border-line p-inset-sm"
                  >
                    {concern.hasImage && perms.photos ? (
                      <AccessPicture
                        target={target}
                        profileId={record.id}
                        kind="concern"
                        id={concern.id}
                        alt={`Photo from ${record.memberName}`}
                        className="h-20 w-20 shrink-0 rounded-control"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="text-label-lg text-fg">
                        {concernLabel(concern.kinds)}
                      </p>
                      <p className="text-body-sm text-fg-secondary">
                        {concern.detail}
                      </p>
                      <p className="mt-stack-xs text-caption text-fg-muted">
                        {messaging.relativeLabel(concern.reportedAt, now)}
                      </p>
                    </div>
                    <Button
                      size="small"
                      variant="neutral"
                      appearance="fill-stroke"
                      disabled={actions.isSaving}
                      onClick={() =>
                        void actions.reviewConcern(record.id, concern.id)
                      }
                    >
                      <Check aria-hidden="true" />
                      Mark reviewed
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-stack-sm text-heading-5 text-fg">
              Recent Updates
            </h3>
            <UpdatesTimeline
              updates={sortedUpdates(record).slice(0, 4)}
              emptyLabel="No updates yet."
            />
          </section>
        </TabPanel>

        <TabPanel id="appointments" value={tab}>
          {perms.schedule && party === "access" ? (
            <div className="mb-stack-md flex justify-end">
              <Button size="small" onClick={onSchedule}>
                <CalendarPlus aria-hidden="true" />
                Schedule Appointment
              </Button>
            </div>
          ) : null}
          {upcoming.length === 0 ? (
            <EmptyState variant="bare" title="No upcoming appointments" />
          ) : (
            <ul className="divide-y divide-line-subtle">
              {upcoming.map((appointment) => {
                const ride = transportFor(record, appointment.id);
                return (
                  <li
                    key={appointment.id}
                    className="py-inset-xs first:pt-0 last:pb-0"
                  >
                    <AppointmentRow
                      appointment={appointment}
                      action={
                        completing === appointment.id ||
                        !perms.schedule ||
                        party !== "access" ? null : (
                          <Button
                            size="small"
                            variant="neutral"
                            appearance="fill-stroke"
                            onClick={() => setCompleting(appointment.id)}
                          >
                            Complete
                          </Button>
                        )
                      }
                    />
                    {/* Whether a ride is arranged. The access center sees it
                        to confirm the appointment; the dialysis center books
                        it (client, 2026-10-07). */}
                    <p className="mt-stack-xs flex items-center gap-inline-sm text-caption text-fg-muted">
                      Transportation:{" "}
                      {ride ? (
                        <TransportStatusBadge status={ride.status} />
                      ) : (
                        "None arranged"
                      )}
                    </p>
                    {completing === appointment.id ? (
                      <CompleteForm
                        onCancel={() => setCompleting(null)}
                        onSave={(result, performedBy) => {
                          void actions.completeAppointment(
                            record.id,
                            appointment.id,
                            result,
                            performedBy,
                          );
                          setCompleting(null);
                        }}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </TabPanel>

        <TabPanel id="messages" value={tab}>
          <AccessConversationView
            record={record}
            party={party}
            target={target}
            myName={record.memberName}
            readOnlyReason={perms.converse ? undefined : perms.readOnlyReason}
            sending={actions.isSaving}
            onSend={(body, isPrivate) =>
              void actions.sendMessage(record.id, body, { isPrivate })
            }
            onSetPrivate={(messageId, isPrivate) =>
              void actions.setMessagePrivate(record.id, messageId, isPrivate)
            }
            onSetDialysisCanPost={(allowed) =>
              void actions.setDialysisCanPost(record.id, allowed)
            }
          />
        </TabPanel>

        <TabPanel id="history" value={tab}>
          <HistoryTable history={sortedHistory(record)} />
          {/* Export and share the history (client, 2026-10-06). */}
          <div className="mt-stack-lg">
            <ShareLogCard
              title={`Access history: ${record.memberName}`}
              description="Download the patient's access history, print it, or email it to another care team."
              fileName="access-history"
              isEs={false}
              footer="Sent from the NephroReach care team portal."
              table={{
                header: [
                  "Date",
                  "Type",
                  "Procedure",
                  "Location",
                  "Performed by",
                  "Result",
                ],
                rows: sortedHistory(record).map((h) => [
                  h.date,
                  h.type,
                  h.procedure,
                  h.location,
                  h.performedBy,
                  h.result,
                ]),
              }}
            />
          </div>
        </TabPanel>
      </>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={row.memberName}
      description={`${row.mrn ? `MRN ${row.mrn} · ` : ""}${row.overview.type}, ${row.overview.location}`}
    >
      <Tabs
        label="Patient access"
        value={tab}
        onChange={showTab}
        className="mb-stack-lg"
        items={[
          { id: "overview", label: "Overview" },
          { id: "appointments", label: `Appointments (${upcoming.length})` },
          {
            id: "messages",
            label: unread > 0 ? `Messages (${unread})` : "Messages",
          },
          { id: "history", label: "History" },
        ]}
      />
      {actions.error ? (
        <Alert tone="danger" onDismiss={actions.clearError}>
          {refusal(actions.error)}
        </Alert>
      ) : null}
      {content}
    </Modal>
  );
}

/* ----------------------------------------------------- add access patient */

/** Starts the access record for one of this office's patients who has no
 *  record here yet. The dialysis center is the patient's current one (the
 *  server's default). */
function AddAccessModal({
  candidates,
  actions,
  onClose,
}: {
  candidates: Array<{ patientId: string; name: string; mrn: string | null }>;
  actions: AccessActions;
  onClose: () => void;
}) {
  const today = dayKey(useNow());
  const [patientId, setPatientId] = useState(candidates[0]?.patientId ?? "");
  const [type, setType] = useState<string>(ACCESS_TYPES[0]);
  const [location, setLocation] = useState("");
  const [createdOn, setCreatedOn] = useState(today);
  const [status, setStatus] = useState<AccessStatus>("Review Requested");
  const [tried, setTried] = useState(false);
  const [failed, setFailed] = useState<unknown>(null);
  /* No location yet while the access type is still to be decided. */
  const locationError =
    type === "TBD" || location.trim() ? undefined : "Where is the access?";

  return (
    <Modal
      open
      onClose={onClose}
      size="big"
      title="Add Patient"
      description="Starts the access record the patient and both centers share."
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={candidates.length === 0 || actions.isSaving}
            onClick={async () => {
              setTried(true);
              if (!patientId || locationError) return;
              setFailed(null);
              const ok = await actions.createProfile({
                patientId,
                type,
                ...(location.trim() ? { location: location.trim() } : {}),
                ...(createdOn ? { createdOn } : {}),
                status,
              });
              if (ok) onClose();
              else setFailed(actions.error ?? true);
            }}
          >
            Add Patient
          </Button>
        </>
      }
    >
      {candidates.length === 0 ? (
        <EmptyState
          variant="bare"
          title="Every clinic patient already has an access record"
        />
      ) : (
        <div className="space-y-stack-md">
          {failed ? (
            <Alert tone="danger" onDismiss={() => setFailed(null)}>
              {refusal(failed)}
            </Alert>
          ) : null}
          <FormField label="Patient" required>
            {(field) => (
              <Select
                {...field}
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              >
                {candidates.map((c) => (
                  <option key={c.patientId} value={c.patientId}>
                    {c.name}
                    {c.mrn ? ` · MRN ${c.mrn}` : ""}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <div className="grid gap-stack-md sm:grid-cols-2">
            <FormField label="Access type" required>
              {(field) => (
                <Select
                  {...field}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {ACCESS_TYPES.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              )}
            </FormField>
            <FormField
              label="Location"
              required={type !== "TBD"}
              error={tried ? locationError : undefined}
            >
              {(field) => (
                <Input
                  {...field}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="E.g. Left Forearm"
                />
              )}
            </FormField>
            <FormField label="Created on" required>
              {(field) => (
                <Input
                  {...field}
                  type="date"
                  max={today}
                  value={createdOn}
                  onChange={(e) => setCreatedOn(e.target.value)}
                />
              )}
            </FormField>
            <FormField label="Status" required>
              {(field) => (
                <Select
                  {...field}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AccessStatus)}
                >
                  {ACCESS_STATUSES.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              )}
            </FormField>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ------------------------------------------------- open concerns, office */

/** The open reports sent to this office, read per record that has any
 *  (the roster's server count says which; at most the first 20 such
 *  records on the loaded page). */
function OfficeConcerns({
  rows,
  target,
  photos,
  onOpen,
}: {
  rows: AccessRosterRow[];
  target: AccessTarget | null;
  photos: boolean;
  onOpen: (profileId: string) => void;
}) {
  const now = useNow();
  const flagged = rows.filter((row) => row.openConcerns > 0).slice(0, 20);
  const results = useQueries({
    queries: flagged.map((row) => ({
      queryKey: accessKey(target, row.id, "concerns", { status: "Open" }),
      queryFn: () =>
        listConcerns(target!, row.id, { status: "Open", limit: 20 }),
      enabled: !!target,
    })),
  });
  const error = results.find((r) => r.error)?.error ?? null;
  if (error) {
    return (
      <ErrorState
        title={errorTitleFor(error, "Open concerns could not be loaded")}
        message={errorMessageFor(error, undefined)}
        error={error}
      />
    );
  }
  if (results.some((r) => r.isPending)) {
    return <Skeleton height={120} className="rounded-card" />;
  }
  const items = flagged
    .flatMap((row, index) =>
      (results[index]?.data?.items ?? []).map((raw) => ({
        row,
        concern: toConcern(raw),
      })),
    )
    .sort((a, b) => b.concern.reportedAt.localeCompare(a.concern.reportedAt));
  if (items.length === 0) {
    return <p className="text-body-sm text-fg-muted">No open concerns.</p>;
  }
  return (
    <ul className="divide-y divide-line-subtle">
      {items.map(({ row, concern }) => (
        <li
          key={concern.id}
          className="flex items-start gap-inline-lg py-inset-xs first:pt-0 last:pb-0"
        >
          {concern.hasImage && photos ? (
            <AccessPicture
              target={target}
              profileId={row.id}
              kind="concern"
              id={concern.id}
              alt={`Photo from ${row.memberName}`}
              className="h-12 w-12 shrink-0 rounded-control"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onOpen(row.id)}
              className={cn(
                "cursor-pointer rounded-control-small text-label-lg text-fg hover:text-fg-brand hover:underline",
                focusRing,
              )}
            >
              {row.memberName}
            </button>
            <p className="text-body-sm text-fg-secondary">
              {concernLabel(concern.kinds)} — {concern.detail}
            </p>
          </div>
          <span className="shrink-0 text-caption text-fg-muted">
            {messaging.relativeLabel(concern.reportedAt, now)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ page */

function PageSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} height={132} className="rounded-card" />
        ))}
      </div>
      <Skeleton height={480} className="rounded-card" />
    </div>
  );
}

/** A value that settles 300 ms after the last change (server search). */
function useSettled(value: string): string {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), 300);
    return () => clearTimeout(timer);
  }, [value]);
  return settled;
}

export default function ClinicVascularAccess({
  party = "dialysis",
}: {
  /** The page's portal (copy and links only). What this office is on each
   *  record comes from the server (`party` on every response). */
  party?: StaffParty;
}) {
  const HREF = STAFF_HREF[party];
  const { user } = useAuth();
  /* Who refers from this page: the access center itself, or the office
     signed in — the dialysis center, or the nephrology office, which
     shares the clinic's pages (client, 2026-10-05). */
  const office: "access" | ReferralSource =
    party === "access"
      ? "access"
      : user?.role === "nephrology"
        ? "nephrology"
        : "dialysis";
  const reply =
    party === "access"
      ? userCan(user, "access.message.patients")
      : userCan(user, "messages.reply");
  const atAccess = office === "access";
  const can = (p: Parameters<typeof userCan>[1]) => userCan(user, p);
  const perms: Perms = {
    role: user?.staffRole ?? "Administrator",
    reply,
    /* Only the access center schedules access appointments and manages the
       access; the dialysis center and the nephrology office request
       appointments and send concerns or referrals (client, 2026-10-07). */
    schedule: atAccess && can("access.appointments.confirm"),
    coordination: atAccess && can("access.coordination.status"),
    concerns: atAccess ? can("access.concerns") : true,
    photos: atAccess ? can("access.photos") : true,
    referrals: atAccess
      ? can("access.dashboard") ||
        can("access.referrals") ||
        can("access.referrals.assigned")
      : true,
    referralStatus: atAccess
      ? can("access.referral.status")
      : can("access.schedule"),
    replyNephrology: atAccess ? can("access.message.nephrology") : reply,
    replyDialysis: atAccess ? can("access.message.dialysis") : reply,
    /* The patient's conversation is between the patient, the access
       center and the dialysis center; the nephrology office reads it and
       writes to the access center on a referral instead. */
    converse: reply && office !== "nephrology",
    readOnlyReason:
      office === "nephrology"
        ? "The nephrology office reads this conversation. To reach the access center, send a message from Access Center Messages."
        : reply
          ? undefined
          : `${user?.staffRole ?? "Administrator"} accounts can read this conversation but not reply.`,
  };
  const now = useNow();
  const today = dayKey(now);
  const orgId = useOfficeOrgId();
  const target = useOfficeTarget();
  const actions = useAccessActions(target);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All Statuses");
  const search = useSettled(query);
  /* The roster: this office's records, filtered and paged by the server. */
  const roster = useAccessRoster(orgId, {
    status: status === "All Statuses" ? undefined : status,
    search,
  });
  const referralsRead = useReferrals(orgId, {}, { enabled: perms.referrals });
  const patientsRead = useOfficePatients(orgId);
  const rows = roster.rows;

  const [open, setOpen] = useState<{ id: string; tab: PatientTab } | null>(
    null,
  );
  const [scheduling, setScheduling] = useState<string | null>(null);
  /* true for any patient; a patient id when a referral starts the record. */
  const [addingPatient, setAddingPatient] = useState<string | boolean>(false);
  /* Referral popups: one being read, one being written. */
  const [openReferral, setOpenReferral] = useState<string | null>(null);
  const [referring, setReferring] = useState<{
    patientId?: string;
    kind?: ReferralKind;
  } | null>(null);
  /* The referral a booking answers, so scheduling marks it. */
  const [schedulingFor, setSchedulingFor] = useState<string | null>(null);
  const referralActions = useReferralActions(orgId);
  /* Which kind of office a thread is with, by its directory id. */
  const directory = useDirectory();
  const typeOf = (id: string) =>
    directory.offices.find((o) => o.id === id)?.type;

  /* The server already gives each office only its own threads. */
  const referrals = referralsRead.referrals;
  const openReferralCount = referrals.filter((r) =>
    party === "access" ? r.status === "New" : r.status !== "Closed",
  ).length;
  const nextMonth = addDays(today, 30);
  /* From the roster's own counts (open concerns sent to this office, the
     next visit per record) over the loaded pages. */
  const openConcernCount = rows.reduce((sum, row) => sum + row.openConcerns, 0);
  const upcomingCount = rows.filter(
    (row) =>
      row.nextAppointment &&
      row.nextAppointment.date >= today &&
      row.nextAppointment.date <= nextMonth,
  ).length;
  const selected = open ? rows.find((row) => row.id === open.id) : null;
  const rowForPatient = (patientId: string | undefined) =>
    patientId ? rows.find((row) => row.patientId === patientId) : undefined;

  let patientsBody: React.ReactNode;
  if (roster.error) {
    /* A 403 (an office that keeps no access records, a role without the
       level) shows the not-shared state, never cached rows. */
    patientsBody = (
      <ErrorState
        title={errorTitleFor(
          roster.error,
          "Access records could not be loaded",
        )}
        message={errorMessageFor(roster.error, undefined)}
        error={roster.error}
        onRetry={canRetry(roster.error) ? roster.refetch : undefined}
      />
    );
  } else {
    patientsBody = (
      <>
        <div className="overflow-hidden rounded-control border border-line">
          <Table minWidth={760}>
            <TableHead className="bg-surface-sunken">
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Access</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Next Appointment</TableHeaderCell>
                <TableHeaderCell>Concerns</TableHeaderCell>
                <TableHeaderCell className="text-right">
                  Actions
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableEmptyRow colSpan={6}>
                  No patients match these filters.
                </TableEmptyRow>
              ) : (
                rows.map((row) => {
                  const next = row.nextAppointment;
                  const openCount = row.openConcerns;
                  /* Concerns staff sent about this patient count here too,
                     not only the patient's own (client, 2026-10-18). */
                  const staffCount = referrals.filter(
                    (r) =>
                      r.patient?.id === row.patientId &&
                      r.kind === "Access Concern" &&
                      r.status !== "Closed",
                  ).length;
                  const unread = row.unread;
                  return (
                    <TableRow key={row.id}>
                      <TableCell emphasis className="whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            setOpen({ id: row.id, tab: "overview" })
                          }
                          className={cn(
                            "cursor-pointer rounded-control-small text-left hover:text-fg-brand hover:underline",
                            focusRing,
                          )}
                        >
                          {row.memberName}
                        </button>
                        {row.mrn ? (
                          <span className="block text-caption font-normal text-fg-muted tabular-nums">
                            MRN {row.mrn}
                          </span>
                        ) : null}
                        {atAccess && row.dialysisCenter ? (
                          <span className="block text-caption font-normal text-fg-muted">
                            {row.dialysisCenter.name}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {row.overview.type}
                        <span className="block text-caption text-fg-muted">
                          {row.overview.location}
                        </span>
                      </TableCell>
                      <TableCell>
                        <AccessStatusBadge status={row.overview.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {next ? (
                          <>
                            {formatDay(next.date)}
                            <span className="block text-caption text-fg-muted">
                              {next.title} · {formatTime(next.time)}
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {openCount + staffCount > 0 ? (
                          <>
                            <Badge tone="danger">
                              {openCount + staffCount} open
                            </Badge>
                            <span className="block text-caption text-fg-muted">
                              {[
                                openCount > 0
                                  ? `${openCount} from patient`
                                  : null,
                                staffCount > 0
                                  ? `${staffCount} from staff`
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="flex justify-end gap-inline-xs">
                          <button
                            type="button"
                            onClick={() =>
                              setOpen({ id: row.id, tab: "overview" })
                            }
                            className={iconControl}
                            aria-label={`View ${row.memberName}`}
                            title="View access"
                          >
                            <Eye aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpen({ id: row.id, tab: "messages" });
                              if (unread > 0) void actions.markRead(row.id);
                            }}
                            className={cn(iconControl, "relative")}
                            aria-label={
                              unread > 0
                                ? `Messages for ${row.memberName}, ${unread} unread`
                                : `Messages for ${row.memberName}`
                            }
                            title="Messages"
                          >
                            <MessageSquareText aria-hidden="true" />
                            {unread > 0 ? (
                              <span
                                aria-hidden="true"
                                className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-pill bg-danger-solid"
                              />
                            ) : null}
                          </button>
                          {perms.schedule && row.party === "access" ? (
                            <button
                              type="button"
                              onClick={() => setScheduling(row.id)}
                              className={iconControl}
                              aria-label={`Schedule for ${row.memberName}`}
                              title="Schedule appointment"
                            >
                              <CalendarPlus aria-hidden="true" />
                            </button>
                          ) : null}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        {roster.hasMore ? (
          <div className="mt-stack-md flex justify-center">
            <Button
              size="small"
              variant="neutral"
              appearance="fill-stroke"
              disabled={roster.isLoadingMore}
              onClick={roster.loadMore}
            >
              Load more
            </Button>
          </div>
        ) : null}
      </>
    );
  }

  let body: React.ReactNode;
  if (roster.isPending) {
    body = <PageSkeleton />;
  } else {
    body = (
      <>
        {actions.error && !open && scheduling === null && !addingPatient ? (
          <Alert tone="danger" onDismiss={actions.clearError}>
            {refusal(actions.error)}
          </Alert>
        ) : null}

        <section
          aria-label="Access summary"
          className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2"
        >
          <KeyCard
            tone="brand"
            icon={<UsersSolid />}
            value={roster.error ? "—" : roster.total}
            label="Access Patients"
          />
          <KeyCard
            tone="danger"
            icon={<AlertTriangleSolid />}
            value={roster.error ? "—" : openConcernCount}
            label="Open Concerns"
          />
          <KeyCard
            tone="accent"
            icon={<ClockSolid />}
            value={roster.error ? "—" : upcomingCount}
            label="Appointments, Next 30 Days"
          />
          <KeyCard
            tone="warning"
            icon={<BellRing />}
            value={referralsRead.error ? "—" : openReferralCount}
            label={party === "access" ? "New Referrals" : "Open Referrals"}
          />
        </section>

        <Card as="section" padding="small" className="min-w-0">
          <PanelHeading title="Access Patients" />
          <div className="mb-stack-lg flex flex-col gap-inline-md lg:flex-row lg:items-center">
            <Input
              type="search"
              inputSize="small"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or MRN..."
              aria-label="Search patients"
              leadingIcon={<Search aria-hidden="true" />}
              className="lg:max-w-60 lg:flex-1"
            />
            <Select
              selectSize="small"
              aria-label="Access status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="lg:w-48"
            >
              {["All Statuses", ...ACCESS_STATUSES].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
          </div>
          {patientsBody}
        </Card>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card
            as="section"
            padding="small"
            className="h-full"
            hidden={!perms.concerns}
          >
            <PanelHeading title="Open Concerns" />
            {roster.error ? (
              <p className="text-body-sm text-fg-muted">No open concerns.</p>
            ) : (
              <OfficeConcerns
                rows={rows}
                target={target}
                photos={perms.photos}
                onOpen={(id) => setOpen({ id, tab: "overview" })}
              />
            )}
          </Card>

          {perms.referrals ? (
            <ReferralsPanel
              referrals={referrals}
              error={referralsRead.error}
              onRetry={referralsRead.refetch}
              side={office}
              canSend={perms.reply && office !== "access"}
              onSend={() => setReferring({})}
              onOpen={setOpenReferral}
            />
          ) : null}
        </section>

        {/* Patients' rides to access appointments, worked by the dialysis
            center's social worker (client, 2026-10-06: the appointment
            transportation belongs under vascular access too). */}
        {/* Rides are the dialysis center's (its administrator and social
            worker); never the nephrology office's (client, 2026-10-07). */}
        {party === "dialysis" && office === "dialysis" ? (
          <RideRequestsPanel
            orgId={orgId}
            canManage={userCan(user, "rides.manage")}
            onOpen={(id) => setOpen({ id, tab: "overview" })}
          />
        ) : null}

        {selected && open ? (
          <PatientModal
            key={`${selected.id}-${open.tab}`}
            row={selected}
            target={target}
            actions={actions}
            perms={perms}
            initialTab={open.tab}
            onSchedule={() => {
              setScheduling(selected.id);
              setOpen(null);
            }}
            onRefer={
              office !== "access" && perms.reply
                ? () => {
                    setReferring({
                      patientId: selected.patientId,
                      kind: "Access Concern",
                    });
                    setOpen(null);
                  }
                : undefined
            }
            onClose={() => setOpen(null)}
          />
        ) : null}

        {scheduling !== null ? (
          <ScheduleModal
            rows={rows.filter((row) => row.party === "access")}
            actions={actions}
            initialProfileId={
              scheduling || rows.find((row) => row.party === "access")?.id || ""
            }
            onScheduled={
              schedulingFor
                ? () =>
                    void referralActions.setStatus(schedulingFor, "Scheduled")
                : undefined
            }
            onClose={() => {
              setScheduling(null);
              setSchedulingFor(null);
            }}
          />
        ) : null}

        {openReferral ? (
          <ReferralModal
            key={openReferral}
            orgId={orgId}
            referralId={openReferral}
            hasRecord={(patientId) => !!rowForPatient(patientId)}
            side={office}
            canReplyTo={(referral) =>
              atAccess
                ? typeOf(referral.from.id) === "NEPHROLOGY_OFFICE"
                  ? perms.replyNephrology
                  : perms.replyDialysis
                : perms.reply
            }
            canAct={perms.referralStatus}
            actions={referralActions}
            onSchedule={
              perms.schedule
                ? (referral) => {
                    const row = rowForPatient(referral.patient?.id);
                    if (!row) return;
                    setSchedulingFor(referral.id);
                    setScheduling(row.id);
                    setOpenReferral(null);
                  }
                : undefined
            }
            onStartRecord={(referral) => {
              setAddingPatient(referral.patient?.id ?? true);
              setOpenReferral(null);
            }}
            onClose={() => setOpenReferral(null)}
          />
        ) : null}

        {referring ? (
          <SendReferralModal
            side={office}
            orgId={orgId}
            patients={patientsRead.patients}
            patientsError={patientsRead.error}
            initialPatientId={referring.patientId}
            initialKind={referring.kind}
            onClose={() => setReferring(null)}
          />
        ) : null}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <PageTitle
        href={HREF}
        action={
          <div className="flex flex-wrap items-center gap-inline-md">
            <UpdatedBar
              updatedAt={roster.updatedAt}
              isFetching={roster.isFetching}
              refetch={() => {
                roster.refetch();
                referralsRead.refetch();
              }}
            />
            {office !== "access" && perms.reply ? (
              <Button
                size="small"
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setReferring({})}
              >
                <Send aria-hidden="true" />
                Message Access Center
              </Button>
            ) : null}
            {perms.schedule ? (
              <Button
                size="small"
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setAddingPatient(true)}
              >
                <UserPlus aria-hidden="true" />
                Add Patient
              </Button>
            ) : null}
            {perms.schedule ? (
              <Button
                size="small"
                onClick={() => setScheduling("")}
                disabled={!rows.some((row) => row.party === "access")}
              >
                <CalendarPlus aria-hidden="true" />
                Schedule Appointment
              </Button>
            ) : null}
          </div>
        }
      />
      {body}
      {addingPatient ? (
        <AddAccessModal
          candidates={patientsRead.patients.filter(
            (p) =>
              !rows.some((row) => row.patientId === p.patientId) &&
              (addingPatient === true || p.patientId === addingPatient),
          )}
          actions={actions}
          onClose={() => setAddingPatient(false)}
        />
      ) : null}
    </div>
  );
}
