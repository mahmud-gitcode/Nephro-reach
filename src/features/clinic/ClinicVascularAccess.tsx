"use client";

import React, { useMemo, useState } from "react";
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
import { cn } from "@/lib/utils/cn";
import { useNow } from "@/lib/utils/useNow";
import * as messaging from "@/features/messaging/messaging.rules";
import {
  ACCESS_CENTER_NAME,
  ACCESS_STATUSES,
  ACCESS_TYPES,
  APPOINTMENT_TYPES,
  CONCERN_KINDS,
  DIALYSIS_CENTER_NAME,
  TEAM_LABEL,
  addDays,
  dayKey,
  formatDay,
  formatTime,
  nextAppointment,
  openConcerns,
  sortedHistory,
  sortedUpdates,
  unreadFor,
  upcomingAppointments,
  type AccessRecord,
  type AccessStatus,
  type AccessTeam,
  type ReferralKind,
} from "@/features/vascular-access/vascularAccess.data";
import {
  AccessConversationView,
  AccessStatusBadge,
  AppointmentRow,
  HistoryTable,
  UpdatesTimeline,
} from "@/features/vascular-access/AccessUi";
import {
  useVascularAccess,
  type VascularAccessStore,
} from "@/features/vascular-access/useVascularAccess";
import { useAuth } from "@/features/auth/AuthContext";
import { userCan } from "@/features/staff/staff";
import { tableIconButton } from "./tableButton";
import { useClinicData } from "./useClinicData";
import { UpdatedBar } from "./UpdatedBar";
import {
  ReferralModal,
  ReferralsPanel,
  SendReferralModal,
} from "./AccessReferrals";

/* ==========================================================================
   Vascular Access — the staff side
   --------------------------------------------------------------------------
   The other end of the member's Vascular Access tab, for both
   organisations that care for the access, each from its own login:

     dialysis   the Dialysis Center (clinic role): refers concerns to the
                access center directly, and joins the conversation when
                allowed. Its rides live on its Messages page.
     access     the Vascular Access Center (access role): its own
                organisation; manages privacy and who may post

   Both book visits that land on the patient's screen, review reported
   concerns and photos, and read the three-way conversation. Same records,
   same store.
   ========================================================================== */

export type StaffParty = "dialysis" | "access";

const STAFF: Record<StaffParty, { href: string; org: string; person: string }> =
  {
    dialysis: {
      href: "/dashboard/clinic/vascular-access",
      org: DIALYSIS_CENTER_NAME,
      person: "Nurse Wilson",
    },
    access: {
      href: "/dashboard/access-center",
      org: ACCESS_CENTER_NAME,
      person: "Dr. Patel",
    },
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

/** What the signed-in person may do here, from their staff role. */
type Perms = {
  /** Their name, on what they write and book. */
  me: string;
  /** Their role, for the read-only notice. */
  role: string;
  reply: boolean;
  schedule: boolean;
};

/* -------------------------------------------------------- schedule form */

function ScheduleModal({
  records,
  store,
  initialMrn,
  onScheduled,
  onClose,
}: {
  records: AccessRecord[];
  store: VascularAccessStore;
  initialMrn: string;
  /** After booking, e.g. to mark the referral that asked for it. */
  onScheduled?: () => void;
  onClose: () => void;
}) {
  const now = useNow();
  const today = dayKey(now);
  const [mrn, setMrn] = useState(initialMrn);
  const [title, setTitle] = useState<string>(APPOINTMENT_TYPES[0]);
  const [date, setDate] = useState(addDays(today, 7));
  const [time, setTime] = useState("10:00");
  const [place, setPlace] = useState("Vascular Access Center");
  const [team, setTeam] = useState<AccessTeam>("vascular");
  const valid =
    mrn !== "" && date >= today && time !== "" && place.trim() !== "";

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
            disabled={!valid}
            onClick={() => {
              store.scheduleAppointment(mrn, {
                title,
                date,
                time,
                place: place.trim(),
                team,
              });
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
        <FormField label="Patient" required className="sm:col-span-2">
          {(field) => (
            <Select
              {...field}
              value={mrn}
              onChange={(e) => setMrn(e.target.value)}
            >
              {records.map((record) => (
                <option key={record.mrn} value={record.mrn}>
                  {record.memberName} · MRN {record.mrn}
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

function PatientModal({
  record,
  store,
  party,
  perms,
  initialTab,
  onSchedule,
  onRefer,
  onClose,
}: {
  record: AccessRecord;
  store: VascularAccessStore;
  party: StaffParty;
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
  const upcoming = upcomingAppointments(record, today);
  const concerns = openConcerns(record);
  const unread = unreadFor(record, party);

  function showTab(next: PatientTab) {
    setTab(next);
    if (next === "messages") store.markConversationRead(record.mrn, party);
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={record.memberName}
      description={`MRN ${record.mrn} · ${record.overview.type}, ${record.overview.location}`}
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

      <TabPanel id="overview" value={tab} className="space-y-stack-lg">
        <div className="flex flex-wrap items-end gap-inline-lg">
          <FormField label="Access status">
            {(field) => (
              <Select
                {...field}
                selectSize="small"
                className="w-52"
                disabled={!perms.schedule}
                value={record.overview.status}
                onChange={(e) =>
                  store.editOverview(record.mrn, {
                    status: e.target.value as AccessStatus,
                  })
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
                {formatDay(record.overview.createdOn)}
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

        <section>
          <h3 className="mb-stack-sm text-heading-5 text-fg">Open Concerns</h3>
          {concerns.length === 0 ? (
            <p className="text-body-sm text-fg-muted">No open concerns.</p>
          ) : (
            <ul className="space-y-stack-sm">
              {concerns.map((concern) => (
                <li
                  key={concern.id}
                  className="flex flex-wrap items-start gap-inline-lg rounded-control border border-line p-inset-sm"
                >
                  {concern.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- a data URL, nothing to optimise
                    <img
                      src={concern.imageUrl}
                      alt={`Photo from ${record.memberName}`}
                      className="h-20 w-20 shrink-0 rounded-control object-cover"
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
                    onClick={() => store.reviewConcern(record.mrn, concern.id)}
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
          <h3 className="mb-stack-sm text-heading-5 text-fg">Recent Updates</h3>
          <UpdatesTimeline
            updates={sortedUpdates(record).slice(0, 4)}
            emptyLabel="No updates yet."
          />
        </section>
      </TabPanel>

      <TabPanel id="appointments" value={tab}>
        {perms.schedule ? (
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
            {upcoming.map((appointment) => (
              <li
                key={appointment.id}
                className="py-inset-xs first:pt-0 last:pb-0"
              >
                <AppointmentRow
                  appointment={appointment}
                  action={
                    completing === appointment.id || !perms.schedule ? null : (
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
                {completing === appointment.id ? (
                  <CompleteForm
                    onCancel={() => setCompleting(null)}
                    onSave={(result, performedBy) => {
                      store.completeAppointment(
                        record.mrn,
                        appointment.id,
                        result,
                        performedBy,
                      );
                      setCompleting(null);
                    }}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </TabPanel>

      <TabPanel id="messages" value={tab}>
        <AccessConversationView
          record={record}
          party={party}
          myName={perms.me}
          readOnlyReason={
            perms.reply
              ? undefined
              : `${perms.role} accounts can read this conversation but not reply.`
          }
          sending={store.isSaving}
          onSend={(body, isPrivate) =>
            store.sendMessage(record.mrn, party, perms.me, body, {
              private: isPrivate,
            })
          }
          onSetPrivate={(messageId, isPrivate) =>
            store.setMessagePrivate(record.mrn, messageId, isPrivate, party)
          }
          onSetDialysisCanPost={(allowed) =>
            store.setDialysisCanPost(record.mrn, allowed, party)
          }
        />
      </TabPanel>

      <TabPanel id="history" value={tab}>
        <HistoryTable history={sortedHistory(record)} />
      </TabPanel>
    </Modal>
  );
}

/* ----------------------------------------------------- add access patient */

/** Starts the access record for one of the clinic's patients who has no
 *  record yet: what the access is, where, and how it is doing. */
function AddAccessModal({
  candidates,
  onAdd,
  onClose,
}: {
  candidates: Array<{ name: string; mrn: string }>;
  onAdd: (
    patient: { memberName: string; mrn: string },
    overview: {
      type: string;
      location: string;
      createdOn: string;
      status: AccessStatus;
      lastAssessment: string;
    },
  ) => void;
  onClose: () => void;
}) {
  const today = dayKey(useNow());
  const [mrn, setMrn] = useState(candidates[0]?.mrn ?? "");
  const [type, setType] = useState<string>(ACCESS_TYPES[0]);
  const [location, setLocation] = useState("");
  const [createdOn, setCreatedOn] = useState(today);
  const [status, setStatus] = useState<AccessStatus>("Review Requested");
  const [tried, setTried] = useState(false);
  const locationError = location.trim() ? undefined : "Where is the access?";

  return (
    <Modal
      open
      onClose={onClose}
      size="big"
      title="Add Access Patient"
      description="Starts the access record the patient and both centers share."
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={candidates.length === 0}
            onClick={() => {
              setTried(true);
              const patient = candidates.find((c) => c.mrn === mrn);
              if (!patient || locationError) return;
              onAdd(
                { memberName: patient.name, mrn },
                {
                  type,
                  location: location.trim(),
                  createdOn,
                  status,
                  lastAssessment: "",
                },
              );
              onClose();
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
          <FormField label="Patient" required>
            {(field) => (
              <Select
                {...field}
                value={mrn}
                onChange={(e) => setMrn(e.target.value)}
              >
                {candidates.map((c) => (
                  <option key={c.mrn} value={c.mrn}>
                    {c.name} · MRN {c.mrn}
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
              required
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

/* ------------------------------------------------------------------ page */

function PageSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} height={132} className="rounded-card" />
        ))}
      </div>
      <Skeleton height={480} className="rounded-card" />
    </div>
  );
}

export default function ClinicVascularAccess({
  party = "dialysis",
}: {
  party?: StaffParty;
}) {
  const HREF = STAFF[party].href;
  const { user } = useAuth();
  /* A staff login writes and books under its own name; the organisation's
     demo login stands in as its default person. */
  const perms: Perms = {
    me: user?.staffRole ? user.name : STAFF[party].person,
    role: user?.staffRole ?? "Administrator",
    reply: userCan(user, "messages.reply"),
    schedule: userCan(user, "access.schedule"),
  };
  const now = useNow();
  const store = useVascularAccess();
  const records = store.records;
  const today = dayKey(now);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All Statuses");
  const [open, setOpen] = useState<{ mrn: string; tab: PatientTab } | null>(
    null,
  );
  const [scheduling, setScheduling] = useState<string | null>(null);
  /* true for any patient; an MRN when a referral starts the record. */
  const [addingPatient, setAddingPatient] = useState<string | boolean>(false);
  /* Referral popups: one being read, one being written. */
  const [openReferral, setOpenReferral] = useState<string | null>(null);
  const [referring, setReferring] = useState<{
    mrn?: string;
    kind?: ReferralKind;
  } | null>(null);
  /* The referral a booking answers, so scheduling marks it. */
  const [schedulingFor, setSchedulingFor] = useState<string | null>(null);
  /* The clinic's whole patient list, newly enrolled ones included. */
  const clinicData = useClinicData();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter(
      (record) =>
        (status === "All Statuses" || record.overview.status === status) &&
        (q === "" ||
          record.memberName.toLowerCase().includes(q) ||
          record.mrn.includes(q)),
    );
  }, [records, query, status]);

  const concerns = records.flatMap((record) =>
    openConcerns(record).map((concern) => ({ record, concern })),
  );
  const referrals = store.referrals;
  const openReferralCount = referrals.filter((r) =>
    party === "access" ? r.status === "New" : r.status !== "Closed",
  ).length;
  const readingReferral = openReferral
    ? referrals.find((r) => r.id === openReferral)
    : undefined;
  /* Anyone the clinic can refer: access patients, then the rest of its
     roster (a new-access referral is for someone with no record yet). */
  const referable = [
    ...records.map((r) => ({ name: r.memberName, mrn: r.mrn })),
    ...(clinicData.data?.patients ?? [])
      .filter((p) => !records.some((r) => r.mrn === p.mrn))
      .map((p) => ({ name: p.name, mrn: p.mrn })),
  ];
  const nextMonth = addDays(today, 30);
  const upcomingCount = records.reduce(
    (sum, record) =>
      sum +
      upcomingAppointments(record, today).filter((a) => a.date <= nextMonth)
        .length,
    0,
  );
  const selected = open
    ? records.find((record) => record.mrn === open.mrn)
    : null;

  let body: React.ReactNode;
  if (store.error) {
    body = (
      <ErrorState
        title="Access records could not be loaded"
        error={store.error}
        onRetry={store.refetch}
      />
    );
  } else if (store.isPending) {
    body = <PageSkeleton />;
  } else {
    body = (
      <>
        {store.writeError ? (
          <Alert tone="danger" onDismiss={store.clearWriteError}>
            That change did not save. Try again.
          </Alert>
        ) : null}

        <section
          aria-label="Access summary"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <KeyCard
            tone="brand"
            icon={<UsersSolid />}
            value={records.length}
            label="Access Patients"
          />
          <KeyCard
            tone="danger"
            icon={<AlertTriangleSolid />}
            value={concerns.length}
            label="Open Concerns"
          />
          <KeyCard
            tone="accent"
            icon={<ClockSolid />}
            value={upcomingCount}
            label="Appointments, Next 30 Days"
          />
          <KeyCard
            tone="warning"
            icon={<BellRing />}
            value={openReferralCount}
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
                  rows.map((record) => {
                    const next = nextAppointment(record, today);
                    const openCount = openConcerns(record).length;
                    const unread = unreadFor(record, party);
                    return (
                      <TableRow key={record.mrn}>
                        <TableCell emphasis className="whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              setOpen({ mrn: record.mrn, tab: "overview" })
                            }
                            className={cn(
                              "cursor-pointer rounded-control-small text-left hover:text-fg-brand hover:underline",
                              focusRing,
                            )}
                          >
                            {record.memberName}
                          </button>
                          <span className="block text-caption font-normal text-fg-muted tabular-nums">
                            MRN {record.mrn}
                          </span>
                        </TableCell>
                        <TableCell>
                          {record.overview.type}
                          <span className="block text-caption text-fg-muted">
                            {record.overview.location}
                          </span>
                        </TableCell>
                        <TableCell>
                          <AccessStatusBadge status={record.overview.status} />
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
                          {openCount > 0 ? (
                            <Badge tone="danger">{openCount} open</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="flex justify-end gap-inline-xs">
                            <button
                              type="button"
                              onClick={() =>
                                setOpen({ mrn: record.mrn, tab: "overview" })
                              }
                              className={iconControl}
                              aria-label={`View ${record.memberName}`}
                              title="View access"
                            >
                              <Eye aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpen({ mrn: record.mrn, tab: "messages" });
                                store.markConversationRead(record.mrn, party);
                              }}
                              className={cn(iconControl, "relative")}
                              aria-label={
                                unread > 0
                                  ? `Messages for ${record.memberName}, ${unread} unread`
                                  : `Messages for ${record.memberName}`
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
                            {perms.schedule ? (
                              <button
                                type="button"
                                onClick={() => setScheduling(record.mrn)}
                                className={iconControl}
                                aria-label={`Schedule for ${record.memberName}`}
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
        </Card>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card as="section" padding="small" className="h-full">
            <PanelHeading title="Open Concerns" />
            {concerns.length === 0 ? (
              <p className="text-body-sm text-fg-muted">No open concerns.</p>
            ) : (
              <ul className="divide-y divide-line-subtle">
                {concerns.map(({ record, concern }) => (
                  <li
                    key={concern.id}
                    className="flex items-start gap-inline-lg py-inset-xs first:pt-0 last:pb-0"
                  >
                    {concern.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- a data URL, nothing to optimise
                      <img
                        src={concern.imageUrl}
                        alt={`Photo from ${record.memberName}`}
                        className="h-12 w-12 shrink-0 rounded-control object-cover"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() =>
                          setOpen({ mrn: record.mrn, tab: "overview" })
                        }
                        className={cn(
                          "cursor-pointer rounded-control-small text-label-lg text-fg hover:text-fg-brand hover:underline",
                          focusRing,
                        )}
                      >
                        {record.memberName}
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
            )}
          </Card>

          <ReferralsPanel
            referrals={referrals}
            side={party === "access" ? "access" : "clinic"}
            canSend={perms.reply && party === "dialysis"}
            onSend={() => setReferring({})}
            onOpen={setOpenReferral}
          />
        </section>

        {selected && open ? (
          <PatientModal
            key={`${selected.mrn}-${open.tab}`}
            record={selected}
            store={store}
            party={party}
            perms={perms}
            initialTab={open.tab}
            onSchedule={() => {
              setScheduling(selected.mrn);
              setOpen(null);
            }}
            onRefer={
              party === "dialysis" && perms.reply
                ? () => {
                    setReferring({
                      mrn: selected.mrn,
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
            records={records}
            store={store}
            initialMrn={scheduling || records[0]?.mrn || ""}
            onScheduled={
              schedulingFor
                ? () =>
                    store.setReferralStatus(
                      schedulingFor,
                      "Scheduled",
                      perms.me,
                    )
                : undefined
            }
            onClose={() => {
              setScheduling(null);
              setSchedulingFor(null);
            }}
          />
        ) : null}

        {readingReferral ? (
          <ReferralModal
            key={readingReferral.id}
            referral={readingReferral}
            record={records.find((r) => r.mrn === readingReferral.mrn)}
            side={party === "access" ? "access" : "clinic"}
            me={perms.me}
            canReply={perms.reply}
            canAct={perms.schedule}
            store={store}
            onSchedule={() => {
              setSchedulingFor(readingReferral.id);
              setScheduling(readingReferral.mrn);
              setOpenReferral(null);
            }}
            onStartRecord={() => {
              setAddingPatient(readingReferral.mrn);
              setOpenReferral(null);
            }}
            onClose={() => setOpenReferral(null)}
          />
        ) : null}

        {referring ? (
          <SendReferralModal
            side={party === "access" ? "access" : "clinic"}
            patients={referable}
            initialMrn={referring.mrn}
            initialKind={referring.kind}
            me={perms.me}
            onSend={store.sendReferral}
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
              updatedAt={store.updatedAt}
              isFetching={store.isFetching}
              refetch={store.refetch}
            />
            {party === "dialysis" && perms.reply ? (
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
                Add Access Patient
              </Button>
            ) : null}
            {perms.schedule ? (
              <Button
                size="small"
                onClick={() => setScheduling("")}
                disabled={records.length === 0}
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
          candidates={(clinicData.data?.patients ?? []).filter(
            (p) =>
              !records.some((record) => record.mrn === p.mrn) &&
              (addingPatient === true || p.mrn === addingPatient),
          )}
          onAdd={store.addRecord}
          onClose={() => setAddingPatient(false)}
        />
      ) : null}
    </div>
  );
}
