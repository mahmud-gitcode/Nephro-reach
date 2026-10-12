"use client";

import { PageTitle } from "@/components/layout/PageTitle";
import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Calendar,
  CalendarCheck,
  CalendarX,
  CheckCircle2,
  Clock,
  Droplets,
  Eye,
  HeartPulse,
  Pencil,
  Plus,
  Scale,
  Timer,
} from "lucide-react";
import type { DialysisLogEntry } from "@/features/personal-log/dialysisTreatmentData";
import { useTreatmentLog } from "@/features/personal-log/dialysis/useTreatmentLog";
import { useDialysisSchedule } from "@/features/personal-log/dialysis/useDialysisSchedule";
import {
  attendanceOf,
  fluidRemovedKg,
  intraSymptomCounts,
  monthSummary,
  uncharted,
} from "@/features/personal-log/dialysis/treatmentLog";
import { useLanguage } from "@/context/LanguageContext";
import MedicationsGivenSection from "@/features/personal-log/MedicationsGivenSection";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import ModalityTabs from "@/features/personal-log/dialysis/ModalityTabs";
import MachineWaterCard from "@/features/personal-log/dialysis/MachineWaterCard";
import HelpfulTipsCard from "@/features/personal-log/dialysis/HelpfulTipsCard";
import PdExchangeLog from "@/features/personal-log/dialysis/PdExchangeLog";
import { useDialysisModality } from "@/features/personal-log/dialysis/useDialysisModality";
import {
  Alert,
  Badge,
  Button,
  DonutChart,
  buttonStyles,
  Card,
  EmptyState,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";

type StatTone = "brand" | "success" | "warning" | "danger" | "accent";

const statToneClass: Record<StatTone, string> = {
  brand: "bg-brand-100 text-brand-700",
  success: "bg-success-100 text-success-700",
  warning: "bg-warning-100 text-warning-700",
  danger: "bg-danger-100 text-danger-700",
  accent: "bg-accent-100 text-accent-700",
};

/* Two sections on this page draw the same icon + label + value tile, so it
   lives here once. Kept local rather than in components/ui: every other page
   shapes its tiles differently, and a shared version would be all props. */
function StatTile({
  icon: Icon,
  tone,
  label,
  value,
  unit,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tone: StatTone;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    /* Icon above the figure on a phone, where two cards share a row. */
    <Card className="flex flex-col items-start gap-inline-md max-sm:p-inset-sm sm:flex-row sm:items-center sm:gap-inline-lg">
      <span
        aria-hidden="true"
        className={`flex size-11 shrink-0 items-center justify-center rounded-panel sm:size-14 ${statToneClass[tone]}`}
      >
        <Icon className="h-icon-big w-icon-big" />
      </span>
      <div className="min-w-0">
        <p className="text-label-md text-fg">{label}</p>
        <p className="mt-stack-xs flex items-baseline gap-inline-xs">
          <span className="text-metric-md text-fg">{value}</span>
          {unit ? (
            <span className="text-body-sm text-fg-secondary">{unit}</span>
          ) : null}
        </p>
      </div>
    </Card>
  );
}

/* The month's attendance, counted from what the member charted (client,
   2026-10-12: attended, arrived late, ended early, missed — this month). */
function SummaryCards({
  entries,
  monthKey,
  isHome,
}: {
  entries: DialysisLogEntry[];
  monthKey: string;
  isHome: boolean;
}) {
  const { dictionary, language } = useLanguage();
  const isEs = language === "ES";
  const dt = dictionary.dialysisTreatment;
  const month = monthSummary(entries, monthKey);
  const charted = month.attended + month.missed;
  const summaryCards = [
    {
      label: dt?.summary?.attended || "Treatment attended",
      value: charted ? `${Math.round((month.attended / charted) * 100)}%` : "—",
      icon: CheckCircle2,
      tone: "success" as const,
    },
    /* Arriving late means nothing at home (client, 2026-10-12). */
    ...(isHome
      ? []
      : [
          {
            label: dt?.summary?.arrivedLate || "Arrived late",
            value: String(month.arrivedLate),
            icon: Clock,
            tone: "warning" as const,
          },
        ]),
    {
      label: dt?.summary?.endedEarly || "Ended early",
      value: String(month.endedEarly),
      icon: Timer,
      tone: "danger" as const,
    },
    {
      label: dt?.summary?.missed || "Missed treatments",
      value: String(month.missed),
      icon: CalendarX,
      tone: "danger" as const,
    },
    {
      label: isEs ? "Reprogramados" : "Rescheduled",
      value: String(month.rescheduled),
      icon: CalendarCheck,
      tone: "accent" as const,
    },
  ];

  return (
    <section
      aria-label={isEs ? "Este mes" : "This month"}
      className="grid grid-cols-2 gap-inset-sm sm:gap-inline-lg xl:grid-cols-4"
    >
      {summaryCards.map((card) => (
        <StatTile
          key={card.label}
          icon={card.icon}
          tone={card.tone}
          label={card.label}
          value={card.value}
        />
      ))}
    </section>
  );
}

/* The charted session's numbers: pre and post side by side, and the fluid
   removed worked out from the two weights (client, 2026-10-12). */
function ClinicalMeasurementsCards({
  entry,
}: {
  entry: DialysisLogEntry | undefined;
}) {
  const { dictionary, language } = useLanguage();
  const isEs = language === "ES";
  const dt = dictionary.dialysisTreatment;
  const removed = entry
    ? fluidRemovedKg(entry.preWeight, entry.postWeight)
    : null;
  const dash = (v: string | undefined) => (v && v.trim() ? v : "—");
  const clinicalMeasurements = [
    {
      label: dt?.clinicalMeasurements?.fluidRemoved || "Fluid Removed",
      value: removed === null ? "—" : String(removed),
      unit: "kg ≈ L",
      icon: Droplets,
      tone: "brand" as const,
    },
    {
      label: isEs ? "Peso antes / después" : "Pre / Post Weight",
      value: `${dash(entry?.preWeight)} / ${dash(entry?.postWeight)}`,
      unit: "kg",
      icon: Scale,
      tone: "success" as const,
    },
    {
      label: isEs ? "Presión antes / después" : "BP Pre / Post",
      value: `${dash(entry?.preBloodPressure)} · ${dash(entry?.bloodPressurePost)}`,
      unit: dt?.clinicalMeasurements?.mmHg || "mmHg",
      icon: Activity,
      tone: "accent" as const,
    },
    {
      label: isEs ? "Pulso antes / después" : "Heart Rate Pre / Post",
      value: `${dash(entry?.preHeartRate)} / ${dash(entry?.heartRatePost)}`,
      unit: dt?.clinicalMeasurements?.bpm || "bpm",
      icon: HeartPulse,
      tone: "danger" as const,
    },
  ];

  return (
    <section className="space-y-stack-md">
      <h2 className="flex items-center gap-inline-md text-heading-4 text-fg">
        <Activity aria-hidden="true" className="h-4 w-4 text-fg-brand" />
        <span>
          {dt?.clinicalMeasurements?.title || "Clinical Measurements"}
        </span>
        {entry ? (
          <span className="text-body-sm font-normal text-fg-muted">
            · {entry.displayDate}
          </span>
        ) : null}
      </h2>

      <div className="grid grid-cols-2 gap-inset-sm sm:gap-inline-lg xl:grid-cols-4">
        {clinicalMeasurements.map((card) => (
          <StatTile
            key={card.label}
            icon={card.icon}
            tone={card.tone}
            label={card.label}
            value={card.value}
            unit={card.unit}
          />
        ))}
      </div>
    </section>
  );
}

const SYMPTOM_LABEL: Record<string, { en: string; es: string }> = {
  cramping: { en: "Cramping", es: "Calambres" },
  dizziness: { en: "Dizziness", es: "Mareo" },
  swelling: { en: "Swelling", es: "Hinchazón" },
  shortnessOfBreath: { en: "Shortness of breath", es: "Falta de aire" },
  lowBp: { en: "Low BP", es: "Presión baja" },
  highBp: { en: "High BP", es: "Presión alta" },
  fatigue: { en: "Fatigue", es: "Fatiga" },
};

/* How often each symptom came up during the member's charted treatments. */
function SymptomsDonut({ entries }: { entries: DialysisLogEntry[] }) {
  const { dictionary, language } = useLanguage();
  const isEs = language === "ES";
  const dt = dictionary.dialysisTreatment;
  const attended = entries.filter((e) => attendanceOf(e) !== "Missed");
  const counts = intraSymptomCounts(attended).filter((c) => c.count > 0);
  const label = dt?.symptomsDonut?.title || "Symptoms During Treatment";

  return (
    <Card as="section" className="flex flex-col space-y-stack-lg">
      <h2 className="text-heading-4 text-fg">{label}</h2>
      {counts.length === 0 ? (
        <p className="text-body-sm text-fg-muted">
          {isEs
            ? "Ningún síntoma registrado durante sus tratamientos."
            : "No symptoms charted during your treatments."}
        </p>
      ) : (
        <>
          <DonutChart
            className="self-center"
            label={label}
            segments={counts.map((c) => ({
              label: isEs ? SYMPTOM_LABEL[c.key].es : SYMPTOM_LABEL[c.key].en,
              value: c.count,
            }))}
            centerValue={attended.length}
            centerLabel={isEs ? "tratamientos" : "treatments"}
          />
          <ul className="grid grid-cols-2 gap-inline-md border-t border-line-subtle pt-inset-sm">
            {counts.map((c) => (
              <li key={c.key} className="text-caption text-fg-secondary">
                {isEs ? SYMPTOM_LABEL[c.key].es : SYMPTOM_LABEL[c.key].en}:{" "}
                <span className="text-label-sm text-fg">
                  {c.count} / {attended.length}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

/** `2026-06-24` for a date input. */
function toDateInputValue(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function DialysisTreatmentPage() {
  const { language, dictionary } = useLanguage();
  const dt = dictionary.dialysisTreatment;
  const isEs = language === "ES";
  const modalityLog = useDialysisModality();
  const log = useTreatmentLog();
  const schedule = useDialysisSchedule();
  const todayIso = toDateInputValue(new Date());
  /* Null shows every date; the page opens on all of them. */
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const isHome = modalityLog.modality === "home-hd";
  /* In-center and home logs are kept apart (client, 2026-10-12: "all three
     of these are different"). Sample entries carry no modality: in-center. */
  const entries = log.entries.filter(
    (e) =>
      (e.modality ?? "in-center-hd") === (isHome ? "home-hd" : "in-center-hd"),
  );
  const visibleEntries = selectedDate
    ? entries.filter((entry) => entry.date === selectedDate)
    : entries;
  const latestAttended = visibleEntries.find(
    (e) => attendanceOf(e) !== "Missed",
  );
  /* Scheduled days in the last week with nothing charted. */
  const notCharted = uncharted(schedule.periods, log.entries, todayIso);

  return (
    <div className="w-full space-y-stack-xl">
      {/* Named on screen: on a phone the breadcrumb is hidden. */}
      <PageTitle
        href="/dashboard/personal-log/dialysis-treatment"
        title={isEs ? "Tratamiento de Diálisis" : "Dialysis Treatment"}
      />
      <PersonalLogDisclaimer />

      {/* Which kind of dialysis this member is on. Everything below is
          written for a chair at a centre, so a member on PD needs to be
          able to say so before the page asks them for a chair time. */}
      <ModalityTabs log={modalityLog} showPdRhythm />

      {modalityLog.modality === "pd" ? (
        <PdExchangeLog
          log={modalityLog}
          date={selectedDate ?? todayIso}
          dayLabel={formatPdDayLabel(selectedDate ?? todayIso, isEs)}
        />
      ) : (
        <>
          {/* MONTH PICKER & ADD ENTRY BUTTON */}
          <div className="flex flex-col gap-inline-md sm:flex-row sm:items-center sm:justify-end">
            {/* Wraps on a phone: on one line it pushed Add Treatment off
                the screen (client review, 2026-10-08). */}
            <div className="flex flex-wrap items-center gap-inline-md sm:shrink-0 sm:flex-nowrap">
              {/* A fixed width: Safari on iPad and iPhone draws a date field
                  wider than its box and it slid over the Today button
                  beside it (client screenshot, 2026-10-04). */}
              <Input
                type="date"
                inputSize="small"
                className="w-44 min-w-0 appearance-none"
                value={selectedDate ?? ""}
                aria-label={isEs ? "Elegir fecha" : "Pick a date"}
                leadingIcon={<Calendar />}
                onChange={(event) =>
                  setSelectedDate(event.target.value || null)
                }
                onClick={(event) => {
                  // Tapping anywhere on the field opens the calendar, not just
                  // the browser's own small icon.
                  const input = event.currentTarget;
                  if (typeof input.showPicker === "function") {
                    try {
                      input.showPicker();
                    } catch {
                      // Some browsers refuse outside a user gesture; focusing
                      // still lets the field be typed into.
                    }
                  }
                }}
              />

              <Button
                size="small"
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setSelectedDate(toDateInputValue(new Date()))}
              >
                {isEs ? "Hoy" : "Today"}
              </Button>

              <Link
                href="/dashboard/personal-log/dialysis-treatment/add"
                className={buttonStyles({ size: "small" })}
              >
                <Plus />
                <span>{dt?.addEntry || "Add Treatment"}</span>
              </Link>
            </div>
          </div>

          {/* "Did you miss a treatment?" — a scheduled day with nothing
              charted (client, 2026-10-12). */}
          {notCharted.length > 0 ? (
            <Alert
              tone="info"
              title={
                isEs
                  ? "¿Tuvo estos tratamientos?"
                  : "Did you have these treatments?"
              }
            >
              <ul className="mt-stack-xs space-y-stack-sm">
                {notCharted.slice(0, 3).map((day) => (
                  <li
                    key={day.date}
                    className="flex flex-wrap items-center gap-inline-md"
                  >
                    <span className="min-w-40 text-body-sm">
                      {formatPdDayLabel(day.date, isEs)}
                    </span>
                    <Link
                      href={`/dashboard/personal-log/dialysis-treatment/add?date=${day.date}`}
                      className={buttonStyles({ size: "small" })}
                    >
                      {isEs ? "Registrarlo" : "Chart it"}
                    </Link>
                    <Button
                      size="small"
                      variant="neutral"
                      appearance="fill-stroke"
                      onClick={() =>
                        log.markMissed(
                          day.date,
                          isHome ? "home-hd" : "in-center-hd",
                        )
                      }
                    >
                      {isEs ? "Lo perdí" : "I missed it"}
                    </Button>
                  </li>
                ))}
              </ul>
            </Alert>
          ) : null}

          {/* THIS MONTH'S ATTENDANCE */}
          <SummaryCards
            entries={entries}
            monthKey={todayIso.slice(0, 7)}
            isHome={isHome}
          />

          {/* At home the member owns the machine, so its maintenance is
              tracked here. The session's vitals are charted with the
              treatment itself — pre and post — rather than in a second
              card that asked for the same numbers (client, 2026-10-12). */}
          {isHome ? <MachineWaterCard /> : null}

          {/* CLINICAL MEASUREMENTS */}
          <ClinicalMeasurementsCards entry={latestAttended} />

          {/* MEDICATIONS GIVEN DURING DIALYSIS & SYMPTOMS DONUT */}
          <section className="grid grid-cols-1 items-stretch gap-inline-lg xl:grid-cols-12 [&>*]:min-w-0">
            <div className="xl:col-span-8">
              <MedicationsGivenSection
                treatmentDate={latestAttended?.date ?? todayIso}
              />
            </div>
            <div className="xl:col-span-4">
              <SymptomsDonut entries={entries} />
            </div>
          </section>

          {/* DIALYSIS TREATMENT LOG ENTRIES TABLE */}
          <TreatmentEntriesTable
            entries={visibleEntries}
            onShowAll={() => setSelectedDate(null)}
          />
        </>
      )}

      {/* Advice last, below the fields: a member opening this came to record
          a session, not to read. */}
      <HelpfulTipsCard modality={modalityLog.modality} />
    </div>
  );
}

/** "Wednesday, Jun 24" — the day the PD exchanges below belong to. */
function formatPdDayLabel(iso: string, isEs: boolean): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  /* Built from the parts rather than parsed: `new Date("2026-06-24")` is
     midnight UTC, which is the previous day west of Greenwich. */
  return new Date(year, month - 1, day).toLocaleDateString(
    isEs ? "es-ES" : "en-US",
    { weekday: "long", month: "short", day: "numeric" },
  );
}

function AttendanceBadge({
  status,
}: {
  status: DialysisLogEntry["attendance"];
}) {
  const { dictionary } = useLanguage();
  const dt = dictionary.dialysisTreatment;
  const tone = {
    Attended: "success",
    "Arrived Late": "warning",
    "Ended Early": "danger",
    Missed: "danger",
  }[status] as "success" | "warning" | "danger";

  const labels: Record<DialysisLogEntry["attendance"], string> = {
    Attended: dt?.table?.statusAttended || "Attended",
    "Arrived Late": dt?.table?.statusLate || "Arrived Late",
    "Ended Early": dt?.table?.statusEarly || "Ended Early",
    Missed: dt?.table?.statusMissed || "Missed",
  };

  return <Badge tone={tone}>{labels[status] || status}</Badge>;
}

function TreatmentEntriesTable({
  entries,
  onShowAll,
}: {
  entries: DialysisLogEntry[];
  onShowAll: () => void;
}) {
  const { language, dictionary } = useLanguage();
  const isEs = language === "ES";
  const dt = dictionary.dialysisTreatment;

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<Calendar />}
        title={
          isEs
            ? "No hay tratamiento registrado en esta fecha."
            : "No treatment logged on this date."
        }
        action={
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={onShowAll}
          >
            {isEs ? "Ver todas las fechas" : "Show all dates"}
          </Button>
        }
      />
    );
  }

  return (
    <Card as="section" padding="none" className="overflow-hidden">
      <Table minWidth={900}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{dt?.table?.date || "Date"}</TableHeaderCell>
            <TableHeaderCell>
              {dt?.table?.treatmentType || "Treatment Type"}
            </TableHeaderCell>
            <TableHeaderCell numeric>
              {dt?.table?.fluidRemoved || "Fluid Removed"}
            </TableHeaderCell>
            <TableHeaderCell numeric>
              {dt?.table?.weight || "Pre / Post Weight"}
            </TableHeaderCell>
            <TableHeaderCell numeric>
              {dt?.table?.bloodPressure || "Blood Pressure"}
            </TableHeaderCell>
            <TableHeaderCell>
              {dt?.table?.symptoms || "Symptoms"}
            </TableHeaderCell>
            <TableHeaderCell>{dt?.table?.status || "Status"}</TableHeaderCell>
            <TableHeaderCell>{dt?.table?.actions || "Actions"}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((entry) => {
            const symptomsList = entry.preSymptoms
              .concat(entry.intraSymptoms)
              .filter((s) => s !== "None / Comfortable")
              .slice(0, 2);

            return (
              <TableRow key={entry.id}>
                <TableCell emphasis>
                  <span className="block">
                    {entry.displayDate.split(",").slice(0, 2).join(",")}
                  </span>
                  <span className="block text-caption font-normal text-fg-muted">
                    {entry.startTime} – {entry.endTime}
                  </span>
                </TableCell>

                <TableCell>{entry.treatmentType}</TableCell>

                <TableCell numeric>
                  {entry.fluidRemoved ? (
                    <Badge tone="info">{entry.fluidRemoved}</Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>

                <TableCell numeric>
                  <span className="block">
                    {entry.preWeight} → {entry.postWeight}
                  </span>
                  <span className="block text-caption text-success">
                    {entry.weightDiff}
                  </span>
                </TableCell>

                <TableCell numeric>
                  <span className="block">{entry.bloodPressurePost}</span>
                  <span className="block text-caption text-fg-muted">
                    {entry.heartRatePost}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="flex max-w-[180px] flex-wrap gap-inline-xs">
                    {symptomsList.length > 0 ? (
                      symptomsList.map((sym) => (
                        <Badge key={sym} tone="neutral">
                          {sym}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-caption text-fg-subtle">
                        {dt?.table?.none || "None"}
                      </span>
                    )}
                  </span>
                </TableCell>

                <TableCell>
                  <AttendanceBadge status={attendanceOf(entry)} />
                  {entry.status === "rescheduled" ? (
                    <Badge tone="info" className="mt-stack-xs">
                      {isEs ? "Reposición" : "Make-up"}
                    </Badge>
                  ) : null}
                </TableCell>

                <TableCell>
                  <span className="flex items-center gap-inline-md">
                    <Link
                      href={`/dashboard/personal-log/dialysis-treatment/view?id=${entry.id}`}
                      className={buttonStyles({
                        variant: "neutral",
                        appearance: "fill-stroke",
                        size: "small",
                        iconOnly: true,
                      })}
                      title={
                        dt?.table?.viewTooltip || "View Full Entry Details"
                      }
                      aria-label={`${isEs ? "Ver el registro completo del" : "View full entry for"} ${entry.displayDate}`}
                    >
                      <Eye />
                    </Link>

                    <Link
                      href={`/dashboard/personal-log/dialysis-treatment/add?edit=${entry.id}`}
                      className={buttonStyles({
                        variant: "neutral",
                        appearance: "fill-stroke",
                        size: "small",
                        iconOnly: true,
                      })}
                      title={dt?.table?.editTooltip || "Edit Entry"}
                      aria-label={`${isEs ? "Editar el registro del" : "Edit entry for"} ${entry.displayDate}`}
                    >
                      <Pencil />
                    </Link>
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
