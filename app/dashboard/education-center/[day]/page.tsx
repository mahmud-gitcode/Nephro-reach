"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Languages,
  LayoutList,
  PlayCircle,
  RotateCcw,
  X,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import JourneyDayList from "@/components/dashboard/JourneyDayList";
import JourneyResourceDrawer, {
  JourneyPanelContent,
  JourneyPanelRail,
  JourneyPanelTab,
} from "@/components/dashboard/JourneyResourcePanel";
import {
  formatCueTime,
  getJourneyDayBySlug,
  JOURNEY_DAYS,
  JOURNEY_PHASES,
  JourneyDay,
  TOTAL_JOURNEY_DAYS,
} from "@/lib/dialysisJourneyData";
import { useJourneyProgress } from "@/lib/useJourneyProgress";
import { useJourneyNotes } from "@/lib/useJourneyNotes";

/**
 * Player and transcript for one day.
 *
 * Keyed by slug from the page below so moving between days resets playback
 * position and the transcript highlight instead of carrying them over.
 */
function DayStage({
  day,
  isComplete,
  onWatched,
  onToggleComplete,
}: {
  day: JourneyDay;
  isComplete: boolean;
  onWatched: (percent: number) => void;
  onToggleComplete: () => void;
}) {
  const { language, dictionary } = useLanguage();
  const isEs = language === "ES";
  const j = dictionary?.educationJourney;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoUnavailable, setVideoUnavailable] = useState(false);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const seconds = Math.floor(video.currentTime);
    setCurrentTime((previous) => (previous === seconds ? previous : seconds));

    if (video.duration > 0) {
      onWatched((video.currentTime / video.duration) * 100);
    }
  }, [onWatched]);

  const seekTo = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    void video.play().catch(() => {
      // Autoplay can be blocked; the seek still lands where the user asked.
    });
  }, []);

  // The last cue whose timestamp has passed is the one being spoken.
  const activeCueIndex = day.transcript.reduce(
    (active, cue, index) => (currentTime >= cue.at ? index : active),
    -1,
  );

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-[0_0_60px_rgba(0,0,0,0.06)]">
        <div className="relative aspect-video w-full">
          {videoUnavailable ? (
            <>
              <Image
                src={day.poster}
                alt=""
                fill
                className="object-cover opacity-40"
                sizes="(min-width: 1536px) 560px, (min-width: 1280px) 620px, 100vw"
                priority
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                <PlayCircle className="h-12 w-12 text-white/70" />
                <p className="text-base font-semibold text-white">
                  {j?.videoUnavailableTitle || "Video coming soon"}
                </p>
                <p className="max-w-sm text-sm leading-relaxed text-white/70">
                  {j?.videoUnavailableBody ||
                    "The full transcript for this lesson is available below."}
                </p>
              </div>
            </>
          ) : (
            <video
              ref={videoRef}
              src={day.videoSrc}
              poster={day.poster}
              controls
              preload="metadata"
              onTimeUpdate={handleTimeUpdate}
              onError={() => setVideoUnavailable(true)}
              className="h-full w-full bg-black"
            />
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_0_60px_rgba(0,0,0,0.06)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-8 text-slate-950 sm:text-[28px]">
              {isEs ? day.titleEs : day.titleEn}
            </h1>
            <p className="mt-1.5 text-xs font-semibold text-slate-500">
              {j?.dayLabel || "Day"} {day.day} · {day.durationMinutes}{" "}
              {j?.minutesShort || "min"}
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleComplete}
            className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold shadow-sm transition-colors cursor-pointer ${
              isComplete
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "bg-[#2563EB] text-white hover:bg-blue-700"
            }`}
          >
            {isComplete ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span>
              {isComplete
                ? j?.markIncomplete || "Mark as not done"
                : j?.markComplete || "Mark day complete"}
            </span>
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-[0_0_60px_rgba(0,0,0,0.06)]">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-4 sm:p-5">
          <h2 className="text-lg font-semibold leading-7 text-slate-950">
            {j?.transcript || "Transcript"}
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
            <Languages className="h-3.5 w-3.5" />
            {language === "ES" ? "Español" : "English"}
          </span>
        </header>

        <ol className="divide-y divide-slate-100">
          {day.transcript.map((cue, index) => {
            const isActive = index === activeCueIndex;
            return (
              <li key={cue.at}>
                <button
                  type="button"
                  onClick={() => seekTo(cue.at)}
                  disabled={videoUnavailable}
                  className={`flex w-full items-start gap-3 p-4 text-left transition-colors sm:p-5 ${
                    isActive ? "bg-blue-50/70" : "hover:bg-slate-50"
                  } ${videoUnavailable ? "cursor-default" : "cursor-pointer"}`}
                >
                  <span
                    className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold tabular-nums ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {formatCueTime(cue.at)}
                  </span>
                  <span
                    className={`text-sm leading-relaxed ${
                      isActive ? "font-medium text-slate-900" : "text-slate-700"
                    }`}
                  >
                    {isEs ? cue.textEs : cue.textEn}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <p className="border-t border-slate-100 px-4 py-3 text-xs font-medium text-slate-500 sm:px-5">
          {j?.transcriptNote ||
            "The transcript follows the language selected in the header."}
        </p>
      </section>
    </div>
  );
}

export default function JourneyDayPage() {
  const params = useParams();
  const { language, dictionary } = useLanguage();
  const isEs = language === "ES";
  const j = dictionary?.educationJourney;

  const slug = (params?.day as string) || JOURNEY_DAYS[0].slug;
  const day = getJourneyDayBySlug(slug);

  const {
    getProgress,
    markComplete,
    markIncomplete,
    recordWatched,
    completedCount,
  } = useJourneyProgress();

  const { getNote, setNote, flushNote, saveState } = useJourneyNotes();

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<JourneyPanelTab>("overview");
  const [dayListOpen, setDayListOpen] = useState(false);

  // Clicking the active tab collapses the panel; any other tab switches to it.
  const handleSelectTab = useCallback(
    (tab: JourneyPanelTab) => {
      if (panelOpen && panelTab === tab) {
        setPanelOpen(false);
        return;
      }
      setPanelTab(tab);
      setPanelOpen(true);
    },
    [panelOpen, panelTab, setPanelOpen, setPanelTab],
  );

  const closePanel = useCallback(() => setPanelOpen(false), [setPanelOpen]);

  // The mobile day drawer closes on Escape, same as the resource drawer.
  useEffect(() => {
    if (!dayListOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDayListOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dayListOpen]);

  if (!day) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_0_60px_rgba(0,0,0,0.06)]">
        <h1 className="text-xl font-semibold text-slate-950">
          {j?.dayNotFoundTitle || "That day is not part of the journey"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {j?.dayNotFoundBody ||
            "Pick a day from the 21-Day Dialysis Journey to get started."}
        </p>
        <Link
          href="/dashboard/education-center"
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {j?.backToJourney || "Back to the journey"}
        </Link>
      </div>
    );
  }

  const state = getProgress(day.slug);
  const isComplete = state.status === "completed";
  const phase = JOURNEY_PHASES[day.phase];
  const note = getNote(day.slug);

  const currentIndex = JOURNEY_DAYS.findIndex((entry) => entry.slug === day.slug);
  const previousDay = currentIndex > 0 ? JOURNEY_DAYS[currentIndex - 1] : null;
  const nextDay =
    currentIndex < JOURNEY_DAYS.length - 1 ? JOURNEY_DAYS[currentIndex + 1] : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/education-center"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {j?.backToJourney || "Back to the journey"}
          </Link>

          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${phase.chipClass}`}
          >
            {isEs ? phase.labelEs : phase.labelEn}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <CircleCheck className="h-4 w-4 text-emerald-500" />
            {completedCount}/{TOTAL_JOURNEY_DAYS}{" "}
            {j?.completedShort || "complete"}
          </span>

          <button
            type="button"
            onClick={() => setDayListOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50 cursor-pointer xl:hidden"
          >
            <LayoutList className="h-4 w-4 text-slate-600" />
            {j?.allDays || "All days"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_0_60px_rgba(0,0,0,0.06)]">
            <JourneyDayList
              days={JOURNEY_DAYS}
              activeSlug={day.slug}
              getProgress={getProgress}
            />
          </div>
        </aside>

        <div className="flex min-w-0 gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <DayStage
              key={day.slug}
              day={day}
              isComplete={isComplete}
              onWatched={(percent) => recordWatched(day.slug, percent)}
              onToggleComplete={() =>
                isComplete ? markIncomplete(day.slug) : markComplete(day.slug)
              }
            />

            <nav className="mt-4 flex items-center justify-between gap-3">
              {previousDay ? (
                <Link
                  href={`/dashboard/education-center/${previousDay.slug}`}
                  className="inline-flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4 shrink-0 text-slate-600" />
                  <span className="truncate">
                    {j?.previousDay || "Previous"} · {j?.dayLabel || "Day"}{" "}
                    {previousDay.day}
                  </span>
                </Link>
              ) : (
                <span />
              )}

              {nextDay && (
                <Link
                  href={`/dashboard/education-center/${nextDay.slug}`}
                  className="inline-flex min-w-0 items-center gap-2 rounded-2xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                >
                  <span className="truncate">
                    {j?.nextDay || "Next"} · {j?.dayLabel || "Day"} {nextDay.day}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </Link>
              )}
            </nav>
          </div>

          {/* Right side: the panel docks beside the lesson from 2xl up, and
              falls back to the slide-over drawer on narrower screens. */}
          <div className="sticky top-4 flex shrink-0 items-start gap-3 self-start">
            <div
              className={`hidden overflow-hidden transition-[width,opacity] duration-300 ease-out 2xl:block ${
                panelOpen ? "w-[340px] opacity-100" : "w-0 opacity-0"
              }`}
            >
              <div className="flex h-full max-h-[calc(100vh-2rem)] w-[340px] flex-col rounded-3xl border border-slate-200 bg-white shadow-[0_0_60px_rgba(0,0,0,0.06)]">
                <JourneyPanelContent
                  day={day}
                  activeTab={panelTab}
                  onClose={closePanel}
                  note={note}
                  onNoteChange={(value) => setNote(day.slug, value)}
                  onNoteBlur={flushNote}
                  saveState={saveState}
                  interactive={panelOpen}
                />
              </div>
            </div>

            <JourneyPanelRail
              activeTab={panelTab}
              open={panelOpen}
              onSelect={handleSelectTab}
            />
          </div>
        </div>
      </div>

      {/* Mobile day rail — same slide-over treatment as the resource drawer. */}
      <div
        className={`fixed inset-0 z-50 xl:hidden ${dayListOpen ? "" : "pointer-events-none"}`}
        aria-hidden={dayListOpen ? undefined : true}
      >
        <button
          type="button"
          tabIndex={dayListOpen ? 0 : -1}
          onClick={() => setDayListOpen(false)}
          aria-label={j?.closePanel || "Close panel"}
          className={`absolute inset-0 h-full w-full cursor-default bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${
            dayListOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          role="dialog"
          aria-modal={dayListOpen ? true : undefined}
          aria-label={j?.allDays || "All days"}
          className={`absolute inset-y-0 left-0 flex w-full max-w-[340px] flex-col bg-white shadow-[0_0_60px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out ${
            dayListOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
            <h2 className="text-base font-semibold text-slate-950">
              {j?.allDays || "All days"}
            </h2>
            <button
              type="button"
              tabIndex={dayListOpen ? 0 : -1}
              onClick={() => setDayListOpen(false)}
              aria-label={j?.closePanel || "Close panel"}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <JourneyDayList
              days={JOURNEY_DAYS}
              activeSlug={day.slug}
              getProgress={getProgress}
              onNavigate={() => setDayListOpen(false)}
            />
          </div>
        </div>
      </div>

      <JourneyResourceDrawer
        day={day}
        open={panelOpen}
        activeTab={panelTab}
        onClose={closePanel}
        note={note}
        onNoteChange={(value) => setNote(day.slug, value)}
        onNoteBlur={flushNote}
        saveState={saveState}
      />
    </div>
  );
}
