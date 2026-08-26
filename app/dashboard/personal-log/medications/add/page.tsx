import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseMedical,
  ChevronDown,
  Plus,
  Search,
  X,
} from "lucide-react";

const fields = [
  {
    label: "Medication Name: (Brand/Generics)",
    placeholder: "e.g. Amlodipine (Norvasc)",
    full: true,
    search: true,
    helper: "Start typing to see common kidney care medications.",
  },
  { label: "Dose/Strength", placeholder: "e.g. 10 mg or 800 mg" },
  { label: "Route", placeholder: "PO (By Mouth)", select: true },
  { label: "Frequency", placeholder: "Select frequency...", select: true },
  { label: "Purpose", placeholder: "e.g. Blood pressure control" },
  { label: "Start Date", placeholder: "mm/dd/yyyy" },
  { label: "End Date (Optional)", placeholder: "e.g. Blood pressure control" },
  { label: "Prescribing provider", placeholder: "e.g. Dr. Smith" },
  { label: "Pharmacy", placeholder: "e.g. Health Plus Pharmacy" },
  {
    label: "Special instruction",
    placeholder: "e.g. Take with food, avoid grapefruit...",
    full: true,
    textarea: true,
  },
];

function Field({
  field,
}: {
  field: (typeof fields)[number];
}) {
  return (
    <label className={`block ${field.full ? "md:col-span-2" : ""}`}>
      <span className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
        {field.label}
      </span>
      <span
        className={`mt-2 flex rounded border border-[#CBD5ED] bg-white px-4 text-base font-normal leading-6 tracking-[0.08px] text-slate-500 ${
          field.textarea ? "h-[102px] items-start py-3" : "h-12 items-center"
        }`}
      >
        <span className="min-w-0 flex-1 truncate">{field.placeholder}</span>
        {field.search && <Search className="h-5 w-5 shrink-0 text-slate-500" />}
        {field.select && <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" />}
      </span>
      {field.helper && (
        <span className="mt-2 block text-sm font-medium leading-5 tracking-[0.07px] text-slate-700">
          {field.helper}
        </span>
      )}
    </label>
  );
}

export default function AddMedicationPage() {
  return (
    <div className="mx-auto max-w-[672px]">
      <Link
        href="/dashboard/personal-log/medications"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Medication Log
      </Link>

      <section className="rounded-[14px] border border-[#E3E6F0] bg-[#F1F5FA] p-3">
        <header className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-blue-100 text-blue-600">
            <BriefcaseMedical className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-medium leading-7 tracking-[0.09px] text-slate-950">
              Add New Medication
            </h1>
            <p className="mt-0.5 text-base font-medium leading-6 tracking-[0.08px] text-slate-700">
              Update your clinical records with a new prescription.
            </p>
          </div>
          <Link
            href="/dashboard/personal-log/medications"
            className="rounded-full p-1 text-slate-950 transition-colors hover:bg-white"
            aria-label="Close add medication"
          >
            <X className="h-6 w-6" />
          </Link>
        </header>

        <div className="mt-5 rounded-lg bg-white p-3">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {fields.map((field) => (
              <Field key={field.label} field={field} />
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Link
            href="/dashboard/personal-log/medications"
            className="flex h-12 items-center justify-center rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold text-slate-950 transition-colors hover:bg-white"
          >
            Cancel
          </Link>
          <button
            type="button"
            className="flex h-12 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Add Medication
          </button>
        </div>
      </section>
    </div>
  );
}
