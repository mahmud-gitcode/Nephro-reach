"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Phone,
  MapPin,
  PlayCircle,
  FileText,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  ListFilter,
  Activity,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  BEFORE_THE_ER_TOPICS,
  getBeforeTheErTopic,
  SLUG_LIST,
} from "@/lib/beforeTheErData";

function SymptomDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language, t } = useLanguage();
  const isEs = language === "ES";

  const rawSlug = (params?.slug as string) || "chest-pain";
  const currentSlug = rawSlug.toLowerCase().replace(/%20/g, "-");

  const currentTopic = useMemo(() => {
    return getBeforeTheErTopic(currentSlug) || BEFORE_THE_ER_TOPICS["chest-pain"];
  }, [currentSlug]);

  const selectedParam = searchParams.get("selected");
  const selectedSlugList = useMemo(() => {
    if (!selectedParam) return [];
    return selectedParam
      .split(",")
      .map((s) => s.trim().toLowerCase().replace(/%20/g, "-"))
      .filter((s) => !!BEFORE_THE_ER_TOPICS[s]);
  }, [selectedParam]);

  const title = isEs ? currentTopic.titleEs : currentTopic.titleEn;
  const whatToWatchForFull = isEs
    ? currentTopic.whatToWatchForFullEs
    : currentTopic.whatToWatchForFullEn;
  const symptomsList = isEs
    ? currentTopic.symptomsListEs
    : currentTopic.symptomsListEn;
  const actionNote = isEs ? currentTopic.actionNoteEs : currentTopic.actionNoteEn;
  const importantInList = isEs
    ? currentTopic.importantInEs
    : currentTopic.importantInEn;

  function handleSelectTopic(newSlug: string) {
    const query = selectedParam
      ? `?selected=${encodeURIComponent(selectedParam)}`
      : "";
    router.push(`/dashboard/before-the-er/${newSlug}${query}`);
  }

  return (
    <div className="w-full space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <Link
          href="/dashboard/before-the-er"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{isEs ? "Volver a Antes de Urgencias" : "Back to Before-the-ER"}</span>
        </Link>

        {/* Quick Topic Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="topic-selector"
            className="text-xs font-bold text-slate-500 hidden sm:inline-flex items-center gap-1"
          >
            <ListFilter className="h-3.5 w-3.5" />
            <span>{isEs ? "Cambiar Tema:" : "Switch Topic:"}</span>
          </label>
          <select
            id="topic-selector"
            value={currentTopic.slug}
            onChange={(e) => handleSelectTopic(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {SLUG_LIST.map((slug) => {
              const item = BEFORE_THE_ER_TOPICS[slug];
              const itemTitle = isEs ? item.titleEs : item.titleEn;
              return (
                <option key={slug} value={slug}>
                  {itemTitle}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* MULTIPLE SELECTED SYMPTOMS SWITCHER BAR (if patient selected > 1) */}
      {selectedSlugList.length > 1 && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-blue-600" />
              <span>
                {isEs
                  ? `Síntomas Seleccionados para Orientación (${selectedSlugList.length})`
                  : `Selected Symptoms for Guidance (${selectedSlugList.length})`}
              </span>
            </p>
            <span className="text-[11px] font-medium text-blue-700">
              {isEs ? "Toca para ver cada guía" : "Tap any to view guide"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedSlugList.map((slug) => {
              const item = BEFORE_THE_ER_TOPICS[slug];
              const itemTitle = isEs ? item.titleEs : item.titleEn;
              const isActive = slug === currentTopic.slug;
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => handleSelectTopic(slug)}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-blue-200/80 hover:bg-blue-100/60"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>{itemTitle}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              {isEs ? "Guía Antes de Urgencias™" : "Before-the-ER™ Guidance"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
              {title}
            </h1>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold ${
              currentTopic.urgent
                ? "bg-red-100 text-red-800 border border-red-200"
                : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>
              {currentTopic.urgent
                ? isEs
                  ? "Atención de Emergencia"
                  : "Emergency Warning"
                : isEs
                ? "Atención Urgente"
                : "Urgent Warning"}
            </span>
          </span>
        </div>

        {/* What to Watch For Section */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-black">
                1
              </span>
              <span>{isEs ? "Qué Observar (What to Watch For)" : "What to Watch For"}</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1 pl-8">
              {isEs
                ? "Signos clínicos clave y señales de advertencia que requieren atención médica:"
                : "Key clinical warning signs and symptoms that require medical evaluation:"}
            </p>
          </div>

          {/* Full Reference Summary Box */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs sm:text-sm font-medium text-slate-800 leading-relaxed shadow-2xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {isEs ? "Descripción Completa del Tema" : "Complete Guidance Overview"}
            </p>
            <p className="text-slate-900 font-semibold">{whatToWatchForFull}</p>
          </div>

          {/* Structured Warning Signs Checklist */}
          <div className="space-y-2.5 pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pl-1">
              {isEs ? "Signos de Alarma a Vigilar:" : "Specific Warning Signs to Watch For:"}
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {symptomsList.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs leading-snug"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Emergency Directive Action Banner */}
          {actionNote && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50/80 p-4 text-xs sm:text-sm font-bold text-red-950 flex items-start gap-3 shadow-xs">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-red-700 font-extrabold mb-0.5">
                  {isEs ? "Acción de Emergencia Inmediata" : "Immediate Action Directive"}
                </span>
                <p className="text-sm font-bold text-red-900 leading-snug">
                  {actionNote}
                </p>
              </div>
            </div>
          )}

          {/* Subsection 2: Especially Important In */}
          <div className="space-y-3 pt-3 border-t border-slate-200/80">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-black">
                  2
                </span>
                <span>{t("beforeTheEr.detail.importantIn")}</span>
              </h2>
              <p className="text-xs text-slate-600 mt-1 pl-8">
                {isEs
                  ? "Poblaciones de pacientes con mayor vulnerabilidad para este síntoma:"
                  : "Patient populations with higher vulnerability for this condition:"}
              </p>
            </div>

            <ul className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pl-0 sm:pl-8">
              {importantInList.map((item, idx) => (
                <li
                  key={idx}
                  className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 text-xs font-semibold text-emerald-950 flex items-start gap-2 leading-relaxed"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link
            href="/dashboard/before-the-er"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>
              {isEs ? "Comprobar Otros Síntomas" : "Check Another Symptom"}
            </span>
          </Link>

          <a
            href="tel:911"
            className="inline-flex items-center gap-2 rounded-xl bg-[#EF4444] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-red-600 transition-colors"
          >
            <Phone className="h-4 w-4" />
            <span>{t("beforeTheEr.detail.call911")}</span>
          </a>
        </div>
      </section>

      {/* RELATED EDUCATION CARD */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {t("beforeTheEr.detail.relatedEducation")}
          </h2>
          <Link
            href="/dashboard/education-center"
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>{isEs ? "Ver Todos los Videos" : "View All Videos"}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                style={{ width: "auto", height: "auto" }}
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
                style={{ width: "auto", height: "auto" }}
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

export default function SymptomDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-64 w-full items-center justify-center text-slate-500 font-medium">
          Loading Before-the-ER guidance...
        </div>
      }
    >
      <SymptomDetailContent />
    </React.Suspense>
  );
}
