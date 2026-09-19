import { describe, expect, it } from "vitest";
import {
  adherenceByDay,
  bandFor,
  findMood,
  formatStamp,
  needsRefill,
  refillCount,
  reportedSideEffectCount,
  setDoseStatus,
  setRefill,
  setSideEffect,
  sideEffectOf,
  shiftDay,
  statusOf,
  summariseAdherence,
  todayIso,
  upsertMood,
} from "./medicationLog.rules";
import type {
  DoseRecord,
  MoodEntry,
  SideEffectRecord,
} from "./medicationLog.types";

/* The adherence tracker on this page used to be a fixed 86% next to a fixed
 * 50/30/20 ring. Now it is arithmetic on what the member tapped, which means
 * the arithmetic has to be right — and "right" here mostly means not telling
 * someone they missed doses they did not miss. */

const NOW = new Date(2026, 8, 15, 9, 0, 0); // Tue 15 Sep 2026, local

function dose(
  date: string,
  medication: string,
  time: string,
  status: DoseRecord["status"],
): DoseRecord {
  return { date, medication, time, status, stampedAt: NOW.toISOString() };
}

describe("dose status", () => {
  it("is pending until the member says otherwise", () => {
    expect(statusOf([], "2026-09-15", "Norvasc", "07:40 am")).toBe("pending");
  });

  it("stamps the moment the status was set", () => {
    const doses = setDoseStatus(
      [],
      "2026-09-15",
      "Norvasc",
      "07:40 am",
      "taken",
      NOW,
    );
    expect(doses).toHaveLength(1);
    expect(doses[0].stampedAt).toBe(NOW.toISOString());
  });

  it("replaces a status rather than stacking a second one on the dose", () => {
    let doses = setDoseStatus(
      [],
      "2026-09-15",
      "Norvasc",
      "07:40 am",
      "taken",
      NOW,
    );
    doses = setDoseStatus(
      doses,
      "2026-09-15",
      "Norvasc",
      "07:40 am",
      "late",
      NOW,
    );
    expect(doses).toHaveLength(1);
    expect(doses[0].status).toBe("late");
  });

  it("clears the stamp when a status is taken back to pending", () => {
    // Otherwise the table shows a time beside a dose nobody has decided on.
    let doses = setDoseStatus(
      [],
      "2026-09-15",
      "Norvasc",
      "07:40 am",
      "taken",
      NOW,
    );
    doses = setDoseStatus(
      doses,
      "2026-09-15",
      "Norvasc",
      "07:40 am",
      "pending",
      NOW,
    );
    expect(doses).toHaveLength(0);
  });

  it("keeps the same medication at two times apart", () => {
    // Norvasc appears twice in the schedule; one tap must not set both.
    let doses = setDoseStatus(
      [],
      "2026-09-15",
      "Norvasc",
      "07:40 am",
      "taken",
      NOW,
    );
    doses = setDoseStatus(
      doses,
      "2026-09-15",
      "Norvasc",
      "01:09 am",
      "missed",
      NOW,
    );
    expect(doses).toHaveLength(2);
    expect(statusOf(doses, "2026-09-15", "Norvasc", "07:40 am")).toBe("taken");
    expect(statusOf(doses, "2026-09-15", "Norvasc", "01:09 am")).toBe("missed");
  });

  it("keeps the same dose on two days apart", () => {
    let doses = setDoseStatus(
      [],
      "2026-09-15",
      "Norvasc",
      "07:40 am",
      "taken",
      NOW,
    );
    doses = setDoseStatus(
      doses,
      "2026-09-14",
      "Norvasc",
      "07:40 am",
      "missed",
      NOW,
    );
    expect(doses).toHaveLength(2);
  });

  it("shows no stamp at all rather than an invented one", () => {
    expect(formatStamp(undefined, false)).toBeNull();
    expect(formatStamp("not a date", false)).toBeNull();
  });
});

describe("adherence", () => {
  it("says nothing when nothing has been decided", () => {
    // A member who has not opened the page has not missed anything, and 0%
    // would be an accusation rather than a figure.
    const summary = summariseAdherence([], 6);
    expect(summary.percent).toBeNull();
    expect(summary.band).toBeNull();
    expect(summary.pending).toBe(6);
  });

  it("counts a late dose as taken, not as a miss", () => {
    // Otherwise a member who took every dose an hour late is told they
    // adhered to none of them.
    const summary = summariseAdherence(
      [
        dose("2026-09-15", "A", "08:00 am", "taken"),
        dose("2026-09-15", "B", "12:00 pm", "late"),
      ],
      2,
    );
    expect(summary.percent).toBe(100);
    expect(summary.late).toBe(1);
  });

  it("does not let pending doses drag the percentage down", () => {
    // Four doses a day, one taken so far this morning: that is 100% of what
    // has been decided, not 25%.
    const summary = summariseAdherence(
      [dose("2026-09-15", "A", "08:00 am", "taken")],
      4,
    );
    expect(summary.percent).toBe(100);
    expect(summary.pending).toBe(3);
  });

  it("counts misses against the total", () => {
    const summary = summariseAdherence(
      [
        dose("2026-09-15", "A", "08:00 am", "taken"),
        dose("2026-09-15", "B", "12:00 pm", "missed"),
        dose("2026-09-15", "C", "06:00 pm", "missed"),
        dose("2026-09-15", "D", "10:00 pm", "taken"),
      ],
      4,
    );
    expect(summary.percent).toBe(50);
    expect(summary.band).toBe("poor");
  });

  it("bands at 90 and 70, the green and yellow lines", () => {
    expect(bandFor(100)).toBe("good");
    expect(bandFor(90)).toBe("good");
    expect(bandFor(89)).toBe("fair");
    expect(bandFor(70)).toBe("fair");
    expect(bandFor(69)).toBe("poor");
  });

  it("gives seven days oldest first, with unlogged days left blank", () => {
    const week = adherenceByDay(
      [dose("2026-09-15", "A", "08:00 am", "taken")],
      2,
      7,
      NOW,
    );
    expect(week).toHaveLength(7);
    expect(week[6].date).toBe("2026-09-15");
    expect(week[6].summary.percent).toBe(100);
    // A day nobody logged is null, not zero — blank, not red.
    expect(week[0].summary.percent).toBeNull();
  });
});

describe("dates", () => {
  it("reads today in the member's own timezone", () => {
    expect(todayIso(new Date(2026, 8, 15, 22, 30))).toBe("2026-09-15");
  });

  it("steps a day back and forward across a month boundary", () => {
    expect(shiftDay("2026-09-01", -1)).toBe("2026-08-31");
    expect(shiftDay("2026-08-31", 1)).toBe("2026-09-01");
  });
});

describe("refills", () => {
  it("is off until the member says they are low", () => {
    expect(needsRefill({}, "Norvasc")).toBe(false);
    expect(needsRefill(setRefill({}, "Norvasc", true), "Norvasc")).toBe(true);
  });

  it("counts only the ones still flagged", () => {
    let flags = setRefill({}, "Norvasc", true);
    flags = setRefill(flags, "Sevelamer", true);
    expect(refillCount(flags)).toBe(2);

    flags = setRefill(flags, "Norvasc", false);
    expect(refillCount(flags)).toBe(1);
  });
});

describe("the mood log", () => {
  const entry = (date: string, mood: number, notes = ""): MoodEntry => ({
    date,
    mood,
    notes,
    savedAt: NOW.toISOString(),
  });

  it("keeps one entry per day, editing rather than stacking", () => {
    let entries = upsertMood([], entry("2026-09-15", 1, "Tired."));
    entries = upsertMood(entries, entry("2026-09-15", 3, "Much worse by 6pm."));

    expect(entries).toHaveLength(1);
    expect(entries[0].mood).toBe(3);
    expect(entries[0].notes).toBe("Much worse by 6pm.");
  });

  it("finds today's entry so the form reopens with it", () => {
    const entries = upsertMood([], entry("2026-09-15", 2, "Fine."));
    expect(findMood(entries, "2026-09-15")?.notes).toBe("Fine.");
    expect(findMood(entries, "2026-09-14")).toBeUndefined();
  });

  it("keeps the newest day first", () => {
    let entries = upsertMood([], entry("2026-09-13", 1));
    entries = upsertMood(entries, entry("2026-09-15", 1));
    entries = upsertMood(entries, entry("2026-09-14", 1));
    expect(entries.map((item) => item.date)).toEqual([
      "2026-09-15",
      "2026-09-14",
      "2026-09-13",
    ]);
  });
});

describe("side effects", () => {
  const record = (patch: Partial<SideEffectRecord> = {}): SideEffectRecord => ({
    date: "2026-09-17",
    time: "07:40 am",
    medication: "Norvasc",
    effect: "fatigue",
    savedAt: "2026-09-17T08:00:00.000Z",
    ...patch,
  });

  const now = new Date("2026-09-17T09:00:00.000Z");

  it("reads back what was recorded against one dose", () => {
    const records = setSideEffect(
      [],
      "2026-09-17",
      "Norvasc",
      "07:40 am",
      "fatigue",
      now,
    );
    expect(sideEffectOf(records, "2026-09-17", "Norvasc", "07:40 am")).toBe(
      "fatigue",
    );
  });

  it("answers null for a dose nobody has answered for", () => {
    // Not the same as "none": an unanswered dose must never read as a dose
    // that went fine.
    expect(sideEffectOf([], "2026-09-17", "Norvasc", "07:40 am")).toBeNull();
  });

  it("keeps doses apart by time, medication and day", () => {
    const records = [record()];
    expect(
      sideEffectOf(records, "2026-09-17", "Norvasc", "09:00 pm"),
    ).toBeNull();
    expect(sideEffectOf(records, "2026-09-17", "Lasix", "07:40 am")).toBeNull();
    expect(
      sideEffectOf(records, "2026-09-18", "Norvasc", "07:40 am"),
    ).toBeNull();
  });

  it("replaces rather than stacks when changed", () => {
    let records = setSideEffect(
      [],
      "2026-09-17",
      "Norvasc",
      "07:40 am",
      "fatigue",
      now,
    );
    records = setSideEffect(
      records,
      "2026-09-17",
      "Norvasc",
      "07:40 am",
      "nausea",
      now,
    );
    expect(records).toHaveLength(1);
    expect(records[0].effect).toBe("nausea");
  });

  it("clears back to unrecorded rather than storing a blank", () => {
    const records = setSideEffect(
      [record()],
      "2026-09-17",
      "Norvasc",
      "07:40 am",
      null,
      now,
    );
    expect(records).toHaveLength(0);
  });

  it("counts reported symptoms for the day, but not 'none'", () => {
    // The notice this drives says the page will not pass anything to the
    // care team, so it should only appear when there is something to pass.
    const records = [
      record({ effect: "fatigue" }),
      record({ time: "09:00 pm", effect: "none" }),
      record({ time: "01:00 pm", effect: "nausea" }),
      record({ date: "2026-09-18", effect: "rash" }),
    ];
    expect(reportedSideEffectCount(records, "2026-09-17")).toBe(2);
  });

  it("survives the dose status being set back to pending", () => {
    // The reason these are a separate record: setDoseStatus deletes the
    // dose row on "pending", and a member changing their mind about
    // whether they took it must not erase what it did to them.
    const effects = [record()];
    const doses = setDoseStatus(
      [],
      "2026-09-17",
      "Norvasc",
      "07:40 am",
      "pending",
    );
    expect(doses).toHaveLength(0);
    expect(sideEffectOf(effects, "2026-09-17", "Norvasc", "07:40 am")).toBe(
      "fatigue",
    );
  });
});
