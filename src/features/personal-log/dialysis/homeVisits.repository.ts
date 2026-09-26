import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { normaliseVisits, type HomeVisit } from "./homeVisits";

/* ==========================================================================
   Home visits — storage
   --------------------------------------------------------------------------
   No seed. A member opening this should see the visits they actually have
   booked, not three invented appointments they might turn up for.
   ========================================================================== */

const HOME_VISITS_KEY = storageKey("dialysis-home-visits");

export async function listHomeVisits(): Promise<HomeVisit[]> {
  return normaliseVisits(await readJson<unknown>(HOME_VISITS_KEY, null));
}

export async function saveHomeVisits(
  visits: HomeVisit[],
): Promise<HomeVisit[]> {
  return writeJson(HOME_VISITS_KEY, visits);
}
