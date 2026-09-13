"use client";

import React, { useRef } from "react";
import {
  BookOpen,
  CheckCircle2,
  PlayCircle,
  Upload,
} from "lucide-react";
import { CourseClass, CourseClassKind } from "@/features/education/courseLibrary";
import { formatClock } from "@/features/education/vtt";

export const FIELD_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {hint && (
        <span className="mt-0.5 block text-[11px] font-medium text-slate-400">
          {hint}
        </span>
      )}
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

export function OverviewStep({
  draft,
  onChange,
}: {
  draft: CourseClass;
  onChange: (patch: Partial<CourseClass>) => void;
}) {
  return (
    <>
      <Field label="Class title (English)">
        <input
          className={FIELD_CLASS}
          value={draft.titleEn}
          onChange={(event) => onChange({ titleEn: event.target.value })}
          placeholder="e.g. Your Dialysis Access"
        />
      </Field>

      <Field label="Class title (Spanish)">
        <input
          className={FIELD_CLASS}
          value={draft.titleEs}
          onChange={(event) => onChange({ titleEs: event.target.value })}
        />
      </Field>

      <Field label="Summary (English)">
        <textarea
          rows={4}
          className={`${FIELD_CLASS} resize-none`}
          value={draft.summaryEn}
          onChange={(event) => onChange({ summaryEn: event.target.value })}
          placeholder="What this class covers."
        />
      </Field>

      <Field label="Summary (Spanish)">
        <textarea
          rows={4}
          className={`${FIELD_CLASS} resize-none`}
          value={draft.summaryEs}
          onChange={(event) => onChange({ summaryEs: event.target.value })}
        />
      </Field>
    </>
  );
}

/**
 * Two choices, because a video and an audio class are built the same way.
 * Which of the two it ends up being is taken from the file that is uploaded.
 */
const TYPE_OPTIONS: Array<{
  key: "media" | "reading";
  label: string;
  detail: string;
  icon: React.ElementType;
}> = [
  {
    key: "media",
    label: "Video / Audio",
    detail: "A recording with a transcript",
    icon: PlayCircle,
  },
  {
    key: "reading",
    label: "Reading",
    detail: "Written lesson, audio optional",
    icon: BookOpen,
  },
];

export function TypeStep({
  draft,
  onChange,
}: {
  draft: CourseClass;
  onChange: (patch: Partial<CourseClass>) => void;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {TYPE_OPTIONS.map((option) => {
          const selected =
            option.key === "reading"
              ? draft.kind === "reading"
              : draft.kind !== "reading";
          return (
            <button
              key={option.key}
              type="button"
              onClick={() =>
                onChange({
                  kind: option.key === "reading" ? "reading" : "video",
                })
              }
              aria-pressed={selected}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-center transition-colors cursor-pointer ${
                selected
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <option.icon
                className={`h-7 w-7 ${selected ? "text-blue-600" : "text-slate-400"}`}
              />
              <span
                className={`text-sm font-bold ${selected ? "text-blue-700" : "text-slate-800"}`}
              >
                {option.label}
              </span>
              <span className="text-[11px] font-medium leading-snug text-slate-500">
                {option.detail}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/** Reading classes can be typed out instead of recorded. */
export function ReadingBody({
  draft,
  onChange,
}: {
  draft: CourseClass;
  onChange: (patch: Partial<CourseClass>) => void;
}) {
  return (
    <>
      <Field label="Reading text (English)">
        <textarea
          rows={8}
          className={`${FIELD_CLASS} resize-y`}
          value={draft.bodyEn}
          onChange={(event) => onChange({ bodyEn: event.target.value })}
          placeholder="Write the lesson here."
        />
      </Field>

      <Field label="Reading text (Spanish)">
        <textarea
          rows={8}
          className={`${FIELD_CLASS} resize-y`}
          value={draft.bodyEs}
          onChange={(event) => onChange({ bodyEs: event.target.value })}
        />
      </Field>
    </>
  );
}

/** Upload area for the class file. The accepted type follows the class kind. */
export function MediaUpload({
  kind,
  mediaUrl,
  mediaFileName,
  mediaSeconds,
  onPickFile,
}: {
  kind: CourseClassKind;
  mediaUrl: string | null;
  mediaFileName: string | null;
  mediaSeconds: number | null;
  onPickFile: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isReading = kind === "reading";
  const isVideo = kind === "video";
  const accept = isReading ? "audio/*" : "video/*,audio/*";
  const label = isReading ? "audio" : "video or audio";

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPickFile(file);
          event.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-7 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer"
      >
        <Upload className="h-6 w-6 text-slate-400" />
        <span className="text-sm font-bold text-slate-700">
          Upload {label} file
        </span>
        <span className="text-xs font-medium text-slate-500">
          Reads the length and previews it here
        </span>
      </button>

      {mediaFileName && (
        <p className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{mediaFileName}</span>
          {mediaSeconds !== null && (
            <span className="shrink-0">{formatClock(mediaSeconds)}</span>
          )}
        </p>
      )}

      {mediaUrl && isVideo && (
        <video
          src={mediaUrl}
          controls
          preload="metadata"
          className="mt-3 aspect-video w-full rounded-xl bg-slate-900"
        />
      )}

      {mediaUrl && !isVideo && (
        <audio src={mediaUrl} controls className="mt-3 w-full" />
      )}
    </div>
  );
}
