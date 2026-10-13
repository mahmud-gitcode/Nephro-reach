"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import {
  Activity,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  Stethoscope,
  Apple,
  FileText,
  HeartPulse,
  Mail,
  Notebook,
  Pill,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import { NoticeRailLayout } from "@/components/layout/NoticeRailLayout";
import {
  Badge,
  Button,
  buttonStyles,
  Card,
  EmptyState,
  FormField,
  Input,
  Select,
  Skeleton,
} from "@/components/ui";
import { useNow } from "@/lib/utils/useNow";
import { useAppointments } from "@/features/personal-log/appointments/useAppointments";
import {
  timeRange,
  upcoming,
} from "@/features/personal-log/appointments/appointments";
import { useHealthcareTeam } from "@/features/care-team/useHealthcareTeam";
import {
  TEAM_ROLES,
  roleLabel,
  teamError,
  type TeamDraft,
  type TeamRole,
} from "@/features/care-team/healthcareTeam";
import { PageTitle } from "@/components/layout/PageTitle";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type LogTileConfig = {
  key: string;
  icon: IconType;
  /* Category colours come from the primitive ramps rather than the semantic
     status tokens: "Blood Pressure" is a category, not an error, and reusing
     --danger for it would break the rule that semantic colours are reserved.
     A proper categorical palette is still owed — these four ramps are simply
     the distinct hues currently available. */
  iconClass: string;
  iconBg: string;
  href: string;
};

const tileConfigs: LogTileConfig[] = [
  {
    key: "appointments",
    icon: User,
    iconClass: "text-success-700",
    iconBg: "bg-success-100",
    href: "/dashboard/personal-log/appointments",
  },
  {
    key: "medications",
    icon: Pill,
    iconClass: "text-brand-700",
    iconBg: "bg-brand-100",
    href: "/dashboard/personal-log/medications",
  },
  {
    key: "bloodPressure",
    icon: HeartPulse,
    iconClass: "text-danger-700",
    iconBg: "bg-danger-100",
    href: "/dashboard/personal-log/blood-pressure",
  },
  {
    key: "myLabs",
    icon: FileText,
    iconClass: "text-accent-700",
    iconBg: "bg-accent-100",
    href: "/dashboard/personal-log/lab-tracking",
  },
  {
    key: "nutrition",
    icon: Apple,
    iconClass: "text-success-700",
    iconBg: "bg-success-100",
    href: "/dashboard/personal-log/nutrition",
  },
  {
    key: "fluidTracker",
    icon: Activity,
    iconClass: "text-brand-700",
    iconBg: "bg-brand-100",
    href: "/dashboard/personal-log/fluid-tracker",
  },
  {
    key: "dialysisTreatment",
    icon: Activity,
    iconClass: "text-brand-700",
    iconBg: "bg-brand-100",
    href: "/dashboard/personal-log/dialysis-treatment",
  },
  {
    key: "betweenTreatment",
    icon: CalendarCheck,
    iconClass: "text-accent-700",
    iconBg: "bg-accent-100",
    href: "/dashboard/beyond-the-chair",
  },
  {
    key: "dialysisJournal",
    icon: Notebook,
    iconClass: "text-brand-700",
    iconBg: "bg-brand-100",
    href: "/dashboard/personal-log/dialysis-management",
  },
];

/** "Today", "Tomorrow", "In 5 days" — how far off a visit is. */
function whenLabel(date: string, today: string, isEs: boolean): string {
  const [y1, m1, d1] = today.split("-").map(Number);
  const [y2, m2, d2] = date.split("-").map(Number);
  const days = Math.round(
    (new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) /
      86_400_000,
  );
  if (days <= 0) return isEs ? "Hoy" : "Today";
  if (days === 1) return isEs ? "Mañana" : "Tomorrow";
  return isEs ? `En ${days} días` : `In ${days} days`;
}

function UpcomingAppointments() {
  const { t, language } = useLanguage();
  const isEs = language === "ES";
  const locale = isEs ? "es-US" : "en-US";
  const store = useAppointments();
  const now = new Date(useNow());
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  /* Read from the member's own list: this card said "No upcoming
     appointments" with one booked for tomorrow (client, 2026-10-12). */
  const all = upcoming(store.appointments, today);
  const ahead = all.slice(0, 3);

  return (
    <Card as="section" className="space-y-stack-md">
      <div className="flex flex-wrap items-center justify-between gap-inline-md">
        <h2 className="flex items-center gap-inline-sm text-heading-4 text-fg">
          {t("personalLogHub.upcoming.title")}
          {all.length > 0 ? <Badge tone="info">{all.length}</Badge> : null}
        </h2>
        <Link
          href="/dashboard/personal-log/appointments"
          className={buttonStyles({
            variant: "neutral",
            appearance: "fill-stroke",
            size: "small",
          })}
        >
          {t("personalLogHub.upcoming.viewAll")}
          <ChevronRight aria-hidden="true" />
        </Link>
      </div>

      {store.isPending ? (
        <Skeleton height={180} />
      ) : ahead.length === 0 ? (
        <EmptyState
          icon={<CalendarDays />}
          title={t("personalLogHub.upcoming.empty")}
          description={
            isEs
              ? "Agregue su próxima cita para recibir un recordatorio."
              : "Add your next visit to be reminded before it."
          }
          action={
            <Link
              href="/dashboard/personal-log/appointments"
              className={buttonStyles({ size: "small" })}
            >
              <Plus aria-hidden="true" />
              {isEs ? "Agregar una cita" : "Add an appointment"}
            </Link>
          }
        />
      ) : (
        /* One row per visit, the whole row a link: a date tile to scan
           down, how soon it is, then the time, who and where, each with an
           icon so nothing runs together (client, 2026-10-12). */
        <ul className="space-y-stack-sm">
          {ahead.map((appointment, index) => {
            const date = new Date(`${appointment.date}T00:00`);
            const soon = whenLabel(appointment.date, today, isEs);
            const isNext = index === 0;
            return (
              <li key={appointment.id}>
                <Link
                  href="/dashboard/personal-log/appointments"
                  className={`group flex items-start gap-inline-lg rounded-card-nested border p-inset-sm transition-colors duration-150 ease-standard hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:items-center ${
                    isNext
                      ? "border-primary-soft-line bg-primary-soft"
                      : "border-line-subtle"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex w-16 shrink-0 flex-col items-center rounded-card-nested py-inset-xs ${
                      isNext
                        ? "bg-primary-solid text-primary-on-solid"
                        : "bg-surface-sunken text-fg"
                    }`}
                  >
                    <span className="text-overline uppercase">
                      {date.toLocaleDateString(locale, { month: "short" })}
                    </span>
                    <span className="text-metric-sm leading-none">
                      {date.getDate()}
                    </span>
                    <span className="text-caption">
                      {date.toLocaleDateString(locale, { weekday: "short" })}
                    </span>
                  </span>

                  <span className="min-w-0 flex-1 space-y-stack-xs">
                    <span className="flex flex-wrap items-center gap-inline-sm">
                      <span className="text-label-lg text-fg">
                        {appointment.title}
                      </span>
                      <Badge tone={isNext ? "info" : "neutral"}>{soon}</Badge>
                      {appointment.source === "vascular-access" ? (
                        <Badge tone="neutral">
                          {isEs ? "Acceso vascular" : "Vascular access"}
                        </Badge>
                      ) : null}
                    </span>
                    <span className="flex flex-col gap-stack-xs text-body-sm text-fg-secondary sm:flex-row sm:flex-wrap sm:gap-inline-lg">
                      <span className="inline-flex items-center gap-inline-xs">
                        <Clock3
                          aria-hidden="true"
                          className="size-4 shrink-0 text-fg-muted"
                        />
                        <span className="tabular-nums">
                          {timeRange(appointment)}
                        </span>
                      </span>
                      {appointment.doctor ? (
                        <span className="inline-flex items-center gap-inline-xs">
                          <Stethoscope
                            aria-hidden="true"
                            className="size-4 shrink-0 text-fg-muted"
                          />
                          {appointment.doctor}
                        </span>
                      ) : null}
                      {appointment.location ? (
                        <span className="inline-flex min-w-0 items-center gap-inline-xs">
                          <MapPin
                            aria-hidden="true"
                            className="size-4 shrink-0 text-fg-muted"
                          />
                          <span className="truncate">
                            {appointment.location}
                          </span>
                        </span>
                      ) : null}
                    </span>
                    {appointment.notes ? (
                      <span className="flex items-start gap-inline-xs text-caption text-fg-muted">
                        <FileText
                          aria-hidden="true"
                          className="mt-0.5 size-3.5 shrink-0"
                        />
                        <span className="line-clamp-1">
                          {appointment.notes}
                        </span>
                      </span>
                    ) : null}
                  </span>

                  <ChevronRight
                    aria-hidden="true"
                    className="size-5 shrink-0 self-center text-fg-subtle transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {all.length > ahead.length ? (
        <p className="text-caption text-fg-muted">
          {isEs
            ? `${all.length - ahead.length} cita(s) más en Citas.`
            : `${all.length - ahead.length} more on Appointments.`}
        </p>
      ) : null}
    </Card>
  );
}

function HealthcareTeam() {
  const { t, language } = useLanguage();
  const isEs = language === "ES";
  const team = useHealthcareTeam();
  const [draft, setDraft] = useState<TeamDraft>({
    email: "",
    name: "",
    role: "nurse",
  });
  const [tried, setTried] = useState(false);
  const error = teamError(team.team, draft);
  const errorText =
    tried && error
      ? error === "duplicate"
        ? isEs
          ? "Esta persona ya está en su equipo."
          : "This person is already on your team."
        : isEs
          ? "Escriba un correo electrónico válido."
          : "Enter a valid email address."
      : undefined;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (error) return;
    team.invite(draft);
    setDraft({ email: "", name: "", role: draft.role });
    setTried(false);
  };

  return (
    <Card
      tone="default"
      as="section"
      id="healthcare-team"
      className="scroll-mt-24 space-y-stack-md border border-line bg-white shadow-card"
    >
      <div>
        <h2 className="text-heading-4 text-fg">
          {t("personalLogHub.team.title")}
        </h2>
        <p className="mt-stack-xs text-body-sm text-fg-muted">
          {isEs
            ? "Las personas que acepten su invitación aparecen en «Enviar a» cuando comparte sus registros."
            : "People who accept your invitation show up in “Send to” when you share your logs."}
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="grid gap-inline-md sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end"
      >
        <FormField
          label={isEs ? "Correo electrónico" : "Email"}
          error={errorText}
        >
          {(field) => (
            <Input
              {...field}
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              placeholder={t("personalLogHub.team.placeholder")}
              leadingIcon={<Mail />}
            />
          )}
        </FormField>
        <FormField label={isEs ? "Nombre (opcional)" : "Name (optional)"}>
          {(field) => (
            <Input
              {...field}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          )}
        </FormField>
        <FormField label={isEs ? "Función" : "Role"}>
          {(field) => (
            <Select
              {...field}
              value={draft.role}
              onChange={(e) =>
                setDraft({ ...draft, role: e.target.value as TeamRole })
              }
            >
              {TEAM_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {isEs ? role.es : role.en}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <Button type="submit" leadingIcon={<Plus />}>
          {isEs ? "Invitar" : "Invite"}
        </Button>
      </form>

      <p className="text-body-xs text-fg-muted">
        {t("personalLogHub.team.note")}
      </p>

      <Card padding="none" className="border border-line-subtle bg-white">
        {team.isPending ? (
          <Skeleton height={80} />
        ) : team.team.length === 0 ? (
          <EmptyState variant="bare" title={t("personalLogHub.team.empty")} />
        ) : (
          <ul className="divide-y divide-line-subtle">
            {team.team.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-inline-lg px-inset-md py-inset-sm"
              >
                <div className="min-w-0">
                  <p className="text-label-md text-fg">
                    {member.name || member.email}
                  </p>
                  <p className="text-body-sm text-fg-muted">
                    {roleLabel(member.role, isEs)}
                    {member.name ? ` · ${member.email}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-inline-sm">
                  <Badge
                    tone={member.status === "accepted" ? "success" : "info"}
                  >
                    {member.status === "accepted"
                      ? isEs
                        ? "Aceptó"
                        : "Accepted"
                      : t("personalLogHub.team.invited")}
                  </Badge>
                  {/* Until the server emails the invitation, the member can
                      play the other side of it. */}
                  {member.status === "invited" ? (
                    <Button
                      size="small"
                      variant="neutral"
                      appearance="fill-stroke"
                      onClick={() => team.accept(member.id)}
                    >
                      {isEs ? "Marcar aceptada" : "Mark accepted"}
                    </Button>
                  ) : null}
                  <Button
                    size="small"
                    variant="neutral"
                    appearance="ghost"
                    iconOnly
                    aria-label={
                      isEs
                        ? `Quitar a ${member.email}`
                        : `Remove ${member.email}`
                    }
                    onClick={() => team.remove(member.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Card>
  );
}

export default function PersonalLogPage() {
  const { t } = useLanguage();

  return (
    <NoticeRailLayout
      title={<PageTitle href="/dashboard/personal-log" />}
      notices={<PersonalLogDisclaimer spaced={false} stacked />}
    >
      <div className="w-full space-y-stack-xl">
        {/* Two across on a phone: nine full-width tiles were a long
            scroll (client review, 2026-10-08). */}
        <section className="grid grid-cols-2 gap-inset-sm sm:gap-inline-lg xl:grid-cols-4">
          {tileConfigs.map((tile) => (
            <Link
              key={tile.key}
              href={tile.href}
              className="flex flex-col items-center justify-center rounded-card border border-line bg-surface px-inset-sm py-inset-md transition-all duration-150 ease-standard hover:-translate-y-0.5 hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-inset-md sm:py-inset-lg"
            >
              <span
                className={`mb-stack-md flex h-12 w-12 items-center justify-center rounded-pill ${tile.iconBg}`}
              >
                <tile.icon
                  className={`h-icon-big w-icon-big ${tile.iconClass}`}
                />
              </span>
              <span className="text-center text-heading-5 text-fg">
                {t(`personalLogHub.tiles.${tile.key}`)}
              </span>
            </Link>
          ))}
        </section>

        <div className="space-y-stack-xl">
          <UpcomingAppointments />
          <HealthcareTeam />
        </div>
      </div>
    </NoticeRailLayout>
  );
}
