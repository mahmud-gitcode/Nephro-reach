"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  MessageSquareText,
  Plane,
  Video,
} from "lucide-react";
import {
  Badge,
  buttonStyles,
  Card,
  EmptyState,
  KeyCard,
  LineChart,
  ProgressRing,
  Skeleton,
} from "@/components/ui";
import {
  ActivitySolid,
  ClipboardCheckSolid,
  ClockSolid,
  UserCheckSolid,
} from "@/components/icons/solid";
import { PageTitle } from "@/components/layout/PageTitle";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useMemberName } from "@/features/auth/useMemberName";
import { useNow } from "@/lib/utils/useNow";
import { QuickActionsSection } from "./QuickActionsSection";
import { useMemberAttention } from "./useMemberAttention";
import { StoriesCard } from "./StoriesCard";
import { useDialysisSchedule } from "@/features/personal-log/dialysis/useDialysisSchedule";
import { useDialysisModality } from "@/features/personal-log/dialysis/useDialysisModality";
import {
  ALL_WEEKDAYS,
  DEFAULT_CHAIR_TIME,
  fromDateKey,
  makeIsTreatmentDay,
  nextScheduledDate,
  toDateKey,
} from "@/features/personal-log/dialysis/schedule";
import { clock12 } from "@/features/personal-log/dialysis/treatmentLog";
import { useMedications } from "@/features/medications/useMedications";
import { useReminders } from "@/features/medications/useReminders";
import { useMedicationLog } from "@/features/medications/useMedicationLog";
import { doseRows } from "@/features/medications/medicationList";
import { useNutritionLog } from "@/features/personal-log/nutrition/useNutritionLog";
import {
  formatFluid,
  useFluidUnit,
} from "@/features/personal-log/nutrition/fluidUnit";
import { useAppointments } from "@/features/personal-log/appointments/useAppointments";
import {
  timeRange,
  upcoming,
} from "@/features/personal-log/appointments/appointments";
import { useBloodPressure } from "@/features/personal-log/blood-pressure/useBloodPressure";
import {
  categoryOf,
  sortReadings,
  statusOf,
  trend,
} from "@/features/personal-log/blood-pressure/bloodPressure";
import { useClassroom } from "@/features/education/classroom";
import { useJourneyProgress } from "@/features/education/useJourneyProgress";
import { useLiveClasses } from "@/features/clinic/useLiveClasses";
import { useMessages } from "@/features/messaging/useMessages";
import * as messagingRules from "@/features/messaging/messaging.rules";
import { useMemberClinicLabs } from "@/features/labs/useMemberClinicLabs";
import { useTrips } from "@/features/travel/useTrips";
import { tripPhase } from "@/features/travel/trip.rules";
import { useVascularAccess } from "@/features/vascular-access/useVascularAccess";
import {
  openConcerns,
  recordForMember,
} from "@/features/vascular-access/vascularAccess.data";

/* ==========================================================================
   Dashboard 2 — the member's day on one screen
   --------------------------------------------------------------------------
   A second dashboard beside the first (2026-10-12), so the redesign can be
   judged before it replaces anything. Built after the client's review of
   the first one: no repeated curriculum card, no counts that go nowhere,
   nothing about other members — and every figure read from what the
   member has actually logged, never a fixed number.

   Layout, after the showcase: today's four facts in a row, then the rows
   split two-thirds / one-third, with the shortcuts last.
   ========================================================================== */

const HREF = "/dashboard/dashboard-2";

function shortDate(iso: string, isEs: boolean): string {
  return fromDateKey(iso).toLocaleDateString(isEs ? "es-ES" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** "Oct 15": short enough for a half-width card's figure. */
function monthDay(iso: string, isEs: boolean): string {
  return fromDateKey(iso).toLocaleDateString(isEs ? "es-ES" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

function weekdayOf(iso: string, isEs: boolean): string {
  return fromDateKey(iso).toLocaleDateString(isEs ? "es-ES" : "en-US", {
    weekday: "long",
  });
}

function greetingFor(hour: number, isEs: boolean): string {
  if (hour < 12) return isEs ? "Buenos días" : "Good morning";
  if (hour < 18) return isEs ? "Buenas tardes" : "Good afternoon";
  return isEs ? "Buenas noches" : "Good evening";
}

/** A card title with an optional link on the right. */
function CardTitle({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-inline-md">
      <h2 className="text-heading-4 text-fg">{title}</h2>
      {href && linkLabel ? (
        <Link
          href={href}
          className="-my-2.5 inline-flex min-h-11 shrink-0 items-center gap-inline-xs text-label-md text-fg-brand hover:underline"
        >
          {linkLabel}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}

export default function UserDashboard2() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const { user } = useAuth();
  const memberName = useMemberName();
  const now = new Date(useNow());
  const today = toDateKey(now);

  /* ---------------------------------------------------- today's four facts */
  const modality = useDialysisModality();
  const isPd = modality.modality === "pd";
  const schedule = useDialysisSchedule();
  const isTreatmentDay = makeIsTreatmentDay(schedule.periods);
  const todayDate = fromDateKey(today);
  const nextSession = isTreatmentDay(todayDate)
    ? todayDate
    : nextScheduledDate(todayDate, isTreatmentDay);
  const nextKey = toDateKey(nextSession);
  const weekday = ALL_WEEKDAYS[nextSession.getDay()];
  const period =
    [...schedule.periods].reverse().find((p) => p.fromKey <= nextKey) ??
    schedule.periods[0];
  const chairTime = period?.chairTimes[weekday] ?? DEFAULT_CHAIR_TIME;
  const dialysisToday = !isPd && nextKey === today;
  const pdToday = isPd ? modality.exchangesOn(today).length : 0;

  const meds = useMedications();
  const { reminders } = useReminders();
  const doseLog = useMedicationLog();
  const doses = doseRows(meds.medications, reminders);
  const dosesDone = doses.filter((d) => {
    const status = doseLog.statusOf(today, d.medication, d.time);
    return status === "taken" || status === "late";
  }).length;

  const nutrition = useNutritionLog(today);
  const { unit } = useFluidUnit();

  const appointments = useAppointments();
  const nextAppointment = upcoming(appointments.appointments, today)[0];

  /* ------------------------------------------------------------ the rest */
  const attention = useMemberAttention();
  const bp = useBloodPressure();
  const latestBp = sortReadings(bp.readings)[0];
  const bpPoints = trend(bp.readings);

  const classroom = useClassroom();
  const journey = useJourneyProgress(classroom.lessons);
  const live = useLiveClasses();
  const nextClass = live.upcoming[0];
  const recordingCount = live.past.filter(
    (c) => live.recordings[c.title],
  ).length;

  const { conversations } = useMessages();
  const threads = messagingRules.memberConversations(conversations, memberName);
  const unread = messagingRules.totalUnread(threads);
  const latestFromTeam = threads
    .flatMap((thread) =>
      thread.messages
        .filter((m) => m.author === "clinic" && !m.automated)
        .map((m) => ({ thread, message: m })),
    )
    .sort((a, b) => b.message.sentAt.localeCompare(a.message.sentAt))[0];

  const clinicLabs = useMemberClinicLabs();
  const labValues = Object.values(clinicLabs.latest);
  const labsFlagged = labValues.filter((v) => v.flag).length;
  const labDate = labValues.reduce(
    (latest, v) => (v.date > latest ? v.date : latest),
    "",
  );

  const trips = useTrips();
  const activeTrip = trips.openTrips.find(
    (t) => tripPhase(t, today) !== "home" && !t.cancelRequestedAt,
  );
  const access = useVascularAccess();
  const accessRecord = recordForMember(access.state, memberName);
  const accessConcerns = accessRecord ? openConcerns(accessRecord).length : 0;

  const firstName = user?.name.split(" ")[0] ?? "";

  /* One primary action: chart today's treatment on a dialysis day, log a
     blood pressure reading otherwise. */
  const primary = dialysisToday
    ? {
        href: `/dashboard/personal-log/dialysis-treatment/add?date=${today}`,
        label: isEs
          ? "Registrar el tratamiento de hoy"
          : "Chart today's treatment",
      }
    : {
        href: "/dashboard/personal-log/blood-pressure/add",
        label: isEs ? "Registrar presión arterial" : "Log blood pressure",
      };

  return (
    <div className="space-y-stack-xl">
      <PageTitle
        href={HREF}
        title={`${greetingFor(now.getHours(), isEs)}${firstName ? `, ${firstName}` : ""}`}
        action={
          <div className="flex flex-wrap items-center gap-inline-md">
            <span className="text-body-sm text-fg-muted">
              {now.toLocaleDateString(isEs ? "es-ES" : "en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
            <Link href={primary.href} className={buttonStyles()}>
              {primary.label}
            </Link>
          </div>
        }
      />

      {/* Today, in four facts. Each opens the page it comes from. */}
      <section
        aria-label={isEs ? "Hoy" : "Today"}
        className="grid grid-cols-2 gap-inset-sm sm:gap-inset-md xl:grid-cols-4"
      >
        <Link
          href="/dashboard/personal-log/dialysis-management"
          className="block rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {isPd ? (
            <KeyCard
              icon={<ClockSolid />}
              tone="brand"
              value={pdToday}
              label={isEs ? "Intercambios de DP hoy" : "PD exchanges today"}
              note={
                isEs
                  ? "Registrados en Tratamiento"
                  : "Logged on Dialysis Treatment"
              }
            />
          ) : (
            <KeyCard
              icon={<ClockSolid />}
              tone="brand"
              value={
                nextKey === today
                  ? isEs
                    ? "Hoy"
                    : "Today"
                  : monthDay(nextKey, isEs)
              }
              label={
                isEs ? "Próxima sesión de diálisis" : "Next dialysis session"
              }
              note={`${nextKey === today ? "" : `${weekdayOf(nextKey, isEs)} · `}${isEs ? "Sillón" : "Chair"} ${clock12(chairTime)}`}
            />
          )}
        </Link>
        <Link
          href="/dashboard/personal-log/medications"
          className="block rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <KeyCard
            icon={<ClipboardCheckSolid />}
            tone={
              doses.length > 0 && dosesDone === doses.length
                ? "success"
                : "warning"
            }
            value={doses.length === 0 ? "—" : `${dosesDone} / ${doses.length}`}
            label={isEs ? "Medicamentos de hoy" : "Medicines today"}
            note={
              doses.length === 0
                ? isEs
                  ? "Sin recordatorios de dosis"
                  : "No dose reminders set"
                : isEs
                  ? "dosis tomadas"
                  : "doses taken"
            }
          />
        </Link>
        <Link
          href="/dashboard/personal-log/nutrition"
          className="block rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <KeyCard
            icon={<ActivitySolid />}
            tone={
              nutrition.goals.fluid > 0 &&
              nutrition.fluidMl > nutrition.goals.fluid
                ? "danger"
                : "accent"
            }
            value={formatFluid(nutrition.fluidMl, unit)}
            label={isEs ? "Líquidos hoy" : "Fluids today"}
            note={`${isEs ? "de" : "of"} ${formatFluid(nutrition.goals.fluid, unit)}`}
          />
        </Link>
        <Link
          href="/dashboard/personal-log/appointments"
          className="block rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <KeyCard
            icon={<UserCheckSolid />}
            tone="neutral"
            value={nextAppointment ? monthDay(nextAppointment.date, isEs) : "—"}
            label={isEs ? "Próxima cita" : "Next appointment"}
            note={
              nextAppointment
                ? `${weekdayOf(nextAppointment.date, isEs)} · ${timeRange(nextAppointment)} · ${nextAppointment.doctor}`
                : isEs
                  ? "Nada programado"
                  : "Nothing scheduled"
            }
          />
        </Link>
      </section>

      {/* Row: what needs doing (two-thirds), blood pressure (one-third). */}
      <section className="grid grid-cols-1 gap-inset-md xl:grid-cols-3">
        <Card as="section" className="space-y-stack-md xl:col-span-2">
          <CardTitle
            title={isEs ? "Necesita su atención" : "Needs your attention"}
          />
          {attention.isPending ? (
            <Skeleton height={160} />
          ) : attention.items.length === 0 ? (
            <EmptyState
              variant="bare"
              icon={<CheckCircle2 />}
              title={isEs ? "Está al día" : "You're all caught up"}
              description={
                isEs
                  ? "Nada pendiente por ahora."
                  : "Nothing waiting on you right now."
              }
            />
          ) : (
            <ul className="divide-y divide-line-subtle rounded-card-nested border border-line-subtle">
              {attention.items.slice(0, 6).map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-inline-md px-inset-md py-inset-sm"
                >
                  <BellRing
                    aria-hidden="true"
                    className={`size-4 shrink-0 ${
                      item.tone === "danger"
                        ? "text-danger"
                        : item.tone === "warning"
                          ? "text-warning-glyph"
                          : "text-fg-brand"
                    }`}
                  />
                  <span className="min-w-0 flex-1 text-body-md text-fg">
                    {isEs ? item.es : item.en}
                  </span>
                  <Link
                    href={item.href}
                    className={buttonStyles({
                      size: "small",
                      variant: "neutral",
                      appearance: "fill-stroke",
                    })}
                  >
                    {isEs ? item.ctaEs : item.ctaEn}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {attention.items.length > 6 ? (
            <p className="text-caption text-fg-muted">
              {isEs
                ? `Y ${attention.items.length - 6} más en Notificaciones.`
                : `And ${attention.items.length - 6} more in Notifications.`}
            </p>
          ) : null}
        </Card>

        <Card as="section" className="space-y-stack-md">
          <CardTitle
            title={isEs ? "Presión arterial" : "Blood pressure"}
            href="/dashboard/personal-log/blood-pressure"
            linkLabel={isEs ? "Abrir" : "Open"}
          />
          {latestBp ? (
            <>
              <div className="flex flex-wrap items-baseline gap-inline-md">
                <span className="text-metric-md text-fg tabular-nums">
                  {latestBp.systolic}/{latestBp.diastolic}
                </span>
                <span className="text-body-sm text-fg-muted">mmHg</span>
                <Badge tone={categoryOf(statusOf(latestBp)).tone}>
                  {statusOf(latestBp)}
                </Badge>
              </div>
              <p className="text-caption text-fg-muted">
                {shortDate(latestBp.date, isEs)} · {clock12(latestBp.time)} ·{" "}
                {isEs ? "pulso" : "pulse"} {latestBp.pulse}
              </p>
              {bpPoints.length >= 2 ? (
                <LineChart
                  label={isEs ? "Tendencia de presión" : "Blood pressure trend"}
                  unit="mmHg"
                  yMin={60}
                  yMax={180}
                  yTicks={3}
                  height={120}
                  xLabels={bpPoints.map((p) => {
                    const [, m, d] = p.date.split("-").map(Number);
                    return `${m}/${d}`;
                  })}
                  series={[
                    {
                      id: "sys",
                      label: isEs ? "Sistólica" : "Systolic",
                      tone: "accent",
                      points: bpPoints.map((p) => p.systolic),
                    },
                    {
                      id: "dia",
                      label: isEs ? "Diastólica" : "Diastolic",
                      tone: "danger",
                      points: bpPoints.map((p) => p.diastolic),
                    },
                  ]}
                />
              ) : null}
            </>
          ) : (
            <EmptyState
              variant="bare"
              title={isEs ? "Sin lecturas todavía" : "No readings yet"}
            />
          )}
        </Card>
      </section>

      {/* Row: learning (two-thirds), next live class (one-third). */}
      <section className="grid grid-cols-1 gap-inset-md xl:grid-cols-3">
        <Card as="section" className="space-y-stack-md xl:col-span-2">
          <CardTitle
            title={isEs ? "Mi aprendizaje" : "My learning"}
            href="/dashboard/my-classroom"
            linkLabel={isEs ? "Mi clase" : "My Classroom"}
          />
          {classroom.isPending || journey.isPending ? (
            <Skeleton height={140} />
          ) : (
            <div className="flex flex-col gap-inline-lg sm:flex-row sm:items-center">
              <ProgressRing
                size={112}
                value={journey.overallPercent}
                label={isEs ? "Progreso del curso" : "Course progress"}
                centerValue={`${journey.overallPercent}%`}
              />
              <div className="min-w-0 flex-1 space-y-stack-sm">
                <p className="text-label-lg text-fg">
                  {isEs
                    ? `${journey.completedCount} de ${classroom.lessons.length} lecciones completadas`
                    : `${journey.completedCount} of ${classroom.lessons.length} lessons complete`}
                </p>
                {journey.nextDay ? (
                  <>
                    <p className="text-body-sm text-fg-muted">
                      {isEs ? "Siguiente:" : "Next up:"}{" "}
                      <span className="text-fg">
                        {isEs
                          ? journey.nextDay.titleEs
                          : journey.nextDay.titleEn}
                      </span>
                    </p>
                    <Link
                      href={`/dashboard/my-classroom/${journey.nextDay.slug}`}
                      className={buttonStyles({ size: "small" })}
                    >
                      {journey.hasStarted
                        ? isEs
                          ? "Continuar"
                          : "Continue"
                        : isEs
                          ? "Empezar"
                          : "Start"}
                    </Link>
                  </>
                ) : (
                  <p className="text-body-sm text-success">
                    {isEs
                      ? "¡Terminó todas las lecciones!"
                      : "You have finished every lesson!"}
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>

        <Card as="section" className="space-y-stack-md">
          <CardTitle
            title={isEs ? "Próxima clase en vivo" : "Next live class"}
          />
          {nextClass ? (
            <div className="space-y-stack-sm">
              <p className="text-label-lg text-fg">{nextClass.topic}</p>
              <p className="text-body-sm text-fg-muted">
                {shortDate(nextClass.date, isEs)} · {clock12(nextClass.time)}
              </p>
              {nextClass.joinUrl ? (
                <a
                  href={nextClass.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonStyles({ size: "small" })}
                >
                  <Video aria-hidden="true" />
                  {isEs ? "Unirse" : "Join class"}
                </a>
              ) : (
                <p className="text-caption text-fg-muted">
                  {isEs
                    ? "El enlace aparece aquí cuando se agrega."
                    : "The join link appears here once it is added."}
                </p>
              )}
            </div>
          ) : (
            <p className="text-body-sm text-fg-muted">
              {isEs
                ? "La próxima clase aparecerá aquí."
                : "The next class will be posted here."}
            </p>
          )}
          {recordingCount > 0 ? (
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center text-label-md text-fg-brand hover:underline"
            >
              {isEs
                ? `Ver clases pasadas (${recordingCount})`
                : `Watch past classes (${recordingCount})`}
            </Link>
          ) : null}
        </Card>
      </section>

      {/* Row: messages and labs, and anything else in motion. */}
      <section className="grid grid-cols-1 gap-inset-md lg:grid-cols-2 xl:grid-cols-3">
        <Card as="section" className="space-y-stack-md">
          <CardTitle
            title={isEs ? "Mensajes" : "Messages"}
            href="/dashboard/messages"
            linkLabel={isEs ? "Abrir" : "Open"}
          />
          <p className="flex items-center gap-inline-sm text-body-md text-fg">
            <MessageSquareText
              aria-hidden="true"
              className="size-4 text-fg-brand"
            />
            {unread > 0
              ? isEs
                ? `${unread} sin leer`
                : `${unread} unread`
              : isEs
                ? "Nada nuevo"
                : "Nothing new"}
          </p>
          {latestFromTeam ? (
            <p className="line-clamp-2 text-body-sm text-fg-muted">
              <span className="text-fg-secondary">
                {latestFromTeam.thread.contact.name}:
              </span>{" "}
              {latestFromTeam.message.body ||
                latestFromTeam.message.attachment?.name}
            </p>
          ) : null}
        </Card>

        <Card as="section" className="space-y-stack-md">
          <CardTitle
            title={isEs ? "Laboratorios" : "Labs"}
            href="/dashboard/personal-log/lab-tracking"
            linkLabel={isEs ? "Abrir" : "Open"}
          />
          {labValues.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center gap-inline-sm">
                <Badge tone="success">
                  {labValues.length - labsFlagged}{" "}
                  {isEs ? "en rango" : "in range"}
                </Badge>
                {labsFlagged > 0 ? (
                  <Badge tone="warning">
                    {labsFlagged} {isEs ? "fuera de rango" : "out of range"}
                  </Badge>
                ) : null}
                {clinicLabs.unseen ? (
                  <Badge tone="info">{isEs ? "Nuevo" : "New"}</Badge>
                ) : null}
              </div>
              <p className="text-caption text-fg-muted">
                {isEs
                  ? "Últimos resultados de su clínica:"
                  : "Latest results from your clinic:"}{" "}
                {labDate ? shortDate(labDate, isEs) : "—"}
              </p>
            </>
          ) : (
            <p className="text-body-sm text-fg-muted">
              {isEs
                ? "Aún no hay resultados de su clínica."
                : "No results from your clinic yet."}
            </p>
          )}
        </Card>

        {/* Shown only when something is under way. */}
        {activeTrip || accessConcerns > 0 ? (
          <Card
            as="section"
            className="space-y-stack-md lg:col-span-2 xl:col-span-1"
          >
            <CardTitle title={isEs ? "En curso" : "In progress"} />
            <ul className="space-y-stack-sm">
              {activeTrip ? (
                <li>
                  <Link
                    href={`/dashboard/travel-log/${activeTrip.id}`}
                    className="flex items-center gap-inline-md rounded-card-nested border border-line-subtle p-inset-sm hover:bg-surface-sunken"
                  >
                    <Plane
                      aria-hidden="true"
                      className="size-4 shrink-0 text-fg-brand"
                    />
                    <span className="min-w-0 flex-1 text-body-sm text-fg">
                      {isEs ? "Viaje:" : "Trip:"} {activeTrip.destination.city}{" "}
                      · {shortDate(activeTrip.departDate, isEs)}
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 text-fg-muted"
                    />
                  </Link>
                </li>
              ) : null}
              {accessConcerns > 0 ? (
                <li>
                  <Link
                    href="/dashboard/vascular-access"
                    className="flex items-center gap-inline-md rounded-card-nested border border-line-subtle p-inset-sm hover:bg-surface-sunken"
                  >
                    <BellRing
                      aria-hidden="true"
                      className="size-4 shrink-0 text-warning-glyph"
                    />
                    <span className="min-w-0 flex-1 text-body-sm text-fg">
                      {isEs
                        ? `${accessConcerns} reporte(s) de acceso en revisión`
                        : `${accessConcerns} access concern(s) under review`}
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 text-fg-muted"
                    />
                  </Link>
                </li>
              ) : null}
            </ul>
          </Card>
        ) : null}
      </section>

      {/* The member's own shortcuts (client: make them quick actions). */}
      <QuickActionsSection
        isEs={isEs}
        title={isEs ? "Accesos directos" : "Shortcuts"}
      />

      {/* The stories, kept small and last (2026-10-12). */}
      <StoriesCard isEs={isEs} />
    </div>
  );
}
