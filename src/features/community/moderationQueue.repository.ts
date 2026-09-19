import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import type { HeldItem } from "./community.types";

/* ==========================================================================
   Moderation queue — storage
   --------------------------------------------------------------------------
   No seed. A queue that ships with example content trains whoever opens it
   to clear rows without reading them, and these rows are the ones that most
   need reading.
   ========================================================================== */

export const MODERATION_KEY = storageKey("community-moderation-queue");

export async function listHeldItems(): Promise<HeldItem[]> {
  const stored = await readJson<HeldItem[] | null>(MODERATION_KEY, null);
  return Array.isArray(stored) ? stored : [];
}

export async function saveHeldItems(items: HeldItem[]): Promise<HeldItem[]> {
  return writeJson(MODERATION_KEY, items);
}
