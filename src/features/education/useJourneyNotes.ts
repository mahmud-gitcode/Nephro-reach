"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useClassroom } from "./classroom";
import { useLearnerCourse } from "./useLearnerCourse";

export type { JourneyNotesMap } from "./journey.types";

/**
 * What the little line under the textarea says. `error` is the one that
 * matters: "Notes save automatically" while the save is failing is the
 * app telling a member something untrue about their own writing.
 */
export type NoteSaveState = "idle" | "saving" | "saved" | "error";

/** Wait this long after the last keystroke before saving (per class). */
export const AUTOSAVE_DELAY_MS = 800;

/**
 * Free-text notes, one per journey day, on the server (PUT …/classes/:id/
 * note, at most 5000 characters, "" clears it). Read from the learner
 * record's progress rows.
 *
 * Typing does not go through the mutation — a keystroke is not a request.
 * The typed text is held locally per class and the write is debounced;
 * `flushNote` skips the wait, for blur and for leaving the page. A failed
 * save keeps the text on screen and says so.
 */
export function useJourneyNotes() {
  const classroom = useClassroom();
  const learner = useLearnerCourse(classroom.course);
  const [saveState, setSaveState] = useState<NoteSaveState>("idle");
  /* Typed text by slug, ahead of the server. */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const pendingRef = useRef<{ slug: string; text: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { mutate } = learner.note;
  const lessons = classroom.lessons;
  const canWrite = learner.canWrite;

  const send = useCallback(
    (slug: string, text: string) => {
      const classId = lessons.find((lesson) => lesson.slug === slug)?.classId;
      if (!classId || !canWrite) {
        setSaveState("error");
        return;
      }
      mutate(
        { classId, text },
        {
          onSuccess: () => setSaveState("saved"),
          onError: () => setSaveState("error"),
        },
      );
    },
    [lessons, mutate, canWrite],
  );

  const getNote = useCallback(
    (slug: string) => drafts[slug] ?? learner.notes[slug] ?? "",
    [drafts, learner.notes],
  );

  const flushNote = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) send(pending.slug, pending.text);
  }, [send]);

  const setNote = useCallback(
    (slug: string, value: string) => {
      /* A different day's unsaved text goes first. */
      if (pendingRef.current && pendingRef.current.slug !== slug) flushNote();
      pendingRef.current = { slug, text: value };
      setDrafts((current) => ({ ...current, [slug]: value }));
      setSaveState("saving");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const pending = pendingRef.current;
        pendingRef.current = null;
        if (pending) send(pending.slug, pending.text);
      }, AUTOSAVE_DELAY_MS);
    },
    [flushNote, send],
  );

  /* Leaving the page saves what was typed (the request still goes out). */
  const flushRef = useRef(flushNote);
  useEffect(() => {
    flushRef.current = flushNote;
  }, [flushNote]);
  useEffect(() => () => flushRef.current(), []);

  return {
    getNote,
    setNote,
    flushNote,
    saveState,
    canWrite,
    isPending: classroom.isPending || learner.isPending,
    error: classroom.error ?? learner.error,
    saveError: learner.note.error,
  };
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
