import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { normalizeSettings, type ModalitySettings } from "./modality";
import type { PdExchange } from "./pdExchange";

/* ==========================================================================
   Modality and PD exchanges — storage
   --------------------------------------------------------------------------
   Two keys. The modality is one small object the member sets once and
   rarely touches; the exchanges are appended to four or five times a day.
   Writing them together would mean every exchange rewrites the setting.

   No seed for the exchanges. A PD member opening the log should see the
   day they have actually had, not four invented bags.
   ========================================================================== */

const MODALITY_KEY = storageKey("dialysis-modality");
const PD_EXCHANGES_KEY = storageKey("dialysis-pd-exchanges");

export async function getModalitySettings(): Promise<ModalitySettings> {
  return normalizeSettings(await readJson<unknown>(MODALITY_KEY, null));
}

export async function saveModalitySettings(
  settings: ModalitySettings,
): Promise<ModalitySettings> {
  return writeJson(MODALITY_KEY, settings);
}

export async function listPdExchanges(): Promise<PdExchange[]> {
  const stored = await readJson<PdExchange[] | null>(PD_EXCHANGES_KEY, null);
  return Array.isArray(stored) ? stored : [];
}

export async function savePdExchanges(
  exchanges: PdExchange[],
): Promise<PdExchange[]> {
  return writeJson(PD_EXCHANGES_KEY, exchanges);
}
