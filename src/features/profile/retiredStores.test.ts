import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  isRetiredKey,
  purgeLegacyStorage,
  RETIRED_STORES,
  STORAGE_VERSION,
  STORAGE_VERSION_KEY,
} from "@/lib/data/legacyPurge";
import { PHASE_4_DATA_FILES, PHASE_4_RETIRED } from "./retiredStores";

/* Phase 4 moved these stores to the API. A browser that used the prototype
   still holds them; the purge must remove every variant, and no screen may
   read them again (legacy data can never be "restored"). Synthetic only. */

afterEach(() => window.localStorage.clear());

const variants = (name: string) => [
  `nr:${name}`,
  `nr:member:someone@example.test:${name}`,
  `nr:caregiver-none:${name}`,
];

describe("Phase 4 retired stores", () => {
  it.each(PHASE_4_RETIRED)("%s is in the purge registry", (name) => {
    expect(RETIRED_STORES.some((store) => store.name === name)).toBe(true);
    for (const key of variants(name)) expect(isRetiredKey(key)).toBe(true);
  });

  it.each(PHASE_4_RETIRED)(
    "%s is purged in every variant, and the marker is written",
    (name) => {
      for (const key of variants(name))
        window.localStorage.setItem(
          key,
          JSON.stringify([{ id: "legacy-1", name: "Legacy row" }]),
        );
      purgeLegacyStorage(window.localStorage);
      for (const key of variants(name))
        expect(window.localStorage.getItem(key)).toBeNull();
      expect(window.localStorage.getItem(STORAGE_VERSION_KEY)).toBe(
        String(STORAGE_VERSION),
      );
    },
  );

  /* Static: the data layer has no way back to browser storage. */
  it.each(PHASE_4_DATA_FILES)("%s does not touch browser storage", (file) => {
    const text = fs.readFileSync(path.resolve(process.cwd(), file), "utf8");
    expect(text).not.toMatch(/@\/lib\/data\/storage/);
    expect(text).not.toMatch(/localStorage|sessionStorage/);
  });
});
