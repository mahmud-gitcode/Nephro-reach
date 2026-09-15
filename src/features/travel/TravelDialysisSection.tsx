"use client";

import React, { useState } from "react";
import {
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  MapPin,
  Pencil,
  Phone,
  Plane,
  Plus,
  Trash2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  TIME_PREFERENCES,
  TRAVEL_DOCUMENTS,
  TRIP_STATUSES,
  WEEKDAYS,
  canSubmit,
  daysUntilDeparture,
  documentsProgress,
  emptyTrip,
  formatDateLabel,
  formatDays,
  formatTripDates,
  pastTrips,
  isEditable,
  needsChasing,
  statusDetail,
  statusIndex,
  statusLabel,
  timePreferenceLabel,
  toggleDay,
  toggleDocument,
  tripPhase,
  tripError,
  tripLengthDays,
  upcomingTrips,
} from "./trip.rules";
import { useTrips } from "./useTrips";
import type {
  TimePreference,
  TravelDocumentKey,
  TripRequest,
  Weekday,
} from "./trip.types";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  Card,
  Chip,
  ChipGroup,
  EmptyState,
  FormField,
  Input,
  Modal,
  Select,
  Skeleton,
  Textarea,
} from "@/components/ui";

/* ==========================================================================
   Travel dialysis
   --------------------------------------------------------------------------
   The member asks; the facility books. That split is the whole design, and it
   is why nothing on this screen confirms a placement — only the request, the
   paperwork the member gets ready, and whatever the facility has since said.
   ========================================================================== */

/** Six steps as one strip, with only the current one spelled out. */
function ProgressStrip({ trip }: { trip: TripRequest }) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const reached = statusIndex(trip.status);

  return (
    <div>
      <div
        className="flex items-center gap-1"
        role="img"
        aria-label={`${statusLabel(trip.status, isEs)} — ${reached + 1} / ${TRIP_STATUSES.length}`}
      >
        {TRIP_STATUSES.map((step, index) => (
          <span
            key={step.value}
            className={`h-1.5 flex-1 rounded-pill ${
              index < reached
                ? "bg-success"
                : index === reached
                  ? "bg-primary-solid"
                  : "bg-line"
            }`}
          />
        ))}
      </div>
      <p className="mt-stack-xs text-body-sm text-fg-muted">
        {statusDetail(trip.status, isEs)}
      </p>
    </div>
  );
}

/** What the receiving unit has actually booked. Absent until they say so. */
function PlacementCard({ trip }: { trip: TripRequest }) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const placement = trip.placement;

  if (!placement?.facilityName.trim()) return null;

  return (
    <div className="rounded-card border border-success-line bg-success-surface p-inset-sm">
      <p className="flex items-center gap-inline-sm text-label-md text-success">
        <Building2 aria-hidden="true" className="h-4 w-4 shrink-0" />
        {isEs ? "Tu centro durante el viaje" : "Your centre while away"}
      </p>

      <p className="mt-stack-xs text-body-md text-fg">
        {placement.facilityName}
      </p>

      {placement.address ? (
        <p className="mt-stack-xs flex items-start gap-inline-sm text-body-sm text-fg-secondary">
          <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {placement.address}
        </p>
      ) : null}

      {placement.phone ? (
        <a
          href={`tel:${placement.phone.replace(/\s/g, "")}`}
          className="mt-stack-xs inline-flex items-center gap-inline-sm rounded-control-small text-body-sm text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Phone aria-hidden="true" className="h-4 w-4 shrink-0" />
          {placement.phone}
        </a>
      ) : null}

      {placement.treatments.length > 0 ? (
        <ul className="mt-stack-md space-y-stack-xs">
          {placement.treatments.map((treatment) => (
            <li
              key={treatment.id}
              className="flex items-center justify-between gap-inline-md rounded-control bg-surface px-inset-sm py-inset-xs text-body-sm"
            >
              <span className="text-fg">
                {formatDateLabel(treatment.date, isEs)}
              </span>
              <span className="text-fg-secondary tabular-nums">
                {treatment.time}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** The paperwork, ticked rather than uploaded. */
function DocumentChecklist({
  trip,
  onToggle,
  readOnly,
}: {
  trip: TripRequest;
  onToggle: (key: TravelDocumentKey) => void;
  readOnly?: boolean;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const progress = documentsProgress(trip);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-inline-md">
        <p className="flex items-center gap-inline-sm text-label-md text-fg">
          <ClipboardList aria-hidden="true" className="h-4 w-4 shrink-0" />
          {isEs ? "Qué llevar" : "What to have ready"}
        </p>
        <span
          className={`text-body-sm tabular-nums ${progress.complete ? "text-success" : "text-fg-muted"}`}
        >
          {progress.ready} / {progress.total}
        </span>
      </div>

      <ul className="mt-stack-sm space-y-stack-xs">
        {TRAVEL_DOCUMENTS.map((document) => {
          const ready = trip.documentsReady.includes(document.key);
          return (
            <li key={document.key}>
              <button
                type="button"
                role="checkbox"
                aria-checked={ready}
                disabled={readOnly}
                onClick={() => onToggle(document.key)}
                className="flex w-full items-start gap-inline-md rounded-control px-inset-xs py-1 text-left transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring enabled:cursor-pointer enabled:hover:bg-surface-sunken disabled:cursor-default"
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-control-small border ${
                    ready
                      ? "border-primary-solid bg-primary-solid text-primary-on-solid"
                      : "border-line-strong bg-surface"
                  }`}
                >
                  {ready ? <Check className="h-3 w-3 stroke-[3]" /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-body-sm text-fg">
                    {isEs ? document.labelEs : document.labelEn}
                  </span>
                  <span className="block text-caption text-fg-muted">
                    {isEs ? document.hintEs : document.hintEn}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Said plainly: this is a checklist, not a file transfer. */}
      <p className="mt-stack-sm text-caption text-fg-muted">
        {isEs
          ? "Los archivos los envía tu unidad, no esta página."
          : "Your unit sends the files themselves, not this page."}
      </p>
    </div>
  );
}

/** What the member told the facility, so they can check it without editing. */
function RequestSummary({ trip }: { trip: TripRequest }) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const rows: [string, string][] = [
    [
      isEs ? "Días preferidos" : "Preferred days",
      `${formatDays(trip.preferredDays, isEs)} · ${timePreferenceLabel(trip.preferredTime, isEs)}`,
    ],
    [isEs ? "Tu teléfono" : "Your phone", trip.contactPhone],
    [
      isEs ? "Contacto de emergencia" : "Emergency contact",
      [
        trip.emergencyContact.name,
        trip.emergencyContact.relationship,
        trip.emergencyContact.phone,
      ]
        .filter(Boolean)
        .join(" · "),
    ],
    [
      isEs ? "Seguro" : "Insurance",
      [trip.insurance.plan, trip.insurance.memberId]
        .filter(Boolean)
        .join(" · "),
    ],
    [isEs ? "Notas" : "Notes", trip.notes],
  ];

  return (
    <dl className="space-y-stack-xs">
      {rows
        .filter(([, value]) => value.trim())
        .map(([label, value]) => (
          <div key={label} className="flex flex-wrap gap-inline-md">
            <dt className="w-[150px] shrink-0 text-body-sm text-fg-muted">
              {label}
            </dt>
            <dd className="m-0 min-w-0 flex-1 text-body-sm text-fg">{value}</dd>
          </div>
        ))}
    </dl>
  );
}

function TripCard({
  trip,
  onEdit,
  onCancel,
  onToggleDocument,
}: {
  trip: TripRequest;
  onEdit: () => void;
  onCancel: () => void;
  onToggleDocument: (key: TravelDocumentKey) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const [open, setOpen] = useState(false);

  const phase = tripPhase(trip);
  const countdown = daysUntilDeparture(trip);
  const editable = isEditable(trip);
  const chase = needsChasing(trip);
  const confirmed = trip.status === "confirmed";
  const progress = documentsProgress(trip);

  /* One line that answers "where is this up to" before anything else. */
  const when =
    phase === "away"
      ? isEs
        ? "De viaje ahora"
        : "Away now"
      : phase === "home"
        ? isEs
          ? "Terminado"
          : "Finished"
        : countdown === 0
          ? isEs
            ? "Sales hoy"
            : "You leave today"
          : isEs
            ? `Sales en ${countdown} días`
            : `You leave in ${countdown} days`;

  return (
    <Card as="article" tone="flat" padding="small" className="space-y-stack-md">
      {/* ------------------------------------------------------- header */}
      <div className="flex flex-wrap items-start justify-between gap-inline-md">
        <div className="min-w-0">
          <p className="text-heading-5 text-fg">{trip.destination}</p>
          <p className="mt-stack-xs text-body-sm text-fg-muted">
            {formatTripDates(trip, isEs)} ·{" "}
            {isEs
              ? `${tripLengthDays(trip)} días · ${trip.treatmentsNeeded} tratamiento(s)`
              : `${tripLengthDays(trip)} days · ${trip.treatmentsNeeded} treatment(s)`}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-inline-md">
          {phase !== "home" ? (
            <Badge tone={phase === "away" ? "accent" : "neutral"}>{when}</Badge>
          ) : null}
          <Badge
            tone={confirmed ? "success" : phase === "home" ? "neutral" : "info"}
          >
            {statusLabel(trip.status, isEs)}
          </Badge>
        </div>
      </div>

      {/* ------------------------------------------------------ progress */}
      {phase === "home" ? null : <ProgressStrip trip={trip} />}

      {/* A member two weeks out with nothing confirmed should be chasing,
          not waiting. Said once, and only while it is true. */}
      {chase ? (
        <Alert tone="warning">
          {isEs
            ? "Tu viaje es pronto y aún no está confirmado. Llama a tu clínica para preguntar cómo va."
            : "Your trip is soon and it is not confirmed yet. Call your clinic to ask where it has got to."}
        </Alert>
      ) : null}

      {/* The answer, once there is one. */}
      <PlacementCard trip={trip} />

      {/* Only shown once the facility has actually said something. */}
      {trip.facilityNote.trim() ? (
        <p className="rounded-control border border-line bg-surface p-inset-sm text-body-sm text-fg-secondary">
          {trip.facilityNote}
        </p>
      ) : null}

      {/* ------------------------------------------------------- actions */}
      <div className="flex flex-wrap items-center justify-between gap-inline-md">
        <Button
          size="small"
          variant="neutral"
          appearance="stroke"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
        >
          {open ? (
            <ChevronUp aria-hidden="true" className="size-4 shrink-0" />
          ) : (
            <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
          )}
          {isEs ? "Detalles" : "Details"}
          {phase === "home" ? null : (
            <span className="text-fg-muted tabular-nums">
              {progress.ready}/{progress.total}
            </span>
          )}
        </Button>

        <div className="flex items-center gap-inline-md">
          {editable ? (
            <Button
              size="small"
              variant="neutral"
              appearance="fill-stroke"
              onClick={onEdit}
            >
              <Pencil aria-hidden="true" className="size-4 shrink-0" />
              {isEs ? "Editar" : "Edit"}
            </Button>
          ) : null}
          {phase === "home" ? null : (
            <Button
              size="small"
              variant="danger"
              appearance="stroke"
              onClick={onCancel}
            >
              <Trash2 aria-hidden="true" className="size-4 shrink-0" />
              {isEs ? "Cancelar" : "Cancel"}
            </Button>
          )}
        </div>
      </div>

      {/* --------------------------------------------------- the details */}
      {open ? (
        <div className="grid grid-cols-1 gap-inset-md border-t border-line pt-inset-sm lg:grid-cols-2">
          <RequestSummary trip={trip} />
          <DocumentChecklist
            trip={trip}
            onToggle={onToggleDocument}
            readOnly={phase === "home"}
          />
        </div>
      ) : null}
    </Card>
  );
}

export function TravelDialysisSection() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const {
    trips,
    submit,
    update,
    cancel,
    setDocuments,
    isPending,
    error,
    refetch,
    saveError,
    dismissSaveError,
    isSaving,
  } = useTrips();

  const [open, setOpen] = useState(false);
  /* The trip being edited, or null when the form is creating a new one. */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TripRequest>(() => emptyTrip());
  const [submitted, setSubmitted] = useState(false);
  const [pendingCancel, setPendingCancel] = useState<TripRequest | null>(null);

  const set = (patch: Partial<TripRequest>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const invalid = tripError(draft);
  const upcoming = upcomingTrips(trips);
  const past = pastTrips(trips);

  const openForm = () => {
    setDraft(emptyTrip());
    setEditingId(null);
    setSubmitted(false);
    setOpen(true);
  };

  const openEdit = (trip: TripRequest) => {
    setDraft(trip);
    setEditingId(trip.id);
    setSubmitted(false);
    setOpen(true);
  };

  const send = () => {
    setSubmitted(true);
    if (!canSubmit(draft)) return;
    if (editingId) update(draft);
    else submit(draft);
    setOpen(false);
  };

  return (
    <Card as="section">
      <div className="flex flex-wrap items-start justify-between gap-inline-md">
        <div className="flex items-center gap-inline-md">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-primary-soft-line bg-primary-soft text-fg-brand"
          >
            <Plane className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-heading-4 text-fg">
              {isEs ? "Diálisis en Viaje" : "Travel Dialysis"}
            </h2>
            <p className="mt-stack-xs text-body-sm text-fg-muted">
              {isEs
                ? "Pide tus tratamientos fuera de casa. Tu clínica los coordina."
                : "Ask for treatments away from home. Your clinic arranges them."}
            </p>
          </div>
        </div>

        <Button onClick={openForm}>
          <Plus aria-hidden="true" className="size-4 shrink-0" />
          {isEs ? "Solicitar viaje" : "Request a trip"}
        </Button>
      </div>

      {saveError ? (
        <Alert
          tone="danger"
          className="mt-stack-md"
          onDismiss={dismissSaveError}
        >
          {isEs
            ? "No pudimos guardar ese cambio. Nada se envió a tu clínica."
            : "We could not save that change. Nothing went to your clinic."}
        </Alert>
      ) : null}

      <AsyncSection
        pending={isPending}
        error={error}
        onRetry={refetch}
        isEmpty={trips.length === 0}
        errorTitle={
          isEs ? "Tus viajes no se cargaron" : "Your trips did not load"
        }
        skeleton={
          <div className="mt-stack-md space-y-stack-sm">
            <Skeleton height={140} />
          </div>
        }
        empty={
          <EmptyState
            className="mt-stack-md"
            icon={<Plane aria-hidden="true" />}
            title={isEs ? "Sin viajes todavía" : "No trips yet"}
            description={
              isEs
                ? "Cuando planees un viaje, pide aquí tus tratamientos. Avisa con al menos cuatro semanas si puedes."
                : "When you plan a trip, request your treatments here. Give your clinic four weeks if you can."
            }
            action={
              <Button onClick={openForm}>
                <Plus aria-hidden="true" className="size-4 shrink-0" />
                {isEs ? "Solicitar viaje" : "Request a trip"}
              </Button>
            }
          />
        }
      >
        <div className="mt-stack-md space-y-stack-lg">
          {upcoming.length > 0 ? (
            <section className="space-y-stack-sm">
              <h3 className="text-heading-5 text-fg">
                {isEs ? "Próximos viajes" : "Upcoming trips"}
              </h3>
              {upcoming.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onEdit={() => openEdit(trip)}
                  onCancel={() => setPendingCancel(trip)}
                  onToggleDocument={(key) =>
                    setDocuments(
                      trip.id,
                      toggleDocument(trip.documentsReady, key),
                    )
                  }
                />
              ))}
            </section>
          ) : null}

          {past.length > 0 ? (
            <section className="space-y-stack-sm">
              <h3 className="text-heading-5 text-fg">
                {isEs ? "Viajes anteriores" : "Past trips"}
              </h3>
              {past.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onEdit={() => openEdit(trip)}
                  onCancel={() => setPendingCancel(trip)}
                  onToggleDocument={() => {}}
                />
              ))}
            </section>
          ) : null}
        </div>
      </AsyncSection>

      {open ? (
        <Modal
          open
          size="wide"
          onClose={() => setOpen(false)}
          title={
            editingId
              ? isEs
                ? "Editar solicitud"
                : "Edit request"
              : isEs
                ? "Solicitar diálisis en viaje"
                : "Request travel dialysis"
          }
          description={
            editingId
              ? isEs
                ? "Tu clínica verá los cambios. Aún no está confirmado."
                : "Your clinic sees the changes. This is still not confirmed."
              : isEs
                ? "Tu clínica recibe esto y coordina el centro de destino."
                : "Your clinic receives this and arranges the centre at the other end."
          }
          footer={
            <div className="flex flex-wrap items-center justify-end gap-inline-md">
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setOpen(false)}
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button onClick={send} disabled={isSaving}>
                {isSaving
                  ? isEs
                    ? "Guardando…"
                    : "Saving…"
                  : editingId
                    ? isEs
                      ? "Guardar cambios"
                      : "Save changes"
                    : isEs
                      ? "Enviar solicitud"
                      : "Send request"}
              </Button>
            </div>
          }
        >
          <div className="space-y-stack-lg">
            {/* ------------------------------------------------ the trip */}
            <section className="space-y-stack-md">
              <h3 className="text-heading-5 text-fg">
                {isEs ? "El viaje" : "The trip"}
              </h3>

              <FormField
                label={isEs ? "¿A dónde vas?" : "Where are you going?"}
                required
                error={
                  submitted && invalid === "destination"
                    ? isEs
                      ? "Dinos la ciudad o el lugar."
                      : "Tell us the city or place."
                    : undefined
                }
              >
                {(props) => (
                  <Input
                    {...props}
                    value={draft.destination}
                    onChange={(event) =>
                      set({ destination: event.target.value })
                    }
                    placeholder={isEs ? "Ciudad, estado" : "City, state"}
                  />
                )}
              </FormField>

              <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2">
                <FormField label={isEs ? "Salida" : "Leaving"} required>
                  {(props) => (
                    <Input
                      {...props}
                      type="date"
                      value={draft.departDate}
                      onChange={(event) =>
                        set({ departDate: event.target.value })
                      }
                    />
                  )}
                </FormField>

                <FormField
                  label={isEs ? "Regreso" : "Coming back"}
                  required
                  error={
                    submitted && invalid === "order"
                      ? isEs
                        ? "El regreso va después de la salida."
                        : "The return is after the departure."
                      : undefined
                  }
                >
                  {(props) => (
                    <Input
                      {...props}
                      type="date"
                      value={draft.returnDate}
                      min={draft.departDate}
                      onChange={(event) =>
                        set({ returnDate: event.target.value })
                      }
                    />
                  )}
                </FormField>
              </div>
            </section>

            {/* ----------------------------------------- what suits them */}
            <section className="space-y-stack-md border-t border-line pt-inset-md">
              <h3 className="text-heading-5 text-fg">
                {isEs ? "Tus tratamientos" : "Your treatments"}
              </h3>

              <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2">
                <FormField
                  label={isEs ? "Tratamientos necesarios" : "Treatments needed"}
                  required
                >
                  {(props) => (
                    <Input
                      {...props}
                      type="number"
                      min={1}
                      max={30}
                      value={draft.treatmentsNeeded}
                      onChange={(event) =>
                        set({
                          treatmentsNeeded: Math.max(
                            1,
                            Number(event.target.value) || 1,
                          ),
                        })
                      }
                    />
                  )}
                </FormField>

                <FormField label={isEs ? "Hora preferida" : "Preferred time"}>
                  {(props) => (
                    <Select
                      {...props}
                      value={draft.preferredTime}
                      onChange={(event) =>
                        set({
                          preferredTime: event.target.value as TimePreference,
                        })
                      }
                    >
                      {TIME_PREFERENCES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {isEs ? option.labelEs : option.labelEn}
                        </option>
                      ))}
                    </Select>
                  )}
                </FormField>
              </div>

              <FormField
                label={isEs ? "Días preferidos" : "Preferred days"}
                optionalLabel={isEs ? "opcional" : "optional"}
                hint={
                  isEs
                    ? "Déjalo vacío si cualquier día te sirve."
                    : "Leave it empty if any day works."
                }
              >
                {() => (
                  <ChipGroup
                    label={isEs ? "Días preferidos" : "Preferred days"}
                    selection="multiple"
                  >
                    {WEEKDAYS.map((day) => (
                      <Chip
                        key={day.value}
                        selected={draft.preferredDays.includes(day.value)}
                        onClick={() =>
                          set({
                            preferredDays: toggleDay(
                              draft.preferredDays,
                              day.value as Weekday,
                            ),
                          })
                        }
                      >
                        {isEs ? day.labelEs : day.labelEn}
                      </Chip>
                    ))}
                  </ChipGroup>
                )}
              </FormField>
            </section>

            {/* -------------------------------------------- reaching them */}
            <section className="space-y-stack-md border-t border-line pt-inset-md">
              <h3 className="text-heading-5 text-fg">
                {isEs ? "Contacto" : "Contact"}
              </h3>

              <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2">
                <FormField
                  label={isEs ? "Tu teléfono" : "Your phone"}
                  required
                  hint={
                    isEs
                      ? "Donde te puedan localizar durante el viaje."
                      : "Where they can reach you while away."
                  }
                  error={
                    submitted && invalid === "phone"
                      ? isEs
                        ? "Necesitamos un número."
                        : "We need a number."
                      : undefined
                  }
                >
                  {(props) => (
                    <Input
                      {...props}
                      type="tel"
                      value={draft.contactPhone}
                      onChange={(event) =>
                        set({ contactPhone: event.target.value })
                      }
                    />
                  )}
                </FormField>

                <FormField
                  label={isEs ? "Contacto de emergencia" : "Emergency contact"}
                  optionalLabel={isEs ? "opcional" : "optional"}
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={draft.emergencyContact.name}
                      onChange={(event) =>
                        set({
                          emergencyContact: {
                            ...draft.emergencyContact,
                            name: event.target.value,
                          },
                        })
                      }
                      placeholder={isEs ? "Nombre" : "Name"}
                    />
                  )}
                </FormField>

                <FormField
                  label={isEs ? "Su teléfono" : "Their phone"}
                  optionalLabel={isEs ? "opcional" : "optional"}
                >
                  {(props) => (
                    <Input
                      {...props}
                      type="tel"
                      value={draft.emergencyContact.phone}
                      onChange={(event) =>
                        set({
                          emergencyContact: {
                            ...draft.emergencyContact,
                            phone: event.target.value,
                          },
                        })
                      }
                    />
                  )}
                </FormField>

                <FormField
                  label={isEs ? "Parentesco" : "Relationship"}
                  optionalLabel={isEs ? "opcional" : "optional"}
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={draft.emergencyContact.relationship}
                      onChange={(event) =>
                        set({
                          emergencyContact: {
                            ...draft.emergencyContact,
                            relationship: event.target.value,
                          },
                        })
                      }
                      placeholder={
                        isEs ? "Hija, vecino…" : "Daughter, neighbour…"
                      }
                    />
                  )}
                </FormField>
              </div>
            </section>

            {/* ------------------------------------------------- insurance */}
            <section className="space-y-stack-md border-t border-line pt-inset-md">
              <h3 className="text-heading-5 text-fg">
                {isEs ? "Seguro" : "Insurance"}
              </h3>

              <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2">
                <FormField
                  label={isEs ? "Plan o aseguradora" : "Plan or carrier"}
                  optionalLabel={isEs ? "opcional" : "optional"}
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={draft.insurance.plan}
                      onChange={(event) =>
                        set({
                          insurance: {
                            ...draft.insurance,
                            plan: event.target.value,
                          },
                        })
                      }
                    />
                  )}
                </FormField>

                <FormField
                  label={isEs ? "Número de miembro" : "Member number"}
                  optionalLabel={isEs ? "opcional" : "optional"}
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={draft.insurance.memberId}
                      onChange={(event) =>
                        set({
                          insurance: {
                            ...draft.insurance,
                            memberId: event.target.value,
                          },
                        })
                      }
                    />
                  )}
                </FormField>
              </div>
            </section>

            {/* ----------------------------------------------- the rest */}
            <section className="space-y-stack-md border-t border-line pt-inset-md">
              <FormField
                label={
                  isEs ? "Algo que deban saber" : "Anything they should know"
                }
                optionalLabel={isEs ? "opcional" : "optional"}
                hint={
                  isEs
                    ? "Tipo de acceso, cómo llegarás, cualquier cosa útil."
                    : "Access type, how you will get there, anything useful."
                }
              >
                {(props) => (
                  <Textarea
                    {...props}
                    rows={3}
                    value={draft.notes}
                    onChange={(event) => set({ notes: event.target.value })}
                  />
                )}
              </FormField>

              {/* Said before they send a new one. An edit already knows. */}
              {editingId ? null : (
                <Alert tone="info">
                  {isEs
                    ? "Esto es una solicitud, no una reserva. Tu viaje no está confirmado hasta que tu clínica lo confirme aquí."
                    : "This is a request, not a booking. Your trip is not confirmed until your clinic confirms it here."}
                </Alert>
              )}
            </section>
          </div>
        </Modal>
      ) : null}

      {/* Cancelling a request the clinic may already be working on is worth
          one question, the same as every other undoable action here. */}
      {pendingCancel ? (
        <Modal
          open
          size="small"
          closeOnBackdrop={false}
          onClose={() => setPendingCancel(null)}
          title={isEs ? "¿Cancelar esta solicitud?" : "Cancel this request?"}
          description={
            isEs
              ? `Tu solicitud para ${pendingCancel.destination} se eliminará. Si tu clínica ya está trabajando en ella, avísales.`
              : `Your request for ${pendingCancel.destination} will be removed. If your clinic is already working on it, let them know.`
          }
          footer={
            <div className="flex flex-wrap items-center justify-end gap-inline-md">
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setPendingCancel(null)}
              >
                {isEs ? "Conservar" : "Keep it"}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  cancel(pendingCancel.id);
                  setPendingCancel(null);
                }}
              >
                {isEs ? "Cancelar solicitud" : "Cancel request"}
              </Button>
            </div>
          }
        />
      ) : null}
    </Card>
  );
}

export default TravelDialysisSection;
