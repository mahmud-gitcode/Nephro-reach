import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bone,
  ChevronDown,
  Droplet,
  FileText,
  FlaskConical,
  Plus,
  Save,
  ScanLine,
  Upload,
} from "lucide-react";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";

type Field = {
  label: string;
  placeholder: string;
};

type LabSection = {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  metricCount?: string;
  columns?: "two" | "four";
  fields: Field[];
};

const cmpFields: Field[] = [
  { label: "BUN (mg/dL)", placeholder: "7-20" },
  { label: "Creatinine (mg/dL)", placeholder: "0.6-1.2" },
  { label: "eGFR", placeholder: ">60" },
  { label: "Urea (mg/dL)", placeholder: "7-20" },
  { label: "URR (%)", placeholder: "Target >=65" },
  { label: "Glucose (mg/dL)", placeholder: "70-100" },
  { label: "Sodium (mEq/L)", placeholder: "136-145" },
  { label: "Potassium (mEq/L)", placeholder: "3.5-5.0" },
  { label: "Chloride (mEq/L)", placeholder: "98-107" },
  { label: "CO2/Bicarb (mEq/L)", placeholder: "23-29" },
  { label: "Calcium (mg/dL)", placeholder: "8.5-10.5" },
  { label: "Phosphorus (mg/dL)", placeholder: "2.5-4.5" },
  { label: "Albumin (g/dL)", placeholder: "3.5-5.5" },
  { label: "Total Protein (g/dL)", placeholder: "6.0-8.3" },
  { label: "Magnesium (mg/dL)", placeholder: "1.7-2.2" },
  { label: "Corrected Calcium (mg/dL)", placeholder: "8.5-10.5" },
  { label: "Uric Acid (mg/dL)", placeholder: "2.5-7.0" },
  { label: "CRP (mg/L)", placeholder: "<5" },
  { label: "ALT / GPT (U/L)", placeholder: "7-56" },
  { label: "ALP (U/L)", placeholder: "44-147" },
];

const labSections: LabSection[] = [
  {
    title: "METABOLIC PANEL (CMP)",
    icon: FlaskConical,
    metricCount: "20 Metrics",
    columns: "four",
    fields: cmpFields,
  },
  {
    title: "CBC",
    icon: Droplet,
    fields: [
      { label: "WBC (K/uL)", placeholder: "4.0-11.0" },
      { label: "RBC (M/uL)", placeholder: "4.0-5.5" },
      { label: "Hemoglobin (g/dL)", placeholder: "12-16" },
      { label: "Hematocrit (%)", placeholder: "36-46" },
      { label: "MCV (fL)", placeholder: "80-100" },
      { label: "MCH (pg)", placeholder: "27-33" },
      { label: "MCHC (g/dL)", placeholder: "32-36" },
      { label: "RDW (%)", placeholder: "11-15" },
      { label: "Platelet Count (K/uL)", placeholder: "150-400" },
    ],
  },
  {
    title: "WBC DIFFERENTIAL",
    icon: Droplet,
    fields: [
      { label: "Neutrophils (%)", placeholder: "40-70" },
      { label: "Neutrophils Abs (K/uL)", placeholder: "1.5-7.5" },
      { label: "Lymphocytes (%)", placeholder: "20-40" },
      { label: "Lymphocytes Abs (K/uL)", placeholder: "1.0-4.8" },
      { label: "Monocytes (%)", placeholder: "2-8" },
      { label: "Monocytes Abs (K/uL)", placeholder: "0.2-0.9" },
    ],
  },
  {
    title: "IRON STUDIES",
    icon: FlaskConical,
    fields: [
      { label: "Iron (mcg/dL)", placeholder: "50-170" },
      { label: "TIBC (mcg/dL)", placeholder: "250-450" },
      { label: "Iron Saturation (%)", placeholder: "20-50" },
      { label: "Ferritin (ng/mL)", placeholder: "20-200" },
    ],
  },
  {
    title: "BONE & MINERAL",
    icon: Bone,
    fields: [
      { label: "PTH (Intact) (pg/mL)", placeholder: "10-65" },
      { label: "Vitamin D (ng/mL)", placeholder: "30-100" },
    ],
  },
  {
    title: "DIABETES LABS",
    icon: FlaskConical,
    fields: [
      { label: "Hemoglobin A1C (%)", placeholder: "4.0-5.6" },
      { label: "Glucose (mg/dL)", placeholder: "70-100" },
      { label: "Microalbumin (mg/L)", placeholder: "<30" },
      { label: "Urine Albumin/Creatinine Ratio(mg/g)", placeholder: "<30" },
    ],
  },
];

function TextField({
  label,
  placeholder,
  select,
}: {
  label: string;
  placeholder: string;
  select?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
        {label}
      </span>
      <span className="mt-2 flex h-12 items-center rounded border border-[#CBD5ED] bg-white px-4 text-base font-normal leading-6 tracking-[0.08px] text-slate-500">
        <span className="min-w-0 flex-1 truncate">{placeholder}</span>
        {select && <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" />}
      </span>
    </label>
  );
}

function SectionHeading({
  title,
  icon: Icon,
  metricCount,
}: {
  title: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  metricCount?: string;
}) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 bg-[#F1F5FA] px-6 py-4">
      <div className="flex min-w-0 items-center gap-3">
        {Icon ? <Icon className="h-5 w-5 shrink-0 text-blue-700" /> : <span className="h-6 w-1 rounded-full bg-blue-800" />}
        <h2 className="truncate text-lg font-semibold leading-6 tracking-[0.09px] text-[#111C2C]">
          {title}
        </h2>
      </div>
      {metricCount && (
        <p className="shrink-0 text-sm font-medium leading-5 text-slate-500">{metricCount}</p>
      )}
    </div>
  );
}

function LabSectionCard({ section }: { section: LabSection }) {
  const columns =
    section.columns === "four"
      ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
      : "grid-cols-1 sm:grid-cols-2";

  return (
    <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white">
      <SectionHeading title={section.title} icon={section.icon} metricCount={section.metricCount} />
      <div className={`grid gap-4 p-4 ${columns}`}>
        {section.fields.map((field) => (
          <TextField key={`${section.title}-${field.label}`} {...field} />
        ))}
      </div>
    </section>
  );
}

export default function AddBloodResultsPage() {
  const cbcSections = labSections.slice(1, 3);
  const midSections = labSections.slice(3, 5);

  return (
    <div className="space-y-6">
      <PersonalLogDisclaimer />

      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <Link
            href="/dashboard/personal-log/blood-results"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blood Results
          </Link>
          <h1 className="text-[32px] font-medium leading-none text-slate-950">
            Add Blood Results
          </h1>
          <p className="mt-1 max-w-[737px] text-lg font-medium leading-7 tracking-[0.09px] text-slate-700">
            Enter your lab results to track your kidney health trends and monitor treatment
            efficacy.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="flex h-12 items-center justify-center gap-2 rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold tracking-[0.08px] text-slate-950 transition-colors hover:bg-white"
          >
            <ScanLine className="h-5 w-5" />
            Scan Document
          </button>
          <button
            type="button"
            className="flex h-12 items-center justify-center gap-2 rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold tracking-[0.08px] text-slate-950 transition-colors hover:bg-white"
          >
            <Upload className="h-5 w-5" />
            Upload PDF
          </button>
        </div>
      </header>

      <section className="rounded-[10px] border border-slate-200 bg-[#F8FAFC] p-3">
        <div className="mb-3 flex items-center gap-3">
          <span className="h-6 w-1 rounded-full bg-blue-800" />
          <h2 className="text-2xl font-medium leading-8 tracking-[0.12px] text-[#111C2C]">
            General Information
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField label="Test Date" placeholder="mm/dd/yyyy" />
          <TextField label="Unit System" placeholder="US Conventional (mg/dL, g/dL)" select />
        </div>
      </section>

      <LabSectionCard section={labSections[0]} />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {cbcSections.map((section) => (
          <LabSectionCard key={section.title} section={section} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {midSections.map((section) => (
          <LabSectionCard key={section.title} section={section} />
        ))}
      </section>

      <LabSectionCard section={labSections[5]} />

      <section className="rounded-[10px] border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-700" />
          <h2 className="text-2xl font-medium leading-8 tracking-[0.12px] text-[#111C2C]">
            Clinical Notes
          </h2>
        </div>
        <textarea
          className="h-[130px] w-full resize-none rounded border border-[#CBD5ED] bg-white p-4 text-base leading-6 text-slate-700 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="Any additional observations from your clinician or symptoms you noticed today..."
        />
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Link
          href="/dashboard/personal-log/blood-results"
          className="flex h-[52px] items-center justify-center rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold text-slate-950 transition-colors hover:bg-white"
        >
          Cancel
        </Link>
        <button
          type="button"
          className="flex h-[52px] items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
        >
          <Save className="h-5 w-5" />
          Save Results
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
