"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Bell, Check, Eye, X, Phone } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ActionConfig {
  key: "callClinic" | "seekMedical" | "monitorSymptoms" | "call911";
  colorTheme: "blue" | "yellow" | "orange" | "red";
  callActionHref: string;
  isCallLink?: boolean;
  secondaryActionHref?: string;
  secondaryActionKey?: "findSchedule" | "urgentEducation" | "learnMoreEducation";
}

const ACTION_CONFIGS: ActionConfig[] = [
  {
    key: "callClinic",
    colorTheme: "blue",
    callActionHref: "tel:5550100",
    isCallLink: true,
    secondaryActionHref: "/dashboard/personal-log/appointments",
    secondaryActionKey: "findSchedule",
  },
  {
    key: "seekMedical",
    colorTheme: "orange",
    callActionHref: "tel:5550199",
    isCallLink: true,
    secondaryActionHref: "/dashboard/education-center",
    secondaryActionKey: "urgentEducation",
  },
  {
    key: "monitorSymptoms",
    colorTheme: "yellow",
    callActionHref: "/dashboard/personal-log/dialysis-journal",
    isCallLink: false,
    secondaryActionHref: "/dashboard/education-center",
    secondaryActionKey: "learnMoreEducation",
  },
  {
    key: "call911",
    colorTheme: "red",
    callActionHref: "tel:911",
    isCallLink: true,
  },
];

interface SymptomConfig {
  id: string;
  key:
    | "chestPain"
    | "severeFluidOverload"
    | "signsOfStroke"
    | "lossOfConsciousness"
    | "severeAllergicReactions"
    | "severeShortnessOfBreath"
    | "seizures"
    | "dialysisAccessEmergencies"
    | "severeBleeding"
    | "severeHyperkalemia"
    | "feverDialysisCatheter"
    | "confusionMentalStatus";
  urgent: boolean;
}

const SYMPTOMS: SymptomConfig[] = [
  { id: "chest-pain", key: "chestPain", urgent: true },
  { id: "severe-fluid-overload", key: "severeFluidOverload", urgent: false },
  { id: "signs-of-stroke", key: "signsOfStroke", urgent: true },
  { id: "loss-of-consciousness", key: "lossOfConsciousness", urgent: false },
  { id: "severe-allergic-reactions", key: "severeAllergicReactions", urgent: true },
  { id: "severe-shortness-of-breath", key: "severeShortnessOfBreath", urgent: false },
  { id: "seizures", key: "seizures", urgent: true },
  { id: "dialysis-access-emergencies", key: "dialysisAccessEmergencies", urgent: false },
  { id: "severe-bleeding", key: "severeBleeding", urgent: true },
  { id: "severe-hyperkalemia-symptoms", key: "severeHyperkalemia", urgent: false },
  { id: "fever-with-dialysis-catheter", key: "feverDialysisCatheter", urgent: false },
  { id: "confusion-or-mental-status-changes", key: "confusionMentalStatus", urgent: false },
];

export default function BeforeTheErPage() {
  const router = useRouter();
  const { t, dictionary } = useLanguage();

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [activeModalKey, setActiveModalKey] = useState<ActionConfig["key"] | null>(null);

  const selectedCount = selectedSymptoms.length;

  function toggleSymptom(id: string) {
    setSelectedSymptoms((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function handleGetGuidance() {
    if (selectedSymptoms.length > 0) {
      const slug = selectedSymptoms[0];
      router.push(`/dashboard/before-the-er/${slug}`);
    }
  }

  const activeConfig = activeModalKey
    ? ACTION_CONFIGS.find((c) => c.key === activeModalKey)
    : null;

  const modalData = activeModalKey && (dictionary as any)?.beforeTheEr?.[activeModalKey]
    ? ((dictionary as any).beforeTheEr[activeModalKey] as {
        title: string;
        purpose: string;
        reminder: string;
        callAction: string;
        symptoms: string[];
      })
    : null;

  return (
    <div className="space-y-4">
      {/* Disclaimer Box */}
      <section className="rounded-2xl border border-[#FFC9C9] bg-gradient-to-r from-red-50 to-orange-50 px-6 py-6">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-500" />
          <div>
            <h1 className="text-lg font-medium leading-7 text-[#0A0A0A]">
              {t("beforeTheEr.disclaimerTitle")}
            </h1>
            <p className="mt-2 text-sm font-normal leading-5 text-slate-700">
              {t("beforeTheEr.disclaimerText")}
            </p>
          </div>
        </div>
      </section>

      {/* Action Items Grid with Eye Icon Trigger */}
      <section className="rounded-[14px] border border-[#E3E6F0] bg-white px-3 py-4 shadow-xs">
        <h2 className="mb-[14px] text-2xl font-medium leading-8 text-slate-900">
          {t("beforeTheEr.sectionTitle")}
        </h2>

        <div className="rounded-lg border border-[#C4CDD5]">
          <div className="rounded-[14px] border border-slate-200 bg-[#F8FAFC] p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {ACTION_CONFIGS.map((item) => {
                const itemTitle = t(`beforeTheEr.${item.key}.title`);
                return (
                  <div
                    key={item.key}
                    className="flex min-h-[60px] items-center justify-between gap-3 rounded-[10px] border border-slate-200 bg-white p-4 text-left text-lg font-medium leading-7 text-slate-900 transition-colors hover:border-blue-300 hover:bg-blue-50/50"
                  >
                    <span className="truncate">{itemTitle}</span>
                    <button
                      type="button"
                      onClick={() => setActiveModalKey(item.key)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors cursor-pointer"
                      title={t("beforeTheEr.viewDetailsFor").replace("{item}", itemTitle)}
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Symptoms Checkbox List */}
      <section className="rounded-[14px] border border-[#E3E6F0] bg-white px-3 py-4 shadow-xs">
        <div className="mb-[14px] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-medium leading-8 text-slate-900">
              {t("beforeTheEr.notFeelingBestTitle")}
            </h2>
            <p className="mt-2 text-base font-medium leading-6 text-slate-700">
              {t("beforeTheEr.notFeelingBestSubtitle")}
            </p>
          </div>
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={handleGetGuidance}
            className={`flex h-12 items-center justify-center rounded border px-4 text-base font-bold transition-colors ${
              selectedCount === 0
                ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500"
                : "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
            }`}
          >
            {t("beforeTheEr.getGuidance")}
          </button>
        </div>

        <div className="rounded-lg border border-[#C4CDD5]">
          <div className="rounded-[14px] border border-slate-200 bg-[#F8FAFC] p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {SYMPTOMS.map((symptom) => {
                const checked = selectedSymptoms.includes(symptom.id);
                const label = t(`beforeTheEr.symptomsList.${symptom.key}`);

                return (
                  <button
                    key={symptom.id}
                    type="button"
                    onClick={() => toggleSymptom(symptom.id)}
                    className={`flex min-h-16 items-center gap-3 rounded-[10px] bg-white p-[18px] text-left transition-colors cursor-pointer ${
                      symptom.urgent
                        ? "border-2 border-red-300 hover:bg-red-50"
                        : "border border-slate-200 hover:bg-blue-50"
                    } ${checked ? "ring-2 ring-blue-200" : ""}`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                        checked
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      {checked && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className="text-lg font-medium leading-7 text-slate-900">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* EYE BUTTON DETAILS POPUP MODAL */}
      {activeConfig && modalData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity"
          onClick={() => setActiveModalKey(null)}
        >
          <div
            className="flex flex-col w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6 pb-4 bg-white shrink-0">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 leading-tight">
                  {modalData.title}
                </h3>
                <p className="text-sm font-medium text-slate-600 mt-1 leading-relaxed">
                  {modalData.purpose}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalKey(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Reminder Banner */}
              <div
                className={`flex items-start gap-3 rounded-2xl p-4 text-sm font-bold leading-relaxed ${
                  activeConfig.colorTheme === "red"
                    ? "bg-red-50 text-red-900 border border-red-200"
                    : activeConfig.colorTheme === "orange"
                    ? "bg-amber-50 text-amber-900 border border-amber-200"
                    : activeConfig.colorTheme === "yellow"
                    ? "bg-yellow-50 text-yellow-900 border border-yellow-200"
                    : "bg-blue-50 text-blue-900 border border-blue-200"
                }`}
              >
                <Bell className="h-5 w-5 shrink-0 mt-0.5" />
                <span className="break-words">{modalData.reminder}</span>
              </div>

              {/* Symptoms Bullet List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  {t("beforeTheEr.suggestedTopics")}
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-medium text-slate-700">
                  {Array.isArray(modalData.symptoms) &&
                    modalData.symptoms.map((symptomName, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-200/80 break-words whitespace-normal"
                      >
                        <span className="text-blue-600 font-bold text-base leading-none">•</span>
                        <span className="leading-snug">{symptomName}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 p-6 pt-4 bg-slate-50/50 shrink-0">
              {activeConfig.isCallLink ? (
                <a
                  href={activeConfig.callActionHref}
                  className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-colors shadow-sm ${
                    activeConfig.colorTheme === "red"
                      ? "bg-red-600 hover:bg-red-700"
                      : activeConfig.colorTheme === "orange"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : activeConfig.colorTheme === "yellow"
                      ? "bg-yellow-500 hover:bg-yellow-600 text-slate-950"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  <Phone className="h-4 w-4" />
                  {modalData.callAction}
                </a>
              ) : (
                <Link
                  href={activeConfig.callActionHref}
                  className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-colors shadow-sm ${
                    activeConfig.colorTheme === "yellow"
                      ? "bg-yellow-500 hover:bg-yellow-600 text-slate-950"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {modalData.callAction}
                </Link>
              )}

              {activeConfig.secondaryActionHref && activeConfig.secondaryActionKey && (
                <Link
                  href={activeConfig.secondaryActionHref}
                  className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors shadow-xs"
                >
                  {t(`beforeTheEr.${activeConfig.secondaryActionKey}`)}
                </Link>
              )}

              <button
                type="button"
                onClick={() => setActiveModalKey(null)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
              >
                {t("beforeTheEr.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
