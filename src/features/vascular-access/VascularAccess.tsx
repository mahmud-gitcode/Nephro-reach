"use client";

import { useSafetyNotice } from "@/features/messaging/useSafetyNotice";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  Camera,
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
import { uploadErrorMessage } from "@/lib/api/upload";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { cn } from "@/lib/utils/cn";
import { useNow } from "@/lib/utils/useNow";
import { useMemberName } from "@/features/auth/useMemberName";
import * as messaging from "@/features/messaging/messaging.rules";
import { fileError } from "@/features/personal-log/dialysis/accessPhotos";
import type { AccessTarget } from "./access.repository";
import {
  useAccessActions,
  useAccessProfiles,
  useAccessRecord,
  useMemberTarget,
  type AccessActions,
} from "./useAccess";
import {
  CONCERN_KINDS,
  MOBILITY_LEVELS,
  activeTransport,
  dayKey,
  formatDay,
  formatTime,
  lastMessage,
  nextAppointment,
  concernsNewestFirst,
  openConcerns,
  sortedHistory,
  sortedUpdates,
  transportFor,
  upcomingAppointments,
  type AccessConcern,
  type AccessRecord,
  type ConcernRecipient,
  type MobilityLevel,
} from "./vascularAccess.data";
import {
  AccessConversationView,
  AccessPicture,
  AccessStatusBadge,
  AppointmentRow,
  HistoryTable,
  TransportConfirmationView,
  TransportStatusBadge,
  TransportSteps,
  UpdatesTimeline,
} from "./AccessUi";

/* ==========================================================================
   Vascular Access — the member's tab
   --------------------------------------------------------------------------
   Everything about the access in one place: what it is, the visits ahead,
   reporting a problem with a photo, asking for a ride and seeing it
   confirmed, and one conversation with the access center and the dialysis
   center. The offices work the same record from their own pages.

   On the API (Phase 10): the member may have several access profiles, one
   per access center; with more than one, a selector picks which. Every
   write is the member's own route, and a photo is uploaded first and sent
   by file id (a fresh upload only: attaching a saved access photo waits on
   NEW-5).
   ========================================================================== */

const HREF = "/dashboard/vascular-access";

type Props = {
  record: AccessRecord;
  actions: AccessActions;
  target: AccessTarget | null;
  isEs: boolean;
  today: string;
};

/**
 * A picture chosen from the device for upload: kept as a File (never read
 * into a data: URL); its preview is a blob: URL released when it goes.
 */
function PhotoInput({
  file,
  onChange,
  isEs,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  isEs: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const preview = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  return (
    <div className="space-y-stack-xs">
      {file && preview ? (
        <div className="flex items-center gap-inline-md">
          {/* eslint-disable-next-line @next/next/no-img-element -- a local blob: preview of the file about to be uploaded */}
          <img
            src={preview}
            alt={isEs ? "Foto para enviar" : "Photo to send"}
            className="h-14 w-14 rounded-control object-cover"
          />
          <Button
            size="small"
            variant="neutral"
            appearance="ghost"
            onClick={() => onChange(null)}
          >
            {isEs ? "Quitar foto" : "Remove photo"}
          </Button>
        </div>
      ) : null}
      <label
        className={buttonStyles({
          variant: "neutral",
          appearance: "fill-stroke",
          size: "small",
        })}
      >
        <Camera aria-hidden="true" />
        {isEs ? "Tomar o elegir una foto" : "Take or choose a photo"}
        {/* No `capture`: on a phone the picker then offers both the
            camera and the album. */}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const chosen = event.target.files?.[0];
            event.target.value = "";
            if (!chosen) return;
            const problem = fileError(chosen, isEs);
            setError(problem);
            if (!problem) onChange(chosen);
          }}
        />
      </label>
      {error ? <p className="text-caption text-danger">{error}</p> : null}
    </div>
  );
}

/** Why a write was refused: the upload's own reason, or a plain retry. */
function writeErrorText(error: unknown, isEs: boolean): string {
  const upload = error ? uploadErrorMessage(error) : "";
  if (upload && !isEs) return upload;
  return isEs
    ? "No se pudo guardar. Intenta de nuevo."
    : "That did not save. Try again.";
}

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

/* The access center keeps the overview (`PATCH …/access-profiles/:id` is
   access center only): the member has no route to change it, so the page
   no longer offers an edit the server would refuse. */
function OverviewCard({ record, isEs, today }: Props) {
  const next = nextAppointment(record, today);
  const { overview } = record;

  return (
    <Card as="section" padding="small" className="h-full">
      <SectionTitle title={isEs ? "Resumen del Acceso" : "Access Overview"} />
      <dl>
        <Fact label={isEs ? "Tipo de acceso" : "Access Type"}>
          {overview.type}
        </Fact>
        <Fact label={isEs ? "Ubicación" : "Location"}>{overview.location}</Fact>
        <Fact label={isEs ? "Fecha de creación" : "Created"}>
          {overview.createdOn ? formatDay(overview.createdOn) : "—"}
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
    </Card>
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
/** "Vascular access center and dialysis center". */
function recipientsLabel(sendTo: ConcernRecipient[], isEs: boolean): string {
  const who = sendTo;
  const names = who.map((w) =>
    w === "access"
      ? isEs
        ? "centro de acceso vascular"
        : "vascular access center"
      : isEs
        ? "centro de diálisis"
        : "dialysis center",
  );
  return names.join(isEs ? " y " : " and ");
}

function ConcernCard({ record, actions, target, isEs }: Props) {
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
                    {isEs ? "Enviado a " : "Sent to "}
                    {recipientsLabel(concern.sendTo, isEs)} ·{" "}
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
                      disabled={actions.isSaving}
                      onClick={async () => {
                        setNotice(null);
                        /* Said only once the server took it. */
                        if (await actions.resendConcern(record.id, concern.id))
                          setNotice(
                            isEs
                              ? `Reenviado a: ${recipientsLabel(concern.sendTo, true)}.`
                              : `Sent again to: ${recipientsLabel(concern.sendTo, false)}.`,
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
          actions={actions}
          target={target}
          isEs={isEs}
          editing={open === "new" ? undefined : open}
          onClose={() => setOpen(null)}
          onSent={(edited, sendTo) => {
            setOpen(null);
            const where = recipientsLabel(sendTo, isEs);
            setNotice(
              edited
                ? isEs
                  ? `Cambios enviados a: ${where}.`
                  : `Your changes were sent to: ${where}.`
                : isEs
                  ? `Enviado a: ${where}.`
                  : `Sent to: ${where}.`,
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
                disabled={actions.isSaving}
                onClick={async () => {
                  await actions.deleteConcern(record.id, deleting.id);
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
  actions,
  target,
  isEs,
  editing,
  onClose,
  onSent,
}: {
  record: AccessRecord;
  actions: AccessActions;
  target: AccessTarget | null;
  isEs: boolean;
  /** A report being changed; absent for a new one. */
  editing?: AccessConcern;
  onClose: () => void;
  onSent: (edited: boolean, sendTo: ConcernRecipient[]) => void;
}) {
  const safety = useSafetyNotice(isEs);
  /* A dialysis center to send to only when the record names one: the
     server refuses `dialysis` otherwise (a hint, not a rule). */
  const hasDialysis = !!record.dialysisCenter;
  const [kinds, setKinds] = useState<string[]>(editing?.kinds ?? []);
  const [detail, setDetail] = useState(editing?.detail ?? "");
  /* An edit keeps the photo already sent unless it is removed or a new
     one is chosen. */
  const [keepPhoto, setKeepPhoto] = useState(editing?.hasImage ?? false);
  /* A photo taken or picked from the phone's album right here (client,
     2026-10-12: "under Report a Concern, put Add photo"): uploaded on
     send, then sent by id. */
  const [file, setFile] = useState<File | null>(null);
  const [failed, setFailed] = useState<unknown>(null);
  /* Where it goes, said up front: by default both see it (client,
     2026-10-12). */
  const [sendTo, setSendTo] = useState<ConcernRecipient[]>(
    editing?.sendTo ?? (hasDialysis ? ["access", "dialysis"] : ["access"]),
  );
  const valid =
    kinds.length > 0 && detail.trim().length > 0 && sendTo.length > 0;
  const toggleRecipient = (who: ConcernRecipient) =>
    setSendTo((current) =>
      current.includes(who)
        ? current.filter((entry) => entry !== who)
        : [...current, who],
    );

  const toggle = (id: string) =>
    setKinds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );

  async function send() {
    setFailed(null);
    const draft = { kinds, detail: detail.trim(), sendTo, file };
    const ok = editing
      ? await actions.editConcern(record.id, editing.id, {
          ...draft,
          removePhoto: editing.hasImage && !keepPhoto && !file,
        })
      : await actions.reportConcern(record.id, draft);
    if (ok) onSent(Boolean(editing), sendTo);
    else setFailed(actions.error ?? true);
  }

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
            disabled={!valid || actions.isSaving}
            onClick={() => safety.guard(() => void send())}
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
      {safety.notice}
      <div className="space-y-stack-md">
        {failed ? (
          <Alert tone="danger" onDismiss={() => setFailed(null)}>
            {writeErrorText(failed, isEs)}
          </Alert>
        ) : null}
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
        <p className="text-label-md text-fg-secondary">
          {isEs ? "Enviar a" : "Send to"}
        </p>
        <ChipGroup label={isEs ? "Enviar a" : "Send to"}>
          <Chip
            selected={sendTo.includes("access")}
            onClick={() => toggleRecipient("access")}
          >
            {isEs ? "Centro de acceso vascular" : "Vascular access center"}
          </Chip>
          {hasDialysis ? (
            <Chip
              selected={sendTo.includes("dialysis")}
              onClick={() => toggleRecipient("dialysis")}
            >
              {isEs ? "Centro de diálisis" : "Dialysis center"}
            </Chip>
          ) : null}
        </ChipGroup>
        {sendTo.length === 0 ? (
          <p className="text-caption text-danger">
            {isEs ? "Elija al menos uno." : "Choose at least one."}
          </p>
        ) : null}
        {editing && keepPhoto && !file ? (
          <div className="flex items-center gap-inline-md">
            <AccessPicture
              target={target}
              profileId={record.id}
              kind="concern"
              id={editing.id}
              alt={isEs ? "Foto enviada" : "Photo sent"}
              className="h-14 w-14 rounded-control"
            />
            <Button
              size="small"
              variant="neutral"
              appearance="ghost"
              onClick={() => setKeepPhoto(false)}
            >
              {isEs ? "Quitar foto" : "Remove photo"}
            </Button>
          </div>
        ) : null}
        <PhotoInput file={file} onChange={setFile} isEs={isEs} />
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
  actions,
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
  const [failed, setFailed] = useState(false);
  const coordinator = record.dialysisCenter?.name ?? "";
  const addressError =
    pickupAddress.trim().length < 5
      ? isEs
        ? "Escribe la dirección de recogida"
        : "Enter the pickup address"
      : undefined;

  async function submit() {
    setTried(true);
    if (addressError || !appointmentId) return;
    setFailed(false);
    const ok = await actions.requestTransport(record.id, {
      appointmentId,
      pickupAddress,
      returnTrip: returnTrip === "yes",
      mobility,
      memberNote,
    });
    if (ok) onClose();
    else setFailed(true);
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="big"
      title={isEs ? "Solicitar transporte" : "Request a Ride"}
      description={
        isEs ? `Se envía a: ${coordinator}` : `Goes to: ${coordinator}`
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button onClick={() => void submit()} disabled={actions.isSaving}>
            {isEs ? "Enviar solicitud" : "Submit Request"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {failed ? (
          <Alert tone="danger" onDismiss={() => setFailed(false)}>
            {writeErrorText(null, isEs)}
          </Alert>
        ) : null}
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

function TransportCard(props: Props) {
  const { record, actions, isEs, today } = props;
  const [asking, setAsking] = useState(false);
  const requests = activeTransport(record).sort((a, b) =>
    a.requestedAt.localeCompare(b.requestedAt),
  );
  /* Rides go to the record's dialysis center: none named, none to ask. */
  const canAsk =
    !!record.dialysisCenter &&
    upcomingAppointments(record, today).some(
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
            const appointment = request.appointment;
            return (
              <li
                key={request.id}
                className="space-y-stack-sm rounded-card-nested border border-line p-inset-sm"
              >
                <div className="flex items-start justify-between gap-inline-md">
                  <div className="min-w-0">
                    <p className="text-label-md text-fg">
                      {appointment?.title ?? "—"}
                    </p>
                    {appointment ? (
                      <p className="text-caption text-fg-muted">
                        {formatDay(appointment.date)} ·{" "}
                        {formatTime(appointment.time)} · {appointment.place}
                      </p>
                    ) : null}
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
                  disabled={actions.isSaving}
                  onClick={() =>
                    void actions.cancelTransport(record.id, request.id)
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
        <RideRequestModal {...props} onClose={() => setAsking(false)} />
      ) : null}
    </Card>
  );
}

/* --------------------------------------------------------------- messages */

/* One conversation with both teams (client, 2026-09-30), so the card is a
   preview of it and a way in. */
function MessagesCard(props: Props) {
  const { record, actions, isEs } = props;
  const now = useNow();
  const [open, setOpen] = useState(false);
  const last = lastMessage(record.conversation);
  const unread = record.unread;

  function openConversation() {
    setOpen(true);
    if (unread > 0) void actions.markRead(record.id);
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
              ? `${last.mine ? (isEs ? "Tú" : "You") : (last.authorName ?? "")}: ${last.body || (isEs ? "Foto" : "Photo")}`
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
        <ConversationModal {...props} onClose={() => setOpen(false)} />
      ) : null}
    </Card>
  );
}

function ConversationModal({
  record,
  actions,
  target,
  isEs,
  onClose,
}: Props & { onClose: () => void }) {
  const safety = useSafetyNotice(isEs);
  /* A fresh picture from the device only (NEW-5: a saved access photo
     would need the same user's new upload anyway). */
  const [file, setFile] = useState<File | null>(null);
  const [failed, setFailed] = useState(false);

  return (
    <>
      {safety.notice}
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
        {failed ? (
          <Alert tone="danger" onDismiss={() => setFailed(false)}>
            {writeErrorText(actions.error, isEs)}
          </Alert>
        ) : null}
        <AccessConversationView
          record={record}
          party={record.party}
          target={target}
          myName={record.memberName}
          isEs={isEs}
          sending={actions.isSaving}
          hasAttachment={!!file}
          attach={<PhotoInput file={file} onChange={setFile} isEs={isEs} />}
          confirmSend={safety.guard}
          onSend={async (body, isPrivate) => {
            setFailed(false);
            const ok = await actions.sendMessage(record.id, body, {
              file,
              isPrivate,
            });
            if (ok) setFile(null);
            else setFailed(true);
          }}
          onSetPrivate={(messageId, isPrivate) =>
            void actions.setMessagePrivate(record.id, messageId, isPrivate)
          }
          onSetDialysisCanPost={(allowed) =>
            void actions.setDialysisCanPost(record.id, allowed)
          }
        />
      </Modal>
    </>
  );
}

/* ---------------------------------------------------------------- page */

function PageSkeleton() {
  return (
    <div aria-busy="true" className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
  const target = useMemberTarget();
  const profiles = useAccessProfiles(target);
  const memberName = useMemberName();
  /* Several access centers may each keep a record (one per center): the
     first is shown until another is picked. */
  const [chosen, setChosen] = useState<string | null>(null);
  const profileId =
    profiles.profiles.find((p) => p.id === chosen)?.id ??
    profiles.profiles[0]?.id ??
    null;
  const reads = useAccessRecord(target, profileId, {
    memberName,
    mrn: null,
  });
  const actions = useAccessActions(target);
  const record = reads.record;
  const today = dayKey(now);
  const error = profiles.error ?? reads.error;
  const lang = isEs ? "es" : "en";
  const retry = () => {
    profiles.refetch();
    reads.refetch();
  };

  let body: React.ReactNode;
  if (error) {
    /* A 403 (not shared, a caregiver without the area) never shows
       cached or sample data. */
    body = (
      <ErrorState
        title={errorTitleFor(
          error,
          isEs
            ? "No se pudo cargar tu acceso"
            : "Your access could not be loaded",
          lang,
        )}
        message={errorMessageFor(error, undefined, lang)}
        error={error}
        onRetry={canRetry(error) ? retry : undefined}
      />
    );
  } else if (profiles.isPending || reads.isPending) {
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
    const props: Props = { record, actions, target, isEs, today };
    body = (
      <>
        {profiles.profiles.length > 1 ? (
          <FormField
            label={isEs ? "Centro de acceso" : "Access center"}
            className="max-w-sm"
          >
            {(field) => (
              <Select
                {...field}
                value={record.id}
                onChange={(e) => setChosen(e.target.value)}
              >
                {profiles.profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.accessCenter.name} · {profile.overview.type}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        ) : null}

        {actions.error ? (
          <Alert tone="danger" onDismiss={actions.clearError}>
            {writeErrorText(actions.error, isEs)}
          </Alert>
        ) : null}

        {/* Side by side only on a wide screen: on a tablet in landscape the
            two halves left each appointment's title and place clipped
            (client, 2026-10-09). */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <OverviewCard {...props} />
          <AppointmentsCard {...props} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ConcernCard {...props} />
          <TransportCard {...props} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
