import { describe, expect, it } from "vitest";
import {
  ALL_PROGRAMS,
  byProgram,
  categories,
  checkInTone,
  completionPct,
  completionTrend,
  followUps,
  overview,
  programs,
  recentCheckIns,
  truncateWords,
} from "./checkIns.data";

describe("byProgram", () => {
  it("returns every row for All Programs", () => {
    expect(byProgram(recentCheckIns, ALL_PROGRAMS)).toHaveLength(
      recentCheckIns.length,
    );
  });

  it("narrows to one program", () => {
    const rows = byProgram(recentCheckIns, "Crash Dialysis (5-Day)");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.program === "Crash Dialysis (5-Day)")).toBe(
      true,
    );
  });

  it("filters the follow-up list by the same rule", () => {
    const rows = byProgram(followUps, "Journey to Dialysis");
    expect(rows.every((r) => r.program === "Journey to Dialysis")).toBe(true);
  });

  it("returns nothing for a program with no rows", () => {
    expect(byProgram(recentCheckIns, "Not A Program")).toEqual([]);
  });
});

describe("the program filter", () => {
  it("offers only programs the rows actually use, plus All", () => {
    const used = new Set([
      ...recentCheckIns.map((r) => r.program),
      ...followUps.map((r) => r.program),
    ]);
    for (const program of programs) {
      if (program === ALL_PROGRAMS) continue;
      expect(used.has(program)).toBe(true);
    }
  });

  it("leads with All Programs, so the page opens unfiltered", () => {
    expect(programs[0]).toBe(ALL_PROGRAMS);
  });
});

describe("completionPct", () => {
  it("rounds to a whole percent", () => {
    expect(completionPct(214, 260)).toBe(82);
    expect(completionPct(177, 260)).toBe(68);
  });

  it("never divides by zero", () => {
    expect(completionPct(5, 0)).toBe(0);
  });
});

describe("the check-in tables", () => {
  it("gives every row a status the badge knows how to colour", () => {
    for (const row of recentCheckIns) {
      expect(checkInTone[row.status]).toBeDefined();
    }
  });

  it("never claims more completed check-ins than were expected", () => {
    for (const category of categories) {
      expect(category.completed).toBeLessThanOrEqual(category.expected);
    }
  });
});

describe("the completion trend", () => {
  it("has one label per point, or the chart silently misaligns", () => {
    expect(completionTrend.labels).toHaveLength(completionTrend.points.length);
  });

  it("stays inside the 50–100 window the chart draws", () => {
    for (const point of completionTrend.points) {
      expect(point).toBeGreaterThanOrEqual(50);
      expect(point).toBeLessThanOrEqual(100);
    }
  });
});

describe("the overview cards", () => {
  it("colours a delta by whether it is good news, not by its direction", () => {
    const missed = overview.find((c) => c.label === "Missed Check-Ins");
    expect(missed?.delta).toEqual({
      change: "20%",
      direction: "down",
      good: true,
    });
  });
});

describe("truncateWords", () => {
  it("leaves text that is already short enough alone, and says so", () => {
    expect(truncateWords("Mary S.", 3)).toEqual({
      text: "Mary S.",
      truncated: false,
    });
  });

  it("clips to the word limit and flags that there is more", () => {
    expect(truncateWords("No symptoms reported. Weight steady.", 3)).toEqual({
      text: "No symptoms reported.…",
      truncated: true,
    });
  });

  it("does not clip text of exactly the limit", () => {
    expect(truncateWords("one two three", 3).truncated).toBe(false);
  });

  it("counts words, not spaces, so runs of whitespace do not fool it", () => {
    expect(truncateWords("  one   two   three   four ", 3)).toEqual({
      text: "one two three…",
      truncated: true,
    });
  });

  it("handles empty text without producing a lone ellipsis", () => {
    expect(truncateWords("", 3)).toEqual({ text: "", truncated: false });
  });

  it("gives every check-in note a preview short enough for the column", () => {
    for (const row of recentCheckIns) {
      const preview = truncateWords(row.notes, 3);
      expect(preview.text.split(/\s+/).length).toBeLessThanOrEqual(3);
    }
  });
});
