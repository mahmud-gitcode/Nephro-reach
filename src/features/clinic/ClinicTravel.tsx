"use client";

import React, { useDeferredValue, useState } from "react";
import { Building2, Plane, Plus, Trash2 } from "lucide-react";
import {
  TRAVEL_DOCUMENTS,
  TRIP_STATUSES,
  addConfirmedTreatment,
  confirmationError,
  destinationLabel,
  emptyPlacement,
  formatDays,
  formatEventTime,
  formatTripDates,
  hasOpenTimeChange,
  removeConfirmedTreatment,
  statusLabel,
  timePreferenceLabel,
  tripLengthDays,
} from "@/features/travel/trip.rules";
import {
  ArrangementError,
  useOfficeTrip,
  useOfficeTrips,
  type OfficeTripRow,
} from "@/features/travel/useTrips";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
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
  TabPanel,
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
import { useCan } from "@/features/staff/useStaffAccounts";
import { PartNote } from "@/features/travel/PartNote";
import { useLanguage } from "@/context/LanguageContext";

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

const patientName = (trip: TripRequest, isEs = false) =>
  trip.patient?.name ?? (isEs ? "Paciente" : "Patient");

/* The inbox rows are the server's summaries (OfficeTripRow); the popup reads
   the whole trip. The two share these few words. */
const rowDestination = (row: OfficeTripRow) =>
  [row.city, row.state].filter(Boolean).join(", ");
const rowDates = (row: OfficeTripRow, isEs = false) =>
  formatTripDates(
    { departDate: row.departDate, returnDate: row.returnDate } as TripRequest,
    isEs,
  );
const rowDays = (row: OfficeTripRow) =>
  tripLengthDays({
    departDate: row.departDate,
    returnDate: row.returnDate,
  } as TripRequest);

/** Where a request stands, as a tag colour. */
const STATUS_TONE: Record<TripStatus, BadgeTone> = {
  submitted: "info",
  "facility-reviewing": "info",
  "records-sent": "accent",
  "placement-pending": "warning",
  confirmed: "success",
  closed: "neutral",
};

function StatusTag({
  trip,
}: {
  trip: Pick<TripRequest, "cancelRequestedAt" | "status">;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  /* The member asked to cancel (client, 2026-10-12): the center manages it
     with the other unit. */
  if (trip.cancelRequestedAt) {
    return (
      <Badge tone="danger">
        {isEs ? "Cancelación solicitada" : "Cancellation requested"}
      </Badge>
    );
  }
  return (
    <Badge tone={STATUS_TONE[trip.status]}>
      {statusLabel(trip.status, isEs)}
    </Badge>
  );
}

/* ------------------------------------------------------------ the table */

function RequestRow({
  trip,
  onManage,
}: {
  trip: OfficeTripRow;
  onManage: () => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const booked = trip.bookedCount;
  const short = booked < trip.treatmentsNeeded;

  return (
    <TableRow>
      <TableCell emphasis>
        <span className="flex items-center gap-inline-md">
          <TableThumb name={trip.patientName} />
          <span className="min-w-0">{trip.patientName}</span>
        </span>
      </TableCell>
      <TableCell>{rowDestination(trip)}</TableCell>
      <TableCell className="whitespace-nowrap">
        {rowDates(trip, isEs)}
        <span className="block text-caption text-fg-muted">
          {rowDays(trip)} {isEs ? "días" : "days"}
        </span>
      </TableCell>
      <TableCell className="whitespace-nowrap tabular-nums">
        <span className={short ? "text-warning" : undefined}>
          {booked} / {trip.treatmentsNeeded}
        </span>
        <span className="block text-caption text-fg-muted">
          {isEs ? "reservados" : "booked"}
        </span>
      </TableCell>
      <TableCell>
        {trip.facilityName || (
          <span className="text-fg-muted">
            {isEs ? "Sin organizar" : "Not arranged"}
          </span>
        )}
      </TableCell>
      <TableCell>
        <span className="flex flex-col items-start gap-stack-xs">
          <StatusTag trip={trip} />
          {trip.hasOpenTimeChange ? (
            <Badge tone="warning" icon={<ClockSolid aria-hidden="true" />}>
              {isEs ? "Cambio de horario solicitado" : "Time change asked"}
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
          aria-label={
            isEs
              ? `Gestionar el viaje de ${trip.patientName} a ${rowDestination(trip)}`
              : `Manage ${trip.patientName}'s trip to ${rowDestination(trip)}`
          }
        >
          {isEs ? "Gestionar" : "Manage"}
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
  const { language } = useLanguage();
  const isEs = language === "ES";
  /* Placing a traveller is the social worker's or coordinator's; anyone
     else on staff can see the arrangement but not change it, so its fields
     are disabled for them (P16c crawl: an Office Manager could edit and
     "Add" times that no button would ever save). */
  const canEdit = useCan("travel.manage");
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
      title={`${patientName(trip, isEs)} — ${destinationLabel(trip)}`}
      description={
        isEs
          ? `${formatTripDates(trip, true)} · ${tripLengthDays(trip)} días · ${trip.treatmentsNeeded} tratamiento(s) necesario(s)`
          : `${formatTripDates(trip, false)} · ${tripLengthDays(trip)} days · ${trip.treatmentsNeeded} treatment(s) needed`
      }
      footer={
        <div className="flex flex-wrap items-center justify-end gap-inline-md">
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {canEdit
              ? isEs
                ? "Cancelar"
                : "Cancel"
              : isEs
                ? "Cerrar"
                : "Close"}
          </Button>
          {canEdit ? (
            /* Confirmed tells the patient it is booked, so it cannot be
               saved without somewhere and some time to be booked into. */
            <Button
              disabled={blocked !== null}
              onClick={() => onSave({ status, placement, note })}
            >
              {isEs ? "Guardar cambios" : "Save changes"}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-stack-lg">
        {!canEdit ? (
          <Alert tone="info">
            {isEs
              ? "Su rol puede ver este arreglo, pero no cambiarlo. Un trabajador social, coordinador de atención o administrador organiza la diálisis en viaje."
              : "Your role can see this arrangement but not change it. A social worker, care coordinator or administrator arranges travel dialysis."}
          </Alert>
        ) : null}
        {hasOpenTimeChange(trip) && trip.timeChange ? (
          <Alert
            tone="warning"
            title={
              isEs
                ? `Cambio de horario solicitado — ${trip.timeChange.preferredTime}`
                : `Time change requested — ${trip.timeChange.preferredTime}`
            }
          >
            <div className="space-y-stack-sm">
              <p className="text-body-sm text-fg-secondary">
                {trip.timeChange.note}
              </p>
              <p className="text-body-sm text-fg-muted">
                {isEs ? "Solicitado" : "Asked"}{" "}
                {formatEventTime(trip.timeChange.requestedAt, isEs)}
                {trip.timeChange.preferredDays.length > 0
                  ? ` · ${formatDays(trip.timeChange.preferredDays, isEs)}`
                  : null}
              </p>
              {canEdit ? (
                <div className="flex flex-wrap items-end gap-inline-md">
                  <Input
                    value={timeReply}
                    onChange={(event) => setTimeReply(event.target.value)}
                    placeholder={
                      isEs ? "Qué hizo al respecto" : "What you did about it"
                    }
                    aria-label={
                      isEs
                        ? "Respuesta sobre el cambio de horario"
                        : "Reply about the time change"
                    }
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
                    {isEs ? "Responder" : "Answer"}
                  </Button>
                </div>
              ) : null}
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
              {isEs ? "La solicitud" : "The request"}
            </h3>
            <dl className="space-y-stack-md rounded-card-nested bg-surface-sunken p-inset-md">
              <Detail
                label={isEs ? "Días preferidos" : "Preferred days"}
                value={`${formatDays(trip.preferredDays, isEs)} · ${timePreferenceLabel(trip.preferredTime, isEs)}`}
              />
              <Detail
                label={isEs ? "Teléfono del paciente" : "Patient phone"}
                value={trip.contactPhone}
              />
              <Detail
                label={isEs ? "Contacto de emergencia" : "Emergency contact"}
                value={[
                  trip.emergencyContact.name,
                  trip.emergencyContact.relationship,
                  trip.emergencyContact.phone,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
              <Detail
                label={isEs ? "Seguro" : "Insurance"}
                value={[trip.insurance.plan, trip.insurance.memberId]
                  .filter(Boolean)
                  .join(" · ")}
              />
              <Detail
                label={isEs ? "Documentos listos" : "Documents ready"}
                value={
                  readyDocuments.length === 0
                    ? isEs
                      ? "Ninguno todavía"
                      : "None yet"
                    : `${readyDocuments.length} ${isEs ? "de" : "of"} ${TRAVEL_DOCUMENTS.length} — ${readyDocuments
                        .map((document) =>
                          isEs ? document.labelEs : document.labelEn,
                        )
                        .join(", ")}`
                }
              />
              <Detail label={isEs ? "Notas" : "Notes"} value={trip.notes} />
            </dl>
          </section>

          {/* What the clinic arranges. */}
          <section
            aria-labelledby="arrangement-heading"
            className="space-y-stack-lg"
          >
            <h3 id="arrangement-heading" className="text-heading-5 text-fg">
              {isEs ? "Su arreglo" : "Your arrangement"}
            </h3>

            <FormField label={isEs ? "Estado" : "Status"}>
              {(props) => (
                <Select
                  {...props}
                  disabled={!canEdit}
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as TripStatus)
                  }
                >
                  {TRIP_STATUSES.map((entry) => (
                    <option key={entry.value} value={entry.value}>
                      {isEs ? entry.labelEs : entry.labelEn}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>

            {/* The name gets the room: "Fresenius Kidney Care — Orlando
                East" cut off at half width. */}
            <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <FormField
                label={isEs ? "Centro receptor" : "Receiving facility"}
              >
                {(props) => (
                  <Input
                    {...props}
                    disabled={!canEdit}
                    value={placement.facilityName}
                    onChange={(event) =>
                      setPlacement({
                        ...placement,
                        facilityName: event.target.value,
                      })
                    }
                    placeholder={
                      isEs
                        ? "Centro de Diálisis Bayview"
                        : "Bayview Dialysis Center"
                    }
                  />
                )}
              </FormField>
              <FormField
                label={isEs ? "Teléfono del centro" : "Facility phone"}
              >
                {(props) => (
                  <Input
                    {...props}
                    type="tel"
                    disabled={!canEdit}
                    value={placement.phone}
                    onChange={(event) =>
                      setPlacement({ ...placement, phone: event.target.value })
                    }
                  />
                )}
              </FormField>
            </div>

            <FormField
              label={isEs ? "Dirección del centro" : "Facility address"}
            >
              {(props) => (
                <Input
                  {...props}
                  disabled={!canEdit}
                  value={placement.address}
                  onChange={(event) =>
                    setPlacement({ ...placement, address: event.target.value })
                  }
                />
              )}
            </FormField>

            <div className="space-y-stack-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-inline-md">
                <p className="text-label-lg text-fg">
                  {isEs ? "Tratamientos reservados" : "Booked treatments"}
                </p>
                <p
                  className={`text-body-sm ${shortfall > 0 ? "text-warning" : "text-success"}`}
                >
                  {isEs
                    ? `${booked} de ${trip.treatmentsNeeded} reservados`
                    : `${booked} of ${trip.treatmentsNeeded} booked`}
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-inline-md">
                <Input
                  type="date"
                  aria-label={isEs ? "Fecha del tratamiento" : "Treatment date"}
                  disabled={!canEdit}
                  value={date}
                  min={trip.departDate}
                  max={trip.returnDate}
                  onChange={(event) => setDate(event.target.value)}
                  className="flex-1"
                />
                <Input
                  type="time"
                  aria-label={isEs ? "Hora del tratamiento" : "Treatment time"}
                  disabled={!canEdit}
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="neutral"
                  appearance="fill-stroke"
                  disabled={!canEdit || !date || !time}
                  onClick={() =>
                    setPlacement(addConfirmedTreatment(placement, date, time))
                  }
                >
                  <Plus aria-hidden="true" />
                  {isEs ? "Agregar" : "Add"}
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
                        disabled={!canEdit}
                        aria-label={
                          isEs
                            ? `Quitar ${treatment.date} ${treatment.time}`
                            : `Remove ${treatment.date} ${treatment.time}`
                        }
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
                  {isEs
                    ? "Aún no hay horarios reservados. No se puede confirmar un viaje sin ellos."
                    : "No times booked yet. A trip cannot be confirmed without them."}
                </p>
              )}
            </div>

            <FormField
              label={
                isEs ? "Mensaje para el paciente" : "Message to the patient"
              }
              hint={
                isEs
                  ? "Se muestra en su viaje. Déjelo vacío hasta que haya algo que decir."
                  : "Shown on their trip. Leave it empty until there is something to say."
              }
            >
              {(props) => (
                <Textarea
                  {...props}
                  rows={3}
                  disabled={!canEdit}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              )}
            </FormField>

            {blocked ? (
              <Alert tone="warning">
                {isEs ? "Para confirmar, agregue" : "To confirm, add"}{" "}
                {blocked === "no-treatments"
                  ? isEs
                    ? "al menos un horario de tratamiento"
                    : "at least one treatment time"
                  : isEs
                    ? "el centro receptor"
                    : "the receiving facility"}
                {isEs
                  ? ". Se le informa al paciente que está reservado en cuanto usted guarda."
                  : ". The patient is told it is booked as soon as you save."}
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
  const { language } = useLanguage();
  const isEs = language === "ES";
  const [view, setView] = useState<"open" | "past">("open");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [managingId, setManagingId] = useState<string | null>(null);

  /* Search and status are the server's filters (spec 045); the split into
     open and past is by date on the server too. */
  const deferredQuery = useDeferredValue(query);
  const {
    upcoming,
    past,
    openPartial,
    pastPartial,
    isPending,
    error,
    refetch,
  } = useOfficeTrips({
    search: deferredQuery,
    status: statusFilter === ALL ? undefined : (statusFilter as TripStatus),
  });
  /* The popup reads the whole trip, by id; a save refreshes it and the list. */
  const {
    trip: managing,
    error: managingError,
    saveArrangement,
    resolveTimeChange,
    saveError,
    dismissSaveError,
  } = useOfficeTrip(managingId);

  const needsAction = upcoming.filter(
    (trip) => !trip.facilityName.trim() || trip.bookedCount === 0,
  ).length;
  const timeChanges = upcoming.filter((trip) => trip.hasOpenTimeChange).length;
  const confirmed = upcoming.filter(
    (trip) => trip.status === "confirmed",
  ).length;

  const rows = view === "open" ? upcoming : past;
  const filtered = query.trim() !== "" || statusFilter !== ALL;

  return (
    <div className="space-y-4">
      <PageTitle href={HREF} />

      {saveError ? (
        <Alert
          tone="danger"
          title={
            isEs ? "No se pudo guardar el cambio" : "That change did not save"
          }
          onDismiss={dismissSaveError}
        >
          {saveError instanceof ArrangementError &&
          saveError.part !== "placement"
            ? isEs
              ? `No se pudo guardar ${saveError.part === "note" ? "el mensaje" : "el estado"}; lo anterior sí se guardó. Abra la solicitud para revisarla.`
              : `The ${saveError.part === "note" ? "message" : "status"} did not save; anything before it did. Open the request to check it.`
            : isEs
              ? "La solicitud no cambió y no se le ha informado nada al paciente."
              : "The request is unchanged, and the patient has not been told anything."}
        </Alert>
      ) : null}

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2">
        <KeyCard
          icon={<Plane />}
          value={upcoming.length}
          label={isEs ? "Solicitudes abiertas" : "Open requests"}
          note={isEs ? "Próximas y en curso" : "Upcoming and in progress"}
        />
        <KeyCard
          tone="warning"
          icon={<AlertTriangleSolid />}
          value={needsAction}
          label={isEs ? "Requieren acción" : "Need action"}
          note={isEs ? "Aún sin centro u horarios" : "No facility or times yet"}
        />
        <KeyCard
          tone="accent"
          icon={<ClockSolid />}
          value={timeChanges}
          label={isEs ? "Cambios de horario solicitados" : "Time changes asked"}
          note={isEs ? "Un paciente está esperando" : "A patient is waiting"}
        />
        <KeyCard
          tone="success"
          icon={<CheckCircleSolid />}
          value={confirmed}
          label={isEs ? "Confirmadas" : "Confirmed"}
          note={
            isEs ? "Centro y horarios enviados" : "Placement and times sent"
          }
        />
      </section>

      <Card as="section" padding="none" className="overflow-hidden">
        <div className="flex flex-col gap-inset-sm p-card pb-stack-lg lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-inline-lg">
            <h2 className="text-heading-4 text-fg">
              {isEs ? "Solicitudes de viaje" : "Travel requests"}
            </h2>
            <Tabs
              label={isEs ? "Qué solicitudes" : "Which requests"}
              value={view}
              onChange={setView}
              items={[
                {
                  id: "open",
                  label: `${isEs ? "Abiertas" : "Open"} (${upcoming.length})`,
                },
                {
                  id: "past",
                  label: `${isEs ? "Pasadas" : "Past"} (${past.length})`,
                },
              ]}
            />
          </div>
          <div className="flex flex-col gap-inline-md sm:flex-row sm:items-center">
            <SearchField
              label={
                isEs ? "Buscar solicitudes de viaje" : "Search travel requests"
              }
              placeholder={
                isEs
                  ? "Buscar paciente o destino…"
                  : "Search patient or destination…"
              }
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="sm:w-64"
            />
            <Select
              selectSize="small"
              aria-label={isEs ? "Estado" : "Status"}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value={ALL}>
                {isEs ? "Todos los estados" : "All statuses"}
              </option>
              {TRIP_STATUSES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {isEs ? entry.labelEs : entry.labelEn}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Each tab reads one bounded page (newest first); when the office
            has more, say so rather than pass a part off as the whole. */}
        <PartNote
          part={view === "open" ? openPartial : pastPartial}
          text={({ loaded, total }) =>
            isEs
              ? `Se muestran las ${loaded} solicitudes ${view === "open" ? "actuales" : "pasadas"} más recientes de ${total}. Busque o elija un estado para encontrar otras.`
              : `Showing the newest ${loaded} of ${total} ${view === "open" ? "current" : "past"} requests. Search or pick a status to find others.`
          }
          className="px-card pb-stack-md"
        />

        {/* The table is the panel the Open and Past tabs control. */}
        <TabPanel id={view} value={view}>
          <AsyncSection
            /* Loading shows as skeleton rows inside the table below, so the
               header and filters stay put; this section only handles the
               failed and empty states. */
            pending={false}
            skeleton={null}
            error={error}
            onRetry={canRetry(error) ? refetch : undefined}
            isEmpty={
              !isPending &&
              !filtered &&
              upcoming.length === 0 &&
              past.length === 0
            }
            errorTitle={errorTitleFor(
              error,
              isEs
                ? "Las solicitudes de viaje no se cargaron"
                : "Travel requests did not load",
              isEs ? "es" : "en",
            )}
            errorMessage={errorMessageFor(error, undefined, isEs ? "es" : "en")}
            empty={
              <div className="px-card pb-card">
                <EmptyState
                  variant="bare"
                  icon={<Plane aria-hidden="true" />}
                  title={
                    isEs ? "No hay solicitudes de viaje" : "No travel requests"
                  }
                  description={
                    isEs
                      ? "Cuando un paciente pida diálisis mientras está fuera, la solicitud llegará aquí."
                      : "When a patient asks for dialysis while they are away, the request lands here."
                  }
                />
              </div>
            }
          >
            <Table minWidth={900}>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>
                    {isEs ? "Paciente" : "Patient"}
                  </TableHeaderCell>
                  <TableHeaderCell>
                    {isEs ? "Destino" : "Destination"}
                  </TableHeaderCell>
                  <TableHeaderCell>{isEs ? "Fechas" : "Dates"}</TableHeaderCell>
                  <TableHeaderCell>
                    {isEs ? "Tratamientos" : "Treatments"}
                  </TableHeaderCell>
                  <TableHeaderCell>
                    {isEs ? "Centro receptor" : "Receiving facility"}
                  </TableHeaderCell>
                  <TableHeaderCell>
                    {isEs ? "Estado" : "Status"}
                  </TableHeaderCell>
                  <TableHeaderCell className="text-right">
                    <span className="sr-only">
                      {isEs ? "Acciones" : "Actions"}
                    </span>
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
                          ? isEs
                            ? "Nada abierto: todas las solicitudes actuales ya se atendieron."
                            : "Nothing open — every current request has been dealt with."
                          : isEs
                            ? "Ninguna solicitud coincide con estos filtros."
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
        </TabPanel>

        <p className="flex items-center gap-inline-sm border-t border-line px-(--table-edge) py-inset-sm text-caption text-fg-muted">
          <Building2 aria-hidden="true" className="h-4 w-4 shrink-0" />
          {isEs
            ? "Todo lo que guarde aparece en el viaje del paciente."
            : "Everything you save appears on the patient\u2019s trip."}
        </p>
      </Card>

      {managingId && managingError ? (
        <Alert
          tone="danger"
          title={errorTitleFor(
            managingError,
            isEs ? "Esta solicitud no se cargó" : "This request did not load",
            isEs ? "es" : "en",
          )}
          onDismiss={() => setManagingId(null)}
        >
          {errorMessageFor(
            managingError,
            isEs
              ? "Es posible que se haya cerrado o que el paciente ya no esté vinculado a su consultorio."
              : "It may have been closed, or the patient is no longer linked to your office.",
            isEs ? "es" : "en",
          )}
        </Alert>
      ) : null}

      {managing && managing.id === managingId ? (
        <ManageModal
          key={managing.id}
          trip={managing}
          onClose={() => setManagingId(null)}
          onResolveTimeChange={(reply) => resolveTimeChange(managing, reply)}
          onSave={({ status, placement, note }) => {
            /* Only what changed, placement then message then status. */
            saveArrangement(managing, {
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
