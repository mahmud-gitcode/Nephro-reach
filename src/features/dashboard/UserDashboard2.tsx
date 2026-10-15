"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Clock,
  MapPin,
  MessageSquareText,
  Pill,
  UserRound,
  Users,
  Video,
} from "lucide-react";
import {
  Badge,
  Button,
  buttonStyles,
  Card,
  EmptyState,
  Progress,
  Skeleton,
} from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useMemberName } from "@/features/auth/useMemberName";
import { useNow } from "@/lib/utils/useNow";
import { cn } from "@/lib/utils/cn";
import { QuickActionsSection } from "./QuickActionsSection";
import { useMemberAttention } from "./useMemberAttention";
import { StoriesCard } from "./StoriesCard";
import {
  fromDateKey,
  toDateKey,
} from "@/features/personal-log/dialysis/schedule";
import { useMedications } from "@/features/medications/useMedications";
import { useReminders } from "@/features/medications/useReminders";
import { useMedicationLog } from "@/features/medications/useMedicationLog";
import { doseRows } from "@/features/medications/medicationList";
import { useAppointments } from "@/features/personal-log/appointments/useAppointments";
import {
  timeRange,
  upcoming,
} from "@/features/personal-log/appointments/appointments";
import { useClassroom } from "@/features/education/classroom";
import { useJourneyProgress } from "@/features/education/useJourneyProgress";
import { useLiveClasses } from "@/features/clinic/useLiveClasses";
import { useMessages } from "@/features/messaging/useMessages";
import * as messagingRules from "@/features/messaging/messaging.rules";

/* ==========================================================================
   Dashboard 2 — the member's day on one screen
   --------------------------------------------------------------------------
   A second dashboard beside the first (2026-10-12), so the redesign can be
   judged before it replaces anything. Trimmed on review (2026-10-14) to
   what the member acts on: what needs them and their messages, the next
   live class, their learning, the next appointment and today's
   medicines, their shortcuts, and the stories last. Every figure is read
   from what the member has logged, never a fixed number.
   ========================================================================== */

const HREF = "/dashboard/dashboard-2";

function greetingFor(hour: number, isEs: boolean): string {
  if (hour < 12) return isEs ? "Buenos días" : "Good morning";
  if (hour < 18) return isEs ? "Buenas tardes" : "Good afternoon";
  return isEs ? "Buenas noches" : "Good evening";
}

/** "in 3 days", "tomorrow", "today" — how far off a date is. */
function whenLabel(dateKey: string, today: string, isEs: boolean): string {
  const days = Math.round(
    (fromDateKey(dateKey).getTime() - fromDateKey(today).getTime()) / 86400000,
  );
  if (days <= 0) return isEs ? "Hoy" : "Today";
  if (days === 1) return isEs ? "Mañana" : "Tomorrow";
  return isEs ? `En ${days} días` : `In ${days} days`;
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

/** "07:40 am" → minutes after midnight, so doses sort by the clock. */
function minutesOf(time: string): number {
  const match = /(\d{1,2}):(\d{2})\s*(am|pm)?/i.exec(time);
  if (!match) return 0;
  let hours = Number(match[1]) % 12;
  if (match[3]?.toLowerCase() === "pm") hours += 12;
  if (!match[3]) hours = Number(match[1]);
  return hours * 60 + Number(match[2]);
}

/** The head every card in the row shares: an icon, the title, a status. */
function CardHead({
  icon,
  title,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-inline-md">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-card-nested bg-primary-soft text-fg-brand [&_svg]:size-5"
      >
        {icon}
      </span>
      <h2 className="min-w-0 flex-1 text-heading-4 text-fg">{title}</h2>
      {badge}
    </div>
  );
}

/** A calendar leaf: month over day, for a date at a glance. */
function DateTile({
  dateKey,
  isEs,
  size = "md",
}: {
  dateKey: string;
  isEs: boolean;
  size?: "md" | "lg";
}) {
  const date = fromDateKey(dateKey);
  const locale = isEs ? "es-ES" : "en-US";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-card-nested border border-primary-soft-line bg-primary-soft text-fg-brand",
        size === "lg" ? "size-20" : "size-16",
      )}
    >
      <span className="text-label-sm uppercase">
        {date.toLocaleDateString(locale, { month: "short" })}
      </span>
      <span
        className={cn(
          "leading-none tabular-nums",
          size === "lg" ? "text-metric-md" : "text-heading-3",
        )}
      >
        {date.getDate()}
      </span>
    </span>
  );
}

export default function UserDashboard2() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const locale = isEs ? "es-ES" : "en-US";
  const { user } = useAuth();
  const memberName = useMemberName();
  const now = new Date(useNow());
  const today = toDateKey(now);

  const attention = useMemberAttention();

  const { conversations } = useMessages();
  const threads = messagingRules
    .sortByRecent(messagingRules.memberConversations(conversations, memberName))
    .filter((c) => !c.archived);
  const unread = messagingRules.totalUnread(threads);

  const live = useLiveClasses();
  const nextClass = live.upcoming[0];
  const recordingCount = live.past.filter(
    (c) => live.recordings[c.title],
  ).length;

  const classroom = useClassroom();
  const journey = useJourneyProgress(classroom.lessons);

  const appointments = useAppointments();
  const nextAppointment = upcoming(appointments.appointments, today)[0];

  const meds = useMedications();
  const { reminders } = useReminders();
  const doseLog = useMedicationLog();
  const doses = doseRows(meds.medications, reminders)
    .map((d) => ({
      ...d,
      state: doseLog.statusOf(today, d.medication, d.time),
    }))
    .sort((a, b) => minutesOf(a.time) - minutesOf(b.time));
  const dosesDone = doses.filter(
    (d) => d.state === "taken" || d.state === "late",
  ).length;

  /* The first dose still to log, in clock order. */
  const nextDose = doses.find((d) => d.state !== "taken" && d.state !== "late");

  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <div className="space-y-stack-xl">
      <PageTitle
        href={HREF}
        title={`${greetingFor(now.getHours(), isEs)}${firstName ? `, ${firstName}` : ""}`}
        action={
          <span className="text-body-sm text-fg-muted">
            {now.toLocaleDateString(locale, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>
        }
      />

      {/* The member's own shortcuts (client: make them quick actions); first,
          under the greeting (2026-10-14). */}
      <QuickActionsSection
        isEs={isEs}
        title={isEs ? "Accesos directos" : "Shortcuts"}
      />

      {/* Row: what needs doing (two-thirds), messages (one-third). */}
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
            title={isEs ? "Mensajes" : "Messages"}
            href="/dashboard/messages"
            linkLabel={isEs ? "Abrir" : "Open"}
          />
          <p className="flex items-center gap-inline-sm text-body-sm text-fg-muted">
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
          {threads.length === 0 ? (
            <p className="text-body-sm text-fg-muted">
              {isEs ? "Aún no hay mensajes." : "No messages yet."}
            </p>
          ) : (
            <ul className="space-y-stack-xs">
              {threads.slice(0, 3).map((thread) => {
                const last = thread.messages[thread.messages.length - 1];
                return (
                  <li key={thread.id}>
                    <Link
                      href="/dashboard/messages"
                      className="flex min-h-11 items-start gap-inline-md rounded-card-nested p-inset-xs hover:bg-surface-sunken"
                    >
                      <span
                        aria-hidden="true"
                        className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-primary-soft text-fg-brand"
                      >
                        <UserRound className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-inline-sm">
                          <span
                            className={cn(
                              "truncate text-label-md",
                              thread.unread > 0
                                ? "text-fg"
                                : "text-fg-secondary",
                            )}
                          >
                            {thread.contact.name}
                          </span>
                          {thread.unread > 0 ? (
                            <Badge tone="info">{thread.unread}</Badge>
                          ) : null}
                        </span>
                        <span className="block truncate text-caption text-fg-muted">
                          {last
                            ? last.body || last.attachment?.name || ""
                            : thread.contact.role}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>

      {/* The next live class: a full-width invitation, as on the first
          dashboard, with when it is at a glance. */}
      <Card
        as="section"
        aria-label={isEs ? "Próxima clase en vivo" : "Next live class"}
        className="relative overflow-hidden"
      >
        <div className="flex flex-col gap-inset-md md:flex-row md:items-center">
          {nextClass ? (
            <DateTile dateKey={nextClass.date} isEs={isEs} size="lg" />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-20 shrink-0 items-center justify-center rounded-card-nested border border-primary-soft-line bg-primary-soft text-fg-brand"
            >
              <Video className="size-8" />
            </span>
          )}

          <div className="min-w-0 flex-1 space-y-stack-xs">
            <div className="flex flex-wrap items-center gap-inline-sm">
              <Badge tone="danger" icon={<Video />}>
                {isEs ? "Clase en vivo" : "Live class"}
              </Badge>
              {nextClass ? (
                <Badge tone="neutral">
                  {whenLabel(nextClass.date, today, isEs)}
                </Badge>
              ) : null}
            </div>
            <h2 className="text-heading-4 text-fg">
              {nextClass?.topic ??
                (isEs
                  ? "Aún no hay clase programada"
                  : "No class scheduled yet")}
            </h2>
            <div className="flex flex-wrap items-center gap-x-inline-lg gap-y-stack-xs text-body-sm text-fg-muted">
              {nextClass ? (
                <>
                  <span className="inline-flex items-center gap-inline-sm">
                    <CalendarDays aria-hidden="true" className="size-4" />
                    {fromDateKey(nextClass.date).toLocaleDateString(locale, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="inline-flex items-center gap-inline-sm">
                    <Clock aria-hidden="true" className="size-4" />
                    {nextClass.time}
                  </span>
                  {nextClass.educator ? (
                    <span className="inline-flex items-center gap-inline-sm">
                      <UserRound aria-hidden="true" className="size-4" />
                      {nextClass.educator}
                    </span>
                  ) : null}
                </>
              ) : (
                <span>
                  {isEs
                    ? "La próxima clase aparecerá aquí."
                    : "The next class will be posted here."}
                </span>
              )}
              <span className="inline-flex items-center gap-inline-sm">
                <Users aria-hidden="true" className="size-4" />
                {isEs
                  ? "Sesión grupal interactiva"
                  : "Interactive group session"}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-stack-xs md:items-end">
            <Button
              leadingIcon={<Video />}
              disabled={!nextClass?.joinUrl}
              onClick={() =>
                nextClass?.joinUrl &&
                window.open(nextClass.joinUrl, "_blank", "noopener,noreferrer")
              }
            >
              {isEs ? "Unirse a la clase" : "Join class"}
            </Button>
            {nextClass && !nextClass.joinUrl ? (
              <span className="text-caption text-fg-muted md:text-right">
                {isEs
                  ? "El enlace aparece cuando se agrega."
                  : "The join link appears once it is added."}
              </span>
            ) : null}
            {recordingCount > 0 ? (
              <Link
                href="/dashboard"
                className="inline-flex min-h-11 items-center justify-center text-label-md text-fg-brand hover:underline"
              >
                {isEs
                  ? `Ver clases pasadas (${recordingCount})`
                  : `Watch past classes (${recordingCount})`}
              </Link>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Row: learning, the next appointment, today's medicines. One shape
          for all three (2026-10-14): an icon and title, one figure that
          answers the card, the detail under it, and the action pinned to
          the bottom so the three line up. */}
      <section className="grid grid-cols-1 gap-inset-md lg:grid-cols-2 xl:grid-cols-3">
        <Card as="section" className="flex flex-col gap-stack-md">
          <CardHead
            icon={<GraduationCap />}
            title={isEs ? "Mi aprendizaje" : "My learning"}
          />
          {classroom.isPending || journey.isPending ? (
            <Skeleton height={160} />
          ) : (
            <>
              <div className="space-y-stack-sm">
                <div className="flex items-baseline justify-between gap-inline-md">
                  <span className="text-metric-md text-fg tabular-nums">
                    {journey.overallPercent}%
                  </span>
                  <span className="text-body-sm text-fg-muted">
                    {isEs
                      ? `${journey.completedCount} de ${classroom.lessons.length} lecciones`
                      : `${journey.completedCount} of ${classroom.lessons.length} lessons`}
                  </span>
                </div>
                <Progress
                  value={journey.completedCount}
                  max={Math.max(classroom.lessons.length, 1)}
                  label={isEs ? "Progreso del curso" : "Course progress"}
                />
              </div>
              {journey.nextDay ? (
                <div className="rounded-card-nested bg-surface-sunken p-inset-sm">
                  <p className="text-caption text-fg-muted">
                    {isEs
                      ? `Siguiente · Lección ${journey.nextDay.day}`
                      : `Next up · Lesson ${journey.nextDay.day}`}
                  </p>
                  <p className="mt-stack-xs line-clamp-2 text-label-md text-fg">
                    {isEs ? journey.nextDay.titleEs : journey.nextDay.titleEn}
                  </p>
                </div>
              ) : (
                <p className="flex items-center gap-inline-sm text-body-sm text-success">
                  <CheckCircle2 aria-hidden="true" className="size-4" />
                  {isEs
                    ? "¡Terminó todas las lecciones!"
                    : "You have finished every lesson!"}
                </p>
              )}
              <Link
                href={
                  journey.nextDay
                    ? `/dashboard/my-classroom/${journey.nextDay.slug}`
                    : "/dashboard/my-classroom"
                }
                className={cn(buttonStyles({ fullWidth: true }), "mt-auto")}
              >
                {!journey.nextDay
                  ? isEs
                    ? "Ir a Mi clase"
                    : "Go to My Classroom"
                  : journey.hasStarted
                    ? isEs
                      ? "Continuar lección"
                      : "Continue lesson"
                    : isEs
                      ? "Empezar el curso"
                      : "Start the course"}
              </Link>
            </>
          )}
        </Card>

        <Card as="section" className="flex flex-col gap-stack-md">
          <CardHead
            icon={<CalendarDays />}
            title={isEs ? "Próxima cita" : "Next appointment"}
            badge={
              nextAppointment ? (
                <Badge tone="info">
                  {whenLabel(nextAppointment.date, today, isEs)}
                </Badge>
              ) : null
            }
          />
          {appointments.isPending ? (
            <Skeleton height={160} />
          ) : nextAppointment ? (
            <>
              <div className="flex items-center gap-inline-md">
                <DateTile dateKey={nextAppointment.date} isEs={isEs} />
                <div className="min-w-0">
                  <p className="truncate text-label-lg text-fg">
                    {nextAppointment.title}
                  </p>
                  <p className="text-body-sm text-fg-muted">
                    {fromDateKey(nextAppointment.date).toLocaleDateString(
                      locale,
                      { weekday: "long" },
                    )}{" "}
                    · {timeRange(nextAppointment)}
                  </p>
                </div>
              </div>
              <dl className="space-y-stack-xs text-body-sm">
                <div className="flex items-center gap-inline-sm">
                  <dt className="sr-only">{isEs ? "Con" : "With"}</dt>
                  <UserRound
                    aria-hidden="true"
                    className="size-4 shrink-0 text-fg-muted"
                  />
                  <dd className="truncate text-fg">{nextAppointment.doctor}</dd>
                </div>
                {nextAppointment.location ? (
                  <div className="flex items-center gap-inline-sm">
                    <dt className="sr-only">{isEs ? "Dónde" : "Where"}</dt>
                    <MapPin
                      aria-hidden="true"
                      className="size-4 shrink-0 text-fg-muted"
                    />
                    <dd className="truncate text-fg">
                      {nextAppointment.location}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </>
          ) : (
            <EmptyState
              variant="bare"
              icon={<CalendarDays />}
              title={isEs ? "Nada programado" : "Nothing scheduled"}
            />
          )}
          <Link
            href="/dashboard/personal-log/appointments"
            className={cn(
              buttonStyles({
                variant: "neutral",
                appearance: "fill-stroke",
                fullWidth: true,
              }),
              "mt-auto",
            )}
          >
            {isEs ? "Ver todas las citas" : "See all appointments"}
          </Link>
        </Card>

        <Card
          as="section"
          className="flex flex-col gap-stack-md lg:col-span-2 xl:col-span-1"
        >
          <CardHead
            icon={<Pill />}
            title={isEs ? "Medicamentos de hoy" : "Medicines today"}
            badge={
              doses.length > 0 && dosesDone === doses.length ? (
                <Badge tone="success">{isEs ? "Completo" : "All done"}</Badge>
              ) : null
            }
          />
          {meds.isPending ? (
            <Skeleton height={160} />
          ) : doses.length === 0 ? (
            <EmptyState
              variant="bare"
              icon={<Pill />}
              title={
                isEs ? "Sin recordatorios de dosis" : "No dose reminders set"
              }
            />
          ) : (
            <>
              <div className="space-y-stack-sm">
                <div className="flex items-baseline justify-between gap-inline-md">
                  <span className="text-metric-md text-fg tabular-nums">
                    {dosesDone}/{doses.length}
                  </span>
                  <span className="text-body-sm text-fg-muted">
                    {isEs ? "dosis tomadas" : "doses taken"}
                  </span>
                </div>
                <Progress
                  value={dosesDone}
                  max={doses.length}
                  tone={dosesDone === doses.length ? "success" : "primary"}
                  label={isEs ? "Dosis de hoy" : "Today's doses"}
                />
              </div>
              {nextDose ? (
                <div className="rounded-card-nested bg-surface-sunken p-inset-sm">
                  <p className="flex items-center justify-between gap-inline-md text-caption text-fg-muted">
                    {isEs ? "Próxima dosis" : "Next dose"}
                    {minutesOf(nextDose.time) <
                    now.getHours() * 60 + now.getMinutes() ? (
                      <Badge tone="warning">
                        {isEs ? "Atrasada" : "Overdue"}
                      </Badge>
                    ) : null}
                  </p>
                  <p className="mt-stack-xs flex items-center justify-between gap-inline-md text-label-md text-fg">
                    <span className="truncate">{nextDose.medication}</span>
                    <span className="shrink-0 tabular-nums">
                      {nextDose.time}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="flex items-center gap-inline-sm text-body-sm text-success">
                  <CheckCircle2 aria-hidden="true" className="size-4" />
                  {isEs
                    ? "Tomó todas las dosis de hoy."
                    : "Every dose for today is logged."}
                </p>
              )}
            </>
          )}
          <Link
            href="/dashboard/personal-log/medications"
            className={cn(
              buttonStyles({
                variant: "neutral",
                appearance: "fill-stroke",
                fullWidth: true,
              }),
              "mt-auto",
            )}
          >
            {isEs ? "Ver medicamentos" : "See medicines"}
          </Link>
        </Card>
      </section>

      {/* The stories, kept small and last (2026-10-12). */}
      <StoriesCard isEs={isEs} />
    </div>
  );
}
