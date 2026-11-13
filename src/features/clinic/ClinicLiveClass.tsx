"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Award,
  BellRing,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  Pencil,
  PlayCircle,
  Plus,
  Quote,
  Star,
  Users,
  Video,
} from "lucide-react";

import {
  MoreSolid,
  StarSolid,
  UserCheckSolid,
  UsersSolid,
  VideoSolid,
} from "@/components/icons/solid";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  Card,
  EmptyState,
  KeyCard,
  MonthCalendar,
  Progress,
  Skeleton,
  Table,
  TableBody,
  TableEmptyRow,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { tableIconButton } from "./tableButton";
import { classDate, formatClassDate, settings } from "./liveClass.data";
import type { RecentClass } from "./liveClass.data";
import { useLiveClasses } from "./useLiveClasses";
import { zoneLabel } from "./liveClass.mappers";
import { isSafeLinkUrl } from "@/lib/utils/safeUrl";
import { toDay } from "@/lib/api/paging";
import { useLanguage } from "@/context/LanguageContext";

const todayDay = () => toDay(new Date());
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import {
  classStatusLabel,
  classesOnDay,
  programLabel,
  settingSummary,
  type ManagedClass,
  type SettingId,
  type SettingValues,
} from "./liveClass.actions";
import {
  AllClassesModal,
  ClassActionsModal,
  RecordingModal,
  RecordingsLibraryModal,
  ScheduleClassModal,
  SettingModal,
  classTone,
} from "./LiveClassModals";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function useIsEs() {
  const { language } = useLanguage();
  return language === "ES";
}

const SETTING_ICONS: Record<(typeof settings)[number]["id"], React.ReactNode> =
  {
    zoom: <Video />,
    reminders: <BellRing />,
    limits: <Users />,
    resources: <FolderOpen />,
    surveys: <ClipboardList />,
    certificates: <Award />,
  };

function PanelHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-stack-lg flex items-start justify-between gap-inline-lg">
      <div className="min-w-0">
        <h2 className="text-heading-4 text-fg">{title}</h2>
        {description ? (
          <p className="mt-stack-xs text-body-sm text-fg-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Five stars filled to the rating, and the number beside them — the
    figure is what a screen reader hears, the stars are decoration. */
function Rating({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  const isEs = useIsEs();
  return (
    <span className="inline-flex items-center gap-inline-xs">
      <span aria-hidden="true" className="flex">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={`${size} ${
              index < Math.round(value)
                ? "fill-chart-warning text-chart-warning"
                : "text-line-strong"
            }`}
          />
        ))}
      </span>
      <span className="sr-only">
        {isEs ? `Calificación de ${value} de 5` : `Rated ${value} out of 5`}
      </span>
    </span>
  );
}

/* The figures come from the classes the server returned: this month's
   upcoming classes and their registrations; for the NephroReach team also
   attendance and ratings of the classes held. Where the API has no figure
   (an office cannot see attendance; no trend or feedback route exists) the
   card says so instead of showing a sample number. */
function SummaryCards({
  upcoming,
  classes,
  today,
  manage,
}: {
  upcoming: ManagedClass[];
  classes: ManagedClass[];
  today: string;
  manage: boolean;
}) {
  const isEs = useIsEs();
  const noData = isEs ? "Aún no hay datos" : "No data yet";
  const month = today.slice(0, 7);
  const thisMonth = upcoming.filter((c) => c.date.startsWith(month)).length;
  const registrations = upcoming.reduce((sum, c) => sum + c.registered, 0);
  const held = classes.filter(
    (c) => c.status !== "Cancelled" && c.date < today,
  );
  const booked = held.reduce((sum, c) => sum + c.registered, 0);
  const joined = held.reduce((sum, c) => sum + (c.attended ?? 0), 0);
  const attendance =
    manage && booked > 0 ? Math.round((joined / booked) * 100) : null;
  const rated = held.filter((c) => (c.averageRating ?? 0) > 0);
  const rating =
    manage && rated.length > 0
      ? Math.round(
          (rated.reduce((sum, c) => sum + (c.averageRating ?? 0), 0) /
            rated.length) *
            10,
        ) / 10
      : null;
  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2">
      <KeyCard
        tone="brand"
        icon={<VideoSolid />}
        value={thisMonth}
        label={isEs ? "Próximas clases en vivo" : "Upcoming Live Classes"}
        note={isEs ? "Este mes" : "This month"}
      />

      <KeyCard
        tone="success"
        icon={<UsersSolid />}
        value={registrations}
        label={isEs ? "Total de inscripciones" : "Total Registrations"}
        note={isEs ? "Para las próximas clases" : "For upcoming classes"}
      />

      <KeyCard
        tone="brand"
        icon={<UserCheckSolid />}
        value={attendance === null ? "—" : `${attendance}%`}
        label={isEs ? "Asistencia promedio" : "Average Attendance"}
        note={
          attendance === null
            ? noData
            : isEs
              ? "Clases realizadas"
              : "Classes held"
        }
      />

      <KeyCard
        tone="warning"
        icon={<StarSolid />}
        value={
          rating === null ? (
            "—"
          ) : (
            <>
              {rating}
              <span className="text-heading-4 text-fg-muted">/5</span>
            </>
          )
        }
        label={isEs ? "Calificación promedio" : "Average Rating"}
        note={rating === null ? noData : undefined}
      >
        {rating === null ? null : <Rating value={rating} />}
      </KeyCard>

      {/* Not a figure, so not a KeyCard: there is no number to lead with
          and no panel colour that would mean anything. */}
      <Card as="article" padding="small" className="flex flex-col">
        <p className="text-heading-5 text-fg-secondary">
          {isEs ? "Comentarios de los miembros" : "Member Feedback"}
        </p>
        <figure className="mt-stack-md flex flex-1 flex-col">
          <Quote aria-hidden="true" className="h-5 w-5 text-fg-brand" />
          <blockquote className="mt-stack-xs text-body-md text-fg-muted">
            {noData}
          </blockquote>
          <figcaption className="mt-auto pt-stack-sm text-caption text-fg-muted">
            {isEs ? "— Comentarios de los miembros" : "— Member Feedback"}
          </figcaption>
        </figure>
      </Card>
    </section>
  );
}

function UpcomingClassesTable({
  classes,
  onViewAll,
  onEdit,
  onActions,
}: {
  classes: ManagedClass[];
  onViewAll: () => void;
  /** Without these the table is read-only (the clinic's view). */
  onEdit?: (item: ManagedClass) => void;
  onActions?: (item: ManagedClass) => void;
}) {
  const isEs = useIsEs();
  const editable = Boolean(onEdit && onActions);
  return (
    <Card as="section" padding="small">
      <PanelHeading
        title={isEs ? "Próximas clases en vivo" : "Upcoming Live Classes"}
        action={
          <Button
            variant="neutral"
            appearance="fill-stroke"
            size="small"
            onClick={onViewAll}
          >
            {isEs ? "Ver todas" : "View All"}
          </Button>
        }
      />
      <div className="overflow-hidden rounded-control border border-line">
        <Table minWidth={860}>
          <TableHead className="bg-surface-sunken">
            <TableRow>
              <TableHeaderCell>{isEs ? "Fecha" : "Date"}</TableHeaderCell>
              <TableHeaderCell>
                {isEs ? "Hora (EST)" : "Time (EST)"}
              </TableHeaderCell>
              <TableHeaderCell>{isEs ? "Tema" : "Topic"}</TableHeaderCell>
              <TableHeaderCell>
                {isEs ? "Educador" : "Educator"}
              </TableHeaderCell>
              <TableHeaderCell>{isEs ? "Programa" : "Program"}</TableHeaderCell>
              <TableHeaderCell>
                {isEs ? "Inscritos" : "Registered"}
              </TableHeaderCell>
              <TableHeaderCell>{isEs ? "Estado" : "Status"}</TableHeaderCell>
              {editable ? (
                <TableHeaderCell className="text-right">
                  {isEs ? "Acciones" : "Actions"}
                </TableHeaderCell>
              ) : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {classes.length === 0 ? (
              <TableEmptyRow colSpan={editable ? 8 : 7}>
                {isEs ? (
                  "No hay próximas clases en vivo. NephroReach aún no ha programado la siguiente."
                ) : (
                  <>
                    No upcoming live classes. NephroReach has not scheduled the
                    next one yet.
                  </>
                )}
              </TableEmptyRow>
            ) : null}
            {classes.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatClassDate(item.date, isEs)}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {item.time}
                </TableCell>
                <TableCell emphasis>{item.topic}</TableCell>
                <TableCell>{item.educator}</TableCell>
                <TableCell>{programLabel(item.program, isEs)}</TableCell>
                <TableCell>
                  <span className="block whitespace-nowrap tabular-nums">
                    {item.registered} / {item.capacity}
                  </span>
                  <Progress
                    value={item.registered}
                    max={item.capacity}
                    label={
                      isEs
                        ? `Inscripciones de ${item.topic}`
                        : `${item.topic} registrations`
                    }
                    size="small"
                    className="mt-stack-xs w-16"
                  />
                </TableCell>
                <TableCell>
                  <Badge tone={classTone[item.status]}>
                    {classStatusLabel(item.status, isEs)}
                  </Badge>
                </TableCell>
                {editable ? (
                  <TableCell>
                    <span className="flex justify-end gap-inline-xs">
                      <Button
                        onClick={() => onEdit?.(item)}
                        variant="neutral"
                        appearance="fill-stroke"
                        size="small"
                        iconOnly
                        className={tableIconButton}
                        aria-label={
                          isEs ? `Editar ${item.topic}` : `Edit ${item.topic}`
                        }
                      >
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button
                        onClick={() => onActions?.(item)}
                        variant="neutral"
                        appearance="fill-stroke"
                        size="small"
                        iconOnly
                        className={tableIconButton}
                        aria-label={
                          isEs
                            ? `Acciones para ${item.topic}`
                            : `Actions for ${item.topic}`
                        }
                      >
                        <MoreSolid />
                      </Button>
                    </span>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function LiveClassCalendar({ classes }: { classes: ManagedClass[] }) {
  /* ?date=2026-09-19 (the dashboard links here with one) opens on that day,
     selected. Without it, or with anything that is not a date, it opens on
     the first scheduled class, so the panel under the grid shows something
     the moment the page loads. */
  const params = useSearchParams();
  const requested = params.get("date");
  const first =
    requested && /^\d{4}-\d{2}-\d{2}$/.test(requested)
      ? classDate(requested)
      : classDate(
          classes.find((c) => c.date >= todayDay())?.date ??
            classes[0]?.date ??
            todayDay(),
        );
  const [year, setYear] = useState(first.getFullYear());
  const [month, setMonth] = useState(first.getMonth());
  const [day, setDay] = useState<number | null>(first.getDate());
  const isEs = useIsEs();
  const locale = isEs ? "es-US" : "en-US";

  const selected = day === null ? [] : classesOnDay(classes, year, month, day);
  const monthLabel = new Date(year, month, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading
        title={isEs ? "Calendario de clases en vivo" : "Live Class Calendar"}
      />
      <MonthCalendar
        year={year}
        month={month}
        selectedDay={day}
        onSelectDay={setDay}
        onMonthChange={(nextYear, nextMonth) => {
          setYear(nextYear);
          setMonth(nextMonth);
          setDay(null);
        }}
        monthLabel={monthLabel}
        weekdayLabels={isEs ? WEEKDAYS_ES : WEEKDAYS}
        formatDayLabel={(date) =>
          date.toLocaleDateString(locale, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        }
        isMarked={(date) =>
          classesOnDay(
            classes,
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
          ).length > 0
        }
      />
      <p className="mt-stack-sm flex items-center gap-inline-xs text-caption text-fg-muted">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-pill bg-action"
        />
        {isEs ? "Clase en vivo programada" : "Live class scheduled"}
      </p>

      <div
        aria-live="polite"
        className="mt-stack-md border-t border-line-subtle pt-inset-sm"
      >
        {day === null ? (
          <p className="text-body-sm text-fg-muted">
            {isEs
              ? "Elija un día para ver su clase."
              : "Pick a day to see its class."}
          </p>
        ) : selected.length === 0 ? (
          <p className="text-body-sm text-fg-muted">
            {isEs ? (
              `No hay clase en vivo el ${day} de ${monthLabel.split(" ")[0]}.`
            ) : (
              <>
                No live class on {monthLabel.split(" ")[0]} {day}.
              </>
            )}
          </p>
        ) : (
          selected.map((item) => (
            <div key={item.id} className="flex items-start gap-inline-lg">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface-brand-subtle text-brand-600"
              >
                <CalendarDays className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-label-lg text-fg">{item.topic}</p>
                <p className="text-body-sm text-fg-secondary">
                  {formatClassDate(item.date, isEs)} · {item.time}{" "}
                  {zoneLabel(item.startsAt ?? new Date())}
                </p>
                <p className="text-body-sm text-fg-muted">
                  {item.educator} · {item.registered}/{item.capacity}{" "}
                  {isEs ? "inscritos" : "registered"}
                </p>
              </div>
              <Badge tone={classTone[item.status]}>
                {classStatusLabel(item.status, isEs)}
              </Badge>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function RecentLiveClasses({
  classes,
  recordings,
  onView,
  onViewAll,
}: {
  /** Classes that have taken place, newest first. */
  classes: RecentClass[];
  recordings: Record<string, string>;
  /** Managing: open the recording's link editor. Without it the button
   *  plays the recording, when one is posted. */
  onView?: (item: RecentClass) => void;
  onViewAll?: () => void;
}) {
  const isEs = useIsEs();
  return (
    <Card as="section" padding="small">
      <PanelHeading
        title={isEs ? "Clases en vivo recientes" : "Recent Live Classes"}
        description={
          onView
            ? isEs
              ? "Publique una grabación y aparecerá en la pantalla de inicio de cada miembro, en Grabaciones recientes en vivo."
              : "Publish a recording and it appears on every member's home screen, under Recent Live Recordings."
            : undefined
        }
      />
      <ul className="divide-y divide-line-subtle">
        {classes.slice(0, 4).map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-inline-lg py-inset-sm first:pt-0 last:pb-0"
          >
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface-brand-subtle text-brand-600"
            >
              <PlayCircle className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-label-lg text-fg">{item.title}</p>
              <p className="text-caption text-fg-muted">
                {formatClassDate(item.date, isEs)}
                {item.attended !== null
                  ? isEs
                    ? ` · ${item.attended} asistieron`
                    : ` · ${item.attended} attended`
                  : ""}
              </p>
              <p className="mt-stack-xs flex items-center gap-inline-xs text-caption text-fg-secondary">
                {item.rating > 0 ? (
                  <>
                    <Rating value={item.rating} size="h-3.5 w-3.5" />
                    <span aria-hidden="true">{item.rating}</span>
                  </>
                ) : null}
                <Badge tone={recordings[item.id] ? "success" : "neutral"}>
                  {recordings[item.id]
                    ? isEs
                      ? "Publicada"
                      : "Published"
                    : isEs
                      ? "No publicada"
                      : "Not published"}
                </Badge>
              </p>
            </div>
            {onView ? (
              <Button
                onClick={() => onView(item)}
                variant="neutral"
                appearance="fill-stroke"
                size="small"
                aria-label={
                  isEs
                    ? recordings[item.id]
                      ? `Editar la grabación de ${item.title}`
                      : `Publicar la grabación de ${item.title}`
                    : recordings[item.id]
                      ? `Edit ${item.title} recording`
                      : `Publish ${item.title} recording`
                }
              >
                {recordings[item.id]
                  ? isEs
                    ? "Editar"
                    : "Edit"
                  : isEs
                    ? "Publicar"
                    : "Publish"}
              </Button>
            ) : (
              <Button
                variant="neutral"
                appearance="fill-stroke"
                size="small"
                disabled={!recordings[item.id]}
                title={
                  recordings[item.id]
                    ? undefined
                    : isEs
                      ? "Aún no publicada"
                      : "Not posted yet"
                }
                aria-label={
                  isEs
                    ? `Ver la grabación de ${item.title}`
                    : `Watch ${item.title} recording`
                }
                onClick={() => {
                  const link = recordings[item.id];
                  if (isSafeLinkUrl(link))
                    window.open(link, "_blank", "noopener,noreferrer");
                }}
              >
                {isEs ? "Ver" : "Watch"}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {onViewAll ? (
        <Button
          onClick={onViewAll}
          variant="neutral"
          appearance="stroke"
          size="small"
          fullWidth
          className="mt-stack-lg"
        >
          {isEs ? "Ver todas las grabaciones" : "View All Recordings"}
        </Button>
      ) : null}
    </Card>
  );
}

/* No server figure exists for these two yet (Phase 13 design §2.5,
   MISSING-BACKEND): the cards stay, and say so. */
function RegistrationSources() {
  const isEs = useIsEs();
  return (
    <Card as="section" padding="small">
      <PanelHeading
        title={isEs ? "Fuentes de inscripción" : "Registration Sources"}
      />
      <EmptyState
        title={isEs ? "Aún no hay datos" : "No data yet"}
        description={
          isEs
            ? "Aún no se registran las fuentes de inscripción."
            : "Registration sources are not recorded yet."
        }
      />
    </Card>
  );
}

function AttendanceTrend() {
  const isEs = useIsEs();
  return (
    <Card as="section" padding="small">
      <PanelHeading
        title={isEs ? "Tendencia de asistencia" : "Attendance Trend"}
      />
      <EmptyState
        title={isEs ? "Aún no hay datos" : "No data yet"}
        description={
          isEs
            ? "Aún no se registra la asistencia por mes."
            : "Attendance by month is not recorded yet."
        }
      />
    </Card>
  );
}

function LiveClassSettings({
  values,
  onManage,
}: {
  values: Record<SettingId, SettingValues>;
  onManage: (id: SettingId, title: string) => void;
}) {
  const isEs = useIsEs();
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading
        title={isEs ? "Configuración de clases en vivo" : "Live Class Settings"}
      />
      <ul className="grid gap-4 sm:grid-cols-2">
        {settings.map((item) => {
          const title = isEs ? item.titleEs : item.title;
          return (
            <li
              key={item.id}
              className="flex items-center gap-inline-lg rounded-control border border-line-subtle p-inset-sm"
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface-sunken text-fg-secondary [&_svg]:h-5 [&_svg]:w-5"
              >
                {SETTING_ICONS[item.id]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-label-lg text-fg">{title}</p>
                {/* What is actually switched on, when anything is — more use
                  than repeating the card's own description back. */}
                <p className="text-body-sm text-fg-muted">
                  {settingSummary(item.id, values[item.id], isEs) ??
                    (isEs ? item.descriptionEs : item.description)}
                </p>
              </div>
              <Button
                onClick={() => onManage(item.id, title)}
                variant="neutral"
                appearance="fill-stroke"
                size="small"
                aria-label={isEs ? `Administrar ${title}` : `Manage ${title}`}
              >
                {isEs ? "Administrar" : "Manage"}
              </Button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* The client (2026-10-06): NephroReach (Joni) hosts every live class, so
   scheduling, recordings and the settings live in the admin portal. The
   admin's Live Class page is this page with `manage`; the clinic sees the
   same schedule, read-only. */
export default function ClinicLiveClass({
  manage = false,
  href = "/dashboard/clinic/live-class",
}: {
  manage?: boolean;
  href?: string;
}) {
  const live = useLiveClasses({ manage });
  const past = live.past;
  const isEs = useIsEs();

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedClass | null>(null);
  const [acting, setActing] = useState<ManagedClass | null>(null);
  const [allOpen, setAllOpen] = useState(false);
  const [recording, setRecording] = useState<RecentClass | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [setting, setSetting] = useState<{
    id: SettingId;
    title: string;
  } | null>(null);

  const openSchedule = (item: ManagedClass | null) => {
    setEditing(item);
    setScheduleOpen(true);
  };

  return (
    <div className="space-y-4">
      <PageTitle
        href={href}
        action={
          manage ? (
            <Button size="small" onClick={() => openSchedule(null)}>
              <Plus className="h-4 w-4" />
              {isEs ? "Programar nueva clase" : "Schedule New Class"}
            </Button>
          ) : (
            <span className="text-body-sm text-fg-muted">
              {isEs
                ? "NephroReach imparte las clases"
                : "Classes are hosted by NephroReach"}
            </span>
          )
        }
      />

      {live.saveError ? (
        <Alert tone="danger" onDismiss={live.dismissSaveError}>
          {live.saveError.message ||
            (isEs
              ? "No se pudo guardar el cambio. Inténtelo de nuevo."
              : "That change did not save. Please try again.")}
        </Alert>
      ) : null}

      <AsyncSection
        pending={live.isPending}
        error={live.error}
        errorTitle={errorTitleFor(
          live.error,
          isEs
            ? "No se cargaron las clases en vivo"
            : "Live classes did not load",
          isEs ? "es" : "en",
        )}
        errorMessage={errorMessageFor(
          live.error,
          undefined,
          isEs ? "es" : "en",
        )}
        onRetry={canRetry(live.error) ? live.refetch : undefined}
        skeleton={<Skeleton height={560} className="rounded-card" />}
      >
        <div className="space-y-4">
          <SummaryCards
            upcoming={live.upcoming}
            classes={live.classes}
            today={live.today}
            manage={manage}
          />

          <UpcomingClassesTable
            classes={live.upcoming}
            onViewAll={() => setAllOpen(true)}
            onEdit={manage ? openSchedule : undefined}
            onActions={manage ? setActing : undefined}
          />

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <Suspense
              fallback={<Skeleton height={560} className="rounded-card" />}
            >
              <LiveClassCalendar classes={live.classes} />
            </Suspense>
            <RecentLiveClasses
              classes={past}
              recordings={live.recordings}
              onView={manage ? setRecording : undefined}
              onViewAll={manage ? () => setLibraryOpen(true) : undefined}
            />
            <RegistrationSources />
          </section>

          {manage ? (
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <AttendanceTrend />
              <div className="xl:col-span-2">
                <LiveClassSettings
                  values={live.settings}
                  onManage={(id, title) => setSetting({ id, title })}
                />
              </div>
            </section>
          ) : (
            <AttendanceTrend />
          )}
        </div>
      </AsyncSection>

      {/* The dialogs behind the actions above. Keyed where they hold a
          draft, so a reopened form starts from what it was given. */}
      {manage && scheduleOpen ? (
        <ScheduleClassModal
          key={`schedule-${editing?.id ?? "new"}`}
          open
          onClose={() => setScheduleOpen(false)}
          classes={live.classes}
          editing={editing}
          today={live.today}
          onSave={(draft, id) =>
            id ? live.updateClass(id, draft) : live.addClass(draft)
          }
        />
      ) : null}

      <ClassActionsModal
        item={acting}
        onClose={() => setActing(null)}
        onEdit={() => openSchedule(acting)}
        onStatus={(status) => acting && live.setStatus(acting.id, status)}
        onDuplicate={() => acting && live.duplicate(acting.id)}
        onRemove={() => acting && live.remove(acting.id)}
      />

      <AllClassesModal
        open={allOpen}
        onClose={() => setAllOpen(false)}
        classes={live.classes}
        today={live.today}
        onSelect={(item) => {
          setAllOpen(false);
          if (manage) setActing(item);
        }}
      />

      <RecordingModal
        key={`recording-${recording?.title ?? "none"}`}
        item={recording}
        onClose={() => setRecording(null)}
        link={recording ? (live.recordings[recording.id] ?? "") : ""}
        onSave={live.setRecording}
      />

      <RecordingsLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        classes={past}
        recordings={live.recordings}
        onSelect={(item) => {
          setLibraryOpen(false);
          setRecording(item);
        }}
      />

      <SettingModal
        key={`setting-${setting?.id ?? "none"}`}
        id={setting?.id ?? null}
        title={setting?.title ?? ""}
        onClose={() => setSetting(null)}
        values={setting ? live.settings[setting.id] : {}}
        onSave={live.setSetting}
      />
    </div>
  );
}
