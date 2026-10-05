import { describe, expect, it } from "vitest";
import {
  answerFor,
  monthKey,
  monthlyVisits,
  recordAnswer,
  seedErVisits,
  visitsIn,
  weekOf,
} from "./erVisits";

/* Sunday 4 October 2026, noon. */
const NOW = new Date(2026, 9, 4, 12).getTime();

describe("ER visit log", () => {
  it("files an answer under the week's Monday", () => {
    expect(weekOf(NOW)).toBe("2026-09-28");
    expect(weekOf(new Date(2026, 9, 5, 9).getTime())).toBe("2026-10-05");
  });

  it("keeps one answer per week, with the date reported", () => {
    let log = recordAnswer([], "no", NOW);
    log = recordAnswer(log, "yes", NOW + 60_000);
    expect(log).toHaveLength(1);
    expect(answerFor(log, "2026-09-28")).toMatchObject({ answer: "yes" });
    expect(log[0].reportedAt).toBe(new Date(NOW + 60_000).toISOString());
  });

  it("counts Yes answers by the month they were reported", () => {
    const log = [
      ...recordAnswer([], "yes", new Date(2026, 8, 10).getTime()),
      ...recordAnswer([], "yes", new Date(2026, 9, 1).getTime()),
      ...recordAnswer([], "no", new Date(2026, 9, 2, 23).getTime()),
    ];
    expect(visitsIn(log, "2026-10")).toBe(1);
    expect(visitsIn(log, "2026-09")).toBe(1);
    expect(monthKey(NOW, 1)).toBe("2026-09");
    const months = monthlyVisits(log, NOW, 3);
    expect(months.map((m) => m.month)).toEqual([
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
  });

  it("seeds a history without this week's answer", () => {
    const seed = seedErVisits(NOW);
    expect(answerFor(seed, weekOf(NOW))).toBeUndefined();
    expect(seed.some((r) => r.answer === "yes")).toBe(true);
  });
});
