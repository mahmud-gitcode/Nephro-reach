"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  CourseClass,
  CourseDocument,
  createId,
} from "@/lib/courseLibrary";
import {
  Field,
  FIELD_CLASS,
  MediaUpload,
  OverviewStep,
  ReadingBody,
  TypeStep,
} from "@/components/dashboard/ClassWizardSteps";
import ClassTranscriptUpload from "@/components/dashboard/ClassTranscriptUpload";

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
  const closeRef = useRef<HTMLButtonElement>(null);

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close dialog"
        className="absolute inset-0 h-full w-full cursor-default bg-slate-900/50 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[90vh] w-full max-w-[560px] flex-col rounded-2xl bg-white shadow-[0_0_60px_rgba(15,23,42,0.25)]"
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {children}
        </div>

        <footer className="flex items-center justify-end gap-2.5 border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitDisabled}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {submitLabel}
          </button>
        </footer>
      </div>
    </div>
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
    initial ?? { titleEn: "", titleEs: "", descriptionEn: "", descriptionEs: "" },
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

      <Field label="Course name (Spanish)" hint="Falls back to English if empty">
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
            setValues((current) => ({ ...current, titleEn: event.target.value }))
          }
          placeholder="e.g. Understanding Dialysis"
        />
      </Field>

      <Field label="Module name (Spanish)" hint="Falls back to English if empty">
        <input
          className={FIELD_CLASS}
          value={values.titleEs}
          onChange={(event) =>
            setValues((current) => ({ ...current, titleEs: event.target.value }))
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
        className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-7 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer"
      >
        <Upload className="h-6 w-6 text-slate-400" />
        <span className="text-sm font-bold text-slate-700">Upload handouts</span>
      </button>

      {documents.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          No handouts attached yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <FileText className="h-4.5 w-4.5" />
              </span>

              <span className="min-w-0 flex-1">
                <input
                  className="w-full rounded-lg border border-transparent px-2 py-1 text-sm font-semibold text-slate-900 outline-none transition-colors hover:border-slate-200 focus:border-blue-500"
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
                <span className="block px-2 text-xs font-medium text-slate-500">
                  {doc.metaEn}
                </span>
              </span>

              <button
                type="button"
                onClick={() =>
                  onChange(documents.filter((entry) => entry.id !== doc.id))
                }
                aria-label={`Remove ${doc.titleEn}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
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

const STEPS = [
  { key: "overview", label: "Overview" },
  { key: "type", label: "Type" },
  { key: "media", label: "Media" },
  { key: "documents", label: "Documents" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

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

  const step = STEPS[stepIndex].key as StepKey;
  const isLastStep = stepIndex === STEPS.length - 1;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close class editor"
        className="absolute inset-0 h-full w-full cursor-default bg-slate-900/50 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Class editor"
        className="relative flex max-h-[92vh] w-full max-w-[720px] flex-col rounded-2xl bg-white shadow-[0_0_60px_rgba(15,23,42,0.25)]"
      >
        <header className="flex items-start gap-3 border-b border-slate-200 p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              {moduleName}
            </p>
            <h2 className="mt-0.5 truncate text-lg font-semibold text-slate-950">
              {draft.titleEn || "New class"}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close class editor"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <ol className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 px-4 py-3">
          {STEPS.map((entry, index) => {
            const done = index < stepIndex;
            const active = index === stepIndex;
            return (
              <li key={entry.key} className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setStepIndex(index)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    active
                      ? "bg-blue-600 text-white"
                      : done
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                      active
                        ? "bg-white/25"
                        : done
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" /> : index + 1}
                  </span>
                  {entry.label}
                </button>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                )}
              </li>
            );
          })}
        </ol>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {step === "overview" && (
            <OverviewStep draft={draft} onChange={set} />
          )}

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

              <div className="space-y-4 border-t border-slate-200 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Transcript
                </h3>
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
        </div>

        <footer className="flex items-center justify-between gap-2.5 border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
            disabled={stepIndex === 0}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={() => onSave(draft)}
                disabled={!canContinue}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                Save class
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setStepIndex((index) =>
                    Math.min(STEPS.length - 1, index + 1),
                  )
                }
                disabled={!canContinue}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
