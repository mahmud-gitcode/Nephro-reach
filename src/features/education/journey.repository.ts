import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import type { JourneyNotesMap, JourneyProgressMap } from "./journey.types";

/* ==========================================================================
   The 21-day journey — storage
   --------------------------------------------------------------------------
   Two records, kept apart on purpose: progress is written by the video
   player several times a minute, notes are written as the member types. One
   blob would mean each write racing the other.

   There is no seed here. An unvisited journey is genuinely empty, and
   showing a member progress they did not make would be a lie about their
   own record.
   ========================================================================== */

const PROGRESS_KEY = storageKey("journey-progress");
const NOTES_KEY = storageKey("journey-notes");

/** A map or nothing. Anything else in storage is treated as nothing. */
function asMap<T>(value: unknown): Record<string, T> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, T>)
    : {};
}

export async function getProgress(): Promise<JourneyProgressMap> {
  return asMap(await readJson<unknown>(PROGRESS_KEY, null));
}

export async function saveProgress(
  progress: JourneyProgressMap,
): Promise<JourneyProgressMap> {
  return writeJson(PROGRESS_KEY, progress);
}

export async function getNotes(): Promise<JourneyNotesMap> {
  return asMap(await readJson<unknown>(NOTES_KEY, null));
}

export async function saveNotes(
  notes: JourneyNotesMap,
): Promise<JourneyNotesMap> {
  return writeJson(NOTES_KEY, notes);
}
