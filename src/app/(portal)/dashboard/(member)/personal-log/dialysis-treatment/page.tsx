"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Calendar,
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
import { mockDialysisEntries, DialysisLogEntry } from "@/features/personal-log/dialysisTreatmentData";
import { useLanguage } from "@/context/LanguageContext";
import MedicationsGivenSection from "@/features/personal-log/MedicationsGivenSection";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import {
  Badge,
  Button,
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
    <Card className="flex items-center gap-inline-lg">
      <span
        aria-hidden="true"
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-panel ${statToneClass[tone]}`}
      >
        <Icon className="h-icon-big w-icon-big" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-label-md text-fg">{label}</p>
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

function SummaryCards() {
  const { dictionary } = useLanguage();
  const dt = dictionary.dialysisTreatment;
  const summaryCards = [
    { label: dt?.summary?.attended || "Treatment attended", value: "90%", icon: CheckCircle2, tone: "success" as const },
    { label: dt?.summary?.arrivedLate || "Arrived late", value: "2", icon: Clock, tone: "warning" as const },
    { label: dt?.summary?.endedEarly || "Ended early", value: "4", icon: Timer, tone: "danger" as const },
    { label: dt?.summary?.missed || "Missed treatments", value: "2", icon: CalendarX, tone: "danger" as const },
  ];

  return (
    <section className="grid grid-cols-1 gap-inline-lg sm:grid-cols-2 xl:grid-cols-4">
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

function ClinicalMeasurementsCards() {
  const { dictionary } = useLanguage();
  const dt = dictionary.dialysisTreatment;
  const clinicalMeasurements = [
    { label: dt?.clinicalMeasurements?.fluidRemoved || "Fluid Removed", value: "2.3", unit: dt?.clinicalMeasurements?.liters || "Liters", icon: Droplets, tone: "brand" as const },
    { label: dt?.clinicalMeasurements?.postWeight || "Post Weight", value: "72.4", unit: "kg (pre: 74.7)", icon: Scale, tone: "success" as const },
    { label: dt?.clinicalMeasurements?.bloodPressure || "Blood Pressure", value: "118 / 72", unit: dt?.clinicalMeasurements?.mmHg || "mmHg", icon: Activity, tone: "accent" as const },
    { label: dt?.clinicalMeasurements?.heartRate || "Heart Rate", value: "78", unit: dt?.clinicalMeasurements?.bpm || "bpm", icon: HeartPulse, tone: "danger" as const },
  ];

  return (
    <section className="space-y-stack-md">
      <h2 className="flex items-center gap-inline-md text-heading-5 text-fg">
        <Activity aria-hidden="true" className="h-4 w-4 text-fg-brand" />
        <span>{dt?.clinicalMeasurements?.title || "Clinical Measurements"}</span>
      </h2>

      <div className="grid grid-cols-1 gap-inline-lg sm:grid-cols-2 xl:grid-cols-4">
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

function SymptomsDonut() {
  const { dictionary } = useLanguage();
  const dt = dictionary.dialysisTreatment;
  const symptomSlices = [
    {
      label: dt?.symptomsDonut?.cramping || "Cramping",
      count: 29,
      percent: 50,
      color: "var(--color-brand-600)",
    },
    {
      label: dt?.symptomsDonut?.lowBp || "Low BP",
      count: 16,
      percent: 28,
      color: "var(--color-warning-500)",
    },
    {
      label: dt?.symptomsDonut?.fatigue || "Fatigue",
      count: 13,
      percent: 22,
      color: "var(--color-danger-500)",
    },
  ];

  const size = 210;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedOffset = 0;

  return (
    <Card as="section" className="flex flex-col justify-between space-y-stack-lg">
      <h2 className="text-heading-5 text-fg">
        {dt?.symptomsDonut?.title || "Symptoms During Treatment"}
      </h2>

      <div className="relative flex justify-center items-center py-2">
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            className="-rotate-90"
            role="img"
            aria-label={symptomSlices
              .map((slice) => `${slice.label}: ${slice.count}, ${slice.percent} percent`)
              .join(". ")}
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--color-surface-sunken)"
              strokeWidth={strokeWidth}
            />
            {symptomSlices.map((slice) => {
              const strokeDasharray = `${(slice.percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedOffset;
              accumulatedOffset += (slice.percent / 100) * circumference;

              return (
                <circle
                  key={slice.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                />
              );
            })}
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-metric-md text-fg">86%</span>
            <span className="mt-stack-xs text-caption text-fg-muted">
              {dt?.symptomsDonut?.overall || "Overall"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-inline-md border-t border-line-subtle pt-inset-sm text-center">
        {symptomSlices.map((slice) => (
          <div key={slice.label} className="space-y-stack-xs">
            <div className="flex items-center justify-center gap-inline-xs text-caption text-fg-secondary">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-pill"
                style={{ backgroundColor: slice.color }}
              />
              <span>{slice.label}</span>
            </div>
            <p className="text-label-sm text-fg">
              {slice.count} ({slice.percent}%)
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** `2026-06-24` for a date input. */
function toDateInputValue(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Newest logged treatment, so the page opens on a day that has data. */
const LATEST_ENTRY_DATE =
  [...mockDialysisEntries]
    .map((entry) => entry.date)
    .sort()
    .pop() ?? toDateInputValue(new Date());

export default function DialysisTreatmentPage() {
  const { language, dictionary } = useLanguage();
  const dt = dictionary.dialysisTreatment;
  const isEs = language === "ES";
  const [selectedDate, setSelectedDate] = useState<string | null>(
    LATEST_ENTRY_DATE,
  );

  const visibleEntries = selectedDate
    ? mockDialysisEntries.filter((entry) => entry.date === selectedDate)
    : mockDialysisEntries;

  return (
    <div className="w-full space-y-stack-xl">
      <PersonalLogDisclaimer />

      {/* MONTH PICKER & ADD ENTRY BUTTON */}
      <div className="flex flex-col gap-inline-md sm:flex-row sm:items-center sm:justify-end">
        <div className="flex shrink-0 items-center gap-inline-md">
          <Input
            type="date"
            inputSize="small"
            className="w-auto"
            value={selectedDate ?? ""}
            aria-label={isEs ? "Elegir fecha" : "Pick a date"}
            leadingIcon={<Calendar />}
            onChange={(event) => setSelectedDate(event.target.value || null)}
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

      {/* TOP 4 SUMMARY CARDS */}
      <SummaryCards />

      {/* CLINICAL MEASUREMENTS */}
      <ClinicalMeasurementsCards />

      {/* MEDICATIONS GIVEN DURING DIALYSIS & SYMPTOMS DONUT */}
      <section className="grid grid-cols-1 items-stretch gap-inline-lg xl:grid-cols-12">
        <div className="xl:col-span-8">
          <MedicationsGivenSection />
        </div>
        <div className="xl:col-span-4">
          <SymptomsDonut />
        </div>
      </section>

      {/* DIALYSIS TREATMENT LOG ENTRIES TABLE */}
      <TreatmentEntriesTable
        entries={visibleEntries}
        onShowAll={() => setSelectedDate(null)}
      />
    </div>
  );
}

function AttendanceBadge({ status }: { status: DialysisLogEntry["attendance"] }) {
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
          <Button variant="neutral" appearance="fill-stroke" onClick={onShowAll}>
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
            <TableHeaderCell>{dt?.table?.treatmentType || "Treatment Type"}</TableHeaderCell>
            <TableHeaderCell numeric>{dt?.table?.fluidRemoved || "Fluid Removed"}</TableHeaderCell>
            <TableHeaderCell numeric>{dt?.table?.weight || "Pre / Post Weight"}</TableHeaderCell>
            <TableHeaderCell numeric>{dt?.table?.bloodPressure || "Blood Pressure"}</TableHeaderCell>
            <TableHeaderCell>{dt?.table?.symptoms || "Symptoms"}</TableHeaderCell>
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
                  <span className="block">{entry.displayDate.split(",")[1]}</span>
                  <span className="block text-caption font-normal text-fg-muted">
                    {entry.startTime} – {entry.endTime}
                  </span>
                </TableCell>

                <TableCell>{entry.treatmentType}</TableCell>

                <TableCell numeric>
                  <Badge tone="info">{entry.fluidRemoved}</Badge>
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
                  <AttendanceBadge status={entry.attendance} />
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
                      title={dt?.table?.viewTooltip || "View Full Entry Details"}
                      aria-label={`View full entry for ${entry.displayDate}`}
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
                      aria-label={`Edit entry for ${entry.displayDate}`}
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
