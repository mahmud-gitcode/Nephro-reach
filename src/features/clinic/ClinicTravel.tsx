"use client";

import React, { useMemo, useState } from "react";
import { Building2, Plane, Plus, Trash2 } from "lucide-react";
import {
  TRAVEL_DOCUMENTS,
  TRIP_STATUSES,
  addConfirmedTreatment,
  canConfirm,
  confirmationError,
  destinationLabel,
  emptyPlacement,
  formatDays,
  formatEventTime,
  formatTripDates,
  hasOpenTimeChange,
  pastTrips,
  removeConfirmedTreatment,
  statusLabel,
  timePreferenceLabel,
  todayIso,
  tripLengthDays,
  upcomingTrips,
} from "@/features/travel/trip.rules";
import { useTrips } from "@/features/travel/useTrips";
import type {
  TripPlacement,
  TripRequest,
  TripStatus,
} from "@/features/travel/trip.types";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  KeyCard,
  Modal,
  SearchField,
  Select,
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
  TableThumb,
  Tabs,
  Textarea,
  type BadgeTone,
} from "@/components/ui";
import {
  AlertTriangleSolid,
  CheckCircleSolid,
  ClockSolid,
} from "@/components/icons/solid";
import { PageTitle } from "@/components/layout/PageTitle";

/* ==========================================================================
   Travel Requests — the clinic's side of travel dialysis
   --------------------------------------------------------------------------
   The brief describes a loop: the patient asks, their home clinic arranges
   transient dialysis somewhere else, and the confirmation comes back to the
   patient in NephroReach. This page is the middle of that loop. It moved
   here from the admin dashboard (2026-09-29): arranging a chair away from
   home is the patient's own clinic's job.

   Laid out like every other clinic page (2026-09-29): stat cards, then one
   card with the requests as a flush table — Open and Past tabs, a search
   and a status filter — and each request opens in a popup to be managed.
   A long form per request, stacked down the page, did not survive a clinic
   with twenty of them.
   ========================================================================== */

const HREF = "/dashboard/clinic/travel";
const ALL = "all";

const patientName = (trip: TripRequest) => trip.patient?.name ?? "Patient";

/** Where a request stands, as a tag colour. */
const STATUS_TONE: Record<TripStatus, BadgeTone> = {
  submitted: "info",
  "facility-reviewing": "info",
  "records-sent": "accent",
  "placement-pending": "warning",
  confirmed: "success",
  closed: "neutral",
};

function StatusTag({ trip }: { trip: TripRequest }) {
  return (
    <Badge tone={STATUS_TONE[trip.status]}>
      {statusLabel(trip.status, false)}
    </Badge>
  );
}

/* ------------------------------------------------------------ the table */

function RequestRow({
  trip,
  onManage,
}: {
  trip: TripRequest;
  onManage: () => void;
}) {
  const booked = trip.placement?.treatments.length ?? 0;
  const short = booked < trip.treatmentsNeeded;

  return (
    <TableRow>
      <TableCell emphasis>
        <span className="flex items-center gap-inline-md">
          <TableThumb name={patientName(trip)} />
          <span className="min-w-0">
            {patientName(trip)}
            {trip.patient?.email ? (
              <span className="block text-caption font-normal text-fg-muted">
                {trip.patient.email}
              </span>
            ) : null}
          </span>
        </span>
      </TableCell>
      <TableCell>{destinationLabel(trip)}</TableCell>
      <TableCell className="whitespace-nowrap">
        {formatTripDates(trip, false)}
        <span className="block text-caption text-fg-muted">
          {tripLengthDays(trip)} days
        </span>
      </TableCell>
      <TableCell className="whitespace-nowrap tabular-nums">
        <span className={short ? "text-warning" : undefined}>
          {booked} / {trip.treatmentsNeeded}
        </span>
        <span className="block text-caption text-fg-muted">booked</span>
      </TableCell>
      <TableCell>
        {trip.placement?.facilityName || (
          <span className="text-fg-muted">Not arranged</span>
        )}
      </TableCell>
      <TableCell>
        <span className="flex flex-col items-start gap-stack-xs">
          <StatusTag trip={trip} />
          {hasOpenTimeChange(trip) ? (
            <Badge tone="warning" icon={<ClockSolid aria-hidden="true" />}>
              Time change asked
            </Badge>
          ) : null}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          onClick={onManage}
          aria-label={`Manage ${patientName(trip)}'s trip to ${destinationLabel(trip)}`}
        >
          Manage
        </Button>
      </TableCell>
    </TableRow>
  );
}

/* ----------------------------------------------------------- the popup */

function Detail({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div>
      <dt className="text-caption text-fg-muted">{label}</dt>
      <dd className="text-body-sm text-fg">{value}</dd>
    </div>
  );
}

/**
 * One request, managed in one place. The arrangement — status, placement,
 * message — is a draft saved together, so a coordinator can fill it in
 * over a phone call without half of it reaching the patient early. An open
 * time-change request is answered on its own, straight away: someone is
 * waiting on it.
 */
function ManageModal({
  trip,
  onClose,
  onSave,
  onResolveTimeChange,
}: {
  trip: TripRequest;
  onClose: () => void;
  onSave: (next: {
    status: TripStatus;
    placement: TripPlacement;
    note: string;
  }) => void;
  onResolveTimeChange: (reply: string) => void;
}) {
  const [status, setStatus] = useState<TripStatus>(trip.status);
  const [placement, setPlacement] = useState<TripPlacement>(
    () => trip.placement ?? emptyPlacement(),
  );
  const [note, setNote] = useState(trip.facilityNote);
  const [date, setDate] = useState(trip.departDate);
  const [time, setTime] = useState("07:00");
  const [timeReply, setTimeReply] = useState("");

  const booked = placement.treatments.length;
  const shortfall = Math.max(0, trip.treatmentsNeeded - booked);
  /* Checked against the draft, so the warning answers what is about to be
     saved, not what was saved before. */
  const blocked =
    status === "confirmed"
      ? confirmationError({ ...trip, status, placement })
      : null;

  const readyDocuments = TRAVEL_DOCUMENTS.filter((document) =>
    trip.documentsReady.includes(document.key),
  );

  return (
    <Modal
      open
      size="wide"
      onClose={onClose}
      title={`${patientName(trip)} — ${destinationLabel(trip)}`}
      description={`${formatTripDates(trip, false)} · ${tripLengthDays(trip)} days · ${trip.treatmentsNeeded} treatment(s) needed`}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-inline-md">
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave({ status, placement, note })}>
            Save changes
          </Button>
        </div>
      }
    >
      <div className="space-y-stack-lg">
        {hasOpenTimeChange(trip) && trip.timeChange ? (
          <Alert
            tone="warning"
            title={`Time change requested — ${trip.timeChange.preferredTime}`}
          >
            <div className="space-y-stack-sm">
              <p className="text-body-sm text-fg-secondary">
                {trip.timeChange.note}
              </p>
              <p className="text-body-sm text-fg-muted">
                Asked {formatEventTime(trip.timeChange.requestedAt, false)}
                {trip.timeChange.preferredDays.length > 0
                  ? ` · ${formatDays(trip.timeChange.preferredDays, false)}`
                  : null}
              </p>
              <div className="flex flex-wrap items-end gap-inline-md">
                <Input
                  value={timeReply}
                  onChange={(event) => setTimeReply(event.target.value)}
                  placeholder="What you did about it"
                  aria-label="Reply about the time change"
                  className="sm:w-[320px]"
                />
                <Button
                  size="small"
                  disabled={!timeReply.trim()}
                  onClick={() => {
                    onResolveTimeChange(timeReply.trim());
                    setTimeReply("");
                  }}
                >
                  Answer
                </Button>
              </div>
            </div>
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 gap-inset-lg lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* What the patient sent. */}
          <section
            aria-labelledby="request-heading"
            className="space-y-stack-md"
          >
            <h3 id="request-heading" className="text-heading-5 text-fg">
              The request
            </h3>
            <dl className="space-y-stack-md rounded-card-nested bg-surface-sunken p-inset-md">
              <Detail
                label="Preferred days"
                value={`${formatDays(trip.preferredDays, false)} · ${timePreferenceLabel(trip.preferredTime, false)}`}
              />
              <Detail label="Patient phone" value={trip.contactPhone} />
              <Detail
                label="Emergency contact"
                value={[
                  trip.emergencyContact.name,
                  trip.emergencyContact.relationship,
                  trip.emergencyContact.phone,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
              <Detail
                label="Insurance"
                value={[trip.insurance.plan, trip.insurance.memberId]
                  .filter(Boolean)
                  .join(" · ")}
              />
              <Detail
                label="Documents ready"
                value={
                  readyDocuments.length === 0
                    ? "None yet"
                    : `${readyDocuments.length} of ${TRAVEL_DOCUMENTS.length} — ${readyDocuments
                        .map((document) => document.labelEn)
                        .join(", ")}`
                }
              />
              <Detail label="Notes" value={trip.notes} />
            </dl>
          </section>

          {/* What the clinic arranges. */}
          <section
            aria-labelledby="arrangement-heading"
            className="space-y-stack-lg"
          >
            <h3 id="arrangement-heading" className="text-heading-5 text-fg">
              Your arrangement
            </h3>

            <FormField label="Status">
              {(props) => (
                <Select
                  {...props}
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as TripStatus)
                  }
                >
                  {TRIP_STATUSES.map((entry) => (
                    <option key={entry.value} value={entry.value}>
                      {entry.labelEn}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>

            {/* The name gets the room: "Fresenius Kidney Care — Orlando
                East" cut off at half width. */}
            <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <FormField label="Receiving facility">
                {(props) => (
                  <Input
                    {...props}
                    value={placement.facilityName}
                    onChange={(event) =>
                      setPlacement({
                        ...placement,
                        facilityName: event.target.value,
                      })
                    }
                    placeholder="Bayview Dialysis Center"
                  />
                )}
              </FormField>
              <FormField label="Facility phone">
                {(props) => (
                  <Input
                    {...props}
                    type="tel"
                    value={placement.phone}
                    onChange={(event) =>
                      setPlacement({ ...placement, phone: event.target.value })
                    }
                  />
                )}
              </FormField>
            </div>

            <FormField label="Facility address">
              {(props) => (
                <Input
                  {...props}
                  value={placement.address}
                  onChange={(event) =>
                    setPlacement({ ...placement, address: event.target.value })
                  }
                />
              )}
            </FormField>

            <div className="space-y-stack-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-inline-md">
                <p className="text-label-lg text-fg">Booked treatments</p>
                <p
                  className={`text-body-sm ${shortfall > 0 ? "text-warning" : "text-success"}`}
                >
                  {booked} of {trip.treatmentsNeeded} booked
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-inline-md">
                <Input
                  type="date"
                  aria-label="Treatment date"
                  value={date}
                  min={trip.departDate}
                  max={trip.returnDate}
                  onChange={(event) => setDate(event.target.value)}
                  className="flex-1"
                />
                <Input
                  type="time"
                  aria-label="Treatment time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="neutral"
                  appearance="fill-stroke"
                  disabled={!date || !time}
                  onClick={() =>
                    setPlacement(addConfirmedTreatment(placement, date, time))
                  }
                >
                  <Plus aria-hidden="true" />
                  Add
                </Button>
              </div>
              {placement.treatments.length > 0 ? (
                <ul className="divide-y divide-line rounded-card-nested border border-line">
                  {placement.treatments.map((treatment) => (
                    <li
                      key={treatment.id}
                      className="flex items-center justify-between gap-inline-md px-inset-md py-inset-xs"
                    >
                      <span className="text-body-sm text-fg tabular-nums">
                        {treatment.date} · {treatment.time}
                      </span>
                      <Button
                        size="small"
                        variant="danger"
                        appearance="ghost"
                        iconOnly
                        aria-label={`Remove ${treatment.date} ${treatment.time}`}
                        onClick={() =>
                          setPlacement(
                            removeConfirmedTreatment(placement, treatment.id),
                          )
                        }
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-sm text-fg-muted">
                  No times booked yet. A trip cannot be confirmed without them.
                </p>
              )}
            </div>

            <FormField
              label="Message to the patient"
              hint="Shown on their trip. Leave it empty until there is something to say."
            >
              {(props) => (
                <Textarea
                  {...props}
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              )}
            </FormField>

            {blocked ? (
              <Alert tone="warning">
                Marked confirmed, but there{" "}
                {blocked === "no-treatments"
                  ? "are no treatment times"
                  : "is no receiving facility"}
                . The patient would be told it is booked.
              </Alert>
            ) : null}
          </section>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------- the page */

export default function ClinicTravel() {
  const {
    trips,
    saveArrangement,
    resolveTimeChange,
    isPending,
    error,
    refetch,
    saveError,
    dismissSaveError,
  } = useTrips();

  const [view, setView] = useState<"open" | "past">("open");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [managingId, setManagingId] = useState<string | null>(null);

  const today = todayIso();
  const upcoming = useMemo(() => upcomingTrips(trips, today), [trips, today]);
  const past = useMemo(() => pastTrips(trips, today), [trips, today]);

  const needsAction = upcoming.filter((trip) => !canConfirm(trip)).length;
  const timeChanges = upcoming.filter(hasOpenTimeChange).length;
  const confirmed = upcoming.filter(
    (trip) => trip.status === "confirmed",
  ).length;

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (view === "open" ? upcoming : past).filter(
      (trip) =>
        (statusFilter === ALL || trip.status === statusFilter) &&
        (!needle ||
          `${patientName(trip)} ${trip.patient?.email ?? ""} ${destinationLabel(trip)} ${trip.placement?.facilityName ?? ""}`
            .toLowerCase()
            .includes(needle)),
    );
  }, [view, upcoming, past, query, statusFilter]);

  /* Read live from the list, so a save shows straight through. */
  const managing = trips.find((trip) => trip.id === managingId) ?? null;

  return (
    <div className="space-y-4">
      <PageTitle href={HREF} />

      {saveError ? (
        <Alert
          tone="danger"
          title="That change did not save"
          onDismiss={dismissSaveError}
        >
          The request is unchanged, and the patient has not been told anything.
        </Alert>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KeyCard
          icon={<Plane />}
          value={upcoming.length}
          label="Open requests"
          note="Upcoming and in progress"
        />
        <KeyCard
          tone="warning"
          icon={<AlertTriangleSolid />}
          value={needsAction}
          label="Need action"
          note="No facility or times yet"
        />
        <KeyCard
          tone="accent"
          icon={<ClockSolid />}
          value={timeChanges}
          label="Time changes asked"
          note="A patient is waiting"
        />
        <KeyCard
          tone="success"
          icon={<CheckCircleSolid />}
          value={confirmed}
          label="Confirmed"
          note="Placement and times sent"
        />
      </section>

      <Card as="section" padding="none" className="overflow-hidden">
        <div className="flex flex-col gap-inset-sm p-card pb-stack-lg lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-inline-lg">
            <h2 className="text-heading-4 text-fg">Travel requests</h2>
            <Tabs
              label="Which requests"
              value={view}
              onChange={setView}
              items={[
                { id: "open", label: `Open (${upcoming.length})` },
                { id: "past", label: `Past (${past.length})` },
              ]}
            />
          </div>
          <div className="flex flex-col gap-inline-md sm:flex-row sm:items-center">
            <SearchField
              label="Search travel requests"
              placeholder="Search patient or destination…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="sm:w-64"
            />
            <Select
              selectSize="small"
              aria-label="Status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value={ALL}>All statuses</option>
              {TRIP_STATUSES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.labelEn}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <AsyncSection
          /* Loading shows as skeleton rows inside the table below, so the
             header and filters stay put; this section only handles the
             failed and empty states. */
          pending={false}
          skeleton={null}
          error={error}
          onRetry={refetch}
          isEmpty={!isPending && trips.length === 0}
          errorTitle="Travel requests did not load"
          empty={
            <div className="px-card pb-card">
              <EmptyState
                variant="bare"
                icon={<Plane aria-hidden="true" />}
                title="No travel requests"
                description="When a patient asks for dialysis while they are away, the request lands here."
              />
            </div>
          }
        >
          <Table minWidth={900}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Patient</TableHeaderCell>
                <TableHeaderCell>Destination</TableHeaderCell>
                <TableHeaderCell>Dates</TableHeaderCell>
                <TableHeaderCell>Treatments</TableHeaderCell>
                <TableHeaderCell>Receiving facility</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            {isPending ? (
              <TableSkeleton rows={4} columns={7} />
            ) : (
              <TableBody>
                {rows.length === 0 ? (
                  <TableEmptyRow colSpan={7}>
                    <p className="text-center text-body-sm text-fg-muted">
                      {view === "open" && upcoming.length === 0
                        ? "Nothing open — every current request has been dealt with."
                        : "No requests match these filters."}
                    </p>
                  </TableEmptyRow>
                ) : (
                  rows.map((trip) => (
                    <RequestRow
                      key={trip.id}
                      trip={trip}
                      onManage={() => setManagingId(trip.id)}
                    />
                  ))
                )}
              </TableBody>
            )}
          </Table>
        </AsyncSection>

        <p className="flex items-center gap-inline-sm border-t border-line px-(--table-edge) py-inset-sm text-caption text-fg-muted">
          <Building2 aria-hidden="true" className="h-4 w-4 shrink-0" />
          Everything you save appears on the patient&rsquo;s trip.
        </p>
      </Card>

      {managing ? (
        <ManageModal
          key={managing.id}
          trip={managing}
          onClose={() => setManagingId(null)}
          onResolveTimeChange={(reply) => resolveTimeChange(managing.id, reply)}
          onSave={({ status, placement, note }) => {
            /* One write for all three, and only what changed. */
            saveArrangement(managing.id, {
              status: status !== managing.status ? status : undefined,
              placement:
                JSON.stringify(placement) !==
                JSON.stringify(managing.placement ?? emptyPlacement())
                  ? placement
                  : undefined,
              note: note !== managing.facilityNote ? note : undefined,
            });
            setManagingId(null);
          }}
        />
      ) : null}
    </div>
  );
}
