import React from "react";
import Link from "next/link";
import { CalendarDays, Check, Clock3, HeartPulse, Plus, X } from "lucide-react";

const vitalFields = [
  { label: "Systolic (mmHg)", value: "123" },
  { label: "Diastolic (mmHg)", value: "123" },
  { label: "Pulse (BPM)", value: "123" },
];

const moods = [
  { label: "Great", mark: "Excellent", emoji: ":)" },
  { label: "Good", mark: "Stable", emoji: ":)" },
  { label: "Okay", mark: "Average", emoji: ":|" },
  { label: "Tired", mark: "Low energy", emoji: "-_-" },
  { label: "Stressed", mark: "Tense", emoji: ":/" },
];

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[74px] items-center gap-3 rounded-lg border border-[#E3E6F0] bg-white p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-medium leading-4 text-slate-500">{label}</p>
        <p className="mt-1 text-sm font-semibold leading-5 text-slate-950">{value}</p>
      </div>
    </div>
  );
}

function VitalField({ field }: { field: (typeof vitalFields)[number] }) {
  return (
    <label className="block">
      <span className="text-sm font-medium leading-5 text-slate-950">{field.label}</span>
      <span className="mt-2 flex h-12 items-center rounded border border-[#CBD5ED] bg-white px-3 text-base font-medium text-slate-700">
        {field.value}
      </span>
    </label>
  );
}

function ChoiceBox({ selected = false }: { selected?: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
        selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
      }`}
    >
      {selected && <Check className="h-3.5 w-3.5" />}
    </span>
  );
}

export default function AddBloodPressurePage() {
  return (
    <div className="mx-auto max-w-[429px]">
      <section className="rounded-[14px] border border-[#E3E6F0] bg-[#F1F5FA] p-3">
        <header className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-red-100 text-red-500">
            <HeartPulse className="h-6 w-6" />
          </span>
          <h1 className="min-w-0 flex-1 text-lg font-medium leading-7 tracking-[0.09px] text-slate-950">
            Add Blood Pressure
          </h1>
          <Link
            href="/dashboard/personal-log/blood-pressure"
            className="rounded-full p-1 text-slate-950 transition-colors hover:bg-white"
            aria-label="Close add blood pressure"
          >
            <X className="h-6 w-6" />
          </Link>
        </header>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <InfoCard icon={CalendarDays} label="Date" value="May 5,2026" />
          <InfoCard icon={Clock3} label="Time" value="12:00 AM" />
        </div>

        <div className="mt-4 rounded-lg bg-white p-3">
          <h2 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
            1. How I Felt Today
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {vitalFields.map((field) => (
              <VitalField key={field.label} field={field} />
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-white p-3">
          <h2 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
            How I Feel
          </h2>
          <p className="mt-1 text-sm font-medium leading-5 text-slate-500">
            Select your current state
          </p>

          <div className="mt-3 space-y-2">
            {moods.map((mood, index) => (
              <button
                key={mood.label}
                type="button"
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  index === 1
                    ? "border-blue-300 bg-blue-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F1F5FA] text-sm font-bold text-slate-700">
                  {mood.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-5 text-slate-950">
                    {mood.label}
                  </span>
                  <span className="block text-xs font-medium leading-4 text-slate-500">
                    {mood.mark}
                  </span>
                </span>
                <ChoiceBox selected={index === 1} />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-white p-3">
          <h2 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
            How I Feel
          </h2>
          <p className="mt-3 text-sm font-medium leading-5 text-slate-950">
            Did I take my medications as prescribed today?
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {["Yes", "No"].map((option, index) => (
              <button
                key={option}
                type="button"
                className={`flex h-12 items-center justify-between rounded-lg border px-3 text-sm font-semibold ${
                  index === 0
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                {option}
                <ChoiceBox selected={index === 0} />
              </button>
            ))}
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-medium leading-5 text-slate-950">Notes</span>
            <span className="mt-2 block min-h-[92px] rounded border border-[#CBD5ED] bg-white p-3 text-sm font-medium leading-5 text-slate-600">
              Took all meds after session.
            </span>
          </label>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href="/dashboard/personal-log/blood-pressure"
            className="flex h-12 items-center justify-center rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold text-slate-950 transition-colors hover:bg-white"
          >
            Cancel
          </Link>
          <button
            type="button"
            className="flex h-12 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Save Entry
          </button>
        </div>
      </section>
    </div>
  );
}
