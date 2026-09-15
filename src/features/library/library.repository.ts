import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { SEED_LIBRARY_RESOURCES } from "./library.seed";
import type { LibraryResource, LibrarySavedList } from "./library.types";

/* ==========================================================================
   My Library — storage
   --------------------------------------------------------------------------
   Two records, kept apart on purpose. The shelf itself is published content
   that an admin will own once the Library management screen lands, so it is
   read-only from the member side. What the member saves is theirs, is
   written far more often, and belongs in its own key.
   ========================================================================== */

const RESOURCES_KEY = storageKey("library-resources");
const SAVED_KEY = storageKey("library-saved");

/** The published shelf. Falls back to the seed until an admin publishes. */
export async function listResources(): Promise<LibraryResource[]> {
  const stored = await readJson<LibraryResource[] | null>(RESOURCES_KEY, null);
  return Array.isArray(stored) ? stored : SEED_LIBRARY_RESOURCES;
}

export async function saveResources(
  resources: LibraryResource[],
): Promise<LibraryResource[]> {
  return writeJson(RESOURCES_KEY, resources);
}

/** Slugs the member has saved. Empty is a real answer, not a missing one. */
export async function getSaved(): Promise<LibrarySavedList> {
  const stored = await readJson<LibrarySavedList | null>(SAVED_KEY, null);
  return Array.isArray(stored) ? stored : [];
}

export async function setSaved(
  slugs: LibrarySavedList,
): Promise<LibrarySavedList> {
  return writeJson(SAVED_KEY, slugs);
}
