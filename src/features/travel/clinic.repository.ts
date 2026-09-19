import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { SEED_CLINIC } from "./clinic.seed";
import type { DialysisClinic } from "./clinic.types";

const KEY = storageKey("dialysis-clinic");

/* Stored JSON is not to be trusted: it was written by an older build, or by
   a member editing devtools, or half-written when the tab closed. Anything
   that is not a string falls back rather than reaching a tel: link as
   `undefined`. */
function parse(value: unknown): DialysisClinic {
  const raw = (value ?? {}) as Partial<DialysisClinic>;
  return {
    name: typeof raw.name === "string" ? raw.name : SEED_CLINIC.name,
    phone: typeof raw.phone === "string" ? raw.phone : SEED_CLINIC.phone,
    /* Blank, not the seed's street. A record already on the device belongs
       to a member who set their own centre, and attaching the demo
       clinic's address to their name would be a false record of where they
       go three times a week. */
    address: typeof raw.address === "string" ? raw.address : "",
  };
}

export async function getClinic(): Promise<DialysisClinic> {
  const stored = await readJson<unknown>(KEY, null);
  return stored === null ? SEED_CLINIC : parse(stored);
}

export async function saveClinic(
  clinic: DialysisClinic,
): Promise<DialysisClinic> {
  return writeJson(KEY, {
    name: clinic.name.trim(),
    phone: clinic.phone.trim(),
    address: clinic.address.trim(),
  });
}

/** Strips formatting so the number works in a tel: link. */
export function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
