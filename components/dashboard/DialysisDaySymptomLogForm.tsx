"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Droplets,
  HeartPulse,
  Minus,
  Pill,
  Plus,
  Printer,
  Scale,
  Sparkles,
  X,
} from "lucide-react";

export interface DialysisDayLogData {
  date: string;
  isDialysisDay: boolean;
  treatmentType: string;
  startTime: string;
  endTime: string;
  location: string;
  careTeam: string;
  postWeightSummary: string;
  // Attendance & Compliance
  attended: "Yes" | "No";
  arrivedLate: "Yes" | "No";
  endedEarly: "Yes" | "No";
  missedTreatments: number;
  rescheduled: "Yes" | "No";
  // Specific 5-level Symptoms
  cramping: "Yes" | "No" | "Mild" | "Moderate" | "Severe";
  lowBp: "Yes" | "No" | "Mild" | "Moderate" | "Severe";
  fatigue: "Yes" | "No" | "Mild" | "Moderate" | "Severe";
  recoveryTime: "Yes" | "No" | "Mild" | "Moderate" | "Severe";
  // Medication Adherence
  medsTakenPrescribed: "Yes" | "No";
  // Pre-treatment
  preOverallFeel: number;
  preSymptoms: string[];
  preOtherSymptom: string;
  preSeverity: Record<string, number>;
  // Intra-treatment
  hadIntraSymptoms: boolean;
  intraSymptoms: string[];
  intraOtherSymptom: string;
  intraSeverity: Record<string, number>;
  intraNotes: string;
  // Post-treatment
  postOverallFeel: number;
  postSymptoms: string[];
  postOtherSymptom: string;
  postSeverity: Record<string, number>;
  // Clinical vitals
  fluidRemoved: string;
  preWeight: string;
  postWeight: string;
  bloodPressurePost: string;
  heartRatePost: string;
  medicationsGiven: string[];
  medicationsOther: string;
  otherNotes: string;
}

import {
  BsEmojiLaughingFill,
  BsEmojiSmileFill,
  BsEmojiNeutralFill,
  BsEmojiFrownFill,
  BsEmojiAngryFill,
} from "react-icons/bs";

const MOODS = [
  {
    level: 5,
    label: "Great",
    icon: BsEmojiLaughingFill,
    color: "text-emerald-500",
  },
  {
    level: 4,
    label: "Good",
    icon: BsEmojiSmileFill,
    color: "text-lime-500",
  },
  {
    level: 3,
    label: "Okay",
    icon: BsEmojiNeutralFill,
    color: "text-amber-500",
  },
  {
    level: 2,
    label: "Low",
    icon: BsEmojiFrownFill,
    color: "text-orange-500",
  },
  {
    level: 1,
    label: "Poor",
    icon: BsEmojiAngryFill,
    color: "text-red-500",
  },
];

function BinaryToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "Yes" | "No";
  onChange: (v: "Yes" | "No") => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs hover:border-slate-300 transition-colors h-full">
      <span className="text-base font-normal text-slate-800">{label}</span>
      <div className="flex items-center rounded-xl bg-slate-100/80 p-1 border border-slate-200/70">
        <button
          type="button"
          onClick={() => onChange("Yes")}
          className={`rounded-lg px-4 py-1 text-xs font-bold transition-all cursor-pointer ${
            value === "Yes"
              ? "bg-[#2563EB] text-white shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange("No")}
          className={`rounded-lg px-4 py-1 text-xs font-bold transition-all cursor-pointer ${
            value === "No"
              ? "bg-[#2563EB] text-white shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

function SeverityFiveToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "Yes" | "No" | "Mild" | "Moderate" | "Severe";
  onChange: (v: "Yes" | "No" | "Mild" | "Moderate" | "Severe") => void;
}) {
  const options = ["Yes", "No", "Mild", "Moderate", "Severe"] as const;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
      <span className="text-base font-normal text-slate-800">{label}</span>
      <div className="flex items-center rounded-xl bg-slate-100/80 p-1 border border-slate-200/70 self-end sm:self-auto">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                active
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CounterField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs hover:border-slate-300 transition-colors h-full">
      <span className="text-base font-normal text-slate-800">{label}</span>
      <div className="flex items-center gap-2 rounded-xl bg-slate-100/80 p-1 border border-slate-200/70">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex size-7 items-center justify-center rounded-lg bg-white text-slate-700 hover:bg-slate-200/70 shadow-2xs transition-colors cursor-pointer"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="w-8 text-center text-xs font-extrabold text-slate-900">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex size-7 items-center justify-center rounded-lg bg-white text-slate-700 hover:bg-slate-200/70 shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function SeverityRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = Math.min(100, Math.max(0, (value / 10) * 100));

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors">
      <span className="text-base font-normal text-slate-800 w-44 truncate">{label}</span>
      <div className="flex-1 flex items-center gap-3">
        <input
          type="range"
          min="0"
          max="10"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            background: `linear-gradient(to right, #2563EB ${pct}%, #e2e8f0 ${pct}%)`,
          }}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg accent-[#2563EB] focus:outline-none"
        />
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold bg-[#2563EB] text-white shadow-xs">
          {value}
        </span>
      </div>
    </div>
  );
}

function formatDisplayDate(isoDate: string) {
  if (!isoDate) return "";
  const parts = isoDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return isoDate;
  const [y, m, d] = parts;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    weekday: "short",
  });
}

interface Props {
  onClose?: () => void;
  onSave?: (data: DialysisDayLogData) => void;
  isModal?: boolean;
}

export default function DialysisDaySymptomLogForm({ onClose, onSave, isModal = false }: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<number>(1);

  // Date state
  const [selectedDate, setSelectedDate] = useState("2026-05-04");

  // Session & Metadata state
  const [isDialysisDay, setIsDialysisDay] = useState(true);
  const [treatmentType, setTreatmentType] = useState("Hemodialysis");
  const [startTime, setStartTime] = useState("7:30 AM");
  const [endTime, setEndTime] = useState("11:45 AM");
  const [location, setLocation] = useState("ABC Dialysis Center");
  const [careTeam, setCareTeam] = useState("Jane Smith, RN");
  const [postWeightSummary, setPostWeightSummary] = useState("72.4 kg");

  // Options from user reference image
  const [attended, setAttended] = useState<"Yes" | "No">("Yes");
  const [arrivedLate, setArrivedLate] = useState<"Yes" | "No">("No");
  const [endedEarly, setEndedEarly] = useState<"Yes" | "No">("No");
  const [missedTreatments, setMissedTreatments] = useState<number>(0);
  const [rescheduled, setRescheduled] = useState<"Yes" | "No">("No");

  // Specific 5-level severity symptoms
  const [crampingSeverity, setCrampingSeverity] = useState<"Yes" | "No" | "Mild" | "Moderate" | "Severe">("Yes");
  const [lowBpSeverity, setLowBpSeverity] = useState<"Yes" | "No" | "Mild" | "Moderate" | "Severe">("No");
  const [fatigueSeverity, setFatigueSeverity] = useState<"Yes" | "No" | "Mild" | "Moderate" | "Severe">("No");
  const [recoverySeverity, setRecoverySeverity] = useState<"Yes" | "No" | "Mild" | "Moderate" | "Severe">("Yes");

  // Medication compliance
  const [medsTakenPrescribed, setMedsTakenPrescribed] = useState<"Yes" | "No">("Yes");

  // Pre-treatment
  const [preFeel, setPreFeel] = useState(3);
  const [preSymptoms, setPreSymptoms] = useState<string[]>([
    "Fatigue",
    "Swelling",
    "Headache",
  ]);
  const [preOther, setPreOther] = useState("");
  const [preSeverity, setPreSeverity] = useState<Record<string, number>>({
    Fatigue: 6,
    Nausea: 2,
    Pain: 1,
    "Shortness of Breath": 3,
    Overall: 5,
  });

  // Intra-treatment
  const [hadIntraSymptoms, setHadIntraSymptoms] = useState(true);
  const [intraSymptoms, setIntraSymptoms] = useState<string[]>([
    "Low Blood Pressure",
    "Cramps",
    "Dizziness",
  ]);
  const [intraOther, setIntraOther] = useState("");
  const [intraSeverity, setIntraSeverity] = useState<Record<string, number>>({
    Fatigue: 6,
    Nausea: 2,
    Cramps: 7,
    Dizziness: 5,
    Overall: 6,
  });
  const [intraNotes, setIntraNotes] = useState(
    "Felt cramps in legs at 9:30 AM, BP dropped a little but got better after fluid was given."
  );

  // Post-treatment
  const [postFeel, setPostFeel] = useState(4);
  const [postSymptoms, setPostSymptoms] = useState<string[]>([
    "Fatigue",
    "Muscle Cramps",
  ]);
  const [postOther, setPostOther] = useState("");
  const [postSeverity, setPostSeverity] = useState<Record<string, number>>({
    Fatigue: 4,
    Nausea: 1,
    Pain: 2,
    Overall: 3,
  });

  // Vitals & Meds
  const [fluidRemoved, setFluidRemoved] = useState("2.3");
  const [preWeight, setPreWeight] = useState("74.7");
  const [postWeight, setPostWeight] = useState("72.4");
  const [bpPost, setBpPost] = useState("118 / 72");
  const [pulsePost, setPulsePost] = useState("78");
  const [meds, setMeds] = useState<string[]>(["EPO / Mircera", "Heparin"]);
  const [medNotes, setMedNotes] = useState("Took all meds after session.");
  const [generalNotes, setGeneralNotes] = useState("Feeling better after treatment. Plan to rest and drink fluids.");

  const toggleItem = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSave = () => {
    const payload: DialysisDayLogData = {
      date: formatDisplayDate(selectedDate),
      isDialysisDay,
      treatmentType,
      startTime,
      endTime,
      location,
      careTeam,
      postWeightSummary,
      attended,
      arrivedLate,
      endedEarly,
      missedTreatments,
      rescheduled,
      cramping: crampingSeverity,
      lowBp: lowBpSeverity,
      fatigue: fatigueSeverity,
      recoveryTime: recoverySeverity,
      medsTakenPrescribed,
      preOverallFeel: preFeel,
      preSymptoms,
      preOtherSymptom: preOther,
      preSeverity,
      hadIntraSymptoms,
      intraSymptoms,
      intraOtherSymptom: intraOther,
      intraSeverity,
      intraNotes,
      postOverallFeel: postFeel,
      postSymptoms,
      postOtherSymptom: postOther,
      postSeverity,
      fluidRemoved,
      preWeight,
      postWeight,
      bloodPressurePost: bpPost,
      heartRatePost: pulsePost,
      medicationsGiven: meds,
      medicationsOther: medNotes,
      otherNotes: generalNotes,
    };

    if (onSave) onSave(payload);
    if (onClose) onClose();
    else router.push("/dashboard/personal-log/dialysis-treatment");
  };

  const preOptions = [
    "Fatigue",
    "Swelling",
    "Shortness of Breath",
    "Nausea",
    "Itching",
    "Headache",
    "Dizziness",
    "Muscle Cramps",
    "Chest Pain",
    "Anxiety",
    "Poor Appetite",
  ];

  const intraOptions = [
    "Low BP",
    "High BP",
    "Cramps",
    "Nausea",
    "Dizziness",
    "Chest Discomfort",
    "Itching",
  ];

  const postOptions = [
    "Fatigue",
    "Dizziness",
    "Nausea",
    "Headache",
    "Muscle Cramps",
    "Low BP",
    "Itching",
    "Swelling",
    "Better / No Symptoms",
  ];

  return (
    <div className="w-full space-y-4 font-sans text-slate-800">
      {/* 1. CLINICAL SESSION INFORMATION CARD */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Dialysis Day Log
            </h1>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            {/* Date Field with Label */}
            <div className="flex flex-col">
              <label htmlFor="dialysis-log-date" className="text-base font-normal text-slate-800 mb-1">
                Date
              </label>
              <input
                id="dialysis-log-date"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                onClick={(e) => {
                  try {
                    (e.currentTarget as any).showPicker?.();
                  } catch {}
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs hover:border-slate-400 focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 outline-none cursor-pointer h-[34px]"
              />
            </div>

            {/* Dialysis Day Toggle with Label */}
            <div className="flex flex-col">
              <span className="text-base font-normal text-slate-800 mb-1">
                Dialysis Day
              </span>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-0.5 h-[34px]">
                <button
                  type="button"
                  onClick={() => setIsDialysisDay(true)}
                  className={`rounded-lg px-3.5 py-1 text-xs font-bold transition-all cursor-pointer h-full flex items-center ${
                    isDialysisDay
                      ? "bg-[#2563EB] text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setIsDialysisDay(false)}
                  className={`rounded-lg px-3.5 py-1 text-xs font-bold transition-all cursor-pointer h-full flex items-center ${
                    !isDialysisDay
                      ? "bg-[#2563EB] text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer mb-0.5"
              title="Print"
            >
              <Printer className="size-4" />
            </button>

            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer mb-0.5"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Clinical Information Bar */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 rounded-2xl border border-slate-200/90 bg-[#F8FAFC] p-3 text-xs shadow-2xs divide-y sm:divide-y-0 divide-slate-100 sm:divide-x sm:divide-slate-200/80">
          <div className="px-3 py-1.5 sm:py-0 min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">Treatment Type</p>
            <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{treatmentType}</p>
          </div>

          <div className="px-3 py-1.5 sm:py-0 min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">Start Time</p>
            <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{startTime}</p>
          </div>

          <div className="px-3 py-1.5 sm:py-0 min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">End Time</p>
            <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{endTime}</p>
          </div>

          <div className="px-3 py-1.5 sm:py-0 min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">Location</p>
            <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{location}</p>
          </div>

          <div className="px-3 py-1.5 sm:py-0 min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">Care Team</p>
            <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{careTeam}</p>
          </div>

          <div className="px-3 py-1.5 sm:py-0 min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">Post Weight</p>
            <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{postWeightSummary}</p>
          </div>
        </div>
      </div>

      {/* 2. STEP PROGRESS WIZARD CARD */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-4 sm:px-6 shadow-sm">
        <div className="flex items-center justify-between w-full">
          {[
            { id: 1, label: "Pre-Dialysis" },
            { id: 2, label: "During Session" },
            { id: 3, label: "Post & Vitals" },
            { id: 4, label: "Full View" },
          ].map((step, idx, arr) => {
            const isCompleted = activeTab > step.id;
            const isCurrent = activeTab === step.id;

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => setActiveTab(step.id)}
                  className="flex flex-col sm:flex-row items-center gap-2 group cursor-pointer"
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-[#2563EB] text-white ring-4 ring-blue-100 shadow-sm"
                        : isCompleted
                        ? "bg-[#1E40AF] text-white shadow-2xs"
                        : "border-2 border-slate-200 bg-white text-slate-400 group-hover:border-slate-300"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="size-4 stroke-[3]" />
                    ) : (
                      step.id <= 3 ? step.id : <span className="text-[10px]">ALL</span>
                    )}
                  </span>
                  <span
                    className={`text-xs font-bold transition-colors text-center sm:text-left ${
                      isCurrent
                        ? "text-[#2563EB]"
                        : isCompleted
                        ? "text-slate-700"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>

                {idx < arr.length - 1 && (
                  <div
                    className={`flex-1 mx-2 sm:mx-4 h-0.5 transition-colors ${
                      activeTab > step.id ? "bg-[#2563EB]" : "bg-slate-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. FORM CARD */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
        {/* TAB 1: ATTENDANCE & PRE-DIALYSIS */}
        {(activeTab === 1 || activeTab === 4) && (
          <div className="space-y-6">
            {/* All options from reference image: Attendance Tracking */}
            <div className="space-y-3">
              <h2 className="text-base font-bold tracking-tight text-slate-900">
                Attendance & Schedule
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <BinaryToggle
                  label="Treatment attended"
                  value={attended}
                  onChange={setAttended}
                />
                <BinaryToggle
                  label="Arrived late"
                  value={arrivedLate}
                  onChange={setArrivedLate}
                />
                <BinaryToggle
                  label="Ended early"
                  value={endedEarly}
                  onChange={setEndedEarly}
                />
                <CounterField
                  label="Missed treatments"
                  value={missedTreatments}
                  onChange={setMissedTreatments}
                />
                <div className="md:col-span-2">
                  <BinaryToggle
                    label="Rescheduled missed treatment"
                    value={rescheduled}
                    onChange={setRescheduled}
                  />
                </div>
              </div>
            </div>

            {/* Pre-dialysis condition */}
            <div className="pt-3 border-t border-slate-100 space-y-3.5">
              <h3 className="text-base font-bold tracking-tight text-slate-900">
                Pre-Treatment Condition
              </h3>

              {/* Mood */}
              <div className="grid grid-cols-5 gap-2.5">
                {MOODS.map((m) => {
                  const active = preFeel === m.level;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.level}
                      type="button"
                      onClick={() => setPreFeel(m.level)}
                      className={`group flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 transition-all cursor-pointer ${
                        active
                          ? "border-[#2563EB] bg-blue-50/40 text-blue-900 ring-2 ring-blue-500/20 shadow-xs scale-[1.02]"
                          : "border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="relative flex items-center justify-center">
                        <span className="absolute inset-0.5 rounded-full bg-white shadow-2xs" />
                        <Icon className={`relative size-7 sm:size-8 transition-transform group-hover:scale-110 drop-shadow-xs ${m.color}`} />
                      </div>
                      <span className="text-xs font-bold tracking-tight">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Pre Symptoms Chips */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 space-y-2.5">
                <h3 className="text-base font-bold tracking-tight text-slate-900">Pre-Dialysis Symptoms</h3>
                <div className="flex flex-wrap gap-2">
                  {preOptions.map((sym) => {
                    const sel = preSymptoms.includes(sym);
                    return (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => toggleItem(preSymptoms, setPreSymptoms, sym)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                          sel
                            ? "bg-[#2563EB] border-[#2563EB] text-white shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span>{sym}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pre Severity Sliders */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 space-y-3">
                <h3 className="text-base font-bold tracking-tight text-slate-900">Symptom Severity (0–10)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {Object.keys(preSeverity).map((key) => (
                    <SeverityRow
                      key={key}
                      label={key}
                      value={preSeverity[key]}
                      onChange={(v) => setPreSeverity({ ...preSeverity, [key]: v })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DURING TREATMENT */}
        {(activeTab === 2 || activeTab === 4) && (
          <div className="space-y-6">
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              During Treatment
            </h2>

            {/* Core 5-state symptoms from user reference image */}
            <div className="space-y-3">
              <h3 className="text-base font-bold tracking-tight text-slate-900">
                Intra-Session Symptoms
              </h3>

              <div className="space-y-2">
                <SeverityFiveToggle
                  label="Cramping"
                  value={crampingSeverity}
                  onChange={setCrampingSeverity}
                />
                <SeverityFiveToggle
                  label="Low BP"
                  value={lowBpSeverity}
                  onChange={setLowBpSeverity}
                />
                <SeverityFiveToggle
                  label="Fatigue"
                  value={fatigueSeverity}
                  onChange={setFatigueSeverity}
                />
              </div>
            </div>

            {/* Other intra symptoms */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 space-y-2.5">
              <h3 className="text-base font-bold tracking-tight text-slate-900">Additional Symptoms</h3>
              <div className="flex flex-wrap gap-2">
                {intraOptions.map((sym) => {
                  const sel = intraSymptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => toggleItem(intraSymptoms, setIntraSymptoms, sym)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                        sel
                          ? "bg-[#2563EB] border-[#2563EB] text-white shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span>{sym}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 space-y-2">
              <h3 className="text-base font-bold tracking-tight text-slate-900">Session Notes</h3>
              <textarea
                rows={2}
                value={intraNotes}
                onChange={(e) => setIntraNotes(e.target.value)}
                placeholder="Session details, interventions, or notes..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none focus:border-slate-400 resize-none"
              />
            </div>
          </div>
        )}

        {/* TAB 3: POST & RECOVERY */}
        {(activeTab === 3 || activeTab === 4) && (
          <div className="space-y-6">
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              Recovery & Clinical Vitals
            </h2>

            {/* Recovery Time Severity Toggle */}
            <div className="space-y-3">
              <h3 className="text-base font-bold tracking-tight text-slate-900">
                Post-Treatment Recovery
              </h3>

              <SeverityFiveToggle
                label="Recovery time"
                value={recoverySeverity}
                onChange={setRecoverySeverity}
              />

              {/* Medication Prescribed Compliance */}
              <BinaryToggle
                label="Prescribed medications taken"
                value={medsTakenPrescribed}
                onChange={setMedsTakenPrescribed}
              />
            </div>

            {/* Clinical Vitals Cards */}
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
                    <input
                      type="text"
                      value={fluidRemoved}
                      onChange={(e) => setFluidRemoved(e.target.value)}
                      className="w-20 bg-transparent text-xl font-bold text-slate-900 outline-none"
                    />
                    <span className="text-xs font-medium text-slate-500">Liters</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-xs font-semibold">Post Weight</span>
                    <Scale className="size-4 text-slate-400" />
                  </div>
                  <div className="flex items-baseline gap-1.5 pt-1">
                    <input
                      type="text"
                      value={postWeight}
                      onChange={(e) => setPostWeight(e.target.value)}
                      className="w-16 bg-transparent text-xl font-bold text-slate-900 outline-none"
                    />
                    <span className="text-xs font-medium text-slate-500">kg (pre: {preWeight})</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-xs font-semibold">Blood Pressure</span>
                    <HeartPulse className="size-4 text-slate-400" />
                  </div>
                  <div className="flex items-baseline gap-1.5 pt-1">
                    <input
                      type="text"
                      value={bpPost}
                      onChange={(e) => setBpPost(e.target.value)}
                      className="w-24 bg-transparent text-xl font-bold text-slate-900 outline-none"
                    />
                    <span className="text-xs font-medium text-slate-500">mmHg</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-xs font-semibold">Heart Rate</span>
                    <Activity className="size-4 text-slate-400" />
                  </div>
                  <div className="flex items-baseline gap-1.5 pt-1">
                    <input
                      type="text"
                      value={pulsePost}
                      onChange={(e) => setPulsePost(e.target.value)}
                      className="w-16 bg-transparent text-xl font-bold text-slate-900 outline-none"
                    />
                    <span className="text-xs font-medium text-slate-500">bpm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* In-Clinic Medications Given */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 space-y-2.5">
              <h3 className="flex items-center gap-1.5 text-base font-bold tracking-tight text-slate-900">
                <Pill className="size-4 text-slate-500" />
                <span>Medications Administered</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {["EPO / Mircera", "Iron", "Zemplar / Hectorol", "Heparin", "Other"].map((med) => {
                  const sel = meds.includes(med);
                  return (
                    <button
                      key={med}
                      type="button"
                      onClick={() => toggleItem(meds, setMeds, med)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                        sel
                          ? "bg-[#2563EB] border-[#2563EB] text-white shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span>{med}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes field */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 space-y-2">
              <h3 className="text-base font-bold tracking-tight text-slate-900">Recovery Notes</h3>
              <textarea
                rows={3}
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="Post-dialysis notes or recovery observations..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none focus:border-slate-400 resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. FOOTER */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 p-4 px-6">
        <div className="flex items-center gap-2">
          {activeTab > 1 ? (
            <button
              type="button"
              onClick={() => setActiveTab(activeTab - 1)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Previous Page</span>
            </button>
          ) : onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
          ) : (
            <Link
              href="/dashboard/personal-log/dialysis-treatment"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-2xs transition-colors inline-block"
            >
              Cancel
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab < 4 ? (
            <button
              type="button"
              onClick={() => setActiveTab(activeTab + 1)}
              className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <span>Next Page</span>
              <ArrowRight className="size-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-6 py-2 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
            >
              <Check className="size-4" />
              <span>Save Log</span>
            </button>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
