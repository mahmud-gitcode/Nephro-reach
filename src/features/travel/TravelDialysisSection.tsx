"use client";

import React, { useState } from "react";
import {
  Building2,
  Check,
  ClipboardList,
  Clock,
  MapPin,
  Phone,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  TIME_PREFERENCES,
  TRAVEL_DOCUMENTS,
  TRIP_STATUSES,
  WEEKDAYS,
  canSubmit,
  documentsProgress,
  emptyTrip,
  formatDateLabel,
  formatDays,
  statusDetail,
  statusIndex,
  statusLabel,
  timePreferenceLabel,
  toggleDay,
  tripError,
} from "./trip.rules";
import { useTrips } from "./useTrips";
import YourTrips from "./YourTrips";
import type {
  TimePreference,
  TravelDocumentKey,
  TripRequest,
  Weekday,
} from "./trip.types";
import {
  Alert,
  Button,
  Chip,
  ChipGroup,
  FormField,
  Input,
  Modal,
  Select,
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
export function ProgressStrip({ trip }: { trip: TripRequest }) {
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
export function PlacementCard({ trip }: { trip: TripRequest }) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const placement = trip.placement;

  if (!placement?.facilityName.trim()) return null;

  const mapsHref = placement.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${placement.facilityName}, ${placement.address}`,
      )}`
    : null;

  /* Two sub-cards side by side: who and where, then when. Titles are 16px,
     4px up from the small labels they replace. */
  const subCard =
    "flex flex-col gap-stack-sm rounded-card border border-line-subtle bg-surface-sunken p-inset-md";
  const subTitle = "text-label-lg font-semibold text-fg";

  const actionClass =
    "flex min-w-0 items-start gap-inline-md rounded-control border border-line bg-surface p-inset-sm transition-colors duration-150 ease-standard hover:border-primary-soft-line hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
  const actionIcon =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-primary-soft text-fg-brand";

  return (
    <div className="flex flex-col gap-stack-md">
      {/* The center, named first and in green, on the card's white. */}
      <p className="flex items-center gap-inline-sm text-heading-5 text-success">
        <Building2 aria-hidden="true" className="h-5 w-5 shrink-0" />
        {placement.facilityName}
      </p>

      {/* Two grey sub-cards whose tops line up: contact on the left, the
        booked times on the right. */}
      <div className="grid grid-cols-1 items-stretch gap-inset-md md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        {/* Contact info: how to get there and how to ring them */}
        <section className={subCard} aria-labelledby="placement-contact">
          <h3 id="placement-contact" className={subTitle}>
            {isEs ? "Información de contacto" : "Contact info"}
          </h3>

          {/* Address and phone, each on its own white card. */}
          <div className="flex flex-col gap-stack-sm">
            {mapsHref ? (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className={actionClass}
              >
                <span aria-hidden="true" className={actionIcon}>
                  <MapPin className="h-4 w-4" />
                </span>
                <span className="min-w-0 pt-1.5 text-body-sm text-fg-brand">
                  {placement.address}
                  <span className="sr-only">
                    {isEs ? " (abre el mapa)" : " (opens map)"}
                  </span>
                </span>
              </a>
            ) : null}

            {placement.phone ? (
              <a
                href={`tel:${placement.phone.replace(/\s/g, "")}`}
                className={actionClass}
              >
                <span aria-hidden="true" className={actionIcon}>
                  <Phone className="h-4 w-4" />
                </span>
                <span className="pt-1.5 text-body-sm text-fg-brand tabular-nums">
                  {placement.phone}
                </span>
              </a>
            ) : null}
          </div>
        </section>

        {/* Booked treatments: the same slot as the dialysis schedule */}
        {placement.treatments.length > 0 ? (
          <section className={subCard} aria-labelledby="placement-booked">
            <h3 id="placement-booked" className={subTitle}>
              {isEs ? "Tratamientos reservados" : "Booked treatments"}
            </h3>
            <ul className="grid grid-cols-1 gap-inline-md sm:grid-cols-2">
              {placement.treatments.map((treatment) => (
                <li
                  key={treatment.id}
                  className="flex min-w-0 items-center justify-between gap-inline-sm rounded-xl border border-line bg-gradient-to-r from-primary-soft via-surface to-surface py-2.5 pr-2 pl-3 shadow-card"
                >
                  <span className="min-w-0 text-label-sm whitespace-nowrap text-fg-brand">
                    {formatDateLabel(treatment.date, isEs)}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface-sunken px-2.5 py-1 text-xs font-bold whitespace-nowrap text-fg tabular-nums select-none">
                    <Clock
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 stroke-[2.4] text-fg-muted"
                    />
                    {treatment.time}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}

/** The paperwork, ticked rather than uploaded. */
export function DocumentChecklist({
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
export function RequestSummary({ trip }: { trip: TripRequest }) {
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

export function TravelDialysisSection() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const { trips, submit, update, saveError, dismissSaveError, isSaving } =
    useTrips();

  const [open, setOpen] = useState(false);
  /* The trip being edited, or null when the form is creating a new one. */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TripRequest>(() => emptyTrip());
  const [submitted, setSubmitted] = useState(false);

  const set = (patch: Partial<TripRequest>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const invalid = tripError(draft);

  const openEdit = (trip: TripRequest) => {
    setDraft(trip);
    setEditingId(trip.id);
    setSubmitted(false);
    setOpen(true);
  };

  const openForm = () => {
    setDraft(emptyTrip());
    setEditingId(null);
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
    /* Chrome only. Everything this used to draw — a heading, four filter
       tabs and a list of trip cards — is gone, because every part of it was
       a second copy of something already on the page: the panels above
       describe the current trip, Past Travel Treatments lists the finished
       ones, and Your trips chooses between them.

       What is left is the part that has no other home: the request form,
       the cancel confirmation, and the error a member must see if a change
       never reached their clinic. */
    <section>
      {saveError ? (
        <Alert tone="danger" onDismiss={dismissSaveError}>
          {isEs
            ? "No pudimos guardar ese cambio. Nada se envió a tu clínica."
            : "We could not save that change. Nothing went to your clinic."}
        </Alert>
      ) : null}

      {/* Rendered here rather than on the page because Request and Edit
        open the form below. Keeping the trigger and the dialog in one
        component means no state has to be lifted and synced back. */}
      <YourTrips trips={trips} onRequest={openForm} onEdit={openEdit} />

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
                : "Your clinic receives this and arranges the center at the other end."
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

              {/* The address in its parts. One free-text line was enough to
                name a trip and useless for arranging one — the coordinator
                rings round for a chair and needs a street and a zip. */}
              <FormField
                label={isEs ? "Dirección" : "Street address"}
                required
                error={
                  submitted && invalid === "street"
                    ? isEs
                      ? "Dinos la calle donde te quedarás."
                      : "Tell us the street where you are staying."
                    : undefined
                }
              >
                {(props) => (
                  <Input
                    {...props}
                    value={draft.destination.street}
                    onChange={(event) =>
                      set({
                        destination: {
                          ...draft.destination,
                          street: event.target.value,
                        },
                      })
                    }
                    placeholder="1234 Health Way"
                  />
                )}
              </FormField>

              <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-[1fr_120px_140px]">
                <FormField
                  label={isEs ? "Ciudad" : "City"}
                  required
                  error={
                    submitted && invalid === "destination"
                      ? isEs
                        ? "Falta la ciudad o el estado."
                        : "City and state are both needed."
                      : undefined
                  }
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={draft.destination.city}
                      onChange={(event) =>
                        set({
                          destination: {
                            ...draft.destination,
                            city: event.target.value,
                          },
                        })
                      }
                      placeholder="Orlando"
                    />
                  )}
                </FormField>

                <FormField label={isEs ? "Estado" : "State"} required>
                  {(props) => (
                    <Input
                      {...props}
                      value={draft.destination.state}
                      onChange={(event) =>
                        set({
                          destination: {
                            ...draft.destination,
                            /* Uppercased as typed: a state code is written
                               one way on an address. */
                            state: event.target.value.toUpperCase().slice(0, 2),
                          },
                        })
                      }
                      placeholder="FL"
                    />
                  )}
                </FormField>

                <FormField label={isEs ? "Código postal" : "ZIP code"}>
                  {(props) => (
                    <Input
                      {...props}
                      inputMode="numeric"
                      value={draft.destination.zip}
                      onChange={(event) =>
                        set({
                          destination: {
                            ...draft.destination,
                            zip: event.target.value,
                          },
                        })
                      }
                      placeholder="32801"
                    />
                  )}
                </FormField>
              </div>

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
                  label={
                    isEs
                      ? "Nombre del contacto de emergencia"
                      : "Emergency contact name"
                  }
                  required
                  error={
                    submitted && invalid === "emergency-name"
                      ? isEs
                        ? "¿A quién llamamos si algo pasa?"
                        : "Who should be called if something happens?"
                      : undefined
                  }
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

                {/* "Their phone" sat under a name and read as if it might
                  be the member's own. It says whose it is. */}
                <FormField
                  label={
                    isEs
                      ? "Teléfono del contacto de emergencia"
                      : "Emergency contact phone"
                  }
                  required
                  error={
                    submitted && invalid === "emergency-phone"
                      ? isEs
                        ? "Necesitamos un número al que llamar."
                        : "We need a number to call."
                      : undefined
                  }
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
    </section>
  );
}

export default TravelDialysisSection;
