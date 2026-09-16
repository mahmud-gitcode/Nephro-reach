"use client";

import React, { useMemo, useState } from "react";
import { Building2, Check, Plane, Plus, Trash2 } from "lucide-react";
import {
  TRAVEL_DOCUMENTS,
  TRIP_STATUSES,
  addConfirmedTreatment,
  canConfirm,
  confirmationError,
  emptyPlacement,
  formatDays,
  formatTripDates,
  destinationLabel,
  formatEventTime,
  hasOpenTimeChange,
  pastTrips,
  placementShortfall,
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
  Modal,
  Select,
  Skeleton,
  Textarea,
} from "@/components/ui";

/* ==========================================================================
   Travel Requests — the facility side
   --------------------------------------------------------------------------
   The brief describes a loop: the patient asks, the home facility coordinates
   transient dialysis somewhere else, and the confirmation comes back to the
   patient in NephroReach. This screen is the middle of that loop.

   It lives under the admin dashboard because NephroReach has no facility
   role yet. When one exists this page moves behind it unchanged — nothing
   here assumes an administrator rather than a coordinator.
   ========================================================================== */

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="flex flex-wrap gap-inline-md">
      <span className="w-[150px] shrink-0 text-body-sm text-fg-muted">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-body-sm text-fg">{value}</span>
    </div>
  );
}

function RequestCard({
  trip,
  onStatus,
  onOpenPlacement,
  onNote,
  onResolveTimeChange,
}: {
  trip: TripRequest;
  onStatus: (status: TripStatus) => void;
  onOpenPlacement: () => void;
  onNote: (note: string) => void;
  onResolveTimeChange: (reply: string) => void;
}) {
  const [note, setNote] = useState(trip.facilityNote);
  const [timeReply, setTimeReply] = useState("");
  const shortfall = placementShortfall(trip);
  const blocked = confirmationError(trip);

  const readyDocuments = TRAVEL_DOCUMENTS.filter((document) =>
    trip.documentsReady.includes(document.key),
  );

  return (
    <Card as="article" tone="flat" padding="small" className="space-y-stack-md">
      {/* An open time-change request leads the card. It is the one thing on
        here with a member waiting on the other end of it, and burying it
        under the placement controls is how it sits unanswered for a week. */}
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
                onClick={() => {
                  onResolveTimeChange(timeReply.trim());
                  setTimeReply("");
                }}
                /* A reply is required: closing it silently leaves the member
                   watching a request that simply disappeared. */
                disabled={!timeReply.trim()}
              >
                Answer
              </Button>
            </div>
          </div>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-inline-md">
        <div className="min-w-0">
          <p className="text-label-md text-fg">{destinationLabel(trip)}</p>
          <p className="mt-stack-xs text-body-sm text-fg-muted">
            {formatTripDates(trip, false)} · {tripLengthDays(trip)} days ·{" "}
            {trip.treatmentsNeeded} treatment(s) needed
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-inline-md">
          <Badge tone={trip.status === "confirmed" ? "success" : "info"}>
            {statusLabel(trip.status, false)}
          </Badge>
          <Select
            selectSize="small"
            value={trip.status}
            aria-label={`Status for the trip to ${destinationLabel(trip)}`}
            onChange={(event) => onStatus(event.target.value as TripStatus)}
            className="w-[190px]"
          >
            {TRIP_STATUSES.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.labelEn}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Everything the coordinator needs in front of them before they pick
          up the phone, rather than in four different screens. */}
      <div className="space-y-stack-xs rounded-card border border-line bg-surface p-inset-sm">
        <DetailRow
          label="Preferred days"
          value={`${formatDays(trip.preferredDays, false)} · ${timePreferenceLabel(trip.preferredTime, false)}`}
        />
        <DetailRow label="Patient phone" value={trip.contactPhone} />
        <DetailRow
          label="Emergency contact"
          value={[
            trip.emergencyContact.name,
            trip.emergencyContact.relationship,
            trip.emergencyContact.phone,
          ]
            .filter(Boolean)
            .join(" · ")}
        />
        <DetailRow
          label="Insurance"
          value={[trip.insurance.plan, trip.insurance.memberId]
            .filter(Boolean)
            .join(" · ")}
        />
        <DetailRow label="Notes" value={trip.notes} />
        <DetailRow
          label="Documents ready"
          value={
            readyDocuments.length === 0
              ? "None yet"
              : `${readyDocuments.length}/${TRAVEL_DOCUMENTS.length} — ${readyDocuments
                  .map((document) => document.labelEn)
                  .join(", ")}`
          }
        />
      </div>

      {/* The placement, and what is still missing before it can be called
          confirmed. A patient reading "Confirmed" stops chasing it. */}
      <div className="flex flex-wrap items-center justify-between gap-inline-md rounded-card border border-line bg-surface p-inset-sm">
        <div className="min-w-0">
          <p className="flex items-center gap-inline-sm text-label-md text-fg">
            <Building2 aria-hidden="true" className="h-4 w-4 shrink-0" />
            {trip.placement?.facilityName || "No receiving facility yet"}
          </p>
          <p className="mt-stack-xs text-body-sm text-fg-muted">
            {trip.placement?.treatments.length
              ? `${trip.placement.treatments.length} treatment(s) booked${
                  shortfall > 0 ? ` · ${shortfall} still to arrange` : ""
                }`
              : "No treatment times booked"}
          </p>
        </div>
        <Button size="small" onClick={onOpenPlacement}>
          {trip.placement?.facilityName ? "Edit placement" : "Add placement"}
        </Button>
      </div>

      {trip.status === "confirmed" && blocked ? (
        <Alert tone="warning">
          This trip is marked confirmed but has{" "}
          {blocked === "no-treatments"
            ? "no treatment times"
            : "no receiving facility"}
          . The patient is being told it is booked.
        </Alert>
      ) : null}

      <FormField
        label="Message to the patient"
        hint="Shown on their trip. Leave it empty until there is something to say."
      >
        {(props) => (
          <div className="flex flex-col gap-inline-md sm:flex-row sm:items-end">
            <Textarea
              {...props}
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="flex-1"
            />
            <Button
              variant="neutral"
              appearance="fill-stroke"
              disabled={note === trip.facilityNote}
              onClick={() => onNote(note)}
            >
              Send
            </Button>
          </div>
        )}
      </FormField>
    </Card>
  );
}

function PlacementModal({
  trip,
  onSave,
  onClose,
}: {
  trip: TripRequest;
  onSave: (placement: TripPlacement) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<TripPlacement>(
    () => trip.placement ?? emptyPlacement(),
  );
  const [date, setDate] = useState(trip.departDate);
  const [time, setTime] = useState("07:00");

  const shortfall = Math.max(
    0,
    trip.treatmentsNeeded - draft.treatments.length,
  );

  return (
    <Modal
      open
      size="wide"
      onClose={onClose}
      title={`Placement for ${destinationLabel(trip)}`}
      description="What you arranged at the other end. The patient sees this as their confirmation."
      footer={
        <div className="flex flex-wrap items-center justify-end gap-inline-md">
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(draft)}>Save placement</Button>
        </div>
      }
    >
      <div className="space-y-stack-lg">
        <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2">
          <FormField label="Receiving facility" required>
            {(props) => (
              <Input
                {...props}
                value={draft.facilityName}
                onChange={(event) =>
                  setDraft({ ...draft, facilityName: event.target.value })
                }
                placeholder="Bayview Dialysis Center"
              />
            )}
          </FormField>

          <FormField label="Phone">
            {(props) => (
              <Input
                {...props}
                type="tel"
                value={draft.phone}
                onChange={(event) =>
                  setDraft({ ...draft, phone: event.target.value })
                }
              />
            )}
          </FormField>
        </div>

        <FormField label="Address">
          {(props) => (
            <Textarea
              {...props}
              rows={2}
              value={draft.address}
              onChange={(event) =>
                setDraft({ ...draft, address: event.target.value })
              }
            />
          )}
        </FormField>

        <section className="space-y-stack-md border-t border-line pt-inset-md">
          <div className="flex flex-wrap items-baseline justify-between gap-inline-md">
            <h3 className="text-heading-5 text-fg">Confirmed treatments</h3>
            <p
              className={`text-body-sm ${shortfall > 0 ? "text-warning" : "text-success"}`}
            >
              {draft.treatments.length} of {trip.treatmentsNeeded} booked
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-inline-md">
            <FormField label="Date" className="flex-1">
              {(props) => (
                <Input
                  {...props}
                  type="date"
                  value={date}
                  min={trip.departDate}
                  max={trip.returnDate}
                  onChange={(event) => setDate(event.target.value)}
                />
              )}
            </FormField>
            <FormField label="Time" className="flex-1">
              {(props) => (
                <Input
                  {...props}
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                />
              )}
            </FormField>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              disabled={!date || !time}
              onClick={() => setDraft(addConfirmedTreatment(draft, date, time))}
            >
              <Plus aria-hidden="true" className="size-4 shrink-0" />
              Add
            </Button>
          </div>

          {draft.treatments.length === 0 ? (
            <p className="text-body-sm text-fg-muted">
              No times booked yet. A trip cannot be confirmed without them.
            </p>
          ) : (
            <ul className="space-y-stack-xs">
              {draft.treatments.map((treatment) => (
                <li
                  key={treatment.id}
                  className="flex items-center justify-between gap-inline-md rounded-control border border-line bg-surface px-inset-sm py-inset-xs"
                >
                  <span className="text-body-sm text-fg">
                    {treatment.date} · {treatment.time}
                  </span>
                  <Button
                    size="small"
                    variant="danger"
                    appearance="stroke"
                    onClick={() =>
                      setDraft(removeConfirmedTreatment(draft, treatment.id))
                    }
                    aria-label={`Remove ${treatment.date} ${treatment.time}`}
                  >
                    <Trash2 aria-hidden="true" className="size-4 shrink-0" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  );
}

export default function ManageTravelPage() {
  const {
    trips,
    setStatus,
    setPlacement,
    setFacilityNote,
    resolveTimeChange,
    isPending,
    error,
    refetch,
    saveError,
    dismissSaveError,
  } = useTrips();

  const [placing, setPlacing] = useState<TripRequest | null>(null);

  const today = todayIso();
  const upcoming = useMemo(() => upcomingTrips(trips, today), [trips, today]);
  const past = useMemo(() => pastTrips(trips, today), [trips, today]);

  const needsAction = upcoming.filter((trip) => !canConfirm(trip)).length;

  return (
    <>
      <div className="mb-stack-lg">
        <h1 className="text-heading-1 text-fg">Travel Requests</h1>
        <p className="mt-stack-xs measure text-body-md text-fg-muted">
          Patients ask here; you arrange the chair at the other end and send the
          confirmation back. Everything you save appears on their trip.
        </p>
      </div>

      {saveError ? (
        <Alert
          tone="danger"
          title="That change did not save"
          onDismiss={dismissSaveError}
          className="mb-stack-lg"
        >
          The request is unchanged, and the patient has not been told anything.
        </Alert>
      ) : null}

      <AsyncSection
        pending={isPending}
        error={error}
        onRetry={refetch}
        isEmpty={trips.length === 0}
        errorTitle="Travel requests did not load"
        skeleton={
          <div className="space-y-stack-sm">
            <Skeleton height={200} />
          </div>
        }
        empty={
          <EmptyState
            icon={<Plane aria-hidden="true" />}
            title="No travel requests"
            description="When a patient asks for dialysis while they are away, the request lands here."
          />
        }
      >
        <div className="space-y-stack-xl">
          <section className="space-y-stack-md">
            <div className="flex flex-wrap items-baseline justify-between gap-inline-md">
              <h2 className="text-heading-4 text-fg">Open requests</h2>
              {needsAction > 0 ? (
                <p className="text-body-sm text-fg-muted">
                  {needsAction} still need a facility or treatment times
                </p>
              ) : (
                <p className="flex items-center gap-inline-sm text-body-sm text-success">
                  <Check aria-hidden="true" className="h-4 w-4 shrink-0" />
                  All arranged
                </p>
              )}
            </div>

            {upcoming.length === 0 ? (
              <EmptyState
                variant="bare"
                icon={<Plane aria-hidden="true" />}
                title="Nothing open"
                description="Every current request has been dealt with."
              />
            ) : (
              upcoming.map((trip) => (
                <RequestCard
                  key={trip.id}
                  trip={trip}
                  onStatus={(status) => setStatus(trip.id, status)}
                  onOpenPlacement={() => setPlacing(trip)}
                  onNote={(note) => setFacilityNote(trip.id, note)}
                  onResolveTimeChange={(reply) =>
                    resolveTimeChange(trip.id, reply)
                  }
                />
              ))
            )}
          </section>

          {past.length > 0 ? (
            <section className="space-y-stack-md">
              <h2 className="text-heading-4 text-fg">Past trips</h2>
              {past.map((trip) => (
                <Card key={trip.id} as="article" tone="flat" padding="small">
                  <div className="flex flex-wrap items-center justify-between gap-inline-md">
                    <div className="min-w-0">
                      <p className="text-label-md text-fg">
                        {destinationLabel(trip)}
                      </p>
                      <p className="mt-stack-xs text-body-sm text-fg-muted">
                        {formatTripDates(trip, false)} ·{" "}
                        {trip.placement?.facilityName ||
                          "No placement recorded"}
                      </p>
                    </div>
                    <Badge tone="neutral">
                      {statusLabel(trip.status, false)}
                    </Badge>
                  </div>
                </Card>
              ))}
            </section>
          ) : null}
        </div>
      </AsyncSection>

      {placing ? (
        <PlacementModal
          trip={placing}
          onSave={(placement) => {
            setPlacement(placing.id, placement);
            setPlacing(null);
          }}
          onClose={() => setPlacing(null)}
        />
      ) : null}
    </>
  );
}
