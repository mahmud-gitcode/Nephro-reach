"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Trash2,
  Upload,
} from "lucide-react";
import {
  CourseClass,
  CourseDocument,
  CourseSettings,
  createId,
} from "@/features/education/courseLibrary";
import {
  Field,
  FIELD_CLASS,
  MediaUpload,
  OverviewStep,
  ReadingBody,
  TypeStep,
} from "@/features/education/admin/ClassWizardSteps";
import ClassTranscriptUpload from "@/features/education/admin/ClassTranscriptUpload";
import {
  QuestionListEditor,
  VideoQuestionListEditor,
} from "@/features/education/admin/QuestionEditor";
import { Button, Modal } from "@/components/ui";

/** Centred dialog used by the course and module forms. */
export function AdminModal({
  title,
  open,
  onClose,
  onSubmit,
  submitLabel,
  submitDisabled,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submitDisabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    // Escape, the scroll lock and the initial focus move were already here.
    // What was missing was the trap that keeps Tab inside the dialog.
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title={title}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitDisabled}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-lg">{children}</div>
    </Modal>
  );
}

export interface CourseFormValues {
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
}

export function CourseModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial?: CourseFormValues;
  onClose: () => void;
  onSave: (values: CourseFormValues) => void;
}) {
  const [values, setValues] = useState<CourseFormValues>(
    initial ?? {
      titleEn: "",
      titleEs: "",
      descriptionEn: "",
      descriptionEs: "",
    },
  );

  const set = (patch: Partial<CourseFormValues>) =>
    setValues((current) => ({ ...current, ...patch }));

  return (
    <AdminModal
      title={initial ? "Edit course" : "New course"}
      open={open}
      onClose={onClose}
      onSubmit={() => onSave(values)}
      submitLabel={initial ? "Save course" : "Create course"}
      submitDisabled={values.titleEn.trim().length === 0}
    >
      <Field label="Course name (English)">
        <input
          className={FIELD_CLASS}
          value={values.titleEn}
          onChange={(event) => set({ titleEn: event.target.value })}
          placeholder="e.g. Home Dialysis Essentials"
        />
      </Field>

      <Field
        label="Course name (Spanish)"
        hint="Falls back to English if empty"
      >
        <input
          className={FIELD_CLASS}
          value={values.titleEs}
          onChange={(event) => set({ titleEs: event.target.value })}
        />
      </Field>

      <Field label="Description (English)">
        <textarea
          rows={3}
          className={`${FIELD_CLASS} resize-none`}
          value={values.descriptionEn}
          onChange={(event) => set({ descriptionEn: event.target.value })}
        />
      </Field>

      <Field label="Description (Spanish)">
        <textarea
          rows={3}
          className={`${FIELD_CLASS} resize-none`}
          value={values.descriptionEs}
          onChange={(event) => set({ descriptionEs: event.target.value })}
        />
      </Field>
    </AdminModal>
  );
}

export interface ModuleFormValues {
  titleEn: string;
  titleEs: string;
}

export function ModuleModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial?: ModuleFormValues;
  onClose: () => void;
  onSave: (values: ModuleFormValues) => void;
}) {
  const [values, setValues] = useState<ModuleFormValues>(
    initial ?? { titleEn: "", titleEs: "" },
  );

  return (
    <AdminModal
      title={initial ? "Edit module" : "New module"}
      open={open}
      onClose={onClose}
      onSubmit={() => onSave(values)}
      submitLabel={initial ? "Save module" : "Add module"}
      submitDisabled={values.titleEn.trim().length === 0}
    >
      <Field label="Module name (English)">
        <input
          className={FIELD_CLASS}
          value={values.titleEn}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              titleEn: event.target.value,
            }))
          }
          placeholder="e.g. Understanding Dialysis"
        />
      </Field>

      <Field
        label="Module name (Spanish)"
        hint="Falls back to English if empty"
      >
        <input
          className={FIELD_CLASS}
          value={values.titleEs}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              titleEs: event.target.value,
            }))
          }
        />
      </Field>
    </AdminModal>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Upload handouts and name them. Type and size are taken from the file. */
function DocumentsStep({
  documents,
  onChange,
}: {
  documents: CourseDocument[];
  onChange: (next: CourseDocument[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList) => {
    const added: CourseDocument[] = Array.from(files).map((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      const meta = `${extension.toUpperCase() || "FILE"} · ${formatFileSize(file.size)}`;
      return {
        id: createId("doc"),
        titleEn: file.name.replace(/\.[^.]+$/, ""),
        titleEs: file.name.replace(/\.[^.]+$/, ""),
        kind: extension === "pdf" ? "pdf" : "worksheet",
        metaEn: meta,
        metaEs: meta,
      };
    });
    onChange([...documents, ...added]);
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-control border border-dashed border-line-strong px-4 py-7 text-center transition-colors hover:border-primary-edge hover:bg-primary-soft"
      >
        <Upload className="h-6 w-6 text-fg-subtle" />
        <span className="text-sm font-bold text-fg-secondary">
          Upload handouts
        </span>
      </button>

      {documents.length === 0 ? (
        <p className="rounded-control border border-dashed border-line p-6 text-center text-sm text-fg-muted">
          No handouts attached yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 rounded-control border border-line bg-surface p-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-danger-surface text-danger">
                <FileText className="h-4.5 w-4.5" />
              </span>

              <span className="min-w-0 flex-1">
                <input
                  className="w-full rounded-control border border-transparent px-2 py-1 text-sm font-semibold text-fg transition-colors outline-none hover:border-line focus:border-primary-edge"
                  value={doc.titleEn}
                  onChange={(event) =>
                    onChange(
                      documents.map((entry) =>
                        entry.id === doc.id
                          ? {
                              ...entry,
                              titleEn: event.target.value,
                              titleEs: event.target.value,
                            }
                          : entry,
                      ),
                    )
                  }
                />
                <span className="block px-2 text-xs font-medium text-fg-muted">
                  {doc.metaEn}
                </span>
              </span>

              <button
                type="button"
                onClick={() =>
                  onChange(documents.filter((entry) => entry.id !== doc.id))
                }
                aria-label={`Remove ${doc.titleEn}`}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-control text-fg-subtle transition-colors hover:bg-danger-surface hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const LESSON_STEPS = [
  { key: "overview", label: "Overview" },
  { key: "type", label: "Type" },
  { key: "media", label: "Media" },
  { key: "documents", label: "Documents" },
  { key: "activities", label: "Activities" },
  { key: "video", label: "Video questions" },
] as const;

/* An exam has no media: just what it is called and its questions. */
const EXAM_STEPS = [
  { key: "overview", label: "Overview" },
  { key: "type", label: "Type" },
  { key: "exam", label: "Exam questions" },
] as const;

type StepKey =
  (typeof LESSON_STEPS)[number]["key"] | (typeof EXAM_STEPS)[number]["key"];

/**
 * Stepped dialog for creating or editing a class: overview, then type, then
 * the media and its transcript, then the handouts.
 */
export function ClassEditorPanel({
  open,
  initial,
  moduleName,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: CourseClass;
  moduleName: string;
  onClose: () => void;
  onSave: (courseClass: CourseClass) => void;
}) {
  const [draft, setDraft] = useState<CourseClass>(initial);
  const [stepIndex, setStepIndex] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaFileName, setMediaFileName] = useState<string | null>(null);
  const [mediaSeconds, setMediaSeconds] = useState<number | null>(null);

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

  // Release the object URL when it is replaced or the dialog closes.
  useEffect(() => {
    if (!mediaUrl) return;
    return () => URL.revokeObjectURL(mediaUrl);
  }, [mediaUrl]);

  if (!open) return null;

  const STEPS: ReadonlyArray<{ key: StepKey; label: string }> =
    draft.kind === "exam" ? EXAM_STEPS : LESSON_STEPS;
  const safeIndex = Math.min(stepIndex, STEPS.length - 1);
  const step = STEPS[safeIndex].key;
  const isLastStep = safeIndex === STEPS.length - 1;
  const canContinue = draft.titleEn.trim().length > 0;

  const set = (patch: Partial<CourseClass>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const handlePickFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    setMediaFileName(file.name);

    // A reading class keeps its kind; otherwise the file decides whether
    // this is a video or an audio class.
    const isAudioFile = file.type.startsWith("audio/");
    set({
      mediaSrc: `/media/${file.name}`,
      ...(draft.kind === "reading"
        ? {}
        : { kind: isAudioFile ? ("audio" as const) : ("video" as const) }),
    });

    // Reading the real length fills the duration and lets the transcript
    // sync check work.
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      const seconds = probe.duration;
      if (Number.isFinite(seconds) && seconds > 0) {
        setMediaSeconds(seconds);
        set({ durationMinutes: Math.max(1, Math.round(seconds / 60)) });
      }
    };
    probe.src = url;
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={draft.titleEn || "New class"}
      description={moduleName}
      footer={
        <>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
            disabled={safeIndex === 0}
            className="mr-auto"
          >
            <ChevronLeft aria-hidden="true" />
            Back
          </Button>

          <Button variant="neutral" appearance="stroke" onClick={onClose}>
            Cancel
          </Button>

          {isLastStep ? (
            <Button onClick={() => onSave(draft)} disabled={!canContinue}>
              Save class
            </Button>
          ) : (
            <Button
              onClick={() =>
                setStepIndex((index) => Math.min(STEPS.length - 1, index + 1))
              }
              disabled={!canContinue}
            >
              Next
              <ChevronRight aria-hidden="true" />
            </Button>
          )}
        </>
      }
    >
      <div className="flex min-h-0 flex-col">
        <ol className="-mx-inset-lg mb-stack-lg flex items-center gap-inline-sm overflow-x-auto border-b border-line px-inset-lg pb-inset-sm">
          {STEPS.map((entry, index) => {
            const done = index < safeIndex;
            const active = index === safeIndex;
            return (
              <li
                key={entry.key}
                className="flex shrink-0 items-center gap-1.5"
              >
                <button
                  type="button"
                  onClick={() => setStepIndex(index)}
                  aria-current={active ? "step" : undefined}
                  className={`flex cursor-pointer items-center gap-inline-sm rounded-control px-inset-xs py-1.5 text-label-sm transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                    active
                      ? "bg-primary-solid text-primary-on-solid"
                      : done
                        ? "bg-primary-soft text-primary-fg"
                        : "text-fg-muted hover:bg-surface-sunken"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 items-center justify-center rounded-pill text-[10px] ${
                      active
                        ? "bg-surface/25"
                        : done
                          ? "bg-primary-solid text-primary-on-solid"
                          : "bg-line text-fg-muted"
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" /> : index + 1}
                  </span>
                  {entry.label}
                </button>
                {index < STEPS.length - 1 && (
                  <ChevronRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5 text-fg-subtle"
                  />
                )}
              </li>
            );
          })}
        </ol>

        <div className="min-h-0 flex-1 space-y-stack-lg">
          {step === "overview" && <OverviewStep draft={draft} onChange={set} />}

          {step === "type" && <TypeStep draft={draft} onChange={set} />}

          {step === "media" && (
            <>
              {draft.kind === "reading" && (
                <ReadingBody draft={draft} onChange={set} />
              )}

              <MediaUpload
                kind={draft.kind}
                mediaUrl={mediaUrl}
                mediaFileName={mediaFileName}
                mediaSeconds={mediaSeconds}
                onPickFile={handlePickFile}
              />

              <div className="space-y-4 border-t border-line pt-4">
                <h3 className="text-xs font-bold text-fg-muted">Transcript</h3>
                <ClassTranscriptUpload
                  draft={draft}
                  onChange={set}
                  mediaSeconds={mediaSeconds}
                />
              </div>
            </>
          )}

          {step === "documents" && (
            <DocumentsStep
              documents={draft.documents}
              onChange={(documents) => set({ documents })}
            />
          )}

          {step === "exam" && (
            <>
              <p className="text-sm text-fg-muted">
                A scored exam, taken in order like any other class. Members need
                the course pass mark to finish it.
              </p>
              <QuestionListEditor
                questions={draft.activities}
                scoredOnly
                onChange={(activities) => set({ activities })}
                emptyText="No exam questions yet."
              />
            </>
          )}

          {step === "activities" && (
            <>
              <p className="text-sm text-fg-muted">
                Questions shown under the lesson. Members answer them to finish
                the class; they are not marked.
              </p>
              <QuestionListEditor
                questions={draft.activities}
                onChange={(activities) => set({ activities })}
                emptyText="No activities yet. Add a question, reflection or fill-in."
              />
            </>
          )}

          {step === "video" &&
            (draft.kind === "reading" ? (
              <p className="rounded-control border border-dashed border-line p-6 text-center text-sm text-fg-muted">
                Pop-up questions need a video or audio class.
              </p>
            ) : (
              <VideoQuestionListEditor
                items={draft.videoQuestions}
                onChange={(videoQuestions) => set({ videoQuestions })}
              />
            ))}
        </div>
      </div>
    </Modal>
  );
}

/** Course-wide settings: what the levels are called, and how exams work. */
export function CourseSettingsModal({
  initial,
  onClose,
  onSave,
}: {
  initial: CourseSettings;
  onClose: () => void;
  onSave: (values: CourseSettings) => void;
}) {
  const [values, setValues] = useState<CourseSettings>(initial);
  const set = (patch: Partial<CourseSettings>) =>
    setValues((current) => ({ ...current, ...patch }));

  const valid =
    values.groupLabelEn.trim().length > 0 &&
    values.itemLabelEn.trim().length > 0 &&
    values.passMark >= 0 &&
    values.passMark <= 100;

  const toggle = (
    key: "showAnswers" | "certificateEnabled" | "requireExamPass",
    label: string,
    hint: string,
  ) => (
    <label className="flex cursor-pointer items-start gap-3 rounded-card border border-line bg-surface-sunken p-inset-md">
      <input
        type="checkbox"
        checked={values[key]}
        onChange={(event) => set({ [key]: event.target.checked })}
        className="mt-0.5 h-4 w-4 accent-[var(--color-brand-600)]"
      />
      <span>
        <span className="block text-sm font-semibold text-fg">{label}</span>
        <span className="mt-0.5 block text-xs text-fg-muted">{hint}</span>
      </span>
    </label>
  );

  return (
    <AdminModal
      title="Course settings"
      open
      onClose={onClose}
      onSubmit={() => onSave(values)}
      submitLabel="Save settings"
      submitDisabled={!valid}
    >
      <div className="space-y-4">
        <p className="text-xs font-bold text-fg-muted">Names</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="A group is called (English)"
            hint="e.g. Module, Day, Week"
          >
            <input
              className={FIELD_CLASS}
              value={values.groupLabelEn}
              onChange={(event) => set({ groupLabelEn: event.target.value })}
            />
          </Field>
          <Field
            label="A group is called (Spanish)"
            hint="e.g. Módulo, Día, Semana"
          >
            <input
              className={FIELD_CLASS}
              value={values.groupLabelEs}
              onChange={(event) => set({ groupLabelEs: event.target.value })}
            />
          </Field>
          <Field
            label="A lesson is called (English)"
            hint="e.g. Class, Lesson, Day"
          >
            <input
              className={FIELD_CLASS}
              value={values.itemLabelEn}
              onChange={(event) => set({ itemLabelEn: event.target.value })}
            />
          </Field>
          <Field
            label="A lesson is called (Spanish)"
            hint="e.g. Clase, Lección, Día"
          >
            <input
              className={FIELD_CLASS}
              value={values.itemLabelEs}
              onChange={(event) => set({ itemLabelEs: event.target.value })}
            />
          </Field>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-bold text-fg-muted">Checks and final exam</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Pass mark (%)">
            <input
              type="number"
              min={0}
              max={100}
              className={FIELD_CLASS}
              value={values.passMark}
              onChange={(event) =>
                set({ passMark: Number(event.target.value) || 0 })
              }
            />
          </Field>
          <Field label="Attempts allowed" hint="0 means unlimited">
            <input
              type="number"
              min={0}
              className={FIELD_CLASS}
              value={values.maxAttempts}
              onChange={(event) =>
                set({
                  maxAttempts: Math.max(0, Number(event.target.value) || 0),
                })
              }
            />
          </Field>
        </div>
        {toggle(
          "showAnswers",
          "Show the right answers after an attempt",
          "Members see which answers were correct on the results screen.",
        )}
      </div>

      <div className="space-y-4">
        <p className="text-xs font-bold text-fg-muted">Certificate</p>
        {toggle(
          "certificateEnabled",
          "Issue a certificate of completion",
          "Unlocks once every lesson is finished.",
        )}
        {toggle(
          "requireExamPass",
          "Require a pass on the final exam",
          "Only applies when the course has a final exam.",
        )}
      </div>
    </AdminModal>
  );
}
