import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import type { ClinicNotice } from "./clinicNotice.types";

/* ==========================================================================
   Clinic notices — storage
   --------------------------------------------------------------------------
   No seed, for the same reason the check-ins have none: a queue that opened
   with invented notices would tell a member their clinic had been sent
   things it never was.

   Delivery is read from the calendar rather than driven by a timer, so a
   notice held over a Sunday still turns up as delivered on Monday even if
   the app was never opened in between.
   ========================================================================== */

const KEY = storageKey("clinic-notices");

export async function listClinicNotices(): Promise<ClinicNotice[]> {
  const stored = await readJson<ClinicNotice[] | null>(KEY, null);
  return Array.isArray(stored) ? stored : [];
}

export async function saveClinicNotices(
  notices: ClinicNotice[],
): Promise<ClinicNotice[]> {
  return writeJson(KEY, notices);
}
