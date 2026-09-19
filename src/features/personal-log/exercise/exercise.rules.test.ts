import { describe, expect, it } from "vitest";
import {
  activityLabel,
  dayTotals,
  defaultUnit,
  emptyDraft,
  entriesOn,
  estimateCalories,
  exerciseError,
  lowestFeeling,
  minutesOn,
  formatAmount,
  removeEntry,
  upsertEntry,
} from "./exercise.rules";
import type { ExerciseEntry } from "./exercise.types";

const entry = (patch: Partial<ExerciseEntry>): ExerciseEntry => ({
  id: "e1",
  date: "2026-09-17",
  activity: "walking",
  customName: "",
  amount: 2000,
  unit: "steps",
  intensity: "light",
  feeling: null,
  note: "",
  savedAt: "2026-09-17T08:00:00.000Z",
  ...patch,
});

const now = new Date(2026, 8, 17, 12);

describe("exerciseError", () => {
  it("accepts 2,000 steps today", () => {
    expect(exerciseError(emptyDraftWith(2000), "2026-09-17", now)).toBeNull();
  });

  it("needs an amount", () => {
    expect(exerciseError(emptyDraftWith(0), "2026-09-17", now)).toBe(
      "missing-amount",
    );
  });

  it("needs a name for other", () => {
    const draft = { ...emptyDraft("other"), amount: 5 };
    expect(exerciseError(draft, "2026-09-17", now)).toBe("missing-name");
    expect(
      exerciseError({ ...draft, customName: "Dancing" }, "2026-09-17", now),
    ).toBeNull();
  });

  it("refuses a future day", () => {
    expect(exerciseError(emptyDraftWith(10), "2026-09-18", now)).toBe(
      "future-date",
    );
  });
});

function emptyDraftWith(amount: number) {
  return { ...emptyDraft("walking"), amount };
}

describe("units", () => {
  it("brings the usual unit with each activity", () => {
    expect(defaultUnit("walking")).toBe("steps");
    expect(defaultUnit("push-ups")).toBe("reps");
    expect(defaultUnit("yoga")).toBe("minutes");
  });

  it("reads back the way a member says it", () => {
    expect(formatAmount(2000, "steps", false)).toBe("2,000 steps");
    expect(formatAmount(10, "reps", false)).toBe("10 times");
    expect(formatAmount(10, "reps", true)).toBe("10 veces");
  });
});

describe("activityLabel", () => {
  it("uses the typed name for other", () => {
    expect(
      activityLabel({ activity: "other", customName: " Dancing " }, false),
    ).toBe("Dancing");
  });
  it("translates presets", () => {
    expect(activityLabel({ activity: "push-ups", customName: "" }, true)).toBe(
      "Flexiones",
    );
  });
});

describe("list edits", () => {
  const list = [
    entry({ id: "a", savedAt: "2026-09-17T10:00:00.000Z" }),
    entry({ id: "b", savedAt: "2026-09-17T08:00:00.000Z" }),
    entry({ id: "c", date: "2026-09-16" }),
  ];

  it("shows one day in the order it was logged", () => {
    expect(entriesOn(list, "2026-09-17").map((e) => e.id)).toEqual(["b", "a"]);
  });

  it("edits in place rather than adding a copy", () => {
    const next = upsertEntry(list, { ...list[0], amount: 3000 });
    expect(next).toHaveLength(3);
    expect(next[0].amount).toBe(3000);
  });

  it("removes by id", () => {
    expect(removeEntry(list, "b").map((e) => e.id)).toEqual(["a", "c"]);
  });
});

describe("dayTotals", () => {
  it("sums the same activity and unit, keeps different units apart", () => {
    const totals = dayTotals(
      [
        entry({ id: "1", amount: 2000 }),
        entry({ id: "2", amount: 1500 }),
        entry({ id: "3", amount: 20, unit: "minutes" }),
        entry({ id: "4", activity: "push-ups", amount: 10, unit: "reps" }),
      ],
      false,
    );
    expect(totals.map((t) => `${t.label}:${t.amount}:${t.unit}`)).toEqual([
      "Walking:3500:steps",
      "Walking:20:minutes",
      "Push-ups:10:reps",
    ]);
  });
});

describe("the day read back", () => {
  const day = [
    entry({ id: "a", amount: 15, unit: "minutes", intensity: "light" }),
    entry({
      id: "b",
      amount: 20,
      unit: "minutes",
      intensity: "moderate",
      feeling: "tired",
    }),
    /* Steps are a real log but not a duration. */
    entry({ id: "c", amount: 2000, unit: "steps", feeling: "good" }),
  ];

  it("sums only what was counted in minutes", () => {
    expect(minutesOn(day)).toBe(35);
  });

  it("estimates calories from duration and intensity", () => {
    // 15 light (4/min) + 20 moderate (6/min); the steps entry adds nothing.
    expect(estimateCalories(day)).toBe(180);
  });

  it("reports the lowest feeling, not the most common", () => {
    expect(lowestFeeling(day)).toBe("tired");
  });

  it("has no feeling to report when none was answered", () => {
    expect(lowestFeeling([entry({ feeling: null })])).toBeNull();
  });
});
