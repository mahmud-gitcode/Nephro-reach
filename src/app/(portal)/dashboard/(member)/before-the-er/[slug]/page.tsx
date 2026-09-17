"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Phone,
  MapPin,
  ChevronDown,
  Activity,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { buttonStyles, Card } from "@/components/ui";
import {
  ExternalLink,
  ExternalLinkProvider,
} from "@/components/common/ExternalLinkDisclaimer";
import { NoticeRailLayout } from "@/components/layout/NoticeRailLayout";
import RelatedLibrary from "@/features/library/member/RelatedLibrary";
import {
  BEFORE_THE_ER_TOPICS,
  getBeforeTheErTopic,
  SLUG_LIST,
  NEXT_STEP_CONFIGS,
  NextStepLevel,
} from "@/features/emergency/beforeTheErData";

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
      <ExternalLink
        key={match.index}
        href={linkUrl}
        className="font-semibold text-fg-brand underline transition-colors hover:text-primary-fg"
      >
        {linkText}
      </ExternalLink>,
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

function parseWatchForContent(text: string): {
  bullets: string[];
  directive?: string;
} {
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
    const rawSegments = text
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
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
    return (
      getBeforeTheErTopic(currentSlug) || BEFORE_THE_ER_TOPICS["chest-pain"]
    );
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
    <NoticeRailLayout
      notices={
        <>
          {/* 1. EMERGENCY NOTICE CARD (Normal neutral bg & border) */}
          <Card
            as="section"
            padding="none"
            className="space-y-stack-sm p-inset-lg"
          >
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-control bg-danger-surface text-danger"
            >
              <AlertTriangle className="size-4" />
            </span>
            <div>
              <span className="text-xs font-black tracking-wider text-danger uppercase">
                {isEs ? "AVISO DE EMERGENCIA" : "EMERGENCY NOTICE"}
              </span>
            </div>

            <div className="flex flex-col items-start gap-3">
              <p className="text-justify text-sm leading-relaxed font-medium text-fg-secondary sm:text-base">
                {isEs
                  ? "Before-the-ER™ no diagnostica afecciones médicas. Si cree que está experimentando una emergencia potencialmente mortal, llame al 911 de inmediato."
                  : "Before-the-ER™ does not diagnose medical conditions. If you believe you are experiencing a life-threatening emergency, call 911 immediately."}
              </p>

              <a
                href="tel:911"
                className="shrink-0 text-sm font-bold whitespace-nowrap text-danger underline underline-offset-4 transition-colors hover:text-danger sm:text-base"
              >
                {isEs ? "Llamar al 911" : "Call 911"}
              </a>
            </div>
          </Card>
        </>
      }
    >
      <div className="space-y-6">
        {/* MULTIPLE SELECTED SYMPTOMS SWITCHER BAR (if patient selected > 1) */}
        {selectedSlugList.length > 1 && (
          <section className="space-y-stack-sm rounded-card border border-primary-soft-line bg-primary-soft p-inset-md">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-primary-fg uppercase">
                <Activity className="h-4 w-4 text-fg-brand" />
                <span>
                  {isEs
                    ? `Síntomas Seleccionados para Orientación (${selectedSlugList.length})`
                    : `Selected Symptoms for Guidance (${selectedSlugList.length})`}
                </span>
              </p>
              <span className="text-[11px] font-medium text-fg-brand">
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
                    className={`flex cursor-pointer items-center gap-1.5 rounded-control px-3.5 py-2 text-xs font-bold transition-all sm:text-sm ${
                      isActive
                        ? "bg-primary-solid text-primary-on-solid shadow-control"
                        : "border border-primary-soft-line bg-surface text-fg-secondary hover:bg-primary-soft-hover"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-success-600" />
                    <span>{itemTitle}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 2. YOUR NEXT STEP ESCALATION CARD */}
        <section
          className={`rounded-panel border ${nextStepConfig.cardBorder} ${nextStepConfig.cardBg} space-y-3.5 p-5 shadow-control sm:p-6`}
        >
          <div className="space-y-1.5">
            <span className="text-xs font-black tracking-wider text-fg-muted uppercase">
              {isEs ? "SU SIGUIENTE PASO" : "YOUR NEXT STEP"}
            </span>
            <p className="text-sm leading-relaxed font-semibold text-fg sm:text-base">
              {isEs
                ? nextStepConfig.descriptionEs
                : nextStepConfig.descriptionEn}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {nextStepLevel === "call911" && (
              <>
                <a
                  href="tel:911"
                  className={buttonStyles({ variant: "danger" })}
                >
                  <Phone aria-hidden="true" />
                  <span>{t("beforeTheEr.detail.call911")}</span>
                </a>
                <ExternalLink
                  href="https://www.google.com/maps/search/nearest+emergency+room"
                  className={buttonStyles({
                    variant: "neutral",
                    appearance: "fill-stroke",
                  })}
                >
                  <MapPin aria-hidden="true" />
                  <span>{t("beforeTheEr.detail.findNearestEr")}</span>
                </ExternalLink>
              </>
            )}

            {nextStepLevel === "callDialysis" && (
              <>
                <a href="tel:5550100" className={CTA_WARNING}>
                  <Phone aria-hidden="true" />
                  <span>
                    {isEs
                      ? "Llamar a la Clínica de Diálisis"
                      : "Call Dialysis Clinic"}
                  </span>
                </a>
                <a
                  href="tel:911"
                  className={buttonStyles({
                    variant: "danger",
                    appearance: "fill-stroke",
                  })}
                >
                  <span>
                    {isEs ? "Si empeora: 911" : "If Severe: Call 911"}
                  </span>
                </a>
              </>
            )}

            {nextStepLevel === "urgentMedical" && (
              <>
                <ExternalLink
                  href="https://www.google.com/maps/search/nearest+emergency+room"
                  className={CTA_WARNING}
                >
                  <MapPin aria-hidden="true" />
                  <span>
                    {isEs ? "Buscar Urgencias / ER" : "Seek Urgent Care / ER"}
                  </span>
                </ExternalLink>
                <a
                  href="tel:911"
                  className={buttonStyles({
                    variant: "danger",
                    appearance: "fill-stroke",
                  })}
                >
                  <Phone aria-hidden="true" />
                  <span>{isEs ? "Emergencia: 911" : "Emergency: 911"}</span>
                </a>
              </>
            )}

            {nextStepLevel === "monitor" && (
              <Link
                href="/dashboard/personal-log/dialysis-journal"
                className={CTA_SUCCESS}
              >
                <span>
                  {isEs ? "Registrar en Diario" : "Log in Health Journal"}
                </span>
              </Link>
            )}
          </div>
        </section>

        {/* MAIN SYMPTOM DETAILS CARD */}
        <section className="space-y-6 rounded-panel border border-line bg-surface p-6 shadow-control">
          <div className="border-b border-line-subtle pb-4">
            <div className="group relative inline-flex items-center gap-2">
              <h1 className="flex items-center gap-2 text-2xl font-bold text-fg sm:text-3xl">
                <span>{title}</span>
                <ChevronDown className="pointer-events-none h-5 w-5 text-fg-subtle transition-colors group-hover:text-fg-secondary sm:h-6 sm:w-6" />
              </h1>
              <select
                id="topic-selector"
                value={currentTopic.slug}
                onChange={(e) => handleSelectTopic(e.target.value)}
                aria-label={isEs ? "Seleccionar Tema" : "Select Topic"}
                className="absolute inset-0 h-full w-full cursor-pointer text-base opacity-0"
              >
                {SLUG_LIST.map((slug) => {
                  const item = BEFORE_THE_ER_TOPICS[slug];
                  const itemTitle = isEs ? item.titleEs : item.titleEn;
                  return (
                    <option
                      key={slug}
                      value={slug}
                      className="py-1 text-base font-semibold text-fg"
                    >
                      {itemTitle}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* What to Watch For Section */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-fg sm:text-lg">
              {isEs ? "Qué Observar (What to Watch For)" : "What to Watch For"}
            </h2>

            <ul className="space-y-2.5">
              {parsedWatchFor.bullets.map((bullet, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs leading-relaxed font-medium text-fg-secondary sm:text-sm"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fg-muted" />
                  <span>{renderFormattedText(formatBulletText(bullet))}</span>
                </li>
              ))}
            </ul>

            {/* Emergency Directive & Source Citation Callout */}
            {parsedWatchFor.directive && (
              <div className="mt-2 inline-flex w-fit max-w-full items-start gap-2.5 rounded-control border border-danger-line bg-danger-surface p-3.5 text-xs leading-relaxed font-medium text-danger sm:text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <div className="leading-relaxed">
                  {renderFormattedText(parsedWatchFor.directive)}
                </div>
              </div>
            )}
          </div>

          {/* Subsection 2: Especially Important In */}
          <div className="space-y-3 border-t border-line-subtle pt-2">
            <h2 className="text-base font-bold text-fg sm:text-lg">
              {t("beforeTheEr.detail.importantIn")}
            </h2>

            <ul className="space-y-2.5">
              {importantInList.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs leading-relaxed font-medium text-fg-secondary sm:text-sm"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fg-muted" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Real posts off the Library shelf, not two fixed placeholders. */}
        <RelatedLibrary
          category="emergencies"
          title={t("beforeTheEr.detail.relatedEducation")}
        />
      </div>
    </NoticeRailLayout>
  );
}

/* The four next-step levels are an urgency ladder — 911, urgent care,
   clinic, self-monitor — and the colour carries that meaning, so it is not
   decoration to drop. buttonStyles() has no success or warning variant
   (actions are deliberately primary / neutral / danger / accent), so these
   two rungs are composed from the same geometry plus their own tone tokens,
   rather than by overriding buttonStyles, where the classes would collide. */
const CTA_SHAPE =
  "inline-flex shrink-0 items-center justify-center gap-inline-md border " +
  "h-control-big px-control-x-big rounded-control text-button-lg " +
  "whitespace-nowrap cursor-pointer select-none shadow-control " +
  "transition-colors duration-150 ease-standard " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
  "[&_svg]:h-icon-big [&_svg]:w-icon-big";

/* White clears AA on both: warning-600 is 5.07:1, success-600 is 4.63:1. */
const CTA_WARNING = `${CTA_SHAPE} border-transparent bg-warning-600 text-white hover:bg-warning-700`;
const CTA_SUCCESS = `${CTA_SHAPE} border-transparent bg-success-600 text-white hover:bg-success-700`;

export default function SymptomDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-64 w-full items-center justify-center font-medium text-fg-muted">
          Loading Before-the-ER guidance...
        </div>
      }
    >
      <ExternalLinkProvider>
        <SymptomDetailContent />
      </ExternalLinkProvider>
    </React.Suspense>
  );
}
