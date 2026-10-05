import { describe, expect, it } from "vitest";
import {
  ACTIVITY_TYPES,
  ALERT_ACTIVITY,
  CCM_PATIENTS,
  CCM_REQUIREMENTS,
  CCM_THRESHOLD_MINUTES,
  addActivity,
  ageOn,
  completeFollowUp,
  countStatus,
  dayKey,
  durationMinutes,
  filterWorklist,
  followUpsDue,
  minutesFor,
  monthOf,
  pendingMinutesFor,
  recentMonths,
  requirementsMet,
  resolveInbox,
  seedCcmState,
  setRequirement,
  sortWorklist,
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
    [30, "Ready for Review"],
    [45, "Ready for Review"],
  ] as const)("%i minutes is %s", (minutes, status) => {
    expect(statusFor(minutes, false)).toBe(status);
  });

  it("needs attention outranks the minutes", () => {
    expect(statusFor(45, true)).toBe("Action Needed");
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
      counts: "yes" as const,
      ehrDocumented: true,
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

  it("counts only the minutes marked to include", () => {
    const state: CcmState = { activities: [], requirements: {}, inbox: [] };
    const base = {
      mrn: "1",
      type: "BP Review & Follow-Up",
      note: "",
      outcome: "Continue monitoring",
      staff: "Nurse Lisa, RN",
      date: "2026-09-02",
      ehrDocumented: false,
    };
    let next = addActivity(state, { ...base, minutes: 12, counts: "yes" }, 1);
    next = addActivity(next, { ...base, minutes: 8, counts: "pending" }, 2);
    next = addActivity(next, { ...base, minutes: 5, counts: "no" }, 3);
    expect(minutesFor(next, "1", "2026-09")).toBe(12);
    expect(pendingMinutesFor(next, "1", "2026-09")).toBe(8);
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
      countStatus(rows, "Action Needed") +
        countStatus(rows, "Below Threshold") +
        countStatus(rows, "Ready for Review"),
    ).toBe(rows.length);
  });

  it("never logs activity after today", () => {
    expect(state.activities.every((a) => a.date <= TODAY)).toBe(true);
  });

  it("flags an open alert and an overdue follow-up as needing attention", () => {
    const angela = rows.find((row) => row.mrn === "901234")!;
    expect(angela.openAlerts).toBeGreaterThan(0);
    expect(angela.status).toBe("Action Needed");

    const david = rows.find((row) => row.mrn === "890123")!;
    expect(david.overdue).toBe(1);
    expect(david.status).toBe("Action Needed");
  });

  it("judges a past month on its minutes alone", () => {
    const past = worklist(state, CCM_PATIENTS, "2026-08", TODAY);
    expect(past.some((row) => row.status === "Action Needed")).toBe(false);
  });

  it("shows what is left under the threshold", () => {
    const mary = rows.find((row) => row.mrn === "789012")!;
    /* 28 logged, but 14 of them wait on the practice's review. */
    expect(mary.minutes).toBe(14);
    expect(pendingMinutesFor(state, "789012", MONTH)).toBe(14);
    expect(mary.remaining).toBe(16);
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
    ).not.toBe("Action Needed");
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

describe("worklist filters and sorting", () => {
  const rows = worklist(seedCcmState(NOW), CCM_PATIENTS, MONTH, TODAY);

  it("filters by location", () => {
    const north = filterWorklist(rows, {
      query: "",
      provider: "All",
      location: "North Clinic",
      careManager: "All",
      status: "All",
    });
    expect(north.length).toBeGreaterThan(0);
    expect(north.every((row) => row.location === "North Clinic")).toBe(true);
  });

  it("sorts by next follow-up with patients who have none last", () => {
    const sorted = sortWorklist(rows, {
      key: "nextFollowUp",
      direction: "asc",
    });
    const dates = sorted.map((row) => row.nextFollowUp);
    const firstNone = dates.indexOf(null);
    expect(firstNone).toBeGreaterThan(0);
    expect(dates.slice(firstNone).every((d) => d === null)).toBe(true);
    const set = dates.slice(0, firstNone) as string[];
    expect([...set].sort()).toEqual(set);
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
  it("are the client's sixteen plus the six access / KRT planning steps", () => {
    expect(ACTIVITY_TYPES).toHaveLength(22);
    expect(ACTIVITY_TYPES).toContain("Vascular Access Referral");
    expect(ACTIVITY_TYPES.at(-1)).toBe("Other CCM Activity");
    const types: readonly string[] = ACTIVITY_TYPES;
    expect(
      seedCcmState(NOW).activities.every((a) => types.includes(a.type)),
    ).toBe(true);
  });
});

describe("alerts and the activity they are logged under", () => {
  it("points every alert kind at a type from the client's dropdown", () => {
    for (const type of Object.values(ALERT_ACTIVITY)) {
      expect(ACTIVITY_TYPES).toContain(type);
    }
    expect(ALERT_ACTIVITY["Blood pressure"]).toBe("BP Review & Follow-Up");
    expect(ALERT_ACTIVITY["Weight change"]).toBe(
      "Weight / Fluid Review & Follow-Up",
    );
    expect(ALERT_ACTIVITY["Missed appointment"]).toBe(
      "Appointment Coordination",
    );
  });
});
