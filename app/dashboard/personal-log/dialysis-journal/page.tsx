"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BookOpen, ChevronDown, Plus, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

const defaultJournalEntries = [
  {
    id: "1",
    date: "Friday, May 8, 2026",
    preview:
      "Today I learned about mindfulness techniques. The breathing exercises were particularly helpful during stressful moments at work.",
    details:
      "Completed week 4 of the curriculum. The material on emotional regulation resonated with me. I am practicing the daily check-in routine.",
  },
  {
    id: "2",
    date: "Wednesday, May 6, 2026",
    preview:
      "Had a productive session with my mentor today. We discussed goal-setting strategies and I feel more motivated to stick with my wellness plan.",
    details:
      "Logged my fluid intake on time and stayed within the limit. I want to keep this rhythm going through the weekend.",
  },
  {
    id: "3",
    date: "Monday, May 4, 2026",
    preview:
      "Feeling grateful for the support from my dialysis care team. The check-in call helped me stay on track with my fluid goals this week.",
    details:
      "Noted mild fatigue after treatment, but the afternoon walk helped. Planning an earlier bedtime tonight.",
  },
];

function NewEntryModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave?: (entry: { preview: string; details: string }) => void;
}) {
  const { language, dictionary } = useLanguage();
  const dj = dictionary?.dialysisJournal;

  const [mood, setMood] = useState("Calm");
  const [notes, setNotes] = useState("");

  const moodOptions = [
    { key: "Positive", label: dj?.modal?.moods?.positive || "Positive" },
    { key: "Calm", label: dj?.modal?.moods?.calm || "Calm" },
    { key: "Reflective", label: dj?.modal?.moods?.reflective || "Reflective" },
    { key: "Challenging", label: dj?.modal?.moods?.challenging || "Challenging" },
    { key: "Anxious", label: dj?.modal?.moods?.anxious || "Anxious" },
  ];

  if (!open) return null;

  const handleSave = () => {
    if (notes.trim()) {
      const selectedMoodLabel =
        moodOptions.find((m) => m.key === mood)?.label || mood;
      const moodPrefix =
        language === "ES"
          ? `Estado de ánimo: ${selectedMoodLabel}.`
          : `Mood: ${selectedMoodLabel}.`;
      onSave?.({
        preview: notes.trim(),
        details: `${moodPrefix} ${notes.trim()}`,
      });
      setNotes("");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-entry-title"
        className="w-full max-w-[520px] rounded-[20px] border border-slate-200 bg-white p-[17px] pt-[19px] shadow-[0_4px_8px_rgba(15,23,42,0.03),0_8px_16px_rgba(15,23,42,0.05)]"
      >
        <div className="flex items-start gap-2.5">
          <div className="min-w-0 flex-1">
            <h2
              id="new-entry-title"
              className="text-base font-medium leading-4 text-[#0A0A0A]"
            >
              {dj?.modal?.title || "New Entry"}
            </h2>
            <p className="mt-1.5 text-base leading-6 text-[#717182]">
              {dj?.modal?.question || "How are you feeling today?"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-700 transition-colors hover:bg-slate-100 cursor-pointer"
            aria-label={dj?.modal?.cancel || "Close"}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium leading-5 text-[#0A0A0A]">
            {dj?.modal?.moodLabel || "Mood (optional)"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {moodOptions.map((option) => {
              const selected = option.key === mood;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setMood(option.key)}
                  className={`rounded-lg border px-[13px] py-[9px] text-sm font-medium tracking-[0.07px] transition-colors cursor-pointer ${
                    selected
                      ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                      : "border-black/10 bg-white text-[#0A0A0A] hover:bg-slate-50"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={
            dj?.modal?.placeholder || "Write your thoughts here..."
          }
          className="mt-4 min-h-16 w-full resize-y rounded-lg border-0 bg-[#F3F3F5] px-[13px] py-[9px] text-sm leading-5 text-slate-950 outline-none placeholder:text-[#717182] focus:ring-2 focus:ring-blue-100"
          rows={3}
        />

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 flex-1 items-center justify-center rounded border border-slate-200 bg-[#F9F9F9] px-3.5 text-base font-bold tracking-[0.08px] text-slate-950 transition-colors hover:bg-white cursor-pointer"
          >
            {dj?.modal?.cancel || "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex h-12 flex-1 items-center justify-center rounded bg-blue-600 px-3.5 text-base font-bold tracking-[0.08px] text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700 cursor-pointer"
          >
            {dj?.modal?.saveEntry || "Save Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

function JournalCard({
  entry,
}: {
  entry: {
    id: string;
    date: string;
    preview: string;
    details: string;
  };
}) {
  const { dictionary } = useLanguage();
  const dj = dictionary?.dialysisJournal;
  const [open, setOpen] = useState(false);

  return (
    <article className="rounded-[20px] border border-slate-200 bg-white px-4 py-[18px] shadow-[0_4px_8px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Image
            src="/images/journal-avatar.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div>
            <p className="text-base font-medium leading-6 tracking-[0.08px] text-[#18181B]">
              {dj?.pageTitle || "Dialysis Journal"}
            </p>
            <p className="text-sm font-medium leading-5 tracking-[0.07px] text-[#52525B]">
              {entry.date}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-[46px] shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-[13px] py-[9px] text-base font-bold tracking-[0.08px] text-blue-600 transition-colors hover:bg-white cursor-pointer"
        >
          {open
            ? dj?.hideDetails || "Hide details"
            : dj?.viewDetails || "View details"}
          <ChevronDown
            className={`h-6 w-6 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
      <div className="mt-3 h-px bg-slate-200" />
      <p className="mt-3 text-base leading-6 text-[#0A0A0A]">{entry.preview}</p>
      {open && (
        <p className="mt-2 text-base leading-6 text-[#0A0A0A]">{entry.details}</p>
      )}
    </article>
  );
}

export default function DialysisJournalPage() {
  const { user } = useAuth();
  const { language, dictionary } = useLanguage();
  const dj = dictionary?.dialysisJournal;
  const [modalOpen, setModalOpen] = useState(false);

  const [entries, setEntries] = useState(() =>
    dj?.entries && Array.isArray(dj.entries) && dj.entries.length > 0
      ? dj.entries
      : defaultJournalEntries
  );

  React.useEffect(() => {
    if (dj?.entries && Array.isArray(dj.entries) && dj.entries.length > 0) {
      setEntries(dj.entries);
    }
  }, [dj?.entries]);

  const handleAddEntry = (newEntryData: { preview: string; details: string }) => {
    const formattedDate = new Date().toLocaleDateString(
      language === "ES" ? "es-ES" : "en-US",
      { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    );
    const newEntry = {
      id: String(Date.now()),
      date: formattedDate,
      preview: newEntryData.preview,
      details: newEntryData.details,
    };
    setEntries((prev) => [newEntry, ...prev]);
  };

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return dj?.greetingMorning || "Good morning";
    if (hour < 18) return dj?.greetingAfternoon || "Good afternoon";
    return dj?.greetingEvening || "Good evening";
  })();

  const userName = user?.name ? `, ${user.name}` : ", Sarah";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[32px] font-medium leading-none text-slate-950">
            {greeting}
            {userName}
          </h1>
          <p className="mt-1 text-lg font-medium leading-7 tracking-[0.09px] text-slate-600">
            {dj?.subtitle || "Your personal journal for each dialysis day"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex h-12 shrink-0 items-center justify-center gap-2 rounded bg-blue-600 px-3.5 text-base font-bold tracking-[0.08px] text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700 cursor-pointer"
        >
          <Plus className="h-6 w-6" />
          {dj?.newEntryBtn || "New Entry"}
        </button>
      </header>

      {/* Journal Purpose & Logging Guidance Card */}
      <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-white to-blue-50/30 p-5 sm:p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <div className="flex items-start gap-3.5 sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {dj?.introCard?.title || "My Dialysis Journal"}
            </h2>
            <p className="mt-1 text-sm font-semibold text-blue-600 sm:text-base">
              {dj?.introCard?.subtitle ||
                "A private space to reflect on your dialysis journey."}
            </p>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
              {dj?.introCard?.body ||
                "Use your journal to keep track of how dialysis is affecting your everyday life. Write about how you felt after treatment, changes you've noticed, challenges you're working through, accomplishments you're proud of, or anything about your dialysis journey you want to remember."}
            </p>
            <div className="mt-4 rounded-xl border border-blue-100 bg-white/90 p-3.5 sm:p-4">
              <p className="text-xs font-semibold leading-relaxed text-slate-700 sm:text-sm">
                <span className="font-bold text-slate-900">
                  {dj?.introCard?.promptsPrefix || "You can write about:"}
                </span>{" "}
                <span className="text-slate-600 font-medium">
                  {dj?.introCard?.prompts ||
                    "how you felt today • your energy level • your dialysis experience • changes in your routine • good or difficult days • personal goals • milestones and progress"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {entries.map((entry) => (
          <JournalCard key={entry.id} entry={entry} />
        ))}
      </section>

      <NewEntryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAddEntry}
      />
    </div>
  );
}
