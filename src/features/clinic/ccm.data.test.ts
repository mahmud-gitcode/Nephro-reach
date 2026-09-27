import { describe, expect, it } from "vitest";
import {
  ACTIVITY_TYPES,
  CCM_PATIENTS,
  CCM_REQUIREMENTS,
  CCM_THRESHOLD_MINUTES,
  addActivity,
  ageOn,
  completeFollowUp,
  countStatus,
  dayKey,
  durationMinutes,
  followUpsDue,
  minutesFor,
  monthOf,
  recentMonths,
  requirementsMet,
  resolveInbox,
  seedCcmState,
  setRequirement,
  statusFor,
  worklist,
  worklistCsv,
  type CcmState,
} from "./ccm.data";

const NOW = new Date(2026, 8, 27, 12).getTime(); // Sep 27, 2026
const TODAY = dayKey(NOW);
const MONTH = monthOf(TODAY);

describe("the threshold is 30 minutes", () => {
  it("is 30, not the mockup's 20", () => {
    expect(CCM_THRESHOLD_MINUTES).toBe(30);
  });

  it.each([
    [0, "Below Threshold"],
    [20, "Below Threshold"],
    [29, "Below Threshold"],
    [30, "Threshold Reached"],
    [45, "Threshold Reached"],
  ] as const)("%i minutes is %s", (minutes, status) => {
    expect(statusFor(minutes, false)).toBe(status);
  });

  it("needs attention outranks the minutes", () => {
    expect(statusFor(45, true)).toBe("Needs Attention");
  });
});

describe("time", () => {
  it("measures a start and end time", () => {
    expect(durationMinutes("10:05", "10:13")).toBe(8);
    expect(durationMinutes("10:13", "10:05")).toBe(0);
    expect(durationMinutes("", "10:05")).toBe(0);
  });

  it("sums a patient's minutes within the month only", () => {
    const state: CcmState = { activities: [], requirements: {}, inbox: [] };
    const base = {
      mrn: "1",
      type: "BP Review & Follow-Up",
      note: "x",
      outcome: "Continue monitoring",
      staff: "Nurse Lisa, RN",
    };
    let next = addActivity(
      state,
      { ...base, date: "2026-09-02", minutes: 12 },
      1,
    );
    next = addActivity(next, { ...base, date: "2026-09-20", minutes: 10 }, 2);
    next = addActivity(next, { ...base, date: "2026-08-30", minutes: 40 }, 3);
    expect(minutesFor(next, "1", "2026-09")).toBe(22);
    expect(minutesFor(next, "1", "2026-08")).toBe(40);
  });

  it("offers the current month and the two before it", () => {
    expect(recentMonths(NOW)).toEqual(["2026-09", "2026-08", "2026-07"]);
  });

  it("works out age from the date of birth", () => {
    expect(ageOn("1953-04-12", "2026-09-27")).toBe(73);
    expect(ageOn("1953-10-12", "2026-09-27")).toBe(72);
  });
});

describe("the seeded worklist", () => {
  const state = seedCcmState(NOW);
  const rows = worklist(state, CCM_PATIENTS, MONTH, TODAY);

  it("lists every CCM patient, and the statuses add up to the total", () => {
    expect(rows).toHaveLength(CCM_PATIENTS.length);
    expect(
      countStatus(rows, "Needs Attention") +
        countStatus(rows, "Below Threshold") +
        countStatus(rows, "Threshold Reached"),
    ).toBe(rows.length);
  });

  it("never logs activity after today", () => {
    expect(state.activities.every((a) => a.date <= TODAY)).toBe(true);
  });

  it("flags an open alert and an overdue follow-up as needing attention", () => {
    const angela = rows.find((row) => row.mrn === "901234")!;
    expect(angela.openAlerts).toBeGreaterThan(0);
    expect(angela.status).toBe("Needs Attention");

    const david = rows.find((row) => row.mrn === "890123")!;
    expect(david.overdue).toBe(1);
    expect(david.status).toBe("Needs Attention");
  });

  it("judges a past month on its minutes alone", () => {
    const past = worklist(state, CCM_PATIENTS, "2026-08", TODAY);
    expect(past.some((row) => row.status === "Needs Attention")).toBe(false);
  });

  it("shows what is left under the threshold", () => {
    const mary = rows.find((row) => row.mrn === "789012")!;
    expect(mary.minutes).toBe(28);
    expect(mary.remaining).toBe(2);
  });

  it("clears attention once the alert is resolved and follow-up done", () => {
    const overdue = state.activities.find(
      (a) => a.mrn === "890123" && a.followUp,
    )!;
    const next = completeFollowUp(state, overdue.id);
    const david = worklist(next, CCM_PATIENTS, MONTH, TODAY).find(
      (row) => row.mrn === "890123",
    )!;
    expect(david.status).toBe("Below Threshold");

    const alert = state.inbox.find((item) => item.mrn === "901234")!;
    const cleared = resolveInbox(state, alert.id);
    expect(
      worklist(cleared, CCM_PATIENTS, MONTH, TODAY).find(
        (r) => r.mrn === "901234",
      )!.status,
    ).not.toBe("Needs Attention");
  });

  it("lists follow-ups due within a week, overdue first", () => {
    const due = followUpsDue(state, TODAY);
    expect(due.length).toBeGreaterThan(0);
    expect(due[0].followUp.date < TODAY).toBe(true);
  });

  it("exports one CSV line per row plus a header", () => {
    const csv = worklistCsv(rows, MONTH).split("\n");
    expect(csv).toHaveLength(rows.length + 1);
    expect(csv[0]).toContain("Minutes");
  });
});

describe("requirements", () => {
  it("counts the ones checked off", () => {
    const state: CcmState = { activities: [], requirements: {}, inbox: [] };
    expect(requirementsMet(state, "1")).toBe(0);
    const next = setRequirement(state, "1", "consent", { met: true });
    expect(requirementsMet(next, "1")).toBe(1);
    expect(CCM_REQUIREMENTS).toHaveLength(8);
  });
});

describe("activity types", () => {
  it("are the client's sixteen, and every seeded activity uses one", () => {
    expect(ACTIVITY_TYPES).toHaveLength(16);
    const types: readonly string[] = ACTIVITY_TYPES;
    expect(
      seedCcmState(NOW).activities.every((a) => types.includes(a.type)),
    ).toBe(true);
  });
});
