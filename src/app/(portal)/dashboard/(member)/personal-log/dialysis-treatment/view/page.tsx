"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  Angry,
  ArrowLeft,
  Calendar,
  Droplets,
  Frown,
  HeartPulse,
  Laugh,
  Meh,
  Pencil,
  Pill,
  Scale,
  Smile,
} from "lucide-react";
import {
  mockDialysisEntries,
  DialysisLogEntry,
} from "@/features/personal-log/dialysisTreatmentData";
import { useLanguage } from "@/context/LanguageContext";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import { Badge, buttonStyles, Card } from "@/components/ui";

const MOOD_CONFIG: Record<
  number,
  {
    key: "great" | "good" | "okay" | "low" | "poor";
    defaultLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  5: {
    key: "great",
    defaultLabel: "Great",
    icon: Laugh,
    color: "text-success-600",
  },
  4: {
    key: "good",
    defaultLabel: "Good",
    icon: Smile,
    color: "text-success-500",
  },
  3: {
    key: "okay",
    defaultLabel: "Okay",
    icon: Meh,
    color: "text-warning-600",
  },
  2: {
    key: "low",
    defaultLabel: "Low",
    icon: Frown,
    color: "text-warning-700",
  },
  1: {
    key: "poor",
    defaultLabel: "Poor",
    icon: Angry,
    color: "text-danger-600",
  },
};

function DetailRow({
  label,
  value,
  isHighlight,
}: {
  label: string;
  value: string | number;
  isHighlight?: boolean;
}) {
  const isAffirmative = value === "Yes" || value === "Sí";
  return (
    <Card
      padding="small"
      className="flex h-full items-center justify-between gap-inline-lg"
    >
      <span className="text-body-md text-fg-secondary">{label}</span>
      <Badge tone={isHighlight || isAffirmative ? "info" : "neutral"}>
        {value}
      </Badge>
    </Card>
  );
}

function TreatmentDetailContent() {
  const { dictionary } = useLanguage();
  const dt = dictionary.dialysisTreatment;
  const searchParams = useSearchParams();
  const entryId = searchParams.get("id") || "entry-01";

  const entry: DialysisLogEntry =
    mockDialysisEntries.find((e) => e.id === entryId) || mockDialysisEntries[0];

  const preMoodConfig = MOOD_CONFIG[entry.preOverallFeel] || MOOD_CONFIG[4];
  const PreMoodIcon = preMoodConfig.icon;
  const preMoodLabel =
    dt?.detail?.moods?.[preMoodConfig.key] || preMoodConfig.defaultLabel;

  const formatYesNo = (val: string | number) => {
    if (val === "Yes") return dt?.detail?.yes || "Yes";
    if (val === "No") return dt?.detail?.no || "No";
    return val;
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-stack-xl text-fg-secondary">
      {/* HEADER BAR: BACK LINK & EDIT ACTION */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard/personal-log/dialysis-treatment"
          className={buttonStyles({
            variant: "neutral",
            appearance: "stroke",
            size: "small",
          })}
        >
          <ArrowLeft />
          <span>{dt?.backToTreatment || "Back to Dialysis Treatment"}</span>
        </Link>

        <Link
          href={`/dashboard/personal-log/dialysis-treatment/add?edit=${entry.id}`}
          className={buttonStyles({ size: "small" })}
        >
          <Pencil />
          <span>{dt?.editEntry || "Edit Entry"}</span>
        </Link>
      </div>

      {/* CARD 1: SESSION INFORMATION (MATCHING FORM CARD 1) */}
      <div className="w-full space-y-stack-lg rounded-card border border-line bg-surface p-inset-lg shadow-card">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-heading-3 text-fg">
              {dt?.detail?.title || "Dialysis Day Log"}
            </h1>
            <p className="mt-stack-xs text-caption text-fg-muted">
              {entry.displayDate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge tone="neutral" icon={<Calendar />}>
              <span>
                {dt?.detail?.dialysisDay || "Dialysis Day"}:{" "}
                {entry.isDialysisDay
                  ? dt?.detail?.yes || "Yes"
                  : dt?.detail?.no || "No"}
              </span>
            </Badge>
          </div>
        </div>

        {/* 6-Column Summary Bar */}
        <div className="grid grid-cols-2 divide-y divide-line-subtle rounded-card border border-line bg-surface-sunken p-inset-sm text-caption shadow-control sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-6">
          <div className="min-w-0 px-3 py-1.5 sm:py-0">
            <p className="text-caption text-fg-muted">
              {dt?.detail?.summaryBar?.treatmentType || "Treatment Type"}
            </p>
            <p className="mt-stack-xs truncate text-label-sm text-fg">
              {entry.treatmentType}
            </p>
          </div>

          <div className="min-w-0 px-3 py-1.5 sm:py-0">
            <p className="text-caption text-fg-muted">
              {dt?.detail?.summaryBar?.startTime || "Start Time"}
            </p>
            <p className="mt-stack-xs truncate text-label-sm text-fg">
              {entry.startTime}
            </p>
          </div>

          <div className="min-w-0 px-3 py-1.5 sm:py-0">
            <p className="text-caption text-fg-muted">
              {dt?.detail?.summaryBar?.endTime || "End Time"}
            </p>
            <p className="mt-stack-xs truncate text-label-sm text-fg">
              {entry.endTime}
            </p>
          </div>

          <div className="min-w-0 px-3 py-1.5 sm:py-0">
            <p className="text-caption text-fg-muted">
              {dt?.detail?.summaryBar?.location || "Location"}
            </p>
            <p className="mt-stack-xs truncate text-label-sm text-fg">
              {entry.location}
            </p>
          </div>

          <div className="min-w-0 px-3 py-1.5 sm:py-0">
            <p className="text-caption text-fg-muted">
              {dt?.detail?.summaryBar?.careTeam || "Care Team"}
            </p>
            <p className="mt-stack-xs truncate text-label-sm text-fg">
              {entry.careTeam}
            </p>
          </div>

          <div className="min-w-0 px-3 py-1.5 sm:py-0">
            <p className="text-caption text-fg-muted">
              {dt?.detail?.summaryBar?.postWeight || "Post Weight"}
            </p>
            <p className="mt-stack-xs truncate text-label-sm text-fg">
              {entry.postWeightSummary}
            </p>
          </div>
        </div>
      </div>

      {/* CARD 2: LOGGED CLINICAL DATA (MATCHING FORM CARD 2 / STEPS) */}
      <div className="w-full space-y-8 rounded-panel border border-line bg-surface p-6 shadow-card sm:p-8">
        {/* 1. ATTENDANCE & SCHEDULE */}
        <section className="space-y-3">
          <h2 className="text-heading-5 text-fg">
            {dt?.detail?.attendanceSchedule?.title || "Attendance & Schedule"}
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <DetailRow
              label={
                dt?.detail?.attendanceSchedule?.attended || "Treatment attended"
              }
              value={formatYesNo(entry.attended)}
            />
            <DetailRow
              label={
                dt?.detail?.attendanceSchedule?.arrivedLate || "Arrived late"
              }
              value={formatYesNo(entry.arrivedLate)}
            />
            <DetailRow
              label={
                dt?.detail?.attendanceSchedule?.endedEarly || "Ended early"
              }
              value={formatYesNo(entry.endedEarly)}
            />
            <DetailRow
              label={
                dt?.detail?.attendanceSchedule?.missed || "Missed treatments"
              }
              value={entry.missedTreatments}
            />
            <div className="md:col-span-2">
              <DetailRow
                label={
                  dt?.detail?.attendanceSchedule?.rescheduled ||
                  "Rescheduled missed treatment"
                }
                value={formatYesNo(entry.rescheduled)}
              />
            </div>
          </div>
        </section>

        {/* 2. PRE-TREATMENT CONDITION */}
        <section className="space-y-stack-lg border-t border-line-subtle pt-inset-lg">
          <h2 className="text-heading-5 text-fg">
            {dt?.detail?.preTreatment?.title || "Pre-Treatment Condition"}
          </h2>

          {/* Selected Mood Display */}
          <div className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface-sunken p-4">
            <span className="text-body-md text-fg-secondary">
              {dt?.detail?.preTreatment?.overallFeel || "Overall Feel"}
            </span>
            <div className="flex items-center gap-2.5 rounded-card border border-primary-edge bg-surface px-inset-md py-inset-xs shadow-control">
              <div className="relative flex items-center justify-center">
                <span className="absolute inset-0.5 rounded-full bg-surface shadow-control" />
                <PreMoodIcon
                  className={`relative size-7 ${preMoodConfig.color}`}
                />
              </div>
              <span className="text-sm font-bold text-fg">{preMoodLabel}</span>
            </div>
          </div>

          {/* Selected Pre-Dialysis Symptoms */}
          <div className="space-y-stack-sm rounded-card border border-line-subtle bg-surface-sunken p-inset-md">
            <h3 className="text-heading-5 text-fg">
              {dt?.detail?.preTreatment?.preSymptoms || "Pre-Dialysis Symptoms"}
            </h3>
            <div className="flex flex-wrap gap-inline-md">
              {entry.preSymptoms.length > 0 ? (
                entry.preSymptoms.map((sym) => (
                  <span
                    key={sym}
                    className="rounded-control border border-transparent bg-primary-solid px-inset-sm py-1 text-label-sm text-primary-on-solid shadow-control"
                  >
                    {sym}
                  </span>
                ))
              ) : (
                <span className="text-caption text-fg-subtle">
                  {dt?.detail?.preTreatment?.noneReported || "None reported"}
                </span>
              )}
            </div>
          </div>

          {/* Symptom Severity if reported */}
          {Object.keys(entry.preSeverity).length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-heading-5 text-fg">
                {dt?.detail?.preTreatment?.severity ||
                  "Symptom Severity (0–10)"}
              </h3>
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {Object.entries(entry.preSeverity).map(([symptom, score]) => (
                  <div
                    key={symptom}
                    className="flex items-center justify-between gap-4 rounded-xl border border-line-subtle bg-surface-sunken/50 p-3"
                  >
                    <span className="text-body-md text-fg-secondary">
                      {symptom}
                    </span>
                    <span className="flex size-7 items-center justify-center rounded-control-small bg-primary-solid text-label-sm text-primary-on-solid shadow-control">
                      {score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 3. DURING TREATMENT */}
        <section className="space-y-stack-lg border-t border-line-subtle pt-inset-lg">
          <h2 className="text-heading-5 text-fg">
            {dt?.detail?.duringTreatment?.title || "During Treatment"}
          </h2>

          {/* Sequential for extra fluid removal */}
          <DetailRow
            label={
              dt?.detail?.duringTreatment?.sequential ||
              "Sequential for extra fluid removal"
            }
            value={formatYesNo(entry.sequentialFluidRemoval || "No")}
          />

          {/* Core 5-state intra symptoms */}
          <div className="space-y-2">
            <DetailRow
              label={dt?.detail?.duringTreatment?.cramping || "Cramping"}
              value={formatYesNo(entry.cramping)}
            />
            <DetailRow
              label={dt?.detail?.duringTreatment?.lowBp || "Low BP"}
              value={formatYesNo(entry.lowBp)}
            />
            <DetailRow
              label={dt?.detail?.duringTreatment?.highBp || "High BP"}
              value={formatYesNo(entry.highBp || "No")}
            />
            <DetailRow
              label={dt?.detail?.duringTreatment?.fatigue || "Fatigue"}
              value={formatYesNo(entry.fatigue)}
            />
          </div>

          {/* Additional Symptoms */}
          {entry.intraSymptoms.length > 0 && (
            <div className="space-y-stack-sm rounded-card border border-line-subtle bg-surface-sunken p-inset-md">
              <h3 className="text-heading-5 text-fg">
                {dt?.detail?.duringTreatment?.additionalSymptoms ||
                  "Additional Symptoms"}
              </h3>
              <div className="flex flex-wrap gap-inline-md">
                {entry.intraSymptoms.map((sym) => (
                  <span
                    key={sym}
                    className="rounded-control border border-transparent bg-primary-solid px-inset-sm py-1 text-label-sm text-primary-on-solid shadow-control"
                  >
                    {sym}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Session Notes */}
          {entry.intraNotes && (
            <div className="space-y-2 rounded-card border border-line-subtle bg-surface-sunken p-4">
              <h3 className="text-heading-5 text-fg">
                {dt?.detail?.duringTreatment?.sessionNotes || "Session Notes"}
              </h3>
              <p className="rounded-card border border-line bg-surface p-inset-sm text-body-sm text-fg-secondary">
                {entry.intraNotes}
              </p>
            </div>
          )}
        </section>

        {/* 4. RECOVERY & CLINICAL VITALS */}
        <section className="space-y-stack-lg border-t border-line-subtle pt-inset-lg">
          <h2 className="text-heading-5 text-fg">
            {dt?.detail?.recoveryVitals?.title || "Recovery & Clinical Vitals"}
          </h2>

          {/* Post-Treatment Recovery */}
          <div className="space-y-2">
            <DetailRow
              label={
                dt?.detail?.recoveryVitals?.recoveryTime || "Recovery time"
              }
              value={formatYesNo(entry.recoveryTime)}
            />
            <DetailRow
              label={
                dt?.detail?.recoveryVitals?.medsTaken ||
                "Prescribed medications taken"
              }
              value={formatYesNo(entry.medsTakenPrescribed)}
            />
          </div>

          {/* Clinical Measurements (4 Vitals Cards from Form) */}
          <div className="space-y-3 pt-2">
            <h3 className="text-heading-5 text-fg">
              {dt?.detail?.recoveryVitals?.measurements ||
                "Clinical Measurements"}
            </h3>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="space-y-stack-xs rounded-card border border-line bg-surface p-inset-md shadow-card">
                <div className="flex items-center justify-between text-fg-secondary">
                  <span className="text-xs font-semibold">
                    {dt?.clinicalMeasurements?.fluidRemoved || "Fluid Removed"}
                  </span>
                  <Droplets className="size-4 text-fg-subtle" />
                </div>
                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className="text-metric-sm text-fg">
                    {entry.fluidRemoved}
                  </span>
                  <span className="text-caption text-fg-muted">
                    {dt?.clinicalMeasurements?.liters || "Liters"}
                  </span>
                </div>
              </div>

              <div className="space-y-stack-xs rounded-card border border-line bg-surface p-inset-md shadow-card">
                <div className="flex items-center justify-between text-fg-secondary">
                  <span className="text-xs font-semibold">
                    {dt?.clinicalMeasurements?.postWeight || "Post Weight"}
                  </span>
                  <Scale className="size-4 text-fg-subtle" />
                </div>
                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className="text-metric-sm text-fg">
                    {entry.postWeight}
                  </span>
                  <span className="text-caption text-fg-muted">
                    kg (pre: {entry.preWeight})
                  </span>
                </div>
              </div>

              <div className="space-y-stack-xs rounded-card border border-line bg-surface p-inset-md shadow-card">
                <div className="flex items-center justify-between text-fg-secondary">
                  <span className="text-xs font-semibold">
                    {dt?.clinicalMeasurements?.bloodPressure ||
                      "Blood Pressure"}
                  </span>
                  <HeartPulse className="size-4 text-fg-subtle" />
                </div>
                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className="text-metric-sm text-fg">
                    {entry.bloodPressurePost}
                  </span>
                  <span className="text-caption text-fg-muted">
                    {dt?.clinicalMeasurements?.mmHg || "mmHg"}
                  </span>
                </div>
              </div>

              <div className="space-y-stack-xs rounded-card border border-line bg-surface p-inset-md shadow-card">
                <div className="flex items-center justify-between text-fg-secondary">
                  <span className="text-xs font-semibold">
                    {dt?.clinicalMeasurements?.heartRate || "Heart Rate"}
                  </span>
                  <Activity className="size-4 text-fg-subtle" />
                </div>
                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className="text-metric-sm text-fg">
                    {entry.heartRatePost}
                  </span>
                  <span className="text-caption text-fg-muted">
                    {dt?.clinicalMeasurements?.bpm || "bpm"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Administered Medications */}
          <div className="space-y-stack-sm rounded-card border border-line-subtle bg-surface-sunken p-inset-md">
            <h3 className="flex items-center gap-1.5 text-base font-bold tracking-tight text-fg">
              <Pill className="size-4 text-fg-muted" />
              <span>
                {dt?.detail?.recoveryVitals?.medsAdministered ||
                  "Medications Administered"}
              </span>
            </h3>
            <div className="flex flex-wrap gap-inline-md">
              {entry.medicationsGiven && entry.medicationsGiven.length > 0 ? (
                entry.medicationsGiven.map((med) => (
                  <span
                    key={med}
                    className="rounded-control border border-transparent bg-primary-solid px-inset-sm py-1 text-label-sm text-primary-on-solid shadow-control"
                  >
                    {med}
                  </span>
                ))
              ) : (
                <span className="text-caption text-fg-subtle">
                  {dt?.detail?.recoveryVitals?.noneRecorded || "None recorded"}
                </span>
              )}
            </div>
          </div>

          {/* Recovery Notes */}
          {entry.otherNotes && (
            <div className="space-y-2 rounded-card border border-line-subtle bg-surface-sunken p-4">
              <h3 className="text-heading-5 text-fg">
                {dt?.detail?.recoveryVitals?.recoveryNotes || "Recovery Notes"}
              </h3>
              <p className="rounded-card border border-line bg-surface p-inset-sm text-body-sm text-fg-secondary">
                {entry.otherNotes}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FallbackLoading() {
  const { dictionary } = useLanguage();
  const dt = dictionary.dialysisTreatment;
  return (
    <div className="mx-auto w-full max-w-5xl py-12 text-center font-medium text-fg-muted">
      {dt?.detail?.loading || "Loading treatment details..."}
    </div>
  );
}

export default function ViewDialysisTreatmentPage() {
  return (
    <>
      <PersonalLogDisclaimer />

      <Suspense fallback={<FallbackLoading />}>
        <TreatmentDetailContent />
      </Suspense>
    </>
  );
}
