"use client";

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
import { useLanguage } from "@/context/LanguageContext";

interface FieldConfig {
  labelKey: string;
  placeholderKey: string;
  helperKey?: string;
  full?: boolean;
  search?: boolean;
  select?: boolean;
  textarea?: boolean;
}

const FIELD_CONFIGS: FieldConfig[] = [
  {
    labelKey: "nameLabel",
    placeholderKey: "namePlaceholder",
    helperKey: "nameHelper",
    full: true,
    search: true,
  },
  { labelKey: "doseLabel", placeholderKey: "dosePlaceholder" },
  { labelKey: "routeLabel", placeholderKey: "routePlaceholder", select: true },
  { labelKey: "frequencyLabel", placeholderKey: "frequencyPlaceholder", select: true },
  { labelKey: "purposeLabel", placeholderKey: "purposePlaceholder" },
  { labelKey: "startDateLabel", placeholderKey: "startDatePlaceholder" },
  { labelKey: "endDateLabel", placeholderKey: "endDatePlaceholder" },
  { labelKey: "providerLabel", placeholderKey: "providerPlaceholder" },
  { labelKey: "pharmacyLabel", placeholderKey: "pharmacyPlaceholder" },
  {
    labelKey: "instructionsLabel",
    placeholderKey: "instructionsPlaceholder",
    full: true,
    textarea: true,
  },
];

export default function AddMedicationPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-[672px]">
      <Link
        href="/dashboard/personal-log/medications"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("medicationsLog.backToLog")}
      </Link>

      <section className="rounded-[14px] border border-[#E3E6F0] bg-[#F1F5FA] p-3">
        <header className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-blue-100 text-blue-600">
            <BriefcaseMedical className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-medium leading-7 tracking-[0.09px] text-slate-950">
              {t("medicationsLog.addNewMedication")}
            </h1>
            <p className="mt-0.5 text-base font-medium leading-6 tracking-[0.08px] text-slate-700">
              {t("medicationsLog.addNewSubtitle")}
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
            {FIELD_CONFIGS.map((field) => (
              <label
                key={field.labelKey}
                className={`block ${field.full ? "md:col-span-2" : ""}`}
              >
                <span className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
                  {t(`medicationsLog.addForm.${field.labelKey}`)}
                </span>
                <span
                  className={`mt-2 flex rounded border border-[#CBD5ED] bg-white px-4 text-base font-normal leading-6 tracking-[0.08px] text-slate-500 ${
                    field.textarea ? "h-[102px] items-start py-3" : "h-12 items-center"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {t(`medicationsLog.addForm.${field.placeholderKey}`)}
                  </span>
                  {field.search && <Search className="h-5 w-5 shrink-0 text-slate-500" />}
                  {field.select && <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" />}
                </span>
                {field.helperKey && (
                  <span className="mt-2 block text-sm font-medium leading-5 tracking-[0.07px] text-slate-700">
                    {t(`medicationsLog.addForm.${field.helperKey}`)}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Link
            href="/dashboard/personal-log/medications"
            className="flex h-12 items-center justify-center rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold text-slate-950 transition-colors hover:bg-white cursor-pointer"
          >
            {t("medicationsLog.cancel")}
          </Link>
          <button
            type="button"
            className="flex h-12 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            {t("medicationsLog.addMedication")}
          </button>
        </div>
      </section>
    </div>
  );
}
