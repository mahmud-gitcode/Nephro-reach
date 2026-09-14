"use client";

import React, { useRef, useState } from "react";
import {
  AlertTriangle,
  Captions,
  Download,
  Trash2,
  Upload,
} from "lucide-react";
import { CourseClass, createId } from "@/features/education/courseLibrary";
import {
  downloadTextFile,
  formatClock,
  parseCaptions,
  toFileSlug,
  toVtt,
  withResolvedEnds,
} from "@/features/education/vtt";

type CaptionLanguage = "EN" | "ES";

const LANGUAGE_NAME: Record<CaptionLanguage, string> = {
  EN: "English",
  ES: "Español",
};

/**
 * Pick a language, upload its caption file, repeat for the next language.
 *
 * Timings come from the first file uploaded. A later language reuses them when
 * its line count matches, which keeps both versions in step with the recording.
 */
export default function ClassTranscriptUpload({
  draft,
  onChange,
  mediaSeconds,
}: {
  draft: CourseClass;
  onChange: (patch: Partial<CourseClass>) => void;
  mediaSeconds: number | null;
}) {
  const [language, setLanguage] = useState<CaptionLanguage>("EN");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const cues = draft.transcript;
  const lastCueAt = cues.length > 0 ? cues[cues.length - 1].at : 0;
  const durationMismatch = mediaSeconds !== null && lastCueAt > mediaSeconds + 1;

  const loaded = (["EN", "ES"] as CaptionLanguage[])
    .map((code) => ({
      code,
      lines: cues.filter((cue) =>
        code === "EN" ? cue.textEn.trim() : cue.textEs.trim(),
      ).length,
    }))
    .filter((entry) => entry.lines > 0);

  const importFile = async (file: File) => {
    const parsed = parseCaptions(await file.text());
    setError(null);

    if (parsed.length === 0) {
      setError("No caption lines found. Expecting a .vtt or .srt file.");
      return;
    }

    // A second language with the same segmentation is a translation, so only
    // its text column changes and the timings stay exactly where they were.
    if (cues.length === parsed.length) {
      onChange({
        transcript: cues.map((cue, index) => ({
          ...cue,
          ...(language === "EN"
            ? { textEn: parsed[index].text }
            : { textEs: parsed[index].text }),
        })),
      });
      return;
    }

    onChange({
      transcript: parsed.map((cue, index) => ({
        id: createId("cue"),
        at: cue.start,
        end: cue.end,
        textEn: language === "EN" ? cue.text : (cues[index]?.textEn ?? ""),
        textEs: language === "ES" ? cue.text : (cues[index]?.textEs ?? ""),
      })),
    });
  };

  const removeLanguage = (code: CaptionLanguage) => {
    const remaining = cues
      .map((cue) => ({
        ...cue,
        textEn: code === "EN" ? "" : cue.textEn,
        textEs: code === "ES" ? "" : cue.textEs,
      }))
      .filter((cue) => cue.textEn.trim() || cue.textEs.trim());
    onChange({ transcript: remaining });
  };

  const exportLanguage = (code: CaptionLanguage) => {
    const resolved = withResolvedEnds(
      cues.map((cue) => ({
        at: cue.at,
        end: cue.end,
        text: (code === "ES" ? cue.textEs : cue.textEn).trim(),
      })),
      mediaSeconds ?? draft.durationMinutes * 60,
    ).filter((cue) => cue.text.length > 0);

    if (resolved.length > 0) {
      downloadTextFile(
        `${toFileSlug(draft.titleEn)}.${code.toLowerCase()}.vtt`,
        toVtt(resolved),
      );
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".vtt,.srt,text/vtt,text/plain"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importFile(file);
          event.target.value = "";
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="caption-language">
          Transcript language
        </label>
        <select
          id="caption-language"
          value={language}
          onChange={(event) =>
            setLanguage(event.target.value as CaptionLanguage)
          }
          className="rounded-control border border-line bg-surface px-2.5 py-2 text-xs font-bold text-fg-secondary outline-none hover:bg-surface-sunken focus:border-primary-edge cursor-pointer"
        >
          <option value="EN">English</option>
          <option value="ES">Español</option>
        </select>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 rounded-control bg-primary-solid px-3 py-2 text-xs font-bold text-primary-on-solid transition-colors hover:bg-primary-solid-hover cursor-pointer"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload transcript
        </button>
      </div>

      {error && (
        <p className="flex gap-2 rounded-control bg-warning-surface px-3 py-2 text-[11px] font-medium leading-relaxed text-warning">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {durationMismatch && (
        <p className="flex gap-2 rounded-control bg-danger-surface px-3 py-2 text-[11px] font-medium leading-relaxed text-danger">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          This transcript ends at {formatClock(lastCueAt)} but the media is only{" "}
          {formatClock(mediaSeconds ?? 0)} long. The two may not belong
          together.
        </p>
      )}

      {loaded.length === 0 ? (
        <p className="rounded-control border border-dashed border-line p-6 text-center text-sm text-fg-muted">
          No transcript uploaded yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {loaded.map((entry) => (
            <li
              key={entry.code}
              className="flex items-center gap-3 rounded-control border border-line bg-surface p-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary-soft text-fg-brand">
                <Captions className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-fg">
                  {LANGUAGE_NAME[entry.code]}
                </span>
                <span className="block text-xs font-medium text-fg-muted">
                  {entry.lines} lines
                </span>
              </span>

              <button
                type="button"
                onClick={() => exportLanguage(entry.code)}
                aria-label={`Download ${LANGUAGE_NAME[entry.code]} transcript`}
                className="flex h-8 w-8 items-center justify-center rounded-control text-fg-subtle transition-colors hover:bg-surface-sunken hover:text-fg-secondary cursor-pointer"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => removeLanguage(entry.code)}
                aria-label={`Remove ${LANGUAGE_NAME[entry.code]} transcript`}
                className="flex h-8 w-8 items-center justify-center rounded-control text-fg-subtle transition-colors hover:bg-danger-surface hover:text-danger cursor-pointer"
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
