"use client";

import React, { useState } from "react";
import { AlertTriangle, Pencil, Plus } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { PageTitle } from "@/components/layout/PageTitle";
import {
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
  RadioCard,
  RadioGroup,
  SectionTitle,
  SegmentedChoice,
  Select,
  Skeleton,
  Tabs,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useNow } from "@/lib/utils/useNow";
import { DEMO_MEMBER } from "@/features/messaging/messaging.seed";
import * as messaging from "@/features/messaging/messaging.rules";
import AccessPhotosSection from "@/features/personal-log/dialysis/AccessPhotosSection";
import { PhotoPicker } from "@/features/personal-log/dialysis/PhotoPicker";
import { useAccessPhotos } from "@/features/personal-log/dialysis/useAccessPhotos";
import {
  ACCESS_TYPES,
  CONCERN_KINDS,
  TEAM_LABEL,
  dayKey,
  formatDay,
  lastMessage,
  nextAppointment,
  openConcerns,
  recordForMember,
  sortedHistory,
  sortedUpdates,
  upcomingAppointments,
  type AccessRecord,
  type AccessTeam,
} from "./vascularAccess.data";
import {
  AccessStatusBadge,
  AppointmentRow,
  HistoryTable,
  ThreadView,
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
   reporting a problem with a photo, asking for a ride, and talking to the
   vascular team and the dialysis center. The clinic works the same record
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

function ConcernCard({ record, store, isEs }: Props) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const pending = openConcerns(record);

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
            setSent(false);
            setOpen(true);
          }}
        >
          <AlertTriangle aria-hidden="true" />
          {isEs ? "Reportar un problema" : "Report a Concern"}
        </Button>
        {sent ? (
          <Alert tone="success" onDismiss={() => setSent(false)}>
            {isEs
              ? "Enviado a tu equipo de acceso."
              : "Sent to your access team."}
          </Alert>
        ) : null}
      </div>

      {open ? (
        <ConcernModal
          record={record}
          store={store}
          isEs={isEs}
          onClose={() => setOpen(false)}
          onSent={() => {
            setOpen(false);
            setSent(true);
          }}
        />
      ) : null}
    </Card>
  );
}

function ConcernModal({
  record,
  store,
  isEs,
  onClose,
  onSent,
}: {
  record: AccessRecord;
  store: VascularAccessStore;
  isEs: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  const photoLog = useAccessPhotos();
  const [kinds, setKinds] = useState<string[]>([]);
  const [detail, setDetail] = useState("");
  const [photoId, setPhotoId] = useState<string | null>(null);
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
      title={isEs ? "Reportar un problema" : "Report an Access Concern"}
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
              store.reportConcern(record.mrn, {
                kinds,
                detail: detail.trim(),
                ...(photo ? { imageUrl: photo.dataUrl } : {}),
              });
              if (photo) photoLog.markSent(photo.id);
              onSent();
            }}
          >
            {isEs ? "Enviar" : "Send Report"}
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

function TransportCard({ record, store, isEs, today }: Props) {
  const upcoming = upcomingAppointments(record, today);
  const open = upcoming.filter(
    (appointment) =>
      !record.transport.some((entry) => entry.appointmentId === appointment.id),
  );
  const [need, setNeed] = useState("yes");
  const [appointmentId, setAppointmentId] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const chosen = appointmentId || open[0]?.id || "";

  const requests = record.transport
    .map((entry) => ({
      entry,
      appointment: record.appointments.find(
        (a) => a.id === entry.appointmentId,
      ),
    }))
    .filter((row) => row.appointment && !row.appointment.completed);

  return (
    <Card as="section" padding="small" className="h-full">
      <SectionTitle title={isEs ? "Transporte" : "Transportation"} />
      <div className="space-y-stack-md">
        {open.length === 0 ? (
          <p className="text-body-sm text-fg-muted">
            {isEs
              ? "No hay citas que necesiten transporte."
              : "No appointments need a ride."}
          </p>
        ) : (
          <>
            <RadioGroup
              label={
                isEs ? "¿Necesitas transporte?" : "Do you need transportation?"
              }
              value={need}
              onChange={(value) => {
                setNeed(value);
                setDone(null);
              }}
            >
              <RadioCard
                value="yes"
                title={
                  isEs
                    ? "Sí, necesito transporte"
                    : "Yes, I need transportation"
                }
              />
              <RadioCard
                value="no"
                title={
                  isEs ? "No, tengo mi propio transporte" : "No, I have my own"
                }
              />
            </RadioGroup>
            {need === "yes" ? (
              <Select
                selectSize="small"
                aria-label={isEs ? "Cita" : "Appointment"}
                value={chosen}
                onChange={(e) => setAppointmentId(e.target.value)}
              >
                {open.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    {appointment.title} · {formatDay(appointment.date)}
                  </option>
                ))}
              </Select>
            ) : null}
            <Button
              className="w-full"
              onClick={() => {
                if (need === "yes" && chosen) {
                  store.requestTransport(record.mrn, chosen);
                  setAppointmentId("");
                  setDone(isEs ? "Solicitud enviada." : "Request sent.");
                } else {
                  setDone(isEs ? "Anotado." : "Noted.");
                }
              }}
            >
              {isEs ? "Enviar solicitud" : "Submit Request"}
            </Button>
          </>
        )}

        {done ? (
          <Alert tone="success" onDismiss={() => setDone(null)}>
            {done}
          </Alert>
        ) : null}

        {requests.length > 0 ? (
          <ul className="space-y-stack-xs">
            {requests.map(({ entry, appointment }) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-inline-md text-body-sm text-fg"
              >
                <span className="min-w-0 truncate">
                  {appointment!.title} · {formatDay(appointment!.date)}
                </span>
                <Badge
                  tone={entry.status === "Arranged" ? "success" : "warning"}
                >
                  {entry.status === "Arranged"
                    ? isEs
                      ? "Confirmado"
                      : "Arranged"
                    : isEs
                      ? "Solicitado"
                      : "Requested"}
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Card>
  );
}

/* --------------------------------------------------------------- messages */

type MessageFilter = "all" | AccessTeam;

function MessagesCard({ record, store, isEs }: Props) {
  const now = useNow();
  const [filter, setFilter] = useState<MessageFilter>("all");
  const [openTeam, setOpenTeam] = useState<AccessTeam | null>(null);
  const [composing, setComposing] = useState(false);

  const threads = record.threads.filter(
    (thread) => filter === "all" || thread.team === filter,
  );

  const teamLabel = (team: AccessTeam) =>
    team === "vascular"
      ? isEs
        ? "Equipo vascular"
        : "Vascular Team"
      : isEs
        ? "Centro de diálisis"
        : "Dialysis Center";

  function openThread(team: AccessTeam) {
    setOpenTeam(team);
    store.markThreadRead(record.mrn, team, "member");
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
            onClick={() => setComposing(true)}
          >
            <Plus aria-hidden="true" />
            {isEs ? "Nuevo mensaje" : "New Message"}
          </Button>
        }
      />
      <Tabs
        label={isEs ? "Filtrar mensajes" : "Filter messages"}
        value={filter}
        onChange={setFilter}
        className="mb-stack-md"
        items={[
          { id: "all", label: isEs ? "Todos" : "All" },
          { id: "vascular", label: teamLabel("vascular") },
          { id: "dialysis", label: teamLabel("dialysis") },
        ]}
      />
      <ul className="divide-y divide-line-subtle">
        {threads.map((thread) => {
          const last = lastMessage(thread);
          return (
            <li key={thread.team}>
              <button
                type="button"
                onClick={() => openThread(thread.team)}
                className="flex w-full cursor-pointer items-start gap-inline-lg rounded-control px-inset-xs py-inset-xs text-left hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-surface-brand-subtle text-label-md text-brand-600"
                >
                  {messaging.initials(thread.contact)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-inline-sm">
                    <span className="truncate text-label-lg text-fg">
                      {thread.contact}
                    </span>
                    {thread.unreadByMember > 0 ? (
                      <Badge tone="danger" variant="solid">
                        {thread.unreadByMember}
                      </Badge>
                    ) : null}
                  </span>
                  <span className="block text-caption text-fg-muted">
                    {teamLabel(thread.team)}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block truncate text-body-sm",
                      thread.unreadByMember > 0
                        ? "text-fg"
                        : "text-fg-secondary",
                    )}
                  >
                    {last
                      ? last.body || (isEs ? "Foto" : "Photo")
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
            </li>
          );
        })}
      </ul>

      {openTeam || composing ? (
        <ThreadModal
          record={record}
          store={store}
          isEs={isEs}
          initialTeam={openTeam ?? "vascular"}
          choosable={composing}
          onClose={() => {
            setOpenTeam(null);
            setComposing(false);
          }}
        />
      ) : null}
    </Card>
  );
}

function ThreadModal({
  record,
  store,
  isEs,
  initialTeam,
  choosable,
  onClose,
}: {
  record: AccessRecord;
  store: VascularAccessStore;
  isEs: boolean;
  initialTeam: AccessTeam;
  choosable: boolean;
  onClose: () => void;
}) {
  const photoLog = useAccessPhotos();
  const [team, setTeam] = useState<AccessTeam>(initialTeam);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const photo = photoLog.photos.find((entry) => entry.id === photoId) ?? null;
  const thread = record.threads.find((entry) => entry.team === team);

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={thread?.contact ?? TEAM_LABEL[team]}
      description={TEAM_LABEL[team]}
    >
      <div className="space-y-stack-md">
        {choosable ? (
          <SegmentedChoice
            label={isEs ? "Para" : "To"}
            value={team}
            onChange={(next: AccessTeam) => setTeam(next)}
            options={[
              { value: "vascular", label: TEAM_LABEL.vascular },
              { value: "dialysis", label: TEAM_LABEL.dialysis },
            ]}
          />
        ) : null}
        {thread ? (
          <ThreadView
            key={team}
            thread={thread}
            me="member"
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
            onSend={(body) => {
              store.sendMessage(
                record.mrn,
                team,
                "member",
                body,
                photo?.dataUrl,
              );
              if (photo) photoLog.markSent(photo.id);
              setPhotoId(null);
            }}
          />
        ) : null}
      </div>
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
  const record = recordForMember(store.state, DEMO_MEMBER);
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
      <PageTitle href={HREF} />
      {body}
    </div>
  );
}
