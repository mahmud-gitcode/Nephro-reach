"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  Car,
  MessagesSquare,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  buttonStyles,
  Alert,
  Badge,
  Button,
  Card,
  Chip,
  ChipGroup,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  Modal,
  SectionTitle,
  SegmentedChoice,
  Select,
  Skeleton,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useNow } from "@/lib/utils/useNow";
import { useMemberName } from "@/features/auth/useMemberName";
import * as messaging from "@/features/messaging/messaging.rules";
import AccessPhotosSection from "@/features/personal-log/dialysis/AccessPhotosSection";
import { PhotoPicker } from "@/features/personal-log/dialysis/PhotoPicker";
import { useAccessPhotos } from "@/features/personal-log/dialysis/useAccessPhotos";
import {
  ACCESS_TYPES,
  CONCERN_KINDS,
  MOBILITY_LEVELS,
  TRANSPORT_COORDINATOR,
  activeTransport,
  dayKey,
  formatDay,
  formatTime,
  lastMessage,
  nextAppointment,
  concernsNewestFirst,
  openConcerns,
  recordForMember,
  sortedHistory,
  sortedUpdates,
  transportFor,
  unreadFor,
  upcomingAppointments,
  type AccessConcern,
  type AccessRecord,
  type MobilityLevel,
} from "./vascularAccess.data";
import {
  AccessConversationView,
  AccessStatusBadge,
  AppointmentRow,
  HistoryTable,
  TransportConfirmationView,
  TransportStatusBadge,
  TransportSteps,
  UpdatesTimeline,
} from "./AccessUi";
import {
  useVascularAccess,
  type VascularAccessStore,
} from "./useVascularAccess";

/* ==========================================================================
   Vascular Access — the member's tab
   --------------------------------------------------------------------------
   Everything about the access in one place: what it is, the visits ahead,
   reporting a problem with a photo, asking for a ride and seeing it
   confirmed, and one conversation with the access center and the dialysis
   center. The clinic works the same record
   from its own Vascular Access tab.
   ========================================================================== */

const HREF = "/dashboard/vascular-access";

type Props = {
  record: AccessRecord;
  store: VascularAccessStore;
  isEs: boolean;
  today: string;
};

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-inline-lg border-b border-line-subtle py-2 last:border-b-0">
      <dt className="text-body-sm text-fg-secondary">{label}</dt>
      <dd className="text-right text-label-lg text-fg">{children}</dd>
    </div>
  );
}

/* --------------------------------------------------------------- overview */

function OverviewCard({ record, store, isEs, today }: Props) {
  const [editing, setEditing] = useState(false);
  const next = nextAppointment(record, today);
  const { overview } = record;

  return (
    <Card as="section" padding="small" className="h-full">
      <SectionTitle
        title={isEs ? "Resumen del Acceso" : "Access Overview"}
        action={
          <Button
            variant="neutral"
            appearance="fill-stroke"
            size="small"
            onClick={() => setEditing(true)}
          >
            <Pencil aria-hidden="true" />
            {isEs ? "Editar" : "Edit"}
          </Button>
        }
      />
      <dl>
        <Fact label={isEs ? "Tipo de acceso" : "Access Type"}>
          {overview.type}
        </Fact>
        <Fact label={isEs ? "Ubicación" : "Location"}>{overview.location}</Fact>
        <Fact label={isEs ? "Fecha de creación" : "Created"}>
          {formatDay(overview.createdOn)}
        </Fact>
        <Fact label={isEs ? "Estado actual" : "Current Status"}>
          <AccessStatusBadge status={overview.status} isEs={isEs} />
        </Fact>
        <Fact label={isEs ? "Última evaluación" : "Last Assessment"}>
          {overview.lastAssessment ? formatDay(overview.lastAssessment) : "—"}
        </Fact>
        <Fact label={isEs ? "Próximo control" : "Next Follow-Up"}>
          {next ? formatDay(next.date) : "—"}
        </Fact>
      </dl>

      {editing ? (
        <EditOverviewModal
          record={record}
          store={store}
          isEs={isEs}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </Card>
  );
}

function EditOverviewModal({
  record,
  store,
  isEs,
  onClose,
}: {
  record: AccessRecord;
  store: VascularAccessStore;
  isEs: boolean;
  onClose: () => void;
}) {
  const now = useNow();
  const [type, setType] = useState(record.overview.type);
  const [location, setLocation] = useState(record.overview.location);
  const [createdOn, setCreatedOn] = useState(record.overview.createdOn);
  const valid = location.trim().length > 0 && createdOn !== "";

  return (
    <Modal
      open
      onClose={onClose}
      size="small"
      title={isEs ? "Editar acceso" : "Edit Access"}
      footer={
        <>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            size="small"
            onClick={onClose}
          >
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            size="small"
            disabled={!valid}
            onClick={() => {
              store.editOverview(record.mrn, {
                type,
                location: location.trim(),
                createdOn,
              });
              onClose();
            }}
          >
            {isEs ? "Guardar" : "Save"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        <FormField label={isEs ? "Tipo de acceso" : "Access Type"} required>
          {(field) => (
            <Select
              {...field}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {ACCESS_TYPES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField label={isEs ? "Ubicación" : "Location"} required>
          {(field) => (
            <Input
              {...field}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Left Forearm"
            />
          )}
        </FormField>
        <FormField label={isEs ? "Fecha de creación" : "Created"} required>
          {(field) => (
            <Input
              {...field}
              type="date"
              value={createdOn}
              max={dayKey(now)}
              onChange={(e) => setCreatedOn(e.target.value)}
            />
          )}
        </FormField>
      </div>
    </Modal>
  );
}

/* ----------------------------------------------------------- appointments */

function AppointmentsCard({ record, isEs, today }: Props) {
  const [showAll, setShowAll] = useState(false);
  const upcoming = upcomingAppointments(record, today);
  const shown = showAll ? upcoming : upcoming.slice(0, 3);

  return (
    <Card as="section" padding="small" className="h-full">
      <SectionTitle
        title={isEs ? "Próximas Citas" : "Upcoming Appointments"}
        action={
          upcoming.length > 3 ? (
            <Button
              variant="neutral"
              appearance="fill-stroke"
              size="small"
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll
                ? isEs
                  ? "Ver menos"
                  : "Show less"
                : isEs
                  ? "Ver todas"
                  : "View all"}
            </Button>
          ) : null
        }
      />
      {shown.length === 0 ? (
        <EmptyState
          variant="bare"
          title={isEs ? "Sin citas próximas" : "No upcoming appointments"}
        />
      ) : (
        <ul className="divide-y divide-line-subtle">
          {shown.map((appointment) => (
            <li
              key={appointment.id}
              className="py-inset-xs first:pt-0 last:pb-0"
            >
              <AppointmentRow appointment={appointment} isEs={isEs} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ---------------------------------------------------------------- concern */

function concernDate(iso: string, isEs: boolean) {
  return new Date(iso).toLocaleDateString(isEs ? "es-US" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* The member's reports under the button (client, 2026-10-06): they can see
   what they sent, and edit, delete or resend it. */
function ConcernCard({ record, store, isEs }: Props) {
  const [open, setOpen] = useState<AccessConcern | "new" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AccessConcern | null>(null);
  const pending = openConcerns(record);
  const reports = concernsNewestFirst(record);

  return (
    <Card as="section" padding="small" className="h-full">
      <SectionTitle
        title={isEs ? "Reportar un Problema" : "Report an Access Concern"}
      />
      <div className="space-y-stack-md">
        {pending.length > 0 ? (
          <p className="flex items-center gap-inline-sm text-body-sm text-fg-secondary">
            <Badge tone="danger">{pending.length}</Badge>
            {isEs ? "abierto(s), en revisión" : "open, under review"}
          </p>
        ) : null}
        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            setNotice(null);
            setOpen("new");
          }}
        >
          <AlertTriangle aria-hidden="true" />
          {isEs ? "Reportar un problema" : "Report a Concern"}
        </Button>
        {notice ? (
          <Alert tone="success" onDismiss={() => setNotice(null)}>
            {notice}
          </Alert>
        ) : null}

        {reports.length > 0 ? (
          <section aria-label={isEs ? "Mis reportes" : "My reports"}>
            <h3 className="mb-stack-sm text-label-lg text-fg">
              {isEs ? "Mis Reportes" : "My Reports"}
            </h3>
            <ul className="space-y-stack-sm">
              {reports.map((concern) => (
                <li
                  key={concern.id}
                  className="space-y-stack-xs rounded-card-nested border border-line p-inset-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-inline-sm">
                    <span className="text-label-md text-fg">
                      {concern.kinds
                        .map((id) => {
                          const kind = CONCERN_KINDS.find((k) => k.id === id);
                          return kind ? (isEs ? kind.es : kind.en) : id;
                        })
                        .join(", ")}
                    </span>
                    <Badge
                      tone={concern.status === "Open" ? "warning" : "success"}
                    >
                      {concern.status === "Open"
                        ? isEs
                          ? "En revisión"
                          : "Under review"
                        : isEs
                          ? "Revisado"
                          : "Reviewed"}
                    </Badge>
                  </div>
                  <p className="text-body-sm text-fg-secondary">
                    {concern.detail}
                  </p>
                  <p className="text-caption text-fg-muted">
                    {isEs ? "Enviado " : "Sent "}
                    {concernDate(concern.reportedAt, isEs)}
                    {concern.editedAt
                      ? ` · ${isEs ? "editado" : "edited"} ${concernDate(concern.editedAt, isEs)}`
                      : ""}
                    {concern.resentAt
                      ? ` · ${isEs ? "reenviado" : "resent"} ${concernDate(concern.resentAt, isEs)}`
                      : ""}
                  </p>
                  <div className="flex flex-wrap gap-inline-xs">
                    <Button
                      size="small"
                      variant="neutral"
                      appearance="ghost"
                      leadingIcon={<Pencil aria-hidden="true" />}
                      onClick={() => {
                        setNotice(null);
                        setOpen(concern);
                      }}
                    >
                      {isEs ? "Editar" : "Edit"}
                    </Button>
                    <Button
                      size="small"
                      variant="neutral"
                      appearance="ghost"
                      leadingIcon={<Send aria-hidden="true" />}
                      onClick={() => {
                        store.resendConcern(record.mrn, concern.id);
                        setNotice(
                          isEs
                            ? "Reenviado a tu equipo de acceso."
                            : "Sent to your access team again.",
                        );
                      }}
                    >
                      {isEs ? "Reenviar" : "Resend"}
                    </Button>
                    <Button
                      size="small"
                      variant="danger"
                      appearance="ghost"
                      leadingIcon={<Trash2 aria-hidden="true" />}
                      onClick={() => setDeleting(concern)}
                    >
                      {isEs ? "Eliminar" : "Delete"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {open ? (
        <ConcernModal
          key={open === "new" ? "new" : open.id}
          record={record}
          store={store}
          isEs={isEs}
          editing={open === "new" ? undefined : open}
          onClose={() => setOpen(null)}
          onSent={(edited) => {
            setOpen(null);
            setNotice(
              edited
                ? isEs
                  ? "Cambios enviados a tu equipo de acceso."
                  : "Your changes were sent to your access team."
                : isEs
                  ? "Enviado a tu equipo de acceso."
                  : "Sent to your access team.",
            );
          }}
        />
      ) : null}

      {deleting ? (
        <Modal
          open
          size="small"
          onClose={() => setDeleting(null)}
          title={isEs ? "¿Eliminar este reporte?" : "Delete this report?"}
          description={
            isEs
              ? "Tu equipo de acceso ya no lo verá."
              : "Your access team will no longer see it."
          }
          footer={
            <>
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setDeleting(null)}
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  store.deleteConcern(record.mrn, deleting.id);
                  setDeleting(null);
                }}
              >
                {isEs ? "Sí, eliminar" : "Yes, delete"}
              </Button>
            </>
          }
        />
      ) : null}
    </Card>
  );
}

function ConcernModal({
  record,
  store,
  isEs,
  editing,
  onClose,
  onSent,
}: {
  record: AccessRecord;
  store: VascularAccessStore;
  isEs: boolean;
  /** A report being changed; absent for a new one. */
  editing?: AccessConcern;
  onClose: () => void;
  onSent: (edited: boolean) => void;
}) {
  const photoLog = useAccessPhotos();
  const [kinds, setKinds] = useState<string[]>(editing?.kinds ?? []);
  const [detail, setDetail] = useState(editing?.detail ?? "");
  const [photoId, setPhotoId] = useState<string | null>(null);
  /* An edit keeps the photo already sent unless a new one is picked. */
  const [keptImage, setKeptImage] = useState(editing?.imageUrl);
  const photo = photoLog.photos.find((entry) => entry.id === photoId) ?? null;
  const valid = kinds.length > 0 && detail.trim().length > 0;

  const toggle = (id: string) =>
    setKinds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );

  return (
    <Modal
      open
      onClose={onClose}
      title={
        editing
          ? isEs
            ? "Editar reporte"
            : "Edit Report"
          : isEs
            ? "Reportar un problema"
            : "Report an Access Concern"
      }
      footer={
        <>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            size="small"
            onClick={onClose}
          >
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            size="small"
            variant="danger"
            disabled={!valid}
            onClick={() => {
              const imageUrl = photo ? photo.dataUrl : keptImage;
              const change = {
                kinds,
                detail: detail.trim(),
                ...(imageUrl ? { imageUrl } : {}),
              };
              if (editing) {
                store.editConcern(record.mrn, editing.id, change);
              } else {
                store.reportConcern(record.mrn, change);
              }
              if (photo) photoLog.markSent(photo.id);
              onSent(Boolean(editing));
            }}
          >
            {editing
              ? isEs
                ? "Guardar y enviar"
                : "Save & Send"
              : isEs
                ? "Enviar"
                : "Send Report"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        <ChipGroup label={isEs ? "¿Qué notas?" : "What are you noticing?"}>
          {CONCERN_KINDS.map((kind) => (
            <Chip
              key={kind.id}
              selected={kinds.includes(kind.id)}
              onClick={() => toggle(kind.id)}
            >
              {isEs ? kind.es : kind.en}
            </Chip>
          ))}
        </ChipGroup>
        <FormField label={isEs ? "Detalles" : "Details"} required>
          {(field) => (
            <Textarea
              {...field}
              rows={3}
              maxLength={500}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={
                isEs
                  ? "Desde cuándo, qué cambió..."
                  : "When it started, what changed..."
              }
            />
          )}
        </FormField>
        {keptImage && !photo ? (
          <div className="flex items-center gap-inline-md">
            {/* eslint-disable-next-line @next/next/no-img-element -- a data URL, nothing to optimise */}
            <img
              src={keptImage}
              alt={isEs ? "Foto enviada" : "Photo sent"}
              className="h-14 w-14 rounded-control object-cover"
            />
            <Button
              size="small"
              variant="neutral"
              appearance="ghost"
              onClick={() => setKeptImage(undefined)}
            >
              {isEs ? "Quitar foto" : "Remove photo"}
            </Button>
          </div>
        ) : null}
        <PhotoPicker
          photos={photoLog.photos}
          value={photoId}
          onChange={setPhotoId}
          isEs={isEs}
        />
        <Alert tone="warning">
          {isEs
            ? "Sangrado que no para, o sin frémito: llama al 911 o a tu centro ahora."
            : "Bleeding that will not stop, or no thrill: call 911 or your center now."}
        </Alert>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------- transport */

function RideRequestModal({
  record,
  store,
  isEs,
  today,
  onClose,
}: Props & { onClose: () => void }) {
  const open = upcomingAppointments(record, today).filter(
    (appointment) => !transportFor(record, appointment.id),
  );
  const [appointmentId, setAppointmentId] = useState(open[0]?.id ?? "");
  const [pickupAddress, setPickupAddress] = useState("");
  const [returnTrip, setReturnTrip] = useState<"yes" | "no">("yes");
  const [mobility, setMobility] = useState<MobilityLevel>("ambulatory");
  const [memberNote, setMemberNote] = useState("");
  const [tried, setTried] = useState(false);
  const addressError =
    pickupAddress.trim().length < 5
      ? isEs
        ? "Escribe la dirección de recogida"
        : "Enter the pickup address"
      : undefined;

  function submit() {
    setTried(true);
    if (addressError || !appointmentId) return;
    store.requestTransport(record.mrn, {
      appointmentId,
      pickupAddress,
      returnTrip: returnTrip === "yes",
      mobility,
      memberNote,
    });
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="big"
      title={isEs ? "Solicitar transporte" : "Request a Ride"}
      description={
        isEs
          ? `Se envía a: ${TRANSPORT_COORDINATOR}`
          : `Goes to: ${TRANSPORT_COORDINATOR}`
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button onClick={submit} disabled={store.isSaving}>
            {isEs ? "Enviar solicitud" : "Submit Request"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        <FormField label={isEs ? "Cita" : "Appointment"} required>
          {(field) => (
            <Select
              {...field}
              value={appointmentId}
              onChange={(e) => setAppointmentId(e.target.value)}
            >
              {open.map((appointment) => (
                <option key={appointment.id} value={appointment.id}>
                  {appointment.title} · {formatDay(appointment.date)},{" "}
                  {formatTime(appointment.time)}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField
          label={isEs ? "Dirección de recogida" : "Pickup address"}
          required
          error={tried ? addressError : undefined}
        >
          {(field) => (
            <Input
              {...field}
              autoComplete="street-address"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder={isEs ? "Calle, ciudad" : "Street, city"}
            />
          )}
        </FormField>
        <SegmentedChoice
          label={
            isEs ? "¿Necesitas regreso a casa?" : "Do you need a ride home?"
          }
          value={returnTrip}
          onChange={(next: "yes" | "no") => setReturnTrip(next)}
          options={[
            {
              value: "yes",
              label: isEs ? "Sí, ida y vuelta" : "Yes, round trip",
            },
            { value: "no", label: isEs ? "No, solo ida" : "No, one way" },
          ]}
        />
        <SegmentedChoice
          label={isEs ? "¿Cómo te movilizas?" : "How do you get around?"}
          value={mobility}
          onChange={(next: MobilityLevel) => setMobility(next)}
          options={MOBILITY_LEVELS.map((level) => ({
            value: level.id,
            label: isEs ? level.es : level.en,
          }))}
        />
        <FormField
          label={
            isEs
              ? "Algo más para el conductor"
              : "Anything the driver should know"
          }
        >
          {(field) => (
            <Textarea
              {...field}
              rows={2}
              maxLength={200}
              value={memberNote}
              onChange={(e) => setMemberNote(e.target.value)}
              placeholder={
                isEs
                  ? "Ej.: sedación, no puedo manejar de regreso"
                  : "E.g. sedation, I cannot drive home"
              }
            />
          )}
        </FormField>
      </div>
    </Modal>
  );
}

function TransportCard({ record, store, isEs, today }: Props) {
  const [asking, setAsking] = useState(false);
  const requests = activeTransport(record).sort((a, b) =>
    a.requestedAt.localeCompare(b.requestedAt),
  );
  const canAsk = upcomingAppointments(record, today).some(
    (appointment) => !transportFor(record, appointment.id),
  );

  return (
    <Card as="section" padding="small" className="h-full">
      <SectionTitle
        title={isEs ? "Transporte" : "Transportation"}
        action={
          canAsk ? (
            <Button
              size="small"
              onClick={() => setAsking(true)}
              leadingIcon={<Car aria-hidden="true" />}
            >
              {isEs ? "Solicitar" : "Request a Ride"}
            </Button>
          ) : null
        }
      />
      {requests.length === 0 ? (
        <p className="text-body-sm text-fg-muted">
          {canAsk
            ? isEs
              ? "¿Necesitas que te lleven a una cita? Solicítalo aquí."
              : "Need a ride to an appointment? Request it here."
            : isEs
              ? "No hay citas que necesiten transporte."
              : "No appointments need a ride."}
        </p>
      ) : (
        <ul className="space-y-stack-md">
          {requests.map((request) => {
            const appointment = record.appointments.find(
              (a) => a.id === request.appointmentId,
            )!;
            return (
              <li
                key={request.id}
                className="space-y-stack-sm rounded-card-nested border border-line p-inset-sm"
              >
                <div className="flex items-start justify-between gap-inline-md">
                  <div className="min-w-0">
                    <p className="text-label-md text-fg">{appointment.title}</p>
                    <p className="text-caption text-fg-muted">
                      {formatDay(appointment.date)} ·{" "}
                      {formatTime(appointment.time)} · {appointment.place}
                    </p>
                  </div>
                  <TransportStatusBadge status={request.status} isEs={isEs} />
                </div>
                <TransportSteps request={request} isEs={isEs} />
                {request.confirmation ? (
                  <TransportConfirmationView
                    confirmation={request.confirmation}
                    confirmedBy={request.confirmedBy}
                    isEs={isEs}
                  />
                ) : (
                  <p className="text-caption text-fg-muted">
                    {request.status === "Acknowledged"
                      ? isEs
                        ? "Recibido. Te enviaremos los detalles al confirmar."
                        : "Received. You will get the details here once it is booked."
                      : isEs
                        ? `Enviado a ${request.handledBy}.`
                        : `Sent to ${request.handledBy}.`}
                  </p>
                )}
                <Button
                  size="small"
                  variant="neutral"
                  appearance="ghost"
                  onClick={() =>
                    store.cancelTransport(record.mrn, request.id, "member")
                  }
                >
                  {isEs ? "Cancelar transporte" : "Cancel ride"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {asking ? (
        <RideRequestModal
          record={record}
          store={store}
          isEs={isEs}
          today={today}
          onClose={() => setAsking(false)}
        />
      ) : null}
    </Card>
  );
}

/* --------------------------------------------------------------- messages */

/* One conversation with both teams (client, 2026-09-30), so the card is a
   preview of it and a way in. */
function MessagesCard({ record, store, isEs }: Props) {
  const now = useNow();
  const [open, setOpen] = useState(false);
  const last = lastMessage(record.conversation, "member");
  const unread = unreadFor(record, "member");

  function openConversation() {
    setOpen(true);
    store.markConversationRead(record.mrn, "member");
  }

  return (
    <Card as="section" padding="small" className="h-full">
      <SectionTitle
        title={isEs ? "Mensajes" : "Messages"}
        action={
          <Button
            variant="neutral"
            appearance="fill-stroke"
            size="small"
            onClick={openConversation}
            leadingIcon={<Plus aria-hidden="true" />}
          >
            {isEs ? "Nuevo mensaje" : "New Message"}
          </Button>
        }
      />
      <p className="mb-stack-md text-body-sm text-fg-secondary">
        {isEs
          ? "Una conversación con tu centro de acceso y tu centro de diálisis."
          : "One conversation with your access center and your dialysis center."}
      </p>
      <button
        type="button"
        onClick={openConversation}
        className="flex w-full cursor-pointer items-start gap-inline-lg rounded-card-nested border border-line p-inset-sm text-left transition-colors duration-150 ease-standard hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-surface-brand-subtle text-fg-brand"
        >
          <MessagesSquare className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-inline-sm">
            <span className="truncate text-label-lg text-fg">
              {isEs ? "Equipo de acceso" : "Access care team"}
            </span>
            {unread > 0 ? (
              <Badge tone="danger" variant="solid">
                {unread}
              </Badge>
            ) : null}
          </span>
          <span
            className={cn(
              "mt-0.5 block truncate text-body-sm",
              unread > 0 ? "text-fg" : "text-fg-secondary",
            )}
          >
            {last
              ? `${last.author === "member" ? (isEs ? "Tú" : "You") : last.authorName}: ${last.body || (isEs ? "Foto" : "Photo")}`
              : isEs
                ? "Sin mensajes"
                : "No messages yet"}
          </span>
        </span>
        {last ? (
          <span className="shrink-0 text-caption text-fg-muted">
            {messaging.inboxTimeLabel(last.sentAt, now)}
          </span>
        ) : null}
      </button>

      {open ? (
        <ConversationModal
          record={record}
          store={store}
          isEs={isEs}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </Card>
  );
}

function ConversationModal({
  record,
  store,
  isEs,
  onClose,
}: {
  record: AccessRecord;
  store: VascularAccessStore;
  isEs: boolean;
  onClose: () => void;
}) {
  const photoLog = useAccessPhotos();
  const [photoId, setPhotoId] = useState<string | null>(null);
  const photo = photoLog.photos.find((entry) => entry.id === photoId) ?? null;

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={isEs ? "Equipo de acceso" : "Access care team"}
      description={
        isEs
          ? "Tu centro de acceso vascular y tu centro de diálisis ven esta conversación, salvo lo que marques como privado."
          : "Your vascular access center and your dialysis center see this conversation, except what you mark private."
      }
    >
      <AccessConversationView
        record={record}
        party="member"
        myName={record.memberName}
        isEs={isEs}
        sending={store.isSaving}
        attachedUrl={photo?.dataUrl}
        attach={
          <PhotoPicker
            photos={photoLog.photos}
            value={photoId}
            onChange={setPhotoId}
            isEs={isEs}
          />
        }
        onSend={(body, isPrivate) => {
          store.sendMessage(record.mrn, "member", record.memberName, body, {
            imageUrl: photo?.dataUrl,
            private: isPrivate,
          });
          if (photo) photoLog.markSent(photo.id);
          setPhotoId(null);
        }}
        onSetPrivate={(messageId, isPrivate) =>
          store.setMessagePrivate(record.mrn, messageId, isPrivate, "member")
        }
        onSetDialysisCanPost={(allowed) =>
          store.setDialysisCanPost(record.mrn, allowed, "member")
        }
      />
    </Modal>
  );
}

/* ---------------------------------------------------------------- page */

function PageSkeleton() {
  return (
    <div aria-busy="true" className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton height={320} className="rounded-card" />
        <Skeleton height={320} className="rounded-card" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton height={240} className="rounded-card" />
        <Skeleton height={240} className="rounded-card" />
        <Skeleton height={240} className="rounded-card" />
      </div>
    </div>
  );
}

export default function VascularAccess() {
  const now = useNow();
  const { language } = useLanguage();
  const isEs = language === "ES";
  const store = useVascularAccess();
  const memberName = useMemberName();
  const record = recordForMember(store.state, memberName);
  const today = dayKey(now);

  let body: React.ReactNode;
  if (store.error) {
    body = (
      <ErrorState
        title={
          isEs
            ? "No se pudo cargar tu acceso"
            : "Your access could not be loaded"
        }
        error={store.error}
        onRetry={store.refetch}
      />
    );
  } else if (store.isPending) {
    body = <PageSkeleton />;
  } else if (!record) {
    body = (
      <EmptyState
        title={isEs ? "Sin información de acceso" : "No access on file"}
        description={
          isEs
            ? "Tu equipo de acceso la agregará después de tu evaluación."
            : "Your access team adds it after your evaluation."
        }
      />
    );
  } else {
    const props: Props = { record, store, isEs, today };
    body = (
      <>
        {store.writeError ? (
          <Alert tone="danger" onDismiss={store.clearWriteError}>
            {isEs
              ? "No se pudo guardar. Intenta de nuevo."
              : "That did not save. Try again."}
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <OverviewCard {...props} />
          <AppointmentsCard {...props} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <ConcernCard {...props} />
          <TransportCard {...props} />
          <div className="lg:col-span-2 xl:col-span-1">
            <AccessPhotosSection />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MessagesCard {...props} />
          <Card as="section" padding="small" className="h-full">
            <SectionTitle
              title={
                isEs
                  ? "Citas y Procedimientos"
                  : "Appointment & Procedure Updates"
              }
            />
            <UpdatesTimeline
              updates={sortedUpdates(record).slice(0, 5)}
              emptyLabel={isEs ? "Sin novedades." : "No updates yet."}
            />
          </Card>
        </div>

        <Card as="section" padding="small">
          <SectionTitle
            title={isEs ? "Historial del Acceso" : "Access History"}
          />
          <HistoryTable history={sortedHistory(record)} isEs={isEs} />
        </Card>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        href={HREF}
        action={
          /* The Library's access-care shelf (client, 2026-10-05). */
          <Link
            href="/dashboard/my-library?category=access-care"
            className={buttonStyles({
              variant: "neutral",
              appearance: "fill-stroke",
              size: "small",
            })}
          >
            <BookOpen aria-hidden="true" />
            {isEs ? "Qué Hacer y Qué No Hacer" : "Do's and Don'ts"}
          </Link>
        }
      />
      {body}
    </div>
  );
}
