"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bone,
  Droplet,
  FileText,
  FlaskConical,
  Save,
  ScanLine,
  Upload,
} from "lucide-react";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import {
  Button,
  buttonStyles,
  Card,
  FormField,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";

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

/* These were <span> elements styled to look like inputs — 45 of them, none
   of which a member could actually type into. They are real controls now. */
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
    <FormField label={label}>
      {(props) =>
        select ? (
          <Select {...props} defaultValue="">
            <option value="" disabled>
              {placeholder}
            </option>
          </Select>
        ) : (
          <Input {...props} placeholder={placeholder} />
        )
      }
    </FormField>
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
    <div className="flex min-h-14 items-center justify-between gap-inline-md border-b border-line bg-surface-sunken px-inset-lg py-inset-md">
      <div className="flex min-w-0 items-center gap-inline-md">
        {Icon ? (
          <Icon className="h-icon-small w-icon-small shrink-0 text-fg-brand" />
        ) : (
          <span
            aria-hidden="true"
            className="h-6 w-1 rounded-pill bg-primary-solid"
          />
        )}
        <h2 className="truncate text-heading-5 text-fg">{title}</h2>
      </div>
      {metricCount && (
        <p className="shrink-0 text-caption text-fg-muted">{metricCount}</p>
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
    <Card as="section" padding="none" className="overflow-hidden">
      <SectionHeading
        title={section.title}
        icon={section.icon}
        metricCount={section.metricCount}
      />
      <div className={`grid gap-stack-lg p-inset-md ${columns}`}>
        {section.fields.map((field) => (
          <TextField key={`${section.title}-${field.label}`} {...field} />
        ))}
      </div>
    </Card>
  );
}

export default function AddBloodResultsPage() {
  const cbcSections = labSections.slice(1, 3);
  const midSections = labSections.slice(3, 5);

  return (
    <div className="space-y-stack-xl">
      <PersonalLogDisclaimer />

      <header className="flex flex-col gap-inline-lg xl:flex-row xl:items-center xl:justify-between">
        <div>
          <Link
            href="/dashboard/personal-log/blood-results"
            className={buttonStyles({
              variant: "neutral",
              appearance: "stroke",
              size: "small",
            })}
          >
            <ArrowLeft />
            Back to Blood Results
          </Link>
          <h1 className="mt-stack-lg text-heading-1 text-fg">
            Add Blood Results
          </h1>
        </div>
        <div className="flex flex-wrap gap-inline-md">
          <Button
            {...notBuiltYet("Scanning results")}
            variant="neutral"
            appearance="fill-stroke"
            leadingIcon={<ScanLine />}
          >
            Scan Document
          </Button>
          <Button
            {...notBuiltYet("Uploading a file")}
            variant="neutral"
            appearance="fill-stroke"
            leadingIcon={<Upload />}
          >
            Upload PDF
          </Button>
        </div>
      </header>

      <Card as="section" tone="sunken" padding="small">
        <div className="mb-stack-md flex items-center gap-inline-md">
          <span
            aria-hidden="true"
            className="h-6 w-1 rounded-pill bg-primary-solid"
          />
          <h2 className="text-heading-3 text-fg">General Information</h2>
        </div>
        <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-2">
          <TextField label="Test Date" placeholder="mm/dd/yyyy" />
          <TextField
            label="Unit System"
            placeholder="US Conventional (mg/dL, g/dL)"
            select
          />
        </div>
      </Card>

      <LabSectionCard section={labSections[0]} />

      <section className="grid grid-cols-1 gap-inline-lg xl:grid-cols-2">
        {cbcSections.map((section) => (
          <LabSectionCard key={section.title} section={section} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-inline-lg xl:grid-cols-2">
        {midSections.map((section) => (
          <LabSectionCard key={section.title} section={section} />
        ))}
      </section>

      <LabSectionCard section={labSections[5]} />

      <Card as="section">
        <div className="mb-stack-md flex items-center gap-inline-md">
          <FileText
            aria-hidden="true"
            className="h-icon-big w-icon-big text-fg-brand"
          />
          <h2 className="text-heading-3 text-fg">Clinical Notes</h2>
        </div>
        <FormField label="Clinical notes">
          {(props) => (
            <Textarea
              {...props}
              rows={5}
              placeholder="Any additional observations from your clinician or symptoms you noticed today..."
            />
          )}
        </FormField>
      </Card>

      <div className="grid grid-cols-1 gap-inline-lg md:grid-cols-2">
        <Link
          href="/dashboard/personal-log/blood-results"
          className={buttonStyles({
            variant: "neutral",
            appearance: "fill-stroke",
            fullWidth: true,
          })}
        >
          Cancel
        </Link>
        <Button
          {...notBuiltYet("Saving results")}
          fullWidth
          leadingIcon={<Save />}
        >
          Save Results
        </Button>
      </div>
    </div>
  );
}
