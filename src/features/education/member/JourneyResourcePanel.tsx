"use client";

import React, { useEffect, useRef } from "react";
import {
  Captions,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Info,
  Languages,
  NotebookPen,
  PencilRuler,
  X,
} from "lucide-react";
import { LanguageCode, useLanguage } from "@/context/LanguageContext";
import {
  formatCueTime,
  JOURNEY_PHASES,
  JourneyDay,
  JourneyDocumentKind,
} from "@/features/education/dialysisJourneyData";
import { downloadNoteAsText, NoteSaveState } from "@/features/education/useJourneyNotes";

export type JourneyPanelTab =
  | "transcript"
  | "overview"
  | "documents"
  | "notes";

const KIND_ICON: Record<JourneyDocumentKind, React.ElementType> = {
  pdf: FileText,
  checklist: ClipboardList,
  worksheet: PencilRuler,
};

const KIND_CLASS: Record<JourneyDocumentKind, string> = {
  pdf: "bg-danger-surface text-danger",
  checklist: "bg-success-surface text-success",
  worksheet: "bg-accent-soft text-accent-fg",
};

const TAB_ICON: Record<JourneyPanelTab, React.ElementType> = {
  transcript: Captions,
  overview: Info,
  documents: FileText,
  notes: NotebookPen,
};

const TAB_ORDER: JourneyPanelTab[] = [
  "transcript",
  "overview",
  "documents",
  "notes",
];

function tabLabel(
  tab: JourneyPanelTab,
  j: Record<string, string> | undefined,
): string {
  if (tab === "transcript") return j?.transcript || "Transcript";
  if (tab === "overview") return j?.overview || "Overview";
  if (tab === "documents") return j?.documents || "Documents";
  return j?.notes || "Notes";
}

/**
 * The transcript reads in whichever language is picked here, independently of
 * the language toggle in the header.
 */
function TranscriptTab({
  day,
  transcriptLanguage,
  onTranscriptLanguageChange,
  activeCueIndex,
  onSeek,
  seekDisabled,
  interactive,
}: {
  day: JourneyDay;
  transcriptLanguage: LanguageCode;
  onTranscriptLanguageChange: (next: LanguageCode) => void;
  activeCueIndex: number;
  onSeek: (seconds: number) => void;
  seekDisabled: boolean;
  interactive: boolean;
}) {
  const { dictionary } = useLanguage();
  const j = dictionary?.educationJourney;
  const isEs = transcriptLanguage === "ES";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <Languages className="h-4 w-4 shrink-0 text-fg-muted" />
        <label
          htmlFor="journey-transcript-language"
          className="text-xs font-semibold text-fg-muted"
        >
          {j?.transcriptLanguage || "Language"}
        </label>
        <select
          id="journey-transcript-language"
          value={transcriptLanguage}
          tabIndex={interactive ? 0 : -1}
          onChange={(event) =>
            onTranscriptLanguageChange(event.target.value as LanguageCode)
          }
          className="ml-auto rounded-control border border-line bg-surface px-2 py-1.5 text-xs font-bold text-fg-secondary outline-none transition-colors hover:bg-surface-sunken focus:border-primary-edge focus:ring-1 focus:ring-ring cursor-pointer"
        >
          <option value="EN">English</option>
          <option value="ES">Español</option>
        </select>
      </div>

      <ol className="-mx-1 min-h-0 flex-1 overflow-y-auto">
        {day.transcript.map((cue, index) => {
          const isActive = index === activeCueIndex;
          return (
            <li key={cue.at}>
              <button
                type="button"
                tabIndex={interactive ? 0 : -1}
                onClick={() => onSeek(cue.at)}
                disabled={seekDisabled}
                className={`flex w-full items-start gap-2.5 rounded-control p-2 text-left transition-colors ${
                  isActive ? "bg-primary-soft" : "hover:bg-surface-sunken"
                } ${seekDisabled ? "cursor-default" : "cursor-pointer"}`}
              >
                <span
                  className={`mt-0.5 shrink-0 rounded-control-small px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums ${
                    isActive
                      ? "bg-primary-solid text-primary-on-solid"
                      : "bg-surface-sunken text-fg-muted"
                  }`}
                >
                  {formatCueTime(cue.at)}
                </span>
                <span
                  className={`text-sm leading-relaxed ${
                    isActive ? "font-medium text-fg" : "text-fg-secondary"
                  }`}
                >
                  {isEs ? cue.textEs : cue.textEn}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * Vertical icon strip that sits at the right edge of the lesson.
 *
 * Clicking the active tab closes the panel, so the rail doubles as the toggle.
 */
export function JourneyPanelRail({
  activeTab,
  open,
  onSelect,
  tabs = TAB_ORDER,
}: {
  activeTab: JourneyPanelTab;
  open: boolean;
  onSelect: (tab: JourneyPanelTab) => void;
  /** Reading classes have nothing to seek, so they leave Transcript out. */
  tabs?: JourneyPanelTab[];
}) {
  const { dictionary } = useLanguage();
  const j = dictionary?.educationJourney;

  return (
    <div className="flex shrink-0 flex-col gap-1.5 rounded-card border border-line bg-surface p-1.5 shadow-[0_0_60px_rgba(0,0,0,0.06)]">
      {tabs.map((tab) => {
        const Icon = TAB_ICON[tab];
        const label = tabLabel(tab, j);
        const isActive = open && tab === activeTab;

        return (
          <button
            key={tab}
            type="button"
            onClick={() => onSelect(tab)}
            aria-pressed={isActive}
            title={label}
            className={`flex w-[58px] flex-col items-center gap-1 rounded-control px-1 py-2.5 text-[10px] font-semibold leading-tight transition-colors cursor-pointer ${
              isActive
                ? "bg-primary-soft text-fg-brand"
                : "text-fg-muted hover:bg-surface-sunken hover:text-fg-secondary"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="w-full truncate text-center">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function OverviewTab({ day }: { day: JourneyDay }) {
  const { language, dictionary } = useLanguage();
  const isEs = language === "ES";
  const j = dictionary?.educationJourney;
  const keyPoints = isEs ? day.keyPointsEs : day.keyPointsEn;

  return (
    <div>
      <p className="text-sm leading-relaxed text-fg-secondary">
        {isEs ? day.summaryEs : day.summaryEn}
      </p>

      <h4 className="mt-5 text-xs font-bold uppercase tracking-wide text-fg-muted">
        {j?.keyPoints || "What you will learn"}
      </h4>
      <ul className="mt-2 space-y-2">
        {keyPoints.map((point) => (
          <li key={point} className="flex gap-2 text-sm text-fg-secondary">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span className="leading-relaxed">{point}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-control border border-line bg-surface-sunken p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
            {j?.duration || "Length"}
          </dt>
          <dd className="mt-1 text-sm font-bold text-fg">
            {day.durationMinutes} {j?.minutesShort || "min"}
          </dd>
        </div>
        <div className="rounded-control border border-line bg-surface-sunken p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
            {j?.moduleLabel || "Module"}
          </dt>
          <dd className="mt-1 text-sm font-bold text-fg">
            {isEs
              ? JOURNEY_PHASES[day.phase].moduleEs
              : JOURNEY_PHASES[day.phase].moduleEn}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function DocumentsTab({
  day,
  interactive,
}: {
  day: JourneyDay;
  interactive: boolean;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  return (
    <ul className="space-y-2">
      {day.documents.map((doc) => {
        const Icon = KIND_ICON[doc.kind];
        return (
          <li key={doc.id}>
            <button
              type="button"
              tabIndex={interactive ? 0 : -1}
              className="flex w-full items-center gap-3 rounded-control border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong hover:bg-surface-sunken cursor-pointer"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-control ${KIND_CLASS[doc.kind]}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-fg">
                  {isEs ? doc.titleEs : doc.titleEn}
                </span>
                <span className="block text-xs font-medium text-fg-muted">
                  {isEs ? doc.metaEs : doc.metaEn}
                </span>
              </span>
              <Download className="h-4 w-4 shrink-0 text-fg-subtle" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function NotesTab({
  day,
  note,
  onNoteChange,
  onBlur,
  saveState,
  interactive,
}: {
  day: JourneyDay;
  note: string;
  onNoteChange: (value: string) => void;
  onBlur: () => void;
  saveState: NoteSaveState;
  interactive: boolean;
}) {
  const { language, dictionary } = useLanguage();
  const isEs = language === "ES";
  const j = dictionary?.educationJourney;

  const saveLabel =
    saveState === "saving"
      ? j?.notesSaving || "Saving..."
      : saveState === "saved"
        ? j?.notesSaved || "Saved"
        : j?.notesAutosave || "Notes save automatically";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <textarea
        value={note}
        tabIndex={interactive ? 0 : -1}
        onChange={(event) => onNoteChange(event.target.value)}
        onBlur={onBlur}
        placeholder={
          j?.notesPlaceholder ||
          "Write anything you want to remember from this lesson, or a question for your care team."
        }
        className="min-h-[260px] w-full flex-1 resize-none rounded-control border border-line bg-surface p-3 text-sm leading-relaxed text-fg-secondary outline-none transition-colors placeholder:text-fg-subtle focus:border-primary-edge focus:ring-1 focus:ring-ring"
      />

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-fg-muted">{saveLabel}</span>
        <button
          type="button"
          tabIndex={interactive ? 0 : -1}
          disabled={note.trim().length === 0}
          onClick={() =>
            downloadNoteAsText(
              `${day.slug}-notes.txt`,
              `${isEs ? day.titleEs : day.titleEn}\n\n${note}`,
            )
          }
          className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-2.5 py-1.5 text-xs font-bold text-fg-secondary transition-colors hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          {j?.downloadNotes || "Download .txt"}
        </button>
      </div>
    </div>
  );
}

/**
 * The body of the side panel. Rendered inside the docked column on wide
 * screens and inside the slide-over drawer on narrow ones.
 */
export function JourneyPanelContent({
  day,
  activeTab,
  onClose,
  note,
  onNoteChange,
  onNoteBlur,
  saveState,
  transcriptLanguage,
  onTranscriptLanguageChange,
  activeCueIndex,
  onSeek,
  seekDisabled,
  interactive = true,
  closeRef,
}: {
  day: JourneyDay;
  activeTab: JourneyPanelTab;
  onClose: () => void;
  note: string;
  onNoteChange: (value: string) => void;
  onNoteBlur: () => void;
  saveState: NoteSaveState;
  transcriptLanguage: LanguageCode;
  onTranscriptLanguageChange: (next: LanguageCode) => void;
  activeCueIndex: number;
  onSeek: (seconds: number) => void;
  seekDisabled: boolean;
  /** False while the drawer is closed, so nothing inside holds focus. */
  interactive?: boolean;
  closeRef?: React.Ref<HTMLButtonElement>;
}) {
  const { dictionary } = useLanguage();
  const j = dictionary?.educationJourney;

  return (
    <>
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
        <h2 className="truncate text-base font-semibold text-fg">
          {tabLabel(activeTab, j)}
        </h2>
        <button
          ref={closeRef}
          type="button"
          tabIndex={interactive ? 0 : -1}
          onClick={onClose}
          aria-label={j?.closePanel || "Close panel"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg-secondary cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
        {activeTab === "transcript" && (
          <TranscriptTab
            day={day}
            transcriptLanguage={transcriptLanguage}
            onTranscriptLanguageChange={onTranscriptLanguageChange}
            activeCueIndex={activeCueIndex}
            onSeek={onSeek}
            seekDisabled={seekDisabled}
            interactive={interactive}
          />
        )}
        {activeTab === "overview" && <OverviewTab day={day} />}
        {activeTab === "documents" && (
          <DocumentsTab day={day} interactive={interactive} />
        )}
        {activeTab === "notes" && (
          <NotesTab
            day={day}
            note={note}
            onNoteChange={onNoteChange}
            onBlur={onNoteBlur}
            saveState={saveState}
            interactive={interactive}
          />
        )}
      </div>
    </>
  );
}

/**
 * Slide-over shell used below the breakpoint where the panel can dock inline.
 */
export default function JourneyResourceDrawer({
  day,
  open,
  activeTab,
  onClose,
  note,
  onNoteChange,
  onNoteBlur,
  saveState,
  transcriptLanguage,
  onTranscriptLanguageChange,
  activeCueIndex,
  onSeek,
  seekDisabled,
}: {
  day: JourneyDay;
  open: boolean;
  activeTab: JourneyPanelTab;
  onClose: () => void;
  note: string;
  onNoteChange: (value: string) => void;
  onNoteBlur: () => void;
  saveState: NoteSaveState;
  transcriptLanguage: LanguageCode;
  onTranscriptLanguageChange: (next: LanguageCode) => void;
  activeCueIndex: number;
  onSeek: (seconds: number) => void;
  seekDisabled: boolean;
}) {
  const { dictionary } = useLanguage();
  const j = dictionary?.educationJourney;
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes the drawer, and the page behind it stops scrolling.
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 2xl:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={open ? undefined : true}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        aria-label={j?.closePanel || "Close panel"}
        className={`absolute inset-0 h-full w-full cursor-default bg-fg/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal={open ? true : undefined}
        aria-label={tabLabel(activeTab, j)}
        className={`absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col bg-surface shadow-[0_0_60px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <JourneyPanelContent
          day={day}
          activeTab={activeTab}
          onClose={onClose}
          note={note}
          onNoteChange={onNoteChange}
          onNoteBlur={onNoteBlur}
          saveState={saveState}
          transcriptLanguage={transcriptLanguage}
          onTranscriptLanguageChange={onTranscriptLanguageChange}
          activeCueIndex={activeCueIndex}
          onSeek={onSeek}
          seekDisabled={seekDisabled}
          interactive={open}
          closeRef={closeRef}
        />
      </aside>
    </div>
  );
}
