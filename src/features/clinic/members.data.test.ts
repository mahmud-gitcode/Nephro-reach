import { describe, expect, it } from "vitest";
import { patients } from "./enrollment.data";
import {
  availableSlots,
  countStatus,
  daysInactive,
  filterRoster,
  programBreakdown,
  roster,
  shareOf,
  withFollowUpRule,
} from "./members.data";

describe("the roster is the Enroll Patients roster", () => {
  it("has the same 23 people, with the same MRNs and programs", () => {
    expect(roster).toHaveLength(23);
    for (const member of roster) {
      const patient = patients.find((p) => p.mrn === member.mrn);
      expect(patient?.name).toBe(member.name);
      expect(patient?.program).toBe(member.program);
      expect(patient?.enrolledOn).toBe(member.enrolledOn);
    }
  });
});

/* Counted from the roster, and still landing on the client's figures. */
describe("the summary matches the client's figures", () => {
  it.each([
    ["On Track", 18, 78],
    ["Need Follow-Up", 3, 13],
    ["Attention Needed", 2, 9],
    ["Not Started", 0, 0],
  ] as const)("%s: %i (%i%%)", (status, count, pct) => {
    expect(countStatus(roster, status)).toBe(count);
    expect(shareOf(count)).toBe(pct);
  });

  it("leaves 7 of 30 slots", () => {
    expect(availableSlots).toBe(7);
  });

  it("splits 16 / 7 / 0 by program", () => {
    expect(programBreakdown.map((row) => row.value)).toEqual([16, 7, 0]);
  });
});

describe("the eight rows the client specified", () => {
  it.each([
    ["John D. Smith", "On Track", 75],
    ["Mary S. Johnson", "On Track", 60],
    ["Robert L. Davis", "Need Follow-Up", 40],
    ["Angela T. Brown", "On Track", 85],
    ["James K. Wilson", "Attention Needed", 20],
    ["Patricia M. Allen", "On Track", 100],
    ["David R. Carter", "Need Follow-Up", 55],
    ["Lisa W. Thomas", "On Track", 30],
  ] as const)("%s", (name, status, progress) => {
    const member = roster.find((m) => m.name === name);
    expect(member?.status).toBe(status);
    expect(member?.progress).toBe(progress);
  });

  it("gives Angela the details the mockup showed", () => {
    const angela = roster.find((m) => m.name === "Angela T. Brown")!;
    expect(angela.currentModule).toContain("Day 12 of 21");
    expect(angela.liveClasses).toEqual([2, 3]);
    expect(angela.checkIns).toEqual([3, 3]);
    expect(angela.questions).toEqual({ total: 1, open: 0 });
  });
});

describe("filtering", () => {
  it("finds a member by MRN", () => {
    expect(filterRoster(roster, { query: "901234" })[0].name).toBe(
      "Angela T. Brown",
    );
  });

  it("narrows by status", () => {
    const rows = filterRoster(roster, { status: "Attention Needed" });
    expect(rows.map((m) => m.name)).toEqual([
      "James K. Wilson",
      "Robert Turner",
    ]);
  });
});

describe("the 3-day follow-up rule", () => {
  const base = {
    status: "On Track" as const,
    progress: 50,
    lastSeen: "",
    liveClasses: [1, 3] as [number, number],
    checkIns: [1, 3] as [number, number],
    questions: { total: 0, open: 0 },
  };

  it("reads how long a member has been quiet", () => {
    expect(daysInactive("Today")).toBe(0);
    expect(daysInactive("1 day ago")).toBe(1);
    expect(daysInactive("6 days ago")).toBe(6);
    expect(daysInactive("1 week ago")).toBe(7);
    expect(daysInactive("No activity yet")).toBeNull();
  });

  it("flags On Track members after 3 days without activity", () => {
    expect(
      withFollowUpRule({ ...base, lastActivity: "2 days ago" }).status,
    ).toBe("On Track");
    expect(
      withFollowUpRule({ ...base, lastActivity: "3 days ago" }).status,
    ).toBe("Need Follow-Up");
    expect(
      withFollowUpRule({
        ...base,
        status: "Attention Needed",
        lastActivity: "5 days ago",
      }).status,
    ).toBe("Attention Needed");
  });

  it("leaves no quiet member on track in the roster", () => {
    for (const member of roster) {
      const days = daysInactive(member.lastActivity);
      if (days !== null && days >= 3) {
        expect(member.status).not.toBe("On Track");
      }
    }
  });
});
