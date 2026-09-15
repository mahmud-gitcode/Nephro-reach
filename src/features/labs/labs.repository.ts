import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import type { CustomLabResult } from "./labs.types";

/* No seed: a member who has entered no labs has entered no labs, and
   inventing a draw on a page of medical results would be indefensible. */
const KEY = storageKey("custom-lab-results");

export async function getCustomLabResult(): Promise<CustomLabResult | null> {
  const stored = await readJson<CustomLabResult | null>(KEY, null);
  return stored !== null && typeof stored === "object" ? stored : null;
}

export async function saveCustomLabResult(
  result: CustomLabResult,
): Promise<CustomLabResult> {
  return writeJson(KEY, result);
}
