"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AlertTriangle, BookOpen, ChevronDown, Lock, Plus } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import { checkFlaggedMedicalContent } from "@/features/community/moderation";
import {
  Badge,
  Button,
  Card,
  Chip,
  ChipGroup,
  FormField,
  Modal,
  Textarea,
} from "@/components/ui";

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
  const isFlaggedMedical = checkFlaggedMedicalContent(notes);

  const moodOptions = [
    { key: "Positive", label: dj?.modal?.moods?.positive || "Positive" },
    { key: "Calm", label: dj?.modal?.moods?.calm || "Calm" },
    { key: "Reflective", label: dj?.modal?.moods?.reflective || "Reflective" },
    {
      key: "Challenging",
      label: dj?.modal?.moods?.challenging || "Challenging",
    },
    { key: "Anxious", label: dj?.modal?.moods?.anxious || "Anxious" },
  ];

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
    <Modal
      open={open}
      onClose={onClose}
      title={dj?.modal?.title || "New Entry"}
      description={dj?.modal?.question || "How are you feeling today?"}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {dj?.modal?.cancel || "Cancel"}
          </Button>
          <Button onClick={handleSave}>
            {dj?.modal?.saveEntry || "Save Entry"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-lg">
        <fieldset>
          <legend className="mb-stack-sm text-label-lg text-fg">
            {dj?.modal?.moodLabel || "Mood (optional)"}
          </legend>
          <ChipGroup label={dj?.modal?.moodLabel || "Mood"}>
            {moodOptions.map((option) => (
              <Chip
                key={option.key}
                selected={option.key === mood}
                onClick={() => setMood(option.key)}
              >
                {option.label}
              </Chip>
            ))}
          </ChipGroup>
        </fieldset>

        <FormField label={dj?.modal?.title || "New Entry"}>
          {(props) => (
            <Textarea
              {...props}
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={
                dj?.modal?.placeholder || "Write your thoughts here..."
              }
            />
          )}
        </FormField>

        {isFlaggedMedical && (
          <div className="bg-warning-soft text-warning-fg space-y-1 rounded-control border border-warning-line p-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="size-4 shrink-0 text-warning" />
              <span>
                {language === "ES"
                  ? "Aviso de Seguridad y Privacidad"
                  : "Private Journal Safety Reminder"}
              </span>
            </div>
            <p>
              {language === "ES"
                ? "Su diario es 100% privado y puede guardar cualquier palabra libremente. Recuerde que su diario no se monitorea para emergencias médicas. Si necesita ayuda urgente o experimenta síntomas graves, no use su diario para contactar a su equipo; llame al 911 o a su centro de diálisis."
                : "Your journal is private and you may save any entries freely. Please note that private journals are not monitored for medical emergencies. If you need immediate help, do not use your journal to contact your care team—call 911 or your doctor directly."}
            </p>
          </div>
        )}

        <p className="flex items-center gap-1.5 text-caption text-fg-muted">
          <Lock className="size-3.5 shrink-0 text-fg-muted" />
          <span>
            {language === "ES"
              ? "Las entradas del diario son completamente privadas y solo usted puede verlas."
              : "Journal entries are strictly private to your account and never shared."}
          </span>
        </p>
      </div>
    </Modal>
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
    <Card as="article">
      <div className="flex items-start justify-between gap-inline-md">
        <div className="flex min-w-0 items-center gap-inline-md">
          <Image
            src="/images/journal-avatar.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-pill object-cover"
          />
          <div>
            <p className="text-label-lg text-fg">
              {dj?.pageTitle || "Dialysis Journal"}
            </p>
            <p className="text-body-sm text-fg-muted">{entry.date}</p>
          </div>
        </div>
        <Button
          variant="primary"
          appearance="stroke"
          size="small"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={`entry-${entry.id}-details`}
          trailingIcon={
            <ChevronDown className={open ? "rotate-180" : undefined} />
          }
        >
          {open
            ? dj?.hideDetails || "Hide details"
            : dj?.viewDetails || "View details"}
        </Button>
      </div>

      <div className="mt-stack-md h-px bg-line" />
      <p className="mt-stack-md text-body-md text-fg-secondary">
        {entry.preview}
      </p>
      {open && (
        <p
          id={`entry-${entry.id}-details`}
          className="mt-stack-sm text-body-md text-fg-secondary"
        >
          {entry.details}
        </p>
      )}
    </Card>
  );
}

export default function DialysisJournalPage() {
  const { user } = useAuth();
  const { language, dictionary } = useLanguage();
  const dj = dictionary?.dialysisJournal;
  const [modalOpen, setModalOpen] = useState(false);

  /* The seeded entries come from the dictionary, so they change with the
     language. That was being copied into state and re-synced by an effect;
     deriving instead means switching language cannot leave stale copy on
     screen. `added` holds entries the member wrote this session. */
  const seeded =
    dj?.entries && Array.isArray(dj.entries) && dj.entries.length > 0
      ? dj.entries
      : defaultJournalEntries;
  const [added, setAdded] = useState<typeof defaultJournalEntries>([]);
  const entries = [...added, ...seeded];

  const handleAddEntry = (newEntryData: {
    preview: string;
    details: string;
  }) => {
    const formattedDate = new Date().toLocaleDateString(
      language === "ES" ? "es-ES" : "en-US",
      { weekday: "long", year: "numeric", month: "long", day: "numeric" },
    );
    const newEntry = {
      id: String(Date.now()),
      date: formattedDate,
      preview: newEntryData.preview,
      details: newEntryData.details,
    };
    setAdded((prev) => [newEntry, ...prev]);
  };

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return dj?.greetingMorning || "Good morning";
    if (hour < 18) return dj?.greetingAfternoon || "Good afternoon";
    return dj?.greetingEvening || "Good evening";
  })();

  const userName = user?.name ? `, ${user.name}` : ", Sarah";

  return (
    <div className="space-y-stack-xl">
      <PersonalLogDisclaimer />

      {/* Standing Private Journal Notice per Jonlg09 Medical Safety Policy */}
      <aside
        role="note"
        aria-label="Journal Privacy Notice"
        className="rounded-card border border-primary-soft-line bg-surface p-inset-md shadow-xs"
      >
        <div className="flex items-start gap-inline-md">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary-fg">
            <Lock className="size-4" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-label-md font-semibold text-fg">
                {language === "ES"
                  ? "Su diario es privado"
                  : "Your Journal is Private"}
              </p>
              <Badge tone="neutral" variant="soft">
                {language === "ES" ? "No monitoreado" : "Unmonitored"}
              </Badge>
            </div>
            <p className="text-body-sm text-fg-secondary">
              {language === "ES" ? (
                <>
                  <strong className="font-semibold text-fg">
                    Su diario es privado y no se monitorea para emergencias
                    médicas.
                  </strong>{" "}
                  Si necesita ayuda inmediata,{" "}
                  <strong className="font-semibold text-danger-fg">
                    no use su diario para comunicarse con su equipo de atención
                    médica
                  </strong>
                  ; llame al 911 o acuda a urgencias.
                </>
              ) : (
                <>
                  <strong className="font-semibold text-fg">
                    Your journal is private and is not monitored for medical
                    emergencies.
                  </strong>{" "}
                  If you need immediate help,{" "}
                  <strong className="font-semibold text-danger-fg">
                    do not use your journal to contact your care team
                  </strong>
                  . Please call 911 or contact your clinic or emergency care
                  provider directly.
                </>
              )}
            </p>
          </div>
        </div>
      </aside>

      <header className="flex flex-col gap-inline-lg sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-heading-1 text-fg">
            {greeting}
            {userName}
          </h1>
          <p className="mt-stack-xs text-body-lg text-fg-secondary">
            {dj?.subtitle || "Your personal journal for each dialysis day"}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} leadingIcon={<Plus />}>
          {dj?.newEntryBtn || "New Entry"}
        </Button>
      </header>

      {/* Journal Purpose & Logging Guidance Card */}
      <Card as="section" className="border-primary-soft-line bg-primary-soft">
        <div className="flex items-start gap-inline-lg">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-primary-solid text-primary-on-solid"
          >
            <BookOpen className="h-icon-small w-icon-small" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-heading-3 text-fg">
              {dj?.introCard?.title || "My Dialysis Journal"}
            </h2>
            <p className="mt-stack-xs text-label-lg text-fg-brand">
              {dj?.introCard?.subtitle ||
                "A private space to reflect on your dialysis journey."}
            </p>
            <p className="mt-stack-md measure text-body-md text-fg-secondary">
              {dj?.introCard?.body ||
                "Use your journal to keep track of how dialysis is affecting your everyday life. Write about how you felt after treatment, changes you've noticed, challenges you're working through, accomplishments you're proud of, or anything about your dialysis journey you want to remember."}
            </p>
            <Card padding="small" className="mt-stack-lg">
              <p className="text-body-sm text-fg-secondary">
                <span className="font-semibold text-fg">
                  {dj?.introCard?.promptsPrefix || "You can write about:"}
                </span>{" "}
                <span>
                  {dj?.introCard?.prompts ||
                    "how you felt today • your energy level • your dialysis experience • changes in your routine • good or difficult days • personal goals • milestones and progress"}
                </span>
              </p>
            </Card>
          </div>
        </div>
      </Card>

      <section className="space-y-stack-lg">
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
