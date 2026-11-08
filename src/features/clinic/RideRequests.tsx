"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Car, Check, Plus } from "lucide-react";
import {
  Alert,
  Button,
  Card,
  ErrorState,
  FormField,
  Input,
  Modal,
  Select,
  Skeleton,
  SwitchRow,
} from "@/components/ui";
import { isApiError } from "@/lib/api/client";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { cn } from "@/lib/utils/cn";
import {
  dayKey,
  formatDay,
  formatTime,
  MOBILITY_LEVELS,
  toHhMm,
  type MobilityLevel,
  type QueuedRide,
  type TransportConfirmation,
  type TransportRequest,
} from "@/features/vascular-access/vascularAccess.data";
import {
  TransportAsk,
  TransportConfirmationView,
  TransportStatusBadge,
  TransportSteps,
} from "@/features/vascular-access/AccessUi";
import { listAppointments } from "@/features/vascular-access/access.repository";
import { toAppointment } from "@/features/vascular-access/access.mapper";
import {
  accessKey,
  useAccessActions,
  useAccessRoster,
  useOfficeOrgId,
  useRideQueue,
  type AccessActions,
} from "@/features/vascular-access/useAccess";
import { useAuth } from "@/features/auth/AuthContext";
import { userCan } from "@/features/staff/staff";

/* ==========================================================================
   Ride requests — the dialysis center's social worker
   --------------------------------------------------------------------------
   A patient's ride to an access appointment goes to the dialysis center's
   social worker, who books it. The client (2026-10-01): transportation is
   not the access center's job, so this lives on the dialysis center's
   messaging board, for the social worker and the administrator, and not
   on the access center's dashboard.

   On the API (Phase 10): the queue is the office's rides across all its
   records (`GET /organizations/:orgId/transport?active=true`, BE-12,
   spec 048), paged. Each action is the record's own route
   (acknowledge, confirm with HH:mm times, cancel, set up), which the server
   allows only for the dialysis center on that record and only for the
   roles with transport Edit (D4, PM-2); the buttons follow those levels
   and a refusal is shown, never hidden.
   ========================================================================== */

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function refusal(error: unknown): string {
  return isApiError(error) && error.messages[0]
    ? error.messages[0]
    : "That change did not save. Try again.";
}

/* ----------------------------------------------------------- ride booking */

/** The coordinator books the ride: the details go to the patient. Also
 *  used to correct a confirmed ride (the same route). */
function ConfirmRideModal({
  ride,
  actions,
  onClose,
}: {
  ride: QueuedRide;
  actions: AccessActions;
  onClose: () => void;
}) {
  const { request } = ride;
  const appointment = request.appointment;
  const current = request.confirmation;
  const [form, setForm] = useState<TransportConfirmation>({
    pickupTime: current?.pickupTime ?? "",
    returnPickupTime: current?.returnPickupTime ?? "",
    provider: current?.provider ?? "",
    phone: current?.phone ?? "",
    confirmationNumber: current?.confirmationNumber ?? "",
    note: current?.note ?? "",
  });
  const [tried, setTried] = useState(false);
  const [failed, setFailed] = useState<unknown>(null);
  const set = (change: Partial<TransportConfirmation>) =>
    setForm((f) => ({ ...f, ...change }));

  const errors = {
    pickupTime: toHhMm(form.pickupTime) ? undefined : "Set the pickup time",
    provider: form.provider.trim() ? undefined : "Who is driving?",
    phone:
      form.phone.replace(/\D/g, "").length >= 7
        ? undefined
        : "Enter a phone number",
    confirmationNumber: form.confirmationNumber.trim()
      ? undefined
      : "Enter the confirmation number",
  };
  const valid = Object.values(errors).every((e) => !e);
  const show = (e?: string) => (tried ? e : undefined);

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={current ? "Edit Ride" : "Confirm Ride"}
      description={`${ride.memberName} · ${appointment ? `${appointment.title}, ${formatDay(appointment.date)} at ${formatTime(appointment.time)}` : "Appointment removed"}`}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={actions.isSaving}
            onClick={async () => {
              setTried(true);
              if (!valid) return;
              setFailed(null);
              const ok = await actions.confirmTransport(
                request.profileId,
                request.id,
                form,
              );
              if (ok) onClose();
              else setFailed(true);
            }}
          >
            {current ? "Save Changes" : "Confirm & Notify Patient"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-lg">
        {failed ? (
          <Alert tone="danger" onDismiss={() => setFailed(null)}>
            {refusal(actions.error ?? failed)}
          </Alert>
        ) : null}
        <section className="rounded-card-nested border border-line p-inset-sm">
          <h3 className="mb-stack-sm text-heading-5 text-fg">
            What the patient asked for
          </h3>
          <TransportAsk request={request} />
        </section>
        <div className="grid gap-stack-md sm:grid-cols-2">
          <FormField
            label="Pickup time"
            required
            error={show(errors.pickupTime)}
          >
            {(field) => (
              <Input
                {...field}
                type="time"
                value={form.pickupTime}
                onChange={(e) => set({ pickupTime: e.target.value })}
              />
            )}
          </FormField>
          {request.returnTrip ? (
            <FormField
              label="Return pickup time"
              hint="Or leave blank for will-call."
            >
              {(field) => (
                <Input
                  {...field}
                  type="time"
                  value={form.returnPickupTime}
                  onChange={(e) => set({ returnPickupTime: e.target.value })}
                />
              )}
            </FormField>
          ) : null}
          <FormField
            label="Transport company or driver"
            required
            error={show(errors.provider)}
          >
            {(field) => (
              <Input
                {...field}
                value={form.provider}
                onChange={(e) => set({ provider: e.target.value })}
              />
            )}
          </FormField>
          <FormField label="Phone" required error={show(errors.phone)}>
            {(field) => (
              <Input
                {...field}
                type="tel"
                value={form.phone}
                onChange={(e) => set({ phone: e.target.value })}
              />
            )}
          </FormField>
          <FormField
            label="Confirmation number"
            required
            error={show(errors.confirmationNumber)}
          >
            {(field) => (
              <Input
                {...field}
                value={form.confirmationNumber}
                onChange={(e) => set({ confirmationNumber: e.target.value })}
              />
            )}
          </FormField>
        </div>
        <FormField label="Note for the patient">
          {(field) => (
            <Input
              {...field}
              value={form.note}
              onChange={(e) => set({ note: e.target.value })}
              placeholder="E.g. driver will call 10 minutes before"
            />
          )}
        </FormField>
      </div>
    </Modal>
  );
}

/** The office's live ride requests. The dialysis center works them; other
 *  roles see where each one is. */
export function RideRequestsPanel({
  orgId,
  canManage,
  onOpen,
}: {
  orgId: string | null;
  /** The roles with transport Edit (D4: Administrator, Social Worker). */
  canManage: boolean;
  /** Opens the patient's access record, where the page has one. */
  onOpen?: (profileId: string) => void;
}) {
  const queue = useRideQueue(orgId);
  const actions = useAccessActions(
    orgId ? { kind: "office", organizationId: orgId } : null,
  );
  /* The ride being booked: by its request, or by the appointment of one
     just set up (its id comes back from the server's queue). */
  const [editing, setEditing] = useState<{
    profileId: string;
    id?: string;
    appointmentId?: string;
  } | null>(null);
  const [settingUp, setSettingUp] = useState(false);
  const rides = [...queue.rides].sort((a, b) => {
    /* The ones still to book first, oldest first. */
    const rank = (r: TransportRequest) => (r.status === "Confirmed" ? 1 : 0);
    return (
      rank(a.request) - rank(b.request) ||
      a.request.requestedAt.localeCompare(b.request.requestedAt)
    );
  });
  const works = canManage;
  const selected = editing
    ? rides.find(
        (ride) =>
          ride.request.profileId === editing.profileId &&
          (ride.request.id === editing.id ||
            ride.request.appointmentId === editing.appointmentId),
      )
    : null;

  let list: React.ReactNode;
  if (queue.error) {
    list = (
      <ErrorState
        title={errorTitleFor(queue.error, "Ride requests could not be loaded")}
        message={errorMessageFor(queue.error, undefined)}
        error={queue.error}
        onRetry={canRetry(queue.error) ? queue.refetch : undefined}
      />
    );
  } else if (queue.isPending) {
    list = <Skeleton height={120} className="rounded-card" />;
  } else if (rides.length === 0) {
    list = <p className="text-body-sm text-fg-muted">No ride requests.</p>;
  } else {
    list = (
      <ul className="space-y-stack-md">
        {rides.map((ride) => {
          const { request } = ride;
          const appointment = request.appointment;
          return (
            <li
              key={request.id}
              className="space-y-stack-sm rounded-card-nested border border-line p-inset-sm"
            >
              <div className="flex items-start justify-between gap-inline-md">
                <div className="min-w-0">
                  {onOpen ? (
                    <button
                      type="button"
                      onClick={() => onOpen(request.profileId)}
                      className={cn(
                        "cursor-pointer rounded-control-small text-label-lg text-fg hover:text-fg-brand hover:underline",
                        focusRing,
                      )}
                    >
                      {ride.memberName}
                    </button>
                  ) : (
                    <p className="text-label-lg text-fg">{ride.memberName}</p>
                  )}
                  <p className="text-caption text-fg-muted">
                    {appointment
                      ? `${appointment.title} · ${formatDay(appointment.date)}, ${formatTime(appointment.time)} · ${appointment.place}`
                      : "Appointment removed"}
                  </p>
                </div>
                <TransportStatusBadge status={request.status} />
              </div>
              <TransportSteps request={request} />
              {request.confirmation ? (
                <TransportConfirmationView
                  confirmation={request.confirmation}
                  confirmedBy={request.confirmedBy}
                />
              ) : (
                <TransportAsk request={request} />
              )}
              {works ? (
                <div className="flex flex-wrap gap-inline-sm">
                  {request.status === "Requested" ? (
                    <Button
                      size="small"
                      variant="neutral"
                      appearance="fill-stroke"
                      disabled={actions.isSaving}
                      onClick={() =>
                        void actions.acknowledgeTransport(
                          request.profileId,
                          request.id,
                        )
                      }
                      leadingIcon={<Check aria-hidden="true" />}
                    >
                      Acknowledge
                    </Button>
                  ) : null}
                  <Button
                    size="small"
                    variant={
                      request.status === "Confirmed" ? "neutral" : "primary"
                    }
                    appearance={
                      request.status === "Confirmed" ? "fill-stroke" : "fill"
                    }
                    onClick={() =>
                      setEditing({
                        profileId: request.profileId,
                        id: request.id,
                      })
                    }
                    leadingIcon={<Car aria-hidden="true" />}
                  >
                    {request.status === "Confirmed"
                      ? "Edit Ride"
                      : "Confirm Ride"}
                  </Button>
                  <Button
                    size="small"
                    variant="neutral"
                    appearance="ghost"
                    disabled={actions.isSaving}
                    onClick={() =>
                      void actions.cancelTransport(
                        request.profileId,
                        request.id,
                      )
                    }
                  >
                    Cancel
                  </Button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <Card as="section" padding="small" className="h-full">
      <div className="mb-stack-sm flex flex-wrap items-center justify-between gap-inline-md">
        <h2 className="text-heading-4 text-fg">Ride Requests</h2>
        {/* The clinic arranges rides to access appointments itself, not
            only when a patient asks (client, 2026-10-07). */}
        {works ? (
          <Button
            size="small"
            leadingIcon={<Plus aria-hidden="true" />}
            onClick={() => setSettingUp(true)}
          >
            Set Up Transportation
          </Button>
        ) : null}
      </div>
      <p className="mb-stack-md text-caption text-fg-muted">
        {works
          ? "Patients' rides to access appointments come to your social worker. Confirming sends the details to the patient."
          : "Your social worker or administrator arranges these rides."}
      </p>
      {actions.error && !selected && !settingUp ? (
        <div className="mb-stack-md">
          <Alert tone="danger" onDismiss={actions.clearError}>
            {refusal(actions.error)}
          </Alert>
        </div>
      ) : null}
      {list}
      {queue.hasMore ? (
        <div className="mt-stack-md flex justify-center">
          <Button
            size="small"
            variant="neutral"
            appearance="fill-stroke"
            onClick={queue.loadMore}
          >
            Load more
          </Button>
        </div>
      ) : null}

      {settingUp ? (
        <SetUpRideModal
          orgId={orgId}
          actions={actions}
          onClose={() => setSettingUp(false)}
          onSaved={(profileId, appointmentId) => {
            setSettingUp(false);
            /* Straight on to booking it. */
            setEditing({ profileId, appointmentId });
          }}
        />
      ) : null}

      {selected ? (
        <ConfirmRideModal
          key={selected.request.id}
          ride={selected}
          actions={actions}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </Card>
  );
}

/* ------------------------------------------------- clinic sets up a ride */

/** The dialysis center starts a ride for an upcoming access appointment
 *  that has none yet; booking it follows (ConfirmRideModal). */
function SetUpRideModal({
  orgId,
  actions,
  onSaved,
  onClose,
}: {
  orgId: string | null;
  actions: AccessActions;
  onSaved: (profileId: string, appointmentId: string) => void;
  onClose: () => void;
}) {
  const [today] = useState(() => dayKey(Date.now()));
  /* The records this office is the dialysis center on. */
  const roster = useAccessRoster(orgId);
  const choices = roster.rows.filter((row) => row.party === "dialysis");
  const [profileId, setProfileId] = useState("");
  const chosenId = profileId || choices[0]?.id || "";
  const target = orgId
    ? ({ kind: "office", organizationId: orgId } as const)
    : null;
  /* That record's upcoming visits with no ride yet. */
  const visits = useQuery({
    queryKey: accessKey(target, chosenId, "appointments", "upcoming"),
    queryFn: () =>
      listAppointments(target!, chosenId, { state: "upcoming", limit: 50 }),
    enabled: !!target && !!chosenId,
  });
  const open = (visits.data?.items ?? [])
    .map(toAppointment)
    .filter((a) => !a.completed && a.date >= today && !a.transportStatus);
  const [appointmentId, setAppointmentId] = useState("");
  const chosenAppointment = appointmentId || open[0]?.id || "";
  const [pickup, setPickup] = useState("");
  const [returnTrip, setReturnTrip] = useState(true);
  const [mobility, setMobility] = useState<MobilityLevel>("ambulatory");
  const [tried, setTried] = useState(false);
  const [failed, setFailed] = useState<unknown>(null);
  const pickupError = pickup.trim() ? undefined : "Enter the pickup address.";
  const loadError = roster.error ?? visits.error;

  return (
    <Modal
      open
      onClose={onClose}
      title="Set Up Transportation"
      description="A ride to a vascular access appointment. Next, add the ride details the patient will see."
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!chosenAppointment || actions.isSaving}
            onClick={async () => {
              setTried(true);
              if (pickupError || !chosenAppointment) return;
              setFailed(null);
              const ok = await actions.setUpTransport(chosenId, {
                appointmentId: chosenAppointment,
                pickupAddress: pickup.trim(),
                returnTrip,
                mobility,
                memberNote: "Arranged by your dialysis center.",
              });
              if (ok) onSaved(chosenId, chosenAppointment);
              else setFailed(true);
            }}
          >
            Continue
          </Button>
        </>
      }
    >
      {loadError ? (
        <ErrorState
          title={errorTitleFor(loadError, "Appointments could not be loaded")}
          message={errorMessageFor(loadError, undefined)}
          error={loadError}
        />
      ) : roster.isPending ? (
        <Skeleton height={160} className="rounded-card" />
      ) : choices.length === 0 ? (
        <p className="text-body-sm text-fg-muted">
          Every upcoming access appointment already has a ride.
        </p>
      ) : (
        <div className="space-y-stack-md">
          {failed ? (
            <Alert tone="danger" onDismiss={() => setFailed(null)}>
              {refusal(actions.error ?? failed)}
            </Alert>
          ) : null}
          <FormField label="Patient" required>
            {(field) => (
              <Select
                {...field}
                value={chosenId}
                onChange={(e) => {
                  setProfileId(e.target.value);
                  setAppointmentId("");
                }}
              >
                {choices.map((row) => (
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
                value={chosenAppointment}
                onChange={(e) => setAppointmentId(e.target.value)}
              >
                {open.length === 0 ? (
                  <option value="">
                    No upcoming appointment without a ride
                  </option>
                ) : null}
                {open.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} · {formatDay(a.date)}, {formatTime(a.time)}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField
            label="Pickup address"
            required
            error={tried ? pickupError : undefined}
          >
            {(field) => (
              <Input
                {...field}
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
              />
            )}
          </FormField>
          <FormField label="Mobility">
            {(field) => (
              <Select
                {...field}
                value={mobility}
                onChange={(e) => setMobility(e.target.value as MobilityLevel)}
              >
                {MOBILITY_LEVELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.en}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <SwitchRow
            checked={returnTrip}
            onChange={setReturnTrip}
            title="Return trip"
            description="A ride home after the appointment."
          />
        </div>
      )}
    </Modal>
  );
}

/** The panel as the clinic's Messages page shows it: only to the people
 *  who book rides, the social worker and the administrator (the server's
 *  transport level, D4/PM-2). Name and props unchanged: ClinicMessages
 *  (COLLAB) renders it. */
export function ClinicRideRequests() {
  const { user } = useAuth();
  const orgId = useOfficeOrgId();
  /* The dialysis center's alone: never on the nephrology office's page. */
  if (user?.role !== "clinic" || !userCan(user, "rides.manage") || !orgId) {
    return null;
  }
  return <RideRequestsPanel orgId={orgId} canManage />;
}
