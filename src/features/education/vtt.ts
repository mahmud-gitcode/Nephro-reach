/**
 * WebVTT / SRT parsing and serialising.
 *
 * The caption file is the unit of exchange: ASR tools export it, the browser's
 * <track> element reads it, and the transcript panel is just the same cues
 * rendered as a list. Parsing happens in the browser, so no upload is needed
 * to turn a .vtt into editable lines.
 */

export interface ParsedCue {
  start: number;
  end: number;
  text: string;
}

/** Accepts `HH:MM:SS.mmm`, `MM:SS.mmm`, and the SRT comma variant. */
export function parseTimestamp(value: string): number | null {
  const cleaned = value.trim().replace(",", ".");
  if (!cleaned) return null;

  const parts = cleaned.split(":");
  if (parts.length < 2 || parts.length > 3) return null;

  const seconds = Number(parts.pop());
  const minutes = Number(parts.pop());
  const hours = parts.length > 0 ? Number(parts.pop()) : 0;

  if ([seconds, minutes, hours].some((part) => Number.isNaN(part))) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

function pad(value: number, length: number) {
  return String(value).padStart(length, "0");
}

/** Renders seconds as the `HH:MM:SS.mmm` a VTT file expects. */
export function formatTimestamp(seconds: number): string {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const wholeSeconds = Math.floor(safe % 60);
  const milliseconds = Math.round((safe - Math.floor(safe)) * 1000);
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(wholeSeconds, 2)}.${pad(milliseconds, 3)}`;
}

/** Short `m:ss` form used in the editor and the transcript list. */
export function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${pad(safe % 60, 2)}`;
}

/**
 * Reads a .vtt or .srt file. Blocks without a `-->` line — the WEBVTT header,
 * NOTE comments, styling blocks — are skipped rather than treated as cues.
 */
export function parseCaptions(source: string): ParsedCue[] {
  const normalised = source.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const cues: ParsedCue[] = [];

  for (const block of normalised.split(/\n{2,}/)) {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length === 0) continue;

    const arrowIndex = lines.findIndex((line) => line.includes("-->"));
    if (arrowIndex === -1) continue;

    const [rawStart, rawRest] = lines[arrowIndex].split("-->");
    const start = parseTimestamp(rawStart ?? "");
    if (start === null) continue;

    // The end time can be followed by cue settings such as `align:start`.
    const rawEnd = (rawRest ?? "").trim().split(/\s+/)[0] ?? "";
    const end = parseTimestamp(rawEnd);

    const text = lines
      .slice(arrowIndex + 1)
      .join(" ")
      .replace(/<[^>]+>/g, "")
      .trim();
    if (!text) continue;

    cues.push({ start, end: end !== null && end > start ? end : start, text });
  }

  return cues.sort((a, b) => a.start - b.start);
}

/**
 * Fills in an end time for cues that do not carry one, using the next cue's
 * start (or a short tail for the final cue).
 */
export function withResolvedEnds(
  cues: Array<{ at: number; end?: number; text: string }>,
  totalSeconds?: number,
): ParsedCue[] {
  return cues.map((cue, index) => {
    const next = cues[index + 1];
    const fallback = next
      ? next.at
      : Math.max(cue.at + 4, totalSeconds ?? cue.at + 4);
    const end = cue.end && cue.end > cue.at ? cue.end : fallback;
    return { start: cue.at, end, text: cue.text };
  });
}

export function toVtt(cues: ParsedCue[]): string {
  const body = cues
    .map(
      (cue, index) =>
        `${index + 1}\n${formatTimestamp(cue.start)} --> ${formatTimestamp(cue.end)}\n${cue.text}`,
    )
    .join("\n\n");
  return `WEBVTT\n\n${body}\n`;
}

/** Hands the browser a generated file to save. */
export function downloadTextFile(
  fileName: string,
  body: string,
  mimeType = "text/vtt;charset=utf-8",
) {
  try {
    const blob = new Blob([body], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch {
    // Downloads can be blocked; the transcript stays in the editor either way.
  }
}

/** Turns a title into something safe to use as a file name. */
export function toFileSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "class"
  );
}
