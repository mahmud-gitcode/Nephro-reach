"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CalendarX,
  CheckCircle2,
  Clock,
  Eye,
  Info,
  Pencil,
  Plus,
  Timer,
  X,
} from "lucide-react";

const summaryCards = [
  {
    label: "Treatment attended",
    value: "90%",
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-100",
  },
  {
    label: "Arrived late",
    value: "2",
    icon: Clock,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-100",
  },
  {
    label: "Ended early",
    value: "4",
    icon: Timer,
    iconColor: "text-red-500",
    bgColor: "bg-red-50 border-red-100",
  },
  {
    label: "Missed treatments",
    value: "2",
    icon: CalendarX,
    iconColor: "text-rose-500",
    bgColor: "bg-rose-50 border-rose-100",
  },
];

const recoveryPoints = [
  { month: "Mar", good: 10, okay: 20, bad: 40 },
  { month: "Apr", good: 68, okay: 55, bad: 27 },
  { month: "May", good: 30, okay: 33, bad: 12 },
  { month: "Jun", good: 60, okay: 20, bad: 70 },
];

const symptomSlices = [
  { label: "Cramping", count: 29, percent: 50, color: "#2563EB" },
  { label: "Low BP", count: 16, percent: 28, color: "#F59E0B" },
  { label: "Fatigue", count: 13, percent: 22, color: "#EF4444" },
];

function SummaryCards() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => (
        <div
          key={card.label}
          className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs"
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${card.bgColor}`}
          >
            <card.icon className={`h-6 w-6 ${card.iconColor}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">{card.label}</p>
            <p className="mt-0.5 text-3xl font-bold text-slate-900 tracking-tight">
              {card.value}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}

function RecoveryPatternChart() {
  const width = 540;
  const height = 210;
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 30;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const getX = (index: number) =>
    paddingLeft + (index / (recoveryPoints.length - 1)) * chartW;
  const getY = (val: number) =>
    paddingTop + chartH - (val / 100) * chartH;

  const getCurvePath = (key: "good" | "okay" | "bad") => {
    const coords = recoveryPoints.map((pt, idx) => ({
      x: getX(idx),
      y: getY(pt[key]),
    }));

    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 2;
      const cp1y = curr.y;
      const cp2x = curr.x + (next.x - curr.x) / 2;
      const cp2y = next.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return path;
  };

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">
          Recovery Pattern Tracking
        </h2>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#2563EB]" />
            Good
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#F59E0B]" />
            Okay
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#EF4444]" />
            Bad
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[420px]">
          {[100, 80, 60, 40, 20, 0].map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px] font-medium"
                >
                  {tick}
                </text>
                <line
                  x1={paddingLeft}
                  x2={width - paddingRight}
                  y1={y}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          <path
            d={getCurvePath("good")}
            fill="none"
            stroke="#2563EB"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d={getCurvePath("okay")}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={getCurvePath("bad")}
            fill="none"
            stroke="#EF4444"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {recoveryPoints.map((pt, idx) => {
            const cx = getX(idx);
            return (
              <g key={pt.month}>
                <circle cx={cx} cy={getY(pt.good)} r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx={cx} cy={getY(pt.okay)} r="4" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx={cx} cy={getY(pt.bad)} r="4" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />

                <text
                  x={cx}
                  y={height - 5}
                  textAnchor="middle"
                  className="fill-slate-500 text-[11px] font-medium"
                >
                  {pt.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function SymptomsDonut() {
  const size = 210;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedOffset = 0;

  return (
    <section className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
      <h2 className="text-base font-bold text-slate-900">
        Symptoms During Treatment
      </h2>

      <div className="relative flex justify-center items-center py-2">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#F1F5F9"
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

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold text-slate-900">86%</span>
            <span className="text-xs font-medium text-slate-500 mt-0.5">Overall</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
        {symptomSlices.map((slice) => (
          <div key={slice.label} className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span>{slice.label}</span>
            </div>
            <p className="text-xs font-bold text-slate-900">
              {slice.count} ({slice.percent}%)
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DialysisTreatmentPage() {
  const [selectedMonth, setSelectedMonth] = useState("Jun");
  const [viewingEntry, setViewingEntry] = useState<DialysisLogEntry | null>(null);

  return (
    <div className="w-full space-y-6">
      {/* TOP EDUCATIONAL BANNER, MONTH PICKER & ADD ENTRY BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200/80 bg-[#FFFBEB] px-4 py-3 text-xs sm:text-sm font-semibold text-[#92400E] shadow-2xs flex-1">
          <Info className="h-5 w-5 shrink-0 text-[#B45309]" />
          <span>Completing prescribed treatments is important for dialysis adequacy</span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Calendar className="h-4 w-4 text-slate-600" />
            <span>{selectedMonth}</span>
          </button>

          <Link
            href="/dashboard/personal-log/dialysis-treatment/add"
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Entry</span>
          </Link>
        </div>
      </div>

      {/* TOP 4 SUMMARY CARDS */}
      <SummaryCards />

      {/* MAIN CHARTS SECTION: RECOVERY PATTERN & SYMPTOMS DONUT */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <div className="xl:col-span-8">
          <RecoveryPatternChart />
        </div>
        <div className="xl:col-span-4">
          <SymptomsDonut />
        </div>
      </section>

      {/* DIALYSIS TREATMENT LOG ENTRIES TABLE */}
      <TreatmentEntriesTable onSelectEntry={setViewingEntry} />

      {/* VIEW ENTRY DETAIL MODAL */}
      {viewingEntry && (
        <EntryDetailModal
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
        />
      )}
    </div>
  );
}

interface DialysisLogEntry {
  id: string;
  entryNumber: string;
  date: string;
  fullDate: string;
  timeRange: string;
  duration: string;
  treatmentType: string;
  location: string;
  careTeam: string;
  fluidRemoved: string;
  preWeight: string;
  postWeight: string;
  weightDiff: string;
  bloodPressure: string;
  heartRate: string;
  symptoms: string[];
  attendance: "Attended" | "Arrived Late" | "Ended Early" | "Missed";
  recoveryFeel: "Great" | "Good" | "Okay" | "Low" | "Poor";
  notes?: string;
  medications?: string[];
}

const mockDialysisEntries: DialysisLogEntry[] = [
  {
    id: "entry-01",
    entryNumber: "#05",
    date: "Jun 24, 2026",
    fullDate: "Wednesday, Jun 24, 2026",
    timeRange: "7:30 AM – 11:30 AM",
    duration: "4h 00m",
    treatmentType: "Hemodialysis",
    location: "ABC Dialysis Center",
    careTeam: "Jane Smith, RN",
    fluidRemoved: "2.6 L",
    preWeight: "74.8 kg",
    postWeight: "72.2 kg",
    weightDiff: "-2.6 kg",
    bloodPressure: "126/82 mmHg",
    heartRate: "72 bpm",
    symptoms: ["Better / No Symptoms"],
    attendance: "Attended",
    recoveryFeel: "Good",
    notes: "Session completed smoothly without alarms. Target dry weight reached.",
    medications: ["EPO / Mircera", "Heparin"],
  },
  {
    id: "entry-02",
    entryNumber: "#04",
    date: "Jun 22, 2026",
    fullDate: "Monday, Jun 22, 2026",
    timeRange: "8:00 AM – 11:30 AM",
    duration: "3h 30m",
    treatmentType: "Hemodialysis",
    location: "ABC Dialysis Center",
    careTeam: "Jane Smith, RN",
    fluidRemoved: "2.1 L",
    preWeight: "74.5 kg",
    postWeight: "72.4 kg",
    weightDiff: "-2.1 kg",
    bloodPressure: "118/76 mmHg",
    heartRate: "76 bpm",
    symptoms: ["Cramping"],
    attendance: "Arrived Late",
    recoveryFeel: "Okay",
    notes: "Traffic delay caused 30 min late arrival. Experienced mild calf cramps in last 30 minutes.",
    medications: ["Heparin"],
  },
  {
    id: "entry-03",
    entryNumber: "#03",
    date: "Jun 19, 2026",
    fullDate: "Friday, Jun 19, 2026",
    timeRange: "7:30 AM – 10:45 AM",
    duration: "3h 15m",
    treatmentType: "Hemodialysis",
    location: "ABC Dialysis Center",
    careTeam: "Robert Chen, RN",
    fluidRemoved: "2.4 L",
    preWeight: "75.1 kg",
    postWeight: "72.7 kg",
    weightDiff: "-2.4 kg",
    bloodPressure: "106/68 mmHg",
    heartRate: "80 bpm",
    symptoms: ["Low BP", "Fatigue"],
    attendance: "Ended Early",
    recoveryFeel: "Low",
    notes: "BP dropped at 10:30 AM. Nurse reduced UF rate and gave saline bolus. Session ended 45m early for safety.",
    medications: ["Iron", "Heparin"],
  },
  {
    id: "entry-04",
    entryNumber: "#02",
    date: "Jun 17, 2026",
    fullDate: "Wednesday, Jun 17, 2026",
    timeRange: "7:30 AM – 11:30 AM",
    duration: "4h 00m",
    treatmentType: "Hemodialysis",
    location: "ABC Dialysis Center",
    careTeam: "Jane Smith, RN",
    fluidRemoved: "2.8 L",
    preWeight: "75.4 kg",
    postWeight: "72.6 kg",
    weightDiff: "-2.8 kg",
    bloodPressure: "130/84 mmHg",
    heartRate: "70 bpm",
    symptoms: ["Better / No Symptoms"],
    attendance: "Attended",
    recoveryFeel: "Great",
    notes: "Tolerated high fluid removal very well. Felt energetic after treatment.",
    medications: ["EPO / Mircera", "Zemplar / Hectorol", "Heparin"],
  },
  {
    id: "entry-05",
    entryNumber: "#01",
    date: "Jun 15, 2026",
    fullDate: "Monday, Jun 15, 2026",
    timeRange: "7:30 AM – 11:30 AM",
    duration: "4h 00m",
    treatmentType: "Hemodialysis",
    location: "ABC Dialysis Center",
    careTeam: "Robert Chen, RN",
    fluidRemoved: "2.5 L",
    preWeight: "74.9 kg",
    postWeight: "72.4 kg",
    weightDiff: "-2.5 kg",
    bloodPressure: "128/80 mmHg",
    heartRate: "74 bpm",
    symptoms: ["Mild Cramping"],
    attendance: "Attended",
    recoveryFeel: "Good",
    notes: "Mild cramping resolved with stretching. Access site clean with strong bruit and thrill.",
    medications: ["Heparin"],
  },
];

function AttendanceBadge({ status }: { status: DialysisLogEntry["attendance"] }) {
  const styles = {
    Attended: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Arrived Late": "bg-amber-50 text-amber-700 border-amber-200",
    "Ended Early": "bg-red-50 text-red-700 border-red-200",
    Missed: "bg-rose-50 text-rose-700 border-rose-200",
  }[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${styles}`}
    >
      {status}
    </span>
  );
}

function TreatmentEntriesTable({
  onSelectEntry,
}: {
  onSelectEntry: (entry: DialysisLogEntry) => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
      {/* Table Content */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Treatment Type</th>
                <th className="px-4 py-3.5">Fluid Removed</th>
                <th className="px-4 py-3.5">Pre / Post Weight</th>
                <th className="px-4 py-3.5">Blood Pressure</th>
                <th className="px-4 py-3.5">Symptoms</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockDialysisEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Date & Time */}
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900">{entry.date}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{entry.timeRange}</div>
                  </td>

                  {/* Treatment Type */}
                  <td className="px-4 py-3.5 font-medium text-slate-800">
                    {entry.treatmentType}
                  </td>

                  {/* Fluid Removed */}
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {entry.fluidRemoved}
                    </span>
                  </td>

                  {/* Pre / Post Weight */}
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-800">
                      {entry.preWeight} → {entry.postWeight}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-bold">
                      {entry.weightDiff}
                    </div>
                  </td>

                  {/* Blood Pressure */}
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-800">{entry.bloodPressure}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{entry.heartRate}</div>
                  </td>

                  {/* Symptoms */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {entry.symptoms.map((s) => (
                        <span
                          key={s}
                          className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Attendance Status */}
                  <td className="px-4 py-3.5">
                    <AttendanceBadge status={entry.attendance} />
                  </td>

                  {/* Actions: View & Edit */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* View Icon Button */}
                      <button
                        type="button"
                        onClick={() => onSelectEntry(entry)}
                        className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 shadow-2xs transition-colors cursor-pointer"
                        title="View Entry Details"
                        aria-label={`View entry for ${entry.date}`}
                      >
                        <Eye className="size-4" />
                      </button>

                      {/* Edit Icon Button */}
                      <Link
                        href={`/dashboard/personal-log/dialysis-treatment/add?edit=${entry.id}`}
                        className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 shadow-2xs transition-colors cursor-pointer"
                        title="Edit Entry"
                        aria-label={`Edit entry for ${entry.date}`}
                      >
                        <Pencil className="size-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function EntryDetailModal({
  entry,
  onClose,
}: {
  entry: DialysisLogEntry;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200/80 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-bold text-slate-900">
                Dialysis Treatment Entry Details
              </h3>
              <AttendanceBadge status={entry.attendance} />
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">
              {entry.fullDate} • {entry.timeRange} ({entry.duration})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Clinical Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
          <div>
            <p className="text-[11px] font-medium text-slate-500">Treatment Type</p>
            <p className="font-bold text-slate-900 mt-0.5">{entry.treatmentType}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">Care Team</p>
            <p className="font-bold text-slate-900 mt-0.5">{entry.careTeam}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">Location</p>
            <p className="font-bold text-slate-900 mt-0.5 truncate">{entry.location}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">Post-Feel Mood</p>
            <p className="font-bold text-emerald-600 mt-0.5">{entry.recoveryFeel}</p>
          </div>
        </div>

        {/* Vitals & Measurements */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Clinical Measurements & Vitals
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-0.5 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">Fluid Removed</span>
              <p className="text-base font-bold text-blue-700">{entry.fluidRemoved}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-0.5 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">Weight Loss</span>
              <p className="text-base font-bold text-slate-900">{entry.weightDiff}</p>
              <p className="text-[10px] text-slate-500">{entry.preWeight} → {entry.postWeight}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-0.5 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">Blood Pressure</span>
              <p className="text-base font-bold text-slate-900">{entry.bloodPressure}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-0.5 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">Heart Rate</span>
              <p className="text-base font-bold text-slate-900">{entry.heartRate}</p>
            </div>
          </div>
        </div>

        {/* Symptoms & Medications */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 space-y-2">
            <h5 className="text-xs font-bold text-slate-800">Reported Symptoms</h5>
            <div className="flex flex-wrap gap-1.5">
              {entry.symptoms.map((sym) => (
                <span
                  key={sym}
                  className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs"
                >
                  {sym}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 space-y-2">
            <h5 className="text-xs font-bold text-slate-800">Administered Medications</h5>
            <div className="flex flex-wrap gap-1.5">
              {entry.medications?.map((med) => (
                <span
                  key={med}
                  className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs"
                >
                  {med}
                </span>
              )) || <span className="text-xs text-slate-400">None recorded</span>}
            </div>
          </div>
        </div>

        {/* Session Notes */}
        {entry.notes && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 space-y-1">
            <h5 className="text-xs font-bold text-slate-800">Session & Recovery Notes</h5>
            <p className="text-xs text-slate-700 leading-relaxed">{entry.notes}</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            Close
          </button>
          <Link
            href={`/dashboard/personal-log/dialysis-treatment/add?edit=${entry.id}`}
            className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Pencil className="size-3.5" />
            <span>Edit Entry</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
