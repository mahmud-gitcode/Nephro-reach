"use client";

import { LogMediaBar, appendText } from "@/features/personal-log/LogMediaBar";
import React, { useEffect, useState } from "react";
import {
  Calendar,
  CalendarPlus,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  Modal,
  SegmentedChoice,
  Select,
  Skeleton,
  Textarea,
} from "@/components/ui";
import {
  appointmentError,
  awaitingAnswer,
  REMINDER_LEADS,
  directionsUrl,
  icsFor,
  past,
  timeRange,
  upcoming,
  type Appointment,
  type AppointmentDraft,
  type AppointmentError,
  type Attendance,
} from "@/features/personal-log/appointments/appointments";
import { useAppointments } from "@/features/personal-log/appointments/useAppointments";
import { useVascularAccess } from "@/features/vascular-access/useVascularAccess";
import {
  TEAM_LABEL,
  recordForMember,
} from "@/features/vascular-access/vascularAccess.data";
import { useMemberName } from "@/features/auth/useMemberName";
import { useNow } from "@/lib/utils/useNow";

/* ==========================================================================
   Appointments
   --------------------------------------------------------------------------
   The member's own list, stored (useAppointments): what is coming up, the
   next one with directions, the details of any one, and the full list with
   past visits.
   ========================================================================== */

function dateParts(iso: string, isEs: boolean) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const locale = isEs ? "es-US" : "en-US";
  const cap = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1).replace(".", "");
  return {
    month: cap(date.toLocaleDateString(locale, { month: "short" })),
    day: String(d),
    weekday: cap(date.toLocaleDateString(locale, { weekday: "short" })),
    long: date.toLocaleDateString(locale, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };
}

function DateBadge({ iso, isEs }: { iso: string; isEs: boolean }) {
  const parts = dateParts(iso, isEs);
  return (
    <div className="flex w-[78px] shrink-0 flex-col items-center gap-stack-sm rounded-card border border-line bg-surface-sunken px-inset-md py-inset-md text-center text-fg-secondary">
      <p className="text-overline">{parts.month}</p>
      <p className="text-metric-md text-fg">{parts.day}</p>
      <p className="text-label-md">{parts.weekday}</p>
    </div>
  );
}

function IconText({
  icon,
  children,
  primary,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <div className="flex items-center gap-inline-md text-body-md">
      <span
        aria-hidden="true"
        className="text-fg-muted [&_svg]:h-icon-small [&_svg]:w-icon-small"
      >
        {icon}
      </span>
      <span className={primary ? "text-fg-brand" : "text-fg"}>{children}</span>
    </div>
  );
}

function AppointmentRow({
  appointment,
  isEs,
  onOpen,
}: {
  appointment: Appointment;
  isEs: boolean;
  onOpen: () => void;
}) {
  const { t } = useLanguage();
  return (
    <article className="flex flex-col gap-inline-lg border-b border-line-subtle bg-surface p-inset-sm last:border-b-0 sm:flex-row sm:items-center">
      <DateBadge iso={appointment.date} isEs={isEs} />
      <div className="min-w-0 flex-1">
        <h3 className="flex flex-wrap items-center gap-inline-md text-heading-4 text-fg">
          {appointment.title}
          {appointment.attendance ? (
            <Badge
              tone={appointment.attendance === "missed" ? "warning" : "success"}
            >
              {appointment.attendance === "missed"
                ? isEs
                  ? "Perdida"
                  : "Missed"
                : isEs
                  ? "Asistió"
                  : "Attended"}
            </Badge>
          ) : null}
        </h3>
        <p className="mt-0.5 text-body-md text-fg-muted">
          {appointment.doctor}
        </p>
        <div className="mt-stack-md space-y-stack-xs">
          <IconText icon={<Clock3 />}>{timeRange(appointment)}</IconText>
          {appointment.location ? (
            <IconText icon={<MapPin />} primary>
              {appointment.location}
            </IconText>
          ) : null}
        </div>
      </div>
      <Button
        iconOnly
        size="small"
        variant="neutral"
        appearance="stroke"
        onClick={onOpen}
        aria-label={t("appointments.openDetails").replace(
          "{title}",
          appointment.title,
        )}
      >
        <ChevronRight />
      </Button>
    </article>
  );
}

function DetailsModal({
  appointment,
  isEs,
  isPast,
  onAttendance,
  onDelete,
  onClose,
}: {
  appointment: Appointment;
  isEs: boolean;
  /** The day has gone by, so "did you go?" can be answered. */
  isPast: boolean;
  onAttendance: (attendance: Attendance) => void;
  /** Absent for an appointment that belongs to another record. */
  onDelete?: () => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [confirming, setConfirming] = useState(false);
  return (
    <Modal
      open
      onClose={onClose}
      size="big"
      title={appointment.title}
      description={dateParts(appointment.date, isEs).long}
      footer={
        confirming ? (
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setConfirming(false)}
            >
              {t("appointments.cancel")}
            </Button>
            <Button variant="danger" onClick={onDelete}>
              {isEs ? "Sí, eliminar" : "Yes, delete"}
            </Button>
          </>
        ) : (
          <>
            {onDelete ? (
              <Button
                variant="danger"
                appearance="fill-stroke"
                className="mr-auto"
                leadingIcon={<Trash2 />}
                onClick={() => setConfirming(true)}
              >
                {isEs ? "Eliminar" : "Delete"}
              </Button>
            ) : (
              <p className="mr-auto text-caption text-fg-muted">
                {isEs
                  ? "De su registro de Acceso Vascular."
                  : "From your Vascular Access record."}
              </p>
            )}
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={onClose}
            >
              {t("appointments.close")}
            </Button>
            {!isPast ? (
              <Button
                variant="neutral"
                appearance="fill-stroke"
                leadingIcon={<CalendarPlus />}
                onClick={() => addToCalendar(appointment)}
              >
                {isEs ? "Agregar al Calendario" : "Add to Calendar"}
              </Button>
            ) : null}
            {appointment.location || appointment.address ? (
              <Button
                onClick={() =>
                  window.open(directionsUrl(appointment), "_blank", "noopener")
                }
              >
                {t("appointments.getDirections")}
              </Button>
            ) : null}
          </>
        )
      }
    >
      <div className="space-y-stack-md">
        {confirming ? (
          <Alert tone="warning">
            {isEs
              ? "¿Eliminar esta cita? No se puede deshacer."
              : "Delete this appointment? This cannot be undone."}
          </Alert>
        ) : null}
        {isPast ? (
          <SegmentedChoice<Attendance | null>
            label={
              isEs ? "¿Fue a esta cita?" : "Did you go to this appointment?"
            }
            value={appointment.attendance ?? null}
            onChange={(next) => {
              if (next) onAttendance(next);
            }}
            options={[
              { value: "attended", label: isEs ? "Sí, fui" : "Yes, I went" },
              {
                value: "missed",
                label: isEs ? "No, la perdí" : "No, I missed it",
              },
            ]}
          />
        ) : null}
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-inline-lg gap-y-stack-sm text-body-md">
          <dt className="text-fg-muted">{t("appointments.doctorLabel")}</dt>
          <dd className="text-fg">{appointment.doctor}</dd>
          <dt className="text-fg-muted">{t("appointments.timeLabel")}</dt>
          <dd className="text-fg">{timeRange(appointment)}</dd>
          {appointment.location ? (
            <>
              <dt className="text-fg-muted">
                {t("appointments.locationLabel")}
              </dt>
              <dd className="text-fg">{appointment.location}</dd>
            </>
          ) : null}
          {appointment.address ? (
            <>
              <dt className="text-fg-muted">
                {isEs ? "Dirección" : "Address"}
              </dt>
              <dd className="text-fg">{appointment.address}</dd>
            </>
          ) : null}
          {appointment.notes ? (
            <>
              <dt className="text-fg-muted">{isEs ? "Notas" : "Notes"}</dt>
              <dd className="whitespace-pre-wrap text-fg">
                {appointment.notes}
              </dd>
            </>
          ) : null}
        </dl>
      </div>
    </Modal>
  );
}

function NextAppointment({
  next,
  isEs,
}: {
  next: Appointment | undefined;
  isEs: boolean;
}) {
  const { t } = useLanguage();
  return (
    <Card as="section" padding="small" className="h-full">
      <h2 className="px-inset-xs pt-inset-xs text-heading-4 text-fg">
        {t("appointments.nextTitle")}
      </h2>
      {!next ? (
        <EmptyState
          variant="bare"
          icon={<Calendar />}
          title={isEs ? "Nada programado" : "Nothing scheduled"}
        />
      ) : (
        <Card padding="small" className="mt-stack-lg">
          <div className="flex items-start gap-inline-lg">
            <DateBadge iso={next.date} isEs={isEs} />
            <div className="min-w-0">
              <h3 className="text-heading-4 text-fg">{next.title}</h3>
              <p className="mt-0.5 text-body-md text-fg-muted">{next.doctor}</p>
              <div className="mt-stack-md space-y-stack-xs">
                <IconText icon={<Clock3 />}>{timeRange(next)}</IconText>
                {next.location ? (
                  <IconText icon={<MapPin />} primary>
                    {next.location}
                  </IconText>
                ) : null}
              </div>
            </div>
          </div>
          {next.address ? (
            <p className="mt-stack-md text-body-md text-fg-secondary">
              {next.address}
            </p>
          ) : null}
          {next.location || next.address ? (
            <Button
              fullWidth
              className="mt-stack-lg"
              onClick={() =>
                window.open(directionsUrl(next), "_blank", "noopener")
              }
            >
              {t("appointments.getDirections")}
            </Button>
          ) : null}
        </Card>
      )}
    </Card>
  );
}

const EMPTY: AppointmentDraft = {
  date: "",
  start: "",
  end: "",
  title: "",
  doctor: "",
  location: "",
  address: "",
  notes: "",
  reminder: "1d",
};

/** Downloads the appointment as a calendar file; the phone's calendar
 *  opens it and keeps the reminder (client, 2026-10-05). */
function addToCalendar(appointment: Appointment) {
  const url = URL.createObjectURL(
    new Blob([icsFor(appointment, Date.now())], { type: "text/calendar" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${appointment.title.replace(/[^\w-]+/g, "-") || "appointment"}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AppointmentsPage() {
  const { t, language } = useLanguage();
  const isEs = language === "ES";
  const store = useAppointments();
  const access = useVascularAccess();
  const memberName = useMemberName();
  const accessRecord = recordForMember(access.state, memberName);
  /* The access center's bookings for this member, as appointments. */
  const { syncExternal } = store;
  useEffect(() => {
    if (!accessRecord) return;
    syncExternal(
      accessRecord.appointments
        .filter((a) => !a.completed)
        .map((a) => ({
          id: `va-${a.id}`,
          date: a.date,
          start: a.time,
          end: "",
          title: a.title,
          doctor: TEAM_LABEL[a.team],
          location: a.place,
          address: "",
          notes: "",
          source: "vascular-access" as const,
        })),
    );
  }, [accessRecord, syncExternal]);
  const now = new Date(useNow());
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const ahead = upcoming(store.appointments, today);
  const before = past(store.appointments, today);
  /* The one past visit still waiting for "did you go?" — asked here rather
     than left in a details dialog nobody opens. The answer (or the lack of
     one) reaches the care team's CCM dashboard. */
  const unanswered = awaitingAnswer(store.appointments, today)[0];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<AppointmentDraft>(EMPTY);
  const [tried, setTried] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const opened = store.appointments.find((a) => a.id === openId) ?? null;
  const error = appointmentError(draft);
  const set = (key: keyof AppointmentDraft, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const show = (field: AppointmentError) =>
    tried && error === field
      ? isEs
        ? "Revisa este campo"
        : field === "end"
          ? "The end time should be after the start"
          : "This is needed"
      : undefined;

  function save(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    if (error) return;
    store.add(draft);
    setIsModalOpen(false);
    setDraft(EMPTY);
    setTried(false);
  }

  const shown = showAll ? ahead : ahead.slice(0, 3);

  return (
    <div className="space-y-stack-2xl">
      <PersonalLogDisclaimer />

      <header className="flex flex-col gap-inline-lg sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-heading-1 text-fg">{t("appointments.title")}</h1>
        <Button onClick={() => setIsModalOpen(true)} leadingIcon={<Plus />}>
          {t("appointments.addAppointment")}
        </Button>
      </header>

      {unanswered ? (
        <Alert
          tone="info"
          title={
            isEs
              ? `¿Fue a su cita de ${unanswered.title}?`
              : `Did you make it to your ${unanswered.title} appointment?`
          }
        >
          <p>
            {dateParts(unanswered.date, isEs).long} · {unanswered.doctor}.{" "}
            {isEs
              ? "Su equipo de atención lo verá."
              : "Your care team will see your answer."}
          </p>
          <div className="mt-stack-sm flex flex-wrap gap-inline-md">
            <Button
              size="small"
              onClick={() => store.setAttendance(unanswered.id, "attended")}
            >
              {isEs ? "Sí, fui" : "Yes, I went"}
            </Button>
            <Button
              size="small"
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => store.setAttendance(unanswered.id, "missed")}
            >
              {isEs ? "No, la perdí" : "No, I missed it"}
            </Button>
          </div>
        </Alert>
      ) : null}

      {store.error ? (
        <ErrorState
          title={
            isEs
              ? "No se pudieron cargar tus citas"
              : "Your appointments could not be loaded"
          }
          error={store.error}
          onRetry={store.refetch}
        />
      ) : store.isPending ? (
        <Skeleton height={420} className="rounded-card" />
      ) : (
        <section className="grid grid-cols-1 gap-inline-lg lg:grid-cols-[minmax(0,1fr)_minmax(360px,447px)]">
          <Card as="section" padding="small">
            <h2 className="px-inset-xs pt-inset-xs text-heading-4 text-fg">
              {t("appointments.upcomingTitle")}
            </h2>
            {ahead.length === 0 ? (
              <EmptyState
                variant="bare"
                icon={<Calendar />}
                title={
                  isEs ? "No hay citas próximas" : "No upcoming appointments"
                }
                description={
                  isEs
                    ? "Agrega una para recibir un recordatorio."
                    : "Add one to be reminded of it."
                }
              />
            ) : (
              <Card padding="none" className="mt-stack-lg overflow-hidden">
                {shown.map((appointment) => (
                  <AppointmentRow
                    key={appointment.id}
                    appointment={appointment}
                    isEs={isEs}
                    onOpen={() => setOpenId(appointment.id)}
                  />
                ))}
              </Card>
            )}

            {showAll && before.length > 0 ? (
              <>
                <h3 className="mt-stack-xl px-inset-xs text-heading-5 text-fg">
                  {isEs ? "Citas pasadas" : "Past Appointments"}
                </h3>
                <Card padding="none" className="mt-stack-md overflow-hidden">
                  {before.map((appointment) => (
                    <AppointmentRow
                      key={appointment.id}
                      appointment={appointment}
                      isEs={isEs}
                      onOpen={() => setOpenId(appointment.id)}
                    />
                  ))}
                </Card>
              </>
            ) : null}

            {ahead.length > 3 || before.length > 0 ? (
              <div className="mt-stack-md">
                <Button
                  variant="primary"
                  appearance="stroke"
                  fullWidth
                  aria-expanded={showAll}
                  onClick={() => setShowAll((v) => !v)}
                >
                  {showAll
                    ? isEs
                      ? "Mostrar menos"
                      : "Show Less"
                    : t("appointments.viewAll")}
                </Button>
              </div>
            ) : null}
          </Card>
          <NextAppointment next={ahead[0]} isEs={isEs} />
        </section>
      )}

      {opened ? (
        <DetailsModal
          key={opened.id}
          appointment={opened}
          isEs={isEs}
          isPast={opened.date < today}
          onAttendance={(attendance) =>
            store.setAttendance(opened.id, attendance)
          }
          onClose={() => setOpenId(null)}
          onDelete={
            opened.source
              ? undefined
              : () => {
                  store.remove(opened.id);
                  setOpenId(null);
                }
          }
        />
      ) : null}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <span className="flex items-center gap-inline-md">
            <Calendar
              aria-hidden="true"
              className="h-icon-big w-icon-big text-fg-brand"
            />
            {t("appointments.modalTitle")}
          </span>
        }
        footer={
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setIsModalOpen(false)}
            >
              {t("appointments.cancel")}
            </Button>
            <Button type="submit" form="appointment-form">
              {t("appointments.save")}
            </Button>
          </>
        }
      >
        <form
          id="appointment-form"
          onSubmit={save}
          noValidate
          className="space-y-stack-lg"
        >
          <FormField
            label={t("appointments.specialtyLabel")}
            required
            error={show("title")}
          >
            {(props) => (
              <Input
                {...props}
                value={draft.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder={t("appointments.specialtyPlaceholder")}
              />
            )}
          </FormField>
          <FormField
            label={t("appointments.doctorLabel")}
            required
            error={show("doctor")}
          >
            {(props) => (
              <Input
                {...props}
                value={draft.doctor}
                onChange={(e) => set("doctor", e.target.value)}
                placeholder={t("appointments.doctorPlaceholder")}
              />
            )}
          </FormField>
          <div className="grid grid-cols-1 gap-stack-lg sm:grid-cols-3">
            <FormField
              label={t("appointments.dateLabel")}
              required
              error={show("date")}
            >
              {(props) => (
                <Input
                  {...props}
                  type="date"
                  value={draft.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              )}
            </FormField>
            <FormField
              label={isEs ? "Empieza" : "Starts"}
              required
              error={show("start")}
            >
              {(props) => (
                <Input
                  {...props}
                  type="time"
                  value={draft.start}
                  onChange={(e) => set("start", e.target.value)}
                />
              )}
            </FormField>
            <FormField label={isEs ? "Termina" : "Ends"} error={show("end")}>
              {(props) => (
                <Input
                  {...props}
                  type="time"
                  value={draft.end}
                  onChange={(e) => set("end", e.target.value)}
                />
              )}
            </FormField>
          </div>
          <FormField label={t("appointments.locationLabel")}>
            {(props) => (
              <Input
                {...props}
                value={draft.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder={t("appointments.locationPlaceholder")}
              />
            )}
          </FormField>
          <FormField label={isEs ? "Dirección" : "Address"}>
            {(props) => (
              <Input
                {...props}
                value={draft.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder={isEs ? "Para indicaciones" : "For directions"}
              />
            )}
          </FormField>
          <FormField label={isEs ? "Notas" : "Notes"}>
            {(props) => (
              <Textarea
                {...props}
                rows={3}
                maxLength={500}
                value={draft.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            )}
          </FormField>
          <LogMediaBar
            logName="Appointment"
            isEs={isEs}
            onDictated={(text) =>
              setDraft((d) => ({ ...d, notes: appendText(d.notes, text) }))
            }
          />
          <FormField
            label={isEs ? "Recordatorio" : "Reminder"}
            hint={
              isEs
                ? "Le avisamos aquí. Para un aviso en su teléfono, abra la cita y elija Agregar al Calendario."
                : "We remind you here. For a reminder on your phone, open the appointment and choose Add to Calendar."
            }
          >
            {(props) => (
              <Select
                {...props}
                value={draft.reminder ?? "none"}
                onChange={(e) => set("reminder", e.target.value)}
              >
                {REMINDER_LEADS.map((lead) => (
                  <option key={lead.value} value={lead.value}>
                    {isEs ? lead.es : lead.en}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
