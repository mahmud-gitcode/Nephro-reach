import { describe, expect, it } from "vitest";
import { JOURNEY_DAYS } from "./dialysisJourneyData";
import {
  completedCount,
  hasStarted,
  markComplete,
  markIncomplete,
  nextDay,
  overallPercent,
  recordWatched,
  unlockDay,
} from "./journey.rules";
import type { JourneyProgressMap } from "./journey.types";

/* These rules used to be the bodies of six setState updaters, which is why
 * none of them had ever been tested: reaching them meant rendering a page.
 * As pure functions the interesting cases are one line each — and the
 * interesting cases are all about not losing a member's progress. */

const [day1, day2] = JOURNEY_DAYS;
const NOW = new Date("2026-09-15T10:00:00.000Z");
const none: JourneyProgressMap = {};

describe("journey progress rules", () => {
  it("starts a day the first time it is opened", () => {
    const next = unlockDay(none, day1.slug, NOW);
    expect(next[day1.slug].status).toBe("in-progress");
  });

  it("does not restart a day that is already finished", () => {
    const done = markComplete(none, day1.slug, NOW);
    expect(unlockDay(done, day1.slug, NOW)).toBe(done);
  });

  it("opens the next day when one is finished, so the learner can go on", () => {
    const next = markComplete(none, day1.slug, NOW);
    expect(next[day2.slug].status).toBe("in-progress");
  });

  it("does not reopen a finished day that follows the one just finished", () => {
    const both = markComplete(
      markComplete(none, day2.slug, NOW),
      day1.slug,
      NOW,
    );
    expect(both[day2.slug].status).toBe("completed");
  });

  it("raises the watched percentage", () => {
    const next = recordWatched(none, day1.slug, 42, NOW);
    expect(next[day1.slug].percent).toBe(42);
  });

  it("never walks the percentage backwards on a rewatch", () => {
    const watched = recordWatched(none, day1.slug, 80, NOW);
    // Rewatching the first minute has not un-watched the lesson.
    expect(recordWatched(watched, day1.slug, 5, NOW)).toBe(watched);
  });

  it("leaves a finished day finished however little is rewatched", () => {
    const done = markComplete(none, day1.slug, NOW);
    expect(recordWatched(done, day1.slug, 3, NOW)).toBe(done);
  });

  it("counts 95 percent as finished, because players lose the last frames", () => {
    const next = recordWatched(none, day1.slug, 96, NOW);
    expect(next[day1.slug].status).toBe("completed");
  });

  it("clamps a percentage that arrives above the range", () => {
    expect(recordWatched(none, day1.slug, 140, NOW)[day1.slug].percent).toBe(
      100,
    );
  });

  it("ignores a negative percentage rather than recording a start", () => {
    // Clamped to 0, which is no further than the member already was, so the
    // day stays untouched instead of gaining a bogus "started" entry.
    expect(recordWatched(none, day1.slug, -20, NOW)).toBe(none);
  });

  it("reopening a day keeps it started rather than untouched", () => {
    const done = markComplete(none, day1.slug, NOW);
    const reopened = markIncomplete(done, day1.slug, NOW);
    expect(reopened[day1.slug].status).toBe("in-progress");
    expect(reopened[day1.slug].percent).toBe(0);
  });

  it("stamps every change with the time it happened", () => {
    expect(unlockDay(none, day1.slug, NOW)[day1.slug].updatedAt).toBe(
      NOW.toISOString(),
    );
  });
});

describe("journey progress summaries", () => {
  it("reports nothing started on an untouched journey", () => {
    expect(hasStarted(none)).toBe(false);
    expect(completedCount(none)).toBe(0);
    expect(overallPercent(none)).toBe(0);
  });

  it("points 'continue' at the first unfinished day", () => {
    expect(nextDay(none).slug).toBe(day1.slug);
    expect(nextDay(markComplete(none, day1.slug, NOW)).slug).toBe(day2.slug);
  });

  it("counts finished days against the whole journey", () => {
    const next = markComplete(none, day1.slug, NOW);
    expect(completedCount(next)).toBe(1);
    expect(overallPercent(next)).toBe(
      Math.round((1 / JOURNEY_DAYS.length) * 100),
    );
  });

  it("holds 'continue' on the last day once everything is finished", () => {
    const all = JOURNEY_DAYS.reduce(
      (progress, day) => markComplete(progress, day.slug, NOW),
      none,
    );
    expect(nextDay(all).slug).toBe(JOURNEY_DAYS[JOURNEY_DAYS.length - 1].slug);
    expect(overallPercent(all)).toBe(100);
  });
});
