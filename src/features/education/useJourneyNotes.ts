"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotes, saveNotes } from "./journey.repository";
import type { JourneyNotesMap } from "./journey.types";

export type { JourneyNotesMap } from "./journey.types";

/**
 * What the little line under the textarea says. `error` is the one that
 * matters: "Notes save automatically" while the save is failing is the
 * app telling a member something untrue about their own writing.
 */
export type NoteSaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 600;

export const journeyNotesKey = ["education", "journey-notes"] as const;

/**
 * Free-text notes, one per journey day, autosaved.
 *
 * Typing does not go through the mutation — a keystroke is not a request.
 * The typed map is held in a ref and the write is debounced; the mutation
 * only carries what is actually being saved. `flushNote` skips the wait,
 * for blur and for leaving the page.
 */
export function useJourneyNotes() {
  const queryClient = useQueryClient();
  const [saveState, setSaveState] = useState<NoteSaveState>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* The map as typed, which runs ahead of both the cache and storage. It is
     state as well as a ref: state so each keystroke re-renders the textarea,
     a ref so the debounced write sees the newest map without being
     re-created on every character. */
  const [draft, setDraft] = useState<JourneyNotesMap | null>(null);
  const latestRef = useRef<JourneyNotesMap | null>(null);

  const query = useQuery({
    queryKey: journeyNotesKey,
    queryFn: getNotes,
  });

  const write = useMutation({
    mutationFn: (notes: JourneyNotesMap) => saveNotes(notes),
    onSuccess: (notes) => {
      queryClient.setQueryData(journeyNotesKey, notes);
      setSaveState("saved");
    },
    onError: () => setSaveState("error"),
  });

  const { mutate } = write;
  const notes = useMemo(() => draft ?? query.data ?? {}, [draft, query.data]);

  const getNote = useCallback((slug: string) => notes[slug] ?? "", [notes]);

  const setNote = useCallback(
    (slug: string, value: string) => {
      const next = {
        ...(latestRef.current ?? query.data ?? {}),
        [slug]: value,
      };
      latestRef.current = next;
      setDraft(next);
      setSaveState("saving");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        mutate(next);
      }, AUTOSAVE_DELAY_MS);
    },
    [mutate, query.data],
  );

  /** Writes now instead of waiting out the debounce. */
  const flushNote = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (latestRef.current) mutate(latestRef.current);
  }, [mutate]);

  return {
    getNote,
    setNote,
    flushNote,
    saveState,
    isPending: query.isPending,
    error: query.error,
    saveError: write.error,
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
