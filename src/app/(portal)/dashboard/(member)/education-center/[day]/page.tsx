"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Headphones,
  LayoutList,
  PlayCircle,
  RotateCcw,
  X,
} from "lucide-react";
import { LanguageCode, useLanguage } from "@/context/LanguageContext";
import JourneyDayList from "@/components/dashboard/JourneyDayList";
import JourneyResourceDrawer, {
  JourneyPanelContent,
  JourneyPanelRail,
  JourneyPanelTab,
} from "@/components/dashboard/JourneyResourcePanel";
import {
  getJourneyDayBySlug,
  JOURNEY_DAYS,
  JourneyDay,
  JourneyMediaKind,
  TOTAL_JOURNEY_DAYS,
} from "@/lib/dialysisJourneyData";
import { useJourneyProgress } from "@/lib/useJourneyProgress";
import { useJourneyNotes } from "@/lib/useJourneyNotes";

function kindLabel(
  kind: JourneyMediaKind,
  j: Record<string, string> | undefined,
): string {
  if (kind === "audio") return j?.typeAudio || "Audio";
  if (kind === "reading") return j?.typeReading || "Reading";
  return j?.typeVideo || "Video";
}

/**
 * Player and transcript for one day.
 *
 * Keyed by slug from the page below so moving between days resets playback
 * position and the transcript highlight instead of carrying them over.
 */
function DayStage({
  day,
  isComplete,
  onToggleComplete,
  onOpenDayList,
  mediaRef,
  videoUnavailable,
  onTimeUpdate,
  onVideoError,
}: {
  day: JourneyDay;
  isComplete: boolean;
  onToggleComplete: () => void;
  onOpenDayList: () => void;
  /** Owned by the page so the transcript tab can seek this same element. */
  mediaRef: React.MutableRefObject<HTMLMediaElement | null>;
  videoUnavailable: boolean;
  onTimeUpdate: () => void;
  onVideoError: () => void;
}) {
  const { language, dictionary } = useLanguage();
  const isEs = language === "ES";
  const j = dictionary?.educationJourney;

  return (
    <div className="space-y-4">
      {day.kind === "reading" ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_0_60px_rgba(0,0,0,0.06)] sm:p-7">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-700">
            <BookOpen className="h-4 w-4" />
            {kindLabel(day.kind, j)} · {day.durationMinutes}{" "}
            {j?.minutesShort || "min"}
          </p>

          <article className="mt-4 space-y-4">
            {day.transcript.map((cue) => (
              <p
                key={cue.at}
                className="text-base leading-relaxed text-slate-700"
              >
                {isEs ? cue.textEs : cue.textEn}
              </p>
            ))}
          </article>
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-[0_0_60px_rgba(0,0,0,0.06)]">
          {videoUnavailable ? (
            <div className="relative aspect-video w-full">
              <Image
                src={day.poster}
                alt=""
                fill
                className="object-cover opacity-40"
                sizes="(min-width: 1280px) 560px, 100vw"
                priority
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                {day.kind === "audio" ? (
                  <Headphones className="h-12 w-12 text-white/70" />
                ) : (
                  <PlayCircle className="h-12 w-12 text-white/70" />
                )}
                <p className="text-base font-semibold text-white">
                  {j?.videoUnavailableTitle || "Video coming soon"}
                </p>
                <p className="max-w-sm text-sm leading-relaxed text-white/70">
                  {j?.videoUnavailableBody ||
                    "The full transcript for this lesson is available below."}
                </p>
              </div>
            </div>
          ) : day.kind === "audio" ? (
            <>
              <div className="relative aspect-[21/9] w-full">
                <Image
                  src={day.poster}
                  alt=""
                  fill
                  className="object-cover opacity-50"
                  sizes="(min-width: 1280px) 560px, 100vw"
                  priority
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Headphones className="h-12 w-12 text-white/80" />
                  <p className="text-sm font-semibold text-white/90">
                    {kindLabel(day.kind, j)} · {day.durationMinutes}{" "}
                    {j?.minutesShort || "min"}
                  </p>
                </div>
              </div>
              <div className="p-4">
                <audio
                  ref={(element) => {
                    mediaRef.current = element;
                  }}
                  src={day.videoSrc}
                  controls
                  preload="metadata"
                  onTimeUpdate={onTimeUpdate}
                  onError={onVideoError}
                  className="w-full"
                />
              </div>
            </>
          ) : (
            <video
              ref={(element) => {
                mediaRef.current = element;
              }}
              src={day.videoSrc}
              poster={day.poster}
              controls
              preload="metadata"
              onTimeUpdate={onTimeUpdate}
              onError={onVideoError}
              className="aspect-video w-full bg-black"
            />
          )}
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_0_60px_rgba(0,0,0,0.06)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-8 text-slate-950 sm:text-[28px]">
              {isEs ? day.titleEs : day.titleEn}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500">
              <span>
                {j?.dayLabel || "Day"} {day.day}
              </span>
              <span aria-hidden="true">·</span>
              <span>{kindLabel(day.kind, j)}</span>
              <span aria-hidden="true">·</span>
              <span>
                {day.durationMinutes} {j?.minutesShort || "min"}
              </span>
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            {/* Only route to the day list below the width where the rail docks. */}
            <button
              type="button"
              onClick={onOpenDayList}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50 cursor-pointer xl:hidden"
            >
              <LayoutList className="h-4 w-4 text-slate-600" />
              {j?.allDays || "All days"}
            </button>

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
        </div>
      </section>
    </div>
  );
}

export default function JourneyDayPage() {
  const params = useParams();
  const { language, dictionary } = useLanguage();
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
  const [panelTab, setPanelTab] = useState<JourneyPanelTab>("transcript");
  const [dayListOpen, setDayListOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);

  // Seeded from the header language once, then driven only by its own dropdown.
  const [transcriptLanguage, setTranscriptLanguage] =
    useState<LanguageCode>(language);

  // Playback lives here so the transcript tab and the player share one source
  // of truth. Tagging it with the slug resets it on navigation without an effect.
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const [playback, setPlayback] = useState({
    slug,
    seconds: 0,
    unavailable: false,
  });
  const currentPlayback =
    playback.slug === slug ? playback : { slug, seconds: 0, unavailable: false };

  const handleTimeUpdate = useCallback(() => {
    const video = mediaRef.current;
    if (!video) return;

    const seconds = Math.floor(video.currentTime);
    setPlayback((current) =>
      current.slug === slug && current.seconds === seconds
        ? current
        : {
            slug,
            seconds,
            unavailable: current.slug === slug ? current.unavailable : false,
          },
    );

    if (video.duration > 0) {
      recordWatched(slug, (video.currentTime / video.duration) * 100);
    }
  }, [slug, recordWatched]);

  const handleVideoError = useCallback(() => {
    setPlayback((current) => ({
      slug,
      seconds: current.slug === slug ? current.seconds : 0,
      unavailable: true,
    }));
  }, [slug]);

  const seekTo = useCallback((seconds: number) => {
    const video = mediaRef.current;
    if (!video) return;
    video.currentTime = seconds;
    void video.play().catch(() => {
      // Autoplay can be blocked; the seek still lands where the user asked.
    });
  }, []);

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

  const isReading = day.kind === "reading";
  const panelTabs: JourneyPanelTab[] = isReading
    ? ["overview", "documents", "notes"]
    : ["transcript", "overview", "documents", "notes"];
  const activePanelTab = panelTabs.includes(panelTab) ? panelTab : "overview";

  const state = getProgress(day.slug);
  const isComplete = state.status === "completed";
  const note = getNote(day.slug);

  // The last cue whose timestamp has passed is the one being spoken.
  const activeCueIndex = day.transcript.reduce(
    (active, cue, index) => (currentPlayback.seconds >= cue.at ? index : active),
    -1,
  );

  const currentIndex = JOURNEY_DAYS.findIndex((entry) => entry.slug === day.slug);
  const previousDay = currentIndex > 0 ? JOURNEY_DAYS[currentIndex - 1] : null;
  const nextDay =
    currentIndex < JOURNEY_DAYS.length - 1 ? JOURNEY_DAYS[currentIndex + 1] : null;

  return (
    <div className="space-y-4">
      <div
        className={`grid gap-4 ${
          railCollapsed
            ? "xl:grid-cols-[76px_minmax(0,1fr)]"
            : "xl:grid-cols-[360px_minmax(0,1fr)]"
        }`}
      >
        <aside className="hidden xl:block">
          <div className="sticky top-[72px] flex h-[calc(100vh-88px)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_0_60px_rgba(0,0,0,0.06)]">
            <JourneyDayList
              days={JOURNEY_DAYS}
              activeSlug={day.slug}
              getProgress={getProgress}
              completedCount={completedCount}
              totalDays={TOTAL_JOURNEY_DAYS}
              collapsed={railCollapsed}
              onToggleCollapse={() => setRailCollapsed((value) => !value)}
            />
          </div>
        </aside>

        <div className="flex min-w-0 gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <DayStage
              key={day.slug}
              day={day}
              isComplete={isComplete}
              onToggleComplete={() =>
                isComplete ? markIncomplete(day.slug) : markComplete(day.slug)
              }
              onOpenDayList={() => setDayListOpen(true)}
              mediaRef={mediaRef}
              videoUnavailable={currentPlayback.unavailable}
              onTimeUpdate={handleTimeUpdate}
              onVideoError={handleVideoError}
            />

            <nav className="mt-4 flex items-center justify-between gap-3">
              {previousDay ? (
                <Link
                  href={`/dashboard/education-center/${previousDay.slug}`}
                  className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
                >
                  <ChevronLeft className="h-4 w-4 shrink-0 text-slate-500" />
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
                  onClick={() => {
                    markComplete(day.slug);
                  }}
                  className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
                >
                  <span className="truncate">
                    {j?.nextDay || "Next"} · {j?.dayLabel || "Day"} {nextDay.day}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
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
                  activeTab={activePanelTab}
                  onClose={closePanel}
                  note={note}
                  onNoteChange={(value) => setNote(day.slug, value)}
                  onNoteBlur={flushNote}
                  saveState={saveState}
                  transcriptLanguage={transcriptLanguage}
                  onTranscriptLanguageChange={setTranscriptLanguage}
                  activeCueIndex={activeCueIndex}
                  onSeek={seekTo}
                  seekDisabled={currentPlayback.unavailable}
                  interactive={panelOpen}
                />
              </div>
            </div>

            <JourneyPanelRail
              activeTab={activePanelTab}
              open={panelOpen}
              onSelect={handleSelectTab}
              tabs={panelTabs}
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
          className={`absolute inset-y-0 left-0 flex w-full max-w-[360px] flex-col bg-white shadow-[0_0_60px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out ${
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
          <div className="min-h-0 flex-1 overflow-hidden">
            <JourneyDayList
              days={JOURNEY_DAYS}
              activeSlug={day.slug}
              getProgress={getProgress}
              completedCount={completedCount}
              totalDays={TOTAL_JOURNEY_DAYS}
              onNavigate={() => setDayListOpen(false)}
            />
          </div>
        </div>
      </div>

      <JourneyResourceDrawer
        day={day}
        open={panelOpen}
        activeTab={activePanelTab}
        onClose={closePanel}
        note={note}
        onNoteChange={(value) => setNote(day.slug, value)}
        onNoteBlur={flushNote}
        saveState={saveState}
        transcriptLanguage={transcriptLanguage}
        onTranscriptLanguageChange={setTranscriptLanguage}
        activeCueIndex={activeCueIndex}
        onSeek={seekTo}
        seekDisabled={currentPlayback.unavailable}
      />
    </div>
  );
}
