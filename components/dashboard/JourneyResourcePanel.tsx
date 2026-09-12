"use client";

import React, { useEffect, useRef } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Info,
  NotebookPen,
  PencilRuler,
  X,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  JOURNEY_PHASES,
  JourneyDay,
  JourneyDocumentKind,
} from "@/lib/dialysisJourneyData";
import { downloadNoteAsText, NoteSaveState } from "@/lib/useJourneyNotes";

export type JourneyPanelTab = "overview" | "documents" | "notes";

const KIND_ICON: Record<JourneyDocumentKind, React.ElementType> = {
  pdf: FileText,
  checklist: ClipboardList,
  worksheet: PencilRuler,
};

const KIND_CLASS: Record<JourneyDocumentKind, string> = {
  pdf: "bg-red-50 text-red-600",
  checklist: "bg-emerald-50 text-emerald-600",
  worksheet: "bg-violet-50 text-violet-600",
};

const TAB_ICON: Record<JourneyPanelTab, React.ElementType> = {
  overview: Info,
  documents: FileText,
  notes: NotebookPen,
};

const TAB_ORDER: JourneyPanelTab[] = ["overview", "documents", "notes"];

function tabLabel(
  tab: JourneyPanelTab,
  j: Record<string, string> | undefined,
): string {
  if (tab === "overview") return j?.overview || "Overview";
  if (tab === "documents") return j?.documents || "Documents";
  return j?.notes || "Notes";
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
}: {
  activeTab: JourneyPanelTab;
  open: boolean;
  onSelect: (tab: JourneyPanelTab) => void;
}) {
  const { dictionary } = useLanguage();
  const j = dictionary?.educationJourney;

  return (
    <div className="flex shrink-0 flex-col gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_0_60px_rgba(0,0,0,0.06)]">
      {TAB_ORDER.map((tab) => {
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
            className={`flex w-[58px] flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[10px] font-semibold leading-tight transition-colors cursor-pointer ${
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
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
      <p className="text-sm leading-relaxed text-slate-700">
        {isEs ? day.summaryEs : day.summaryEn}
      </p>

      <h4 className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">
        {j?.keyPoints || "What you will learn"}
      </h4>
      <ul className="mt-2 space-y-2">
        {keyPoints.map((point) => (
          <li key={point} className="flex gap-2 text-sm text-slate-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span className="leading-relaxed">{point}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {j?.duration || "Length"}
          </dt>
          <dd className="mt-1 text-sm font-bold text-slate-900">
            {day.durationMinutes} {j?.minutesShort || "min"}
          </dd>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {j?.week || "Week"}
          </dt>
          <dd className="mt-1 text-sm font-bold text-slate-900">
            {isEs
              ? JOURNEY_PHASES[day.phase].rangeEs
              : JOURNEY_PHASES[day.phase].rangeEn}
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
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${KIND_CLASS[doc.kind]}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {isEs ? doc.titleEs : doc.titleEn}
                </span>
                <span className="block text-xs font-medium text-slate-500">
                  {isEs ? doc.metaEs : doc.metaEn}
                </span>
              </span>
              <Download className="h-4 w-4 shrink-0 text-slate-400" />
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
        className="min-h-[260px] w-full flex-1 resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500">{saveLabel}</span>
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
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
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
  /** False while the drawer is closed, so nothing inside holds focus. */
  interactive?: boolean;
  closeRef?: React.Ref<HTMLButtonElement>;
}) {
  const { dictionary } = useLanguage();
  const j = dictionary?.educationJourney;

  return (
    <>
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5">
        <h2 className="truncate text-base font-semibold text-slate-950">
          {tabLabel(activeTab, j)}
        </h2>
        <button
          ref={closeRef}
          type="button"
          tabIndex={interactive ? 0 : -1}
          onClick={onClose}
          aria-label={j?.closePanel || "Close panel"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
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
}: {
  day: JourneyDay;
  open: boolean;
  activeTab: JourneyPanelTab;
  onClose: () => void;
  note: string;
  onNoteChange: (value: string) => void;
  onNoteBlur: () => void;
  saveState: NoteSaveState;
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
        className={`absolute inset-0 h-full w-full cursor-default bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal={open ? true : undefined}
        aria-label={tabLabel(activeTab, j)}
        className={`absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col bg-white shadow-[0_0_60px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out ${
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
          interactive={open}
          closeRef={closeRef}
        />
      </aside>
    </div>
  );
}
