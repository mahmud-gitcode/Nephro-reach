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
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  Activity,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  BEFORE_THE_ER_TOPICS,
  getBeforeTheErTopic,
  SLUG_LIST,
  NEXT_STEP_CONFIGS,
  NextStepLevel,
} from "@/lib/beforeTheErData";

function renderFormattedText(text: string) {
  if (!text) return null;
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const linkText = match[1];
    const linkUrl = match[2];
    parts.push(
      <a
        key={match.index}
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline font-semibold transition-colors"
      >
        {linkText}
      </a>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

function formatBulletText(text: string): string {
  if (!text) return "";
  const trimmed = text.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function parseWatchForContent(text: string): { bullets: string[]; directive?: string } {
  if (!text) return { bullets: [] };

  // Special case for dialysis-access-emergencies which uses "Fistula/graft: ... Catheter: ... Heavy/spurting..."
  if (text.includes("Fistula/graft:") && text.includes("Catheter:")) {
    const parts = text.split(/(?=Catheter:)|(?=Heavy\/spurting)/);
    const fistula = parts[0]?.trim();
    const catheter = parts[1]?.trim();
    const directive = parts.slice(2).join(" ").trim();
    return {
      bullets: [fistula, catheter].filter(Boolean) as string[],
      directive: directive || undefined,
    };
  }

  // Check if text has semicolons separating symptoms
  if (text.includes(";")) {
    const rawSegments = text.split(";").map((s) => s.trim()).filter(Boolean);
    const bullets: string[] = [];
    let directive = "";

    for (let i = 0; i < rawSegments.length; i++) {
      const seg = rawSegments[i];
      // Check if this segment starts an emergency phrase (e.g. "Time to call 911", "→ 911")
      if (
        seg.includes("→") ||
        seg.toLowerCase().includes("call 911") ||
        seg.toLowerCase().includes("time to call")
      ) {
        directive = rawSegments.slice(i).join("; ").trim();
        break;
      }

      // Check if segment has a period followed by sentence
      const periodMatch = seg.match(/\.\s+([A-Z])/);
      if (periodMatch && periodMatch.index !== undefined) {
        const bulletPart = seg.substring(0, periodMatch.index).trim();
        if (bulletPart) bullets.push(bulletPart);
        directive = seg.substring(periodMatch.index + 1).trim();
        if (i + 1 < rawSegments.length) {
          directive += "; " + rawSegments.slice(i + 1).join("; ");
        }
        break;
      } else {
        bullets.push(seg);
      }
    }

    return { bullets, directive: directive.trim() || undefined };
  }

  return { bullets: [text] };
}

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
  const parsedWatchFor = useMemo(() => {
    return parseWatchForContent(whatToWatchForFull);
  }, [whatToWatchForFull]);
  const importantInList = isEs
    ? currentTopic.importantInEs
    : currentTopic.importantInEn;
  const nextStepLevel: NextStepLevel = currentTopic.nextStepLevel || "call911";
  const nextStepConfig = NEXT_STEP_CONFIGS[nextStepLevel];

  function handleSelectTopic(newSlug: string) {
    const query = selectedParam
      ? `?selected=${encodeURIComponent(selectedParam)}`
      : "";
    router.push(`/dashboard/before-the-er/${newSlug}${query}`);
  }

  return (
    <div className="w-full space-y-6">
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

      {/* 1. EMERGENCY NOTICE CARD (Normal neutral bg & border) */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 space-y-2 shadow-xs">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-red-600">
            {isEs ? "AVISO DE EMERGENCIA" : "EMERGENCY NOTICE"}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm sm:text-base font-medium text-slate-700 leading-relaxed">
            {isEs
              ? "Before-the-ER™ no diagnostica afecciones médicas. Si cree que está experimentando una emergencia potencialmente mortal, llame al 911 de inmediato."
              : "Before-the-ER™ does not diagnose medical conditions. If you believe you are experiencing a life-threatening emergency, call 911 immediately."}
          </p>

          <a
            href="tel:911"
            className="text-sm sm:text-base font-bold text-red-600 underline underline-offset-4 hover:text-red-700 transition-colors shrink-0 whitespace-nowrap"
          >
            {isEs ? "Llamar al 911" : "Call 911"}
          </a>
        </div>
      </section>

      {/* 2. YOUR NEXT STEP ESCALATION CARD */}
      <section
        className={`rounded-3xl border ${nextStepConfig.cardBorder} ${nextStepConfig.cardBg} p-5 sm:p-6 space-y-3.5 shadow-xs`}
      >
        <div className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
            {isEs ? "SU SIGUIENTE PASO" : "YOUR NEXT STEP"}
          </span>
          <p className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed">
            {isEs ? nextStepConfig.descriptionEs : nextStepConfig.descriptionEn}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {nextStepLevel === "call911" && (
            <>
              <a
                href="tel:911"
                className="flex items-center gap-2 rounded-xl bg-[#EF4444] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-600 transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>{t("beforeTheEr.detail.call911")}</span>
              </a>
              <a
                href="https://www.google.com/maps/search/nearest+emergency+room"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <MapPin className="h-4 w-4 text-slate-600" />
                <span>{t("beforeTheEr.detail.findNearestEr")}</span>
              </a>
            </>
          )}

          {nextStepLevel === "callDialysis" && (
            <>
              <a
                href="tel:5550100"
                className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-700 transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>{isEs ? "Llamar a la Clínica de Diálisis" : "Call Dialysis Clinic"}</span>
              </a>
              <a
                href="tel:911"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-red-600 shadow-2xs hover:bg-red-50 transition-colors"
              >
                <span>{isEs ? "Si empeora: 911" : "If Severe: Call 911"}</span>
              </a>
            </>
          )}

          {nextStepLevel === "urgentMedical" && (
            <>
              <a
                href="https://www.google.com/maps/search/nearest+emergency+room"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-700 transition-colors"
              >
                <MapPin className="h-4 w-4" />
                <span>{isEs ? "Buscar Urgencias / ER" : "Seek Urgent Care / ER"}</span>
              </a>
              <a
                href="tel:911"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-red-600 shadow-2xs hover:bg-red-50 transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>{isEs ? "Emergencia: 911" : "Emergency: 911"}</span>
              </a>
            </>
          )}

          {nextStepLevel === "monitor" && (
            <Link
              href="/dashboard/personal-log/dialysis-journal"
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <span>{isEs ? "Registrar en Diario" : "Log in Health Journal"}</span>
            </Link>
          )}
        </div>
      </section>

      {/* MAIN SYMPTOM DETAILS CARD */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 space-y-6 shadow-xs">
        <div className="border-b border-slate-100 pb-4">
          <div className="relative inline-flex items-center gap-2 group">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <span>{title}</span>
              <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 group-hover:text-slate-700 transition-colors pointer-events-none" />
            </h1>
            <select
              id="topic-selector"
              value={currentTopic.slug}
              onChange={(e) => handleSelectTopic(e.target.value)}
              aria-label={isEs ? "Seleccionar Tema" : "Select Topic"}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base"
            >
              {SLUG_LIST.map((slug) => {
                const item = BEFORE_THE_ER_TOPICS[slug];
                const itemTitle = isEs ? item.titleEs : item.titleEn;
                return (
                  <option key={slug} value={slug} className="text-slate-900 font-semibold text-base py-1">
                    {itemTitle}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* What to Watch For Section */}
        <div className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {isEs ? "Qué Observar (What to Watch For)" : "What to Watch For"}
          </h2>

          <ul className="space-y-2.5">
            {parsedWatchFor.bullets.map((bullet, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-slate-800 leading-relaxed"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500 shrink-0 mt-2" />
                <span>{renderFormattedText(formatBulletText(bullet))}</span>
              </li>
            ))}
          </ul>

          {/* Emergency Directive & Source Citation Callout */}
          {parsedWatchFor.directive && (
            <div className="inline-flex w-fit max-w-full items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/70 p-3.5 text-xs sm:text-sm font-medium text-red-950 leading-relaxed mt-2">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                {renderFormattedText(parsedWatchFor.directive)}
              </div>
            </div>
          )}
        </div>

        {/* Subsection 2: Especially Important In */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {t("beforeTheEr.detail.importantIn")}
          </h2>

          <ul className="space-y-2.5">
            {importantInList.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-slate-800 leading-relaxed"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500 shrink-0 mt-2" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
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
