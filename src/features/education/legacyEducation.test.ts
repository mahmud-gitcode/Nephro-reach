import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  isRetiredKey,
  purgeLegacyStorage,
  STORAGE_VERSION,
  STORAGE_VERSION_KEY,
} from "@/lib/data/legacyPurge";
import { shouldSendWatched } from "./useJourneyProgress";

/* Phase 13 (STORAGE_VERSION 9): the classroom, journey and live-class keys
   are retired in the same change that moved them to the API, and nothing
   can bring their old rows back. Synthetic data only. */

const RETIRED = [
  "nr:course-library",
  "nr:clinic-live-class",
  "nr:classroom-learner",
  "nr:journey-progress",
  "nr:journey-notes",
  "nr:member:demo@example.test:journey-progress",
  "nr:member:demo@example.test:journey-notes",
  "nr:member:demo@example.test:classroom-learner",
  "nr:caregiver-none:journey-progress",
];

/* The files that read and write education and live-class data now. */
const DATA_FILES = [
  "src/features/education/courseLibrary.ts",
  "src/features/education/classroom.ts",
  "src/features/education/education.repository.ts",
  "src/features/education/education.mappers.ts",
  "src/features/education/liveClasses.repository.ts",
  "src/features/education/useLearnerCourse.ts",
  "src/features/education/useJourneyProgress.ts",
  "src/features/education/useJourneyNotes.ts",
  "src/features/education/useLearnerRecord.ts",
  "src/features/education/useMemberLiveClasses.ts",
  "src/features/education/usePlatformCourses.ts",
  "src/features/clinic/useLiveClasses.ts",
  "src/features/clinic/liveClass.actions.ts",
  "src/features/clinic/liveClass.mappers.ts",
];

describe("retired education and live-class storage", () => {
  it("is in the purge registry at version 9", () => {
    expect(STORAGE_VERSION).toBeGreaterThanOrEqual(9);
    for (const key of RETIRED) expect(isRetiredKey(key)).toBe(true);
    /* Live keys of other features are left alone. */
    expect(isRetiredKey("preferred_language")).toBe(false);
    /* library-saved was retired by Phase 12 (version 8); the member's
       home-HD vitals stay live until D8. */
    expect(
      isRetiredKey("nr:member:demo@example.test:dialysis-treatment-vitals"),
    ).toBe(false);
  });

  it("is purged, with the marker written, and every old row gone", () => {
    const store = window.localStorage;
    store.clear();
    for (const key of RETIRED)
      store.setItem(
        key,
        JSON.stringify({ "day-01": { status: "completed", percent: 100 } }),
      );
    store.setItem("preferred_language", "EN");
    const result = purgeLegacyStorage(store);
    for (const key of RETIRED) expect(store.getItem(key)).toBeNull();
    expect(result.removed).toEqual(expect.arrayContaining(RETIRED));
    expect(store.getItem(STORAGE_VERSION_KEY)).toBe(String(STORAGE_VERSION));
    expect(store.getItem("preferred_language")).toBe("EN");
    store.clear();
  });

  it("cannot come back: no data file touches browser storage or a seed", () => {
    for (const file of DATA_FILES) {
      const text = fs.readFileSync(path.join(process.cwd(), file), "utf8");
      expect(text, file).not.toMatch(
        /readJson|writeJson|storageKey|localStorage/,
      );
      expect(text, file).not.toMatch(
        /classroom\.seed|seedClasses|upcomingClasses|recentClasses/,
      );
    }
    expect(
      fs.existsSync(
        path.join(process.cwd(), "src/features/education/classroom.seed.ts"),
      ),
    ).toBe(false);
    expect(
      fs.existsSync(
        path.join(
          process.cwd(),
          "src/features/education/journey.repository.ts",
        ),
      ),
    ).toBe(false);
  });

  it("no client grading or self-issued certificate is left", () => {
    const rules = fs.readFileSync(
      path.join(process.cwd(), "src/features/education/questions.rules.ts"),
      "utf8",
    );
    expect(rules).not.toMatch(
      /export function (scoreQuiz|buildAttempt|certificateId)/,
    );
  });
});

describe("watched progress is throttled", () => {
  it("sends on 10-point steps and at 95 %, never backwards", () => {
    expect(shouldSendWatched(0, 4)).toBe(false);
    expect(shouldSendWatched(0, 10)).toBe(true);
    expect(shouldSendWatched(10, 19.4)).toBe(false);
    expect(shouldSendWatched(10, 20)).toBe(true);
    expect(shouldSendWatched(90, 95)).toBe(true);
    expect(shouldSendWatched(95, 99)).toBe(false);
    expect(shouldSendWatched(50, 30)).toBe(false);
  });
});
