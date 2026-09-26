import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { normaliseMonth, type SupplyMonth } from "./supplies";

/* ==========================================================================
   Supply checklist — storage
   --------------------------------------------------------------------------
   One key holding a map of month → count, rather than a key per month. A
   member looking back at what they ordered in March is a normal thing to
   want, and a single record keeps that a read rather than a key scan.
   ========================================================================== */

const SUPPLIES_KEY = storageKey("dialysis-supplies");

type StoredMonths = Record<string, unknown>;

export async function getSupplyMonth(monthKey: string): Promise<SupplyMonth> {
  const stored = await readJson<StoredMonths | null>(SUPPLIES_KEY, null);
  return normaliseMonth(stored?.[monthKey] ?? null, monthKey);
}

export async function saveSupplyMonth(
  month: SupplyMonth,
): Promise<SupplyMonth> {
  const stored =
    (await readJson<StoredMonths | null>(SUPPLIES_KEY, null)) ?? {};
  await writeJson(SUPPLIES_KEY, { ...stored, [month.monthKey]: month });
  return month;
}
