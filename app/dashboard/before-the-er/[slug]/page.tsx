"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, Phone, MapPin, PlayCircle, FileText } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const SLUG_TO_KEY: Record<string, string> = {
  "chest-pain": "chestPain",
  "severe-fluid-overload": "severeFluidOverload",
  "signs-of-stroke": "signsOfStroke",
  "loss-of-consciousness": "lossOfConsciousness",
  "severe-allergic-reactions": "severeAllergicReactions",
  "severe-shortness-of-breath": "severeShortnessOfBreath",
  "seizures": "seizures",
  "dialysis-access-emergencies": "dialysisAccessEmergencies",
  "severe-bleeding": "severeBleeding",
  "severe-hyperkalemia-symptoms": "severeHyperkalemia",
  "fever-with-dialysis-catheter": "feverDialysisCatheter",
  "confusion-or-mental-status-changes": "confusionMentalStatus",
};

export default function SymptomDetailPage() {
  const params = useParams();
  const { t } = useLanguage();

  const rawSlug = (params?.slug as string) || "chest-pain";
  const slug = rawSlug.toLowerCase().replace(/%20/g, "-");

  const symptomKey = SLUG_TO_KEY[slug];
  const formattedTitle = symptomKey
    ? t(`beforeTheEr.symptomsList.${symptomKey}`)
    : rawSlug
        .replace(/-/g, " ")
        .replace(/%20/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

  const isChestPain = slug === "chest-pain";

  const emergencySymptoms = isChestPain
    ? [
        t("beforeTheEr.detail.emergencySymptomsList.chestPressure"),
        t("beforeTheEr.detail.emergencySymptomsList.chestTightness"),
        t("beforeTheEr.detail.emergencySymptomsList.crushingChestPain"),
        t("beforeTheEr.detail.emergencySymptomsList.painSpreading"),
        t("beforeTheEr.detail.emergencySymptomsList.chestPainNausea"),
      ]
    : [
        t("beforeTheEr.detail.emergencySymptomsList.severeOnset"),
        t("beforeTheEr.detail.emergencySymptomsList.diffBreathing"),
        t("beforeTheEr.detail.emergencySymptomsList.unusualWeakness"),
        t("beforeTheEr.detail.emergencySymptomsList.rapidWorsening"),
      ];

  const importantIn = isChestPain
    ? [
        t("beforeTheEr.detail.importantInList.dialysisPatients"),
        t("beforeTheEr.detail.importantInList.kidneyFailure"),
        t("beforeTheEr.detail.importantInList.diabetesHeart"),
      ]
    : [
        t("beforeTheEr.detail.importantInList.dialysisPatients"),
        t("beforeTheEr.detail.importantInList.kidneyFailure"),
        t("beforeTheEr.detail.importantInList.highRisk"),
      ];

  return (
    <div className="w-full space-y-6">
      {/* TOP EMERGENCY WARNING ALERT CARD */}
      <section className="rounded-3xl border border-red-200 bg-[#FFF5F5] p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2.5 text-red-950 font-bold text-lg">
          <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
          <span>{t("beforeTheEr.detail.urgentNotice")}</span>
        </div>

        <p className="text-xs font-medium text-slate-700 leading-relaxed">
          {t("beforeTheEr.disclaimerText")}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href="tel:911"
            className="flex items-center gap-2 rounded-xl bg-[#EF4444] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-600 transition-colors"
          >
            <Phone className="h-4 w-4" />
            {t("beforeTheEr.detail.call911")}
          </a>

          <a
            href="https://www.google.com/maps/search/nearest+emergency+room"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <MapPin className="h-4 w-4 text-slate-600" />
            {t("beforeTheEr.detail.findNearestEr")}
          </a>
        </div>
      </section>

      {/* MAIN SYMPTOM DETAILS CARD */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 space-y-6 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900">{formattedTitle}</h1>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-5">
          {/* Subsection 1 */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {t("beforeTheEr.detail.callEmergencyFor")}
            </h2>
            <ul className="space-y-1.5 pl-6 text-xs font-medium text-slate-700 list-disc">
              {emergencySymptoms.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Subsection 2 */}
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {t("beforeTheEr.detail.importantIn")}
            </h2>
            <ul className="space-y-1.5 pl-6 text-xs font-medium text-slate-700 list-disc">
              {importantIn.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* RELATED EDUCATION CARD */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900">
          {t("beforeTheEr.detail.relatedEducation")}
        </h2>

        <div className="space-y-3">
          {/* Video Item */}
          <Link
            href="/dashboard/education-center"
            className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4 hover:bg-blue-50/50 hover:border-blue-200 transition-colors"
          >
            <div className="relative flex h-12 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-900/10 border border-blue-200">
              <Image
                src="/images/logo.svg"
                alt="NephroReach"
                width={48}
                height={32}
                className="object-contain p-1"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t("beforeTheEr.detail.videoTitle")}
              </h3>
              <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                <PlayCircle className="h-3.5 w-3.5 text-blue-600" />
                {t("beforeTheEr.detail.video")} • 8:30
              </p>
            </div>
          </Link>

          {/* Article Item */}
          <Link
            href="/dashboard/education-center"
            className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4 hover:bg-blue-50/50 hover:border-blue-200 transition-colors"
          >
            <div className="relative flex h-12 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-900/10 border border-blue-200">
              <Image
                src="/images/logo.svg"
                alt="NephroReach"
                width={48}
                height={32}
                className="object-contain p-1"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t("beforeTheEr.detail.articleTitle")}
              </h3>
              <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                {t("beforeTheEr.detail.article")} • {t("beforeTheEr.detail.readTime")}
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
