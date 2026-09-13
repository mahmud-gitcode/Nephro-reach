"use client";

import { useCallback, useRef, useState } from "react";

export type JourneyNotesMap = Record<string, string>;

export type NoteSaveState = "idle" | "saving" | "saved";

const STORAGE_KEY = "nephroreach_journey_notes";
const AUTOSAVE_DELAY_MS = 600;

function readStoredNotes(): JourneyNotesMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as JourneyNotesMap;
  } catch {
    return {};
  }
}

function persistNotes(next: JourneyNotesMap) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private window, blocked site data). Notes
    // still work for the current session rather than breaking the page.
  }
}

/**
 * Free-text notes, one note per journey day, autosaved to localStorage.
 *
 * The latest map is mirrored in a ref so the debounced write persists what the
 * member actually typed without reading state inside a setState updater.
 */
export function useJourneyNotes() {
  const [notes, setNotes] = useState<JourneyNotesMap>(readStoredNotes);
  const [saveState, setSaveState] = useState<NoteSaveState>("idle");
  const latestRef = useRef<JourneyNotesMap>(notes);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getNote = useCallback(
    (slug: string): string => notes[slug] ?? "",
    [notes],
  );

  const setNote = useCallback((slug: string, value: string) => {
    const next: JourneyNotesMap = { ...latestRef.current, [slug]: value };
    latestRef.current = next;
    setNotes(next);
    setSaveState("saving");

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      persistNotes(next);
      setSaveState("saved");
    }, AUTOSAVE_DELAY_MS);
  }, []);

  /** Writes immediately instead of waiting out the debounce. */
  const flushNote = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    persistNotes(latestRef.current);
    setSaveState("saved");
  }, []);

  return { getNote, setNote, flushNote, saveState };
}

/** Hands the member their note for a day as a plain .txt download. */
export function downloadNoteAsText(fileName: string, body: string) {
  try {
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch {
    // Downloads can be blocked; the note stays saved in the panel either way.
  }
}
