"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Calendar,
  Droplets,
  HeartPulse,
  Pencil,
  Pill,
  Scale,
} from "lucide-react";
import {
  BsEmojiLaughingFill,
  BsEmojiSmileFill,
  BsEmojiNeutralFill,
  BsEmojiFrownFill,
  BsEmojiAngryFill,
} from "react-icons/bs";
import { mockDialysisEntries, DialysisLogEntry } from "@/lib/dialysisTreatmentData";

const MOOD_CONFIG: Record<
  number,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  5: { label: "Great", icon: BsEmojiLaughingFill, color: "text-emerald-500" },
  4: { label: "Good", icon: BsEmojiSmileFill, color: "text-lime-500" },
  3: { label: "Okay", icon: BsEmojiNeutralFill, color: "text-amber-500" },
  2: { label: "Low", icon: BsEmojiFrownFill, color: "text-orange-500" },
  1: { label: "Poor", icon: BsEmojiAngryFill, color: "text-red-500" },
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
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs h-full">
      <span className="text-base font-normal text-slate-800">{label}</span>
      <span
        className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold ${
          isHighlight || value === "Yes"
            ? "bg-blue-50 text-[#2563EB] border border-blue-200"
            : "bg-slate-100 text-slate-800 border border-slate-200"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function TreatmentDetailContent() {
  const searchParams = useSearchParams();
  const entryId = searchParams.get("id") || "entry-01";

  const entry: DialysisLogEntry =
    mockDialysisEntries.find((e) => e.id === entryId) || mockDialysisEntries[0];

  const preMood = MOOD_CONFIG[entry.preOverallFeel] || MOOD_CONFIG[4];
  const PreMoodIcon = preMood.icon;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 py-2 font-sans text-slate-800">
      {/* HEADER BAR: BACK LINK & EDIT ACTION */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard/personal-log/dialysis-treatment"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Dialysis Treatment</span>
        </Link>

        <Link
          href={`/dashboard/personal-log/dialysis-treatment/add?edit=${entry.id}`}
          className="flex items-center gap-2 rounded-2xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
        >
          <Pencil className="size-3.5" />
          <span>Edit Entry</span>
        </Link>
      </div>

      {/* CARD 1: SESSION INFORMATION (MATCHING FORM CARD 1) */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Dialysis Day Log
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {entry.displayDate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-800 border border-slate-200">
              <Calendar className="size-3.5 text-slate-500" />
              <span>Dialysis Day: {entry.isDialysisDay ? "Yes" : "No"}</span>
            </span>
          </div>
        </div>

        {/* 6-Column Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 rounded-2xl border border-slate-200/90 bg-[#F8FAFC] p-3 text-xs shadow-2xs divide-y sm:divide-y-0 divide-slate-100 sm:divide-x sm:divide-slate-200/80">
          <div className="px-3 py-1.5 sm:py-0 min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">Treatment Type</p>
            <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{entry.treatmentType}</p>
          </div>

          <div className="px-3 py-1.5 sm:py-0 min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">Start Time</p>
            <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{entry.startTime}</p>
          </div>

          <div className="px-3 py-1.5 sm:py-0 min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">End Time</p>
            <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{entry.endTime}</p>
          </div>

          <div className="px-3 py-1.5 sm:py-0 min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">Location</p>
            <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{entry.location}</p>
          </div>

          <div className="px-3 py-1.5 sm:py-0 min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">Care Team</p>
            <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{entry.careTeam}</p>
          </div>

          <div className="px-3 py-1.5 sm:py-0 min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">Post Weight</p>
            <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{entry.postWeightSummary}</p>
          </div>
        </div>
      </div>

      {/* CARD 2: LOGGED CLINICAL DATA (MATCHING FORM CARD 2 / STEPS) */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-8">
        {/* 1. ATTENDANCE & SCHEDULE */}
        <section className="space-y-3">
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            Attendance & Schedule
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DetailRow label="Treatment attended" value={entry.attended} />
            <DetailRow label="Arrived late" value={entry.arrivedLate} />
            <DetailRow label="Ended early" value={entry.endedEarly} />
            <DetailRow label="Missed treatments" value={entry.missedTreatments} />
            <div className="md:col-span-2">
              <DetailRow
                label="Rescheduled missed treatment"
                value={entry.rescheduled}
              />
            </div>
          </div>
        </section>

        {/* 2. PRE-TREATMENT CONDITION */}
        <section className="pt-6 border-t border-slate-100 space-y-4">
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            Pre-Treatment Condition
          </h2>

          {/* Selected Mood Display */}
          <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40">
            <span className="text-base font-normal text-slate-800">Overall Feel</span>
            <div className="flex items-center gap-2.5 bg-white border border-[#2563EB] px-4 py-2 rounded-2xl shadow-2xs">
              <div className="relative flex items-center justify-center">
                <span className="absolute inset-0.5 rounded-full bg-white shadow-2xs" />
                <PreMoodIcon className={`relative size-7 ${preMood.color}`} />
              </div>
              <span className="text-sm font-bold text-slate-900">{preMood.label}</span>
            </div>
          </div>

          {/* Selected Pre-Dialysis Symptoms */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 space-y-2.5">
            <h3 className="text-base font-bold tracking-tight text-slate-900">
              Pre-Dialysis Symptoms
            </h3>
            <div className="flex flex-wrap gap-2">
              {entry.preSymptoms.length > 0 ? (
                entry.preSymptoms.map((sym) => (
                  <span
                    key={sym}
                    className="rounded-xl border px-3 py-1.5 text-xs font-semibold bg-[#2563EB] border-[#2563EB] text-white shadow-xs"
                  >
                    {sym}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">None reported</span>
              )}
            </div>
          </div>

          {/* Symptom Severity if reported */}
          {Object.keys(entry.preSeverity).length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-base font-bold tracking-tight text-slate-900">
                Symptom Severity (0–10)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {Object.entries(entry.preSeverity).map(([symptom, score]) => (
                  <div
                    key={symptom}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                  >
                    <span className="text-base font-normal text-slate-800">{symptom}</span>
                    <span className="flex size-7 items-center justify-center rounded-lg text-xs font-bold bg-[#2563EB] text-white shadow-xs">
                      {score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 3. DURING TREATMENT */}
        <section className="pt-6 border-t border-slate-100 space-y-4">
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            During Treatment
          </h2>

          {/* 3 Core 5-state intra symptoms */}
          <div className="space-y-2">
            <DetailRow label="Cramping" value={entry.cramping} />
            <DetailRow label="Low BP" value={entry.lowBp} />
            <DetailRow label="Fatigue" value={entry.fatigue} />
          </div>

          {/* Additional Symptoms */}
          {entry.intraSymptoms.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 space-y-2.5">
              <h3 className="text-base font-bold tracking-tight text-slate-900">
                Additional Symptoms
              </h3>
              <div className="flex flex-wrap gap-2">
                {entry.intraSymptoms.map((sym) => (
                  <span
                    key={sym}
                    className="rounded-xl border px-3 py-1.5 text-xs font-semibold bg-[#2563EB] border-[#2563EB] text-white shadow-xs"
                  >
                    {sym}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Session Notes */}
          {entry.intraNotes && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 space-y-2">
              <h3 className="text-base font-bold tracking-tight text-slate-900">
                Session Notes
              </h3>
              <p className="text-sm font-normal text-slate-700 leading-relaxed bg-white border border-slate-200 rounded-xl p-3.5">
                {entry.intraNotes}
              </p>
            </div>
          )}
        </section>

        {/* 4. RECOVERY & CLINICAL VITALS */}
        <section className="pt-6 border-t border-slate-100 space-y-4">
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            Recovery & Clinical Vitals
          </h2>

          {/* Post-Treatment Recovery */}
          <div className="space-y-2">
            <DetailRow label="Recovery time" value={entry.recoveryTime} />
            <DetailRow
              label="Prescribed medications taken"
              value={entry.medsTakenPrescribed}
            />
          </div>

          {/* Clinical Measurements (4 Vitals Cards from Form) */}
          <div className="pt-2 space-y-3">
            <h3 className="text-base font-bold tracking-tight text-slate-900">
              Clinical Measurements
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-xs font-semibold">Fluid Removed</span>
                  <Droplets className="size-4 text-slate-400" />
                </div>
                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className="text-xl font-bold text-slate-900">{entry.fluidRemoved}</span>
                  <span className="text-xs font-medium text-slate-500">Liters</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-xs font-semibold">Post Weight</span>
                  <Scale className="size-4 text-slate-400" />
                </div>
                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className="text-xl font-bold text-slate-900">{entry.postWeight}</span>
                  <span className="text-xs font-medium text-slate-500">kg (pre: {entry.preWeight})</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-xs font-semibold">Blood Pressure</span>
                  <HeartPulse className="size-4 text-slate-400" />
                </div>
                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className="text-xl font-bold text-slate-900">{entry.bloodPressurePost}</span>
                  <span className="text-xs font-medium text-slate-500">mmHg</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-xs font-semibold">Heart Rate</span>
                  <Activity className="size-4 text-slate-400" />
                </div>
                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className="text-xl font-bold text-slate-900">{entry.heartRatePost}</span>
                  <span className="text-xs font-medium text-slate-500">bpm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Administered Medications */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 space-y-2.5">
            <h3 className="flex items-center gap-1.5 text-base font-bold tracking-tight text-slate-900">
              <Pill className="size-4 text-slate-500" />
              <span>Medications Administered</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {entry.medicationsGiven && entry.medicationsGiven.length > 0 ? (
                entry.medicationsGiven.map((med) => (
                  <span
                    key={med}
                    className="rounded-xl border px-3 py-1.5 text-xs font-semibold bg-[#2563EB] border-[#2563EB] text-white shadow-xs"
                  >
                    {med}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">None recorded</span>
              )}
            </div>
          </div>

          {/* Recovery Notes */}
          {entry.otherNotes && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 space-y-2">
              <h3 className="text-base font-bold tracking-tight text-slate-900">
                Recovery Notes
              </h3>
              <p className="text-sm font-normal text-slate-700 leading-relaxed bg-white border border-slate-200 rounded-xl p-3.5">
                {entry.otherNotes}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ViewDialysisTreatmentPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-5xl mx-auto py-12 text-center text-slate-500 font-medium">
          Loading treatment details...
        </div>
      }
    >
      <TreatmentDetailContent />
    </Suspense>
  );
}
