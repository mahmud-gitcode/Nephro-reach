"use client";

import React, { useState } from "react";
import { Car, Check, Plus } from "lucide-react";
import {
  Button,
  Card,
  FormField,
  Input,
  Modal,
  Select,
  SwitchRow,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import {
  activeTransport,
  formatDay,
  formatTime,
  MOBILITY_LEVELS,
  transportFor,
  upcomingAppointments,
  type MobilityLevel,
  type AccessRecord,
  type TransportConfirmation,
  type TransportRequest,
} from "@/features/vascular-access/vascularAccess.data";
import {
  TransportAsk,
  TransportConfirmationView,
  TransportStatusBadge,
  TransportSteps,
} from "@/features/vascular-access/AccessUi";
import {
  useVascularAccess,
  type VascularAccessStore,
} from "@/features/vascular-access/useVascularAccess";
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
   ========================================================================== */

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/* ----------------------------------------------------------- ride booking */

/** The coordinator books the ride: the details go to the patient. Also
 *  used to correct a confirmed ride. */
function ConfirmRideModal({
  record,
  request,
  store,
  by,
  onClose,
}: {
  record: AccessRecord;
  request: TransportRequest;
  store: VascularAccessStore;
  /** Who is booking it. */
  by: string;
  onClose: () => void;
}) {
  const appointment = record.appointments.find(
    (a) => a.id === request.appointmentId,
  );
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
  const set = (change: Partial<TransportConfirmation>) =>
    setForm((f) => ({ ...f, ...change }));

  const errors = {
    pickupTime: form.pickupTime ? undefined : "Set the pickup time",
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
      description={`${record.memberName} · ${appointment ? `${appointment.title}, ${formatDay(appointment.date)} at ${formatTime(appointment.time)}` : "Appointment removed"}`}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setTried(true);
              if (!valid) return;
              store.confirmTransport(record.mrn, request.id, form, by);
              onClose();
            }}
          >
            {current ? "Save Changes" : "Confirm & Notify Patient"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-lg">
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

/** Every live ride request. The dialysis center works them; the access
 *  center sees where each one is. */
export function RideRequestsPanel({
  records,
  store,
  me,
  canManage,
  onOpen,
}: {
  records: AccessRecord[];
  store: VascularAccessStore;
  /** Who is booking, on what they confirm. */
  me: string;
  /** The social worker and the administrator work the rides. */
  canManage: boolean;
  /** Opens the patient's access record, where the page has one. */
  onOpen?: (mrn: string) => void;
}) {
  /* The ride being booked: by its request, or by the appointment of one
     just set up by the clinic (its id is made by the store). */
  const [editing, setEditing] = useState<{
    mrn: string;
    id?: string;
    appointmentId?: string;
  } | null>(null);
  const [settingUp, setSettingUp] = useState(false);
  const rides = records
    .flatMap((record) =>
      activeTransport(record).map((request) => ({ record, request })),
    )
    .sort((a, b) => {
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
          ride.record.mrn === editing.mrn &&
          (ride.request.id === editing.id ||
            ride.request.appointmentId === editing.appointmentId),
      )
    : null;

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
      {rides.length === 0 ? (
        <p className="text-body-sm text-fg-muted">No ride requests.</p>
      ) : (
        <ul className="space-y-stack-md">
          {rides.map(({ record, request }) => {
            const appointment = record.appointments.find(
              (a) => a.id === request.appointmentId,
            );
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
                        onClick={() => onOpen(record.mrn)}
                        className={cn(
                          "cursor-pointer rounded-control-small text-label-lg text-fg hover:text-fg-brand hover:underline",
                          focusRing,
                        )}
                      >
                        {record.memberName}
                      </button>
                    ) : (
                      <p className="text-label-lg text-fg">
                        {record.memberName}
                      </p>
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
                        onClick={() =>
                          store.acknowledgeTransport(record.mrn, request.id)
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
                        setEditing({ mrn: record.mrn, id: request.id })
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
                      onClick={() =>
                        store.cancelTransport(
                          record.mrn,
                          request.id,
                          "dialysis",
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
      )}

      {settingUp ? (
        <SetUpRideModal
          records={records}
          onClose={() => setSettingUp(false)}
          onSave={(mrn, details) => {
            store.requestTransport(mrn, details);
            setSettingUp(false);
            /* Straight on to booking it. */
            setEditing({ mrn, appointmentId: details.appointmentId });
          }}
        />
      ) : null}

      {selected ? (
        <ConfirmRideModal
          key={selected.request.id}
          record={selected.record}
          request={selected.request}
          store={store}
          by={me}
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
  records,
  onSave,
  onClose,
}: {
  records: AccessRecord[];
  onSave: (
    mrn: string,
    details: {
      appointmentId: string;
      pickupAddress: string;
      returnTrip: boolean;
      mobility: MobilityLevel;
      memberNote: string;
    },
  ) => void;
  onClose: () => void;
}) {
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  /* Upcoming appointments with no ride yet, per patient. */
  const choices = records
    .map((record) => ({
      record,
      open: upcomingAppointments(record, today).filter(
        (a) => !transportFor(record, a.id),
      ),
    }))
    .filter((c) => c.open.length > 0);
  const [mrn, setMrn] = useState(choices[0]?.record.mrn ?? "");
  const chosen = choices.find((c) => c.record.mrn === mrn);
  const [appointmentId, setAppointmentId] = useState(
    choices[0]?.open[0]?.id ?? "",
  );
  const [pickup, setPickup] = useState("");
  const [returnTrip, setReturnTrip] = useState(true);
  const [mobility, setMobility] = useState<MobilityLevel>("ambulatory");
  const [tried, setTried] = useState(false);
  const pickupError = pickup.trim() ? undefined : "Enter the pickup address.";

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
            disabled={!appointmentId}
            onClick={() => {
              setTried(true);
              if (pickupError || !appointmentId) return;
              onSave(mrn, {
                appointmentId,
                pickupAddress: pickup.trim(),
                returnTrip,
                mobility,
                memberNote: "Arranged by your dialysis center.",
              });
            }}
          >
            Continue
          </Button>
        </>
      }
    >
      {choices.length === 0 ? (
        <p className="text-body-sm text-fg-muted">
          Every upcoming access appointment already has a ride.
        </p>
      ) : (
        <div className="space-y-stack-md">
          <FormField label="Patient" required>
            {(field) => (
              <Select
                {...field}
                value={mrn}
                onChange={(e) => {
                  setMrn(e.target.value);
                  const next = choices.find(
                    (c) => c.record.mrn === e.target.value,
                  );
                  setAppointmentId(next?.open[0]?.id ?? "");
                }}
              >
                {choices.map(({ record }) => (
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
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
              >
                {(chosen?.open ?? []).map((a) => (
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
 *  who book rides, the social worker and the administrator. */
export function ClinicRideRequests() {
  const { user } = useAuth();
  const store = useVascularAccess();
  /* The dialysis center's alone: never on the nephrology office's page. */
  if (
    user?.role !== "clinic" ||
    !userCan(user, "rides.manage") ||
    store.isPending ||
    store.error
  ) {
    return null;
  }
  return (
    <RideRequestsPanel
      records={store.records}
      store={store}
      me={user?.staffRole ? user.name : "Social Worker"}
      canManage
    />
  );
}
