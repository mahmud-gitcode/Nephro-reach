import { describe, expect, it } from "vitest";
import {
  countStatus,
  daysInactive,
  FOLLOW_UP_AFTER_DAYS,
  filterRoster,
  memberStatusFor,
  needsAttention,
  programBreakdownOf,
  recentActivity,
  rosterMemberFor,
} from "./members.data";
import * as data from "./members.data";
import { rosterRows } from "./rosterTestData";

const NOW = new Date("2026-11-03T12:00:00Z");
const roster = rosterRows().map((p) => rosterMemberFor(p, NOW));
const byName = (name: string) => roster.find((m) => m.name === name)!;

describe("rows come from the API roster (Phase 8)", () => {
  it("ships no demo tracking table, roster or activity", () => {
    expect("roster" in data).toBe(false);
    expect(recentActivity).toEqual([]);
  });

  it("keys every member by patientId, never by MRN", () => {
    for (const member of roster) expect(member.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(byName("Devon Example").mrn).toBe("");
  });
});

describe("what is derived and what is not (NEW-2)", () => {
  it("shows no live classes, check-ins or questions: there is no source", () => {
    for (const member of roster) {
      expect(member.liveClasses).toBeNull();
      expect(member.checkIns).toBeNull();
      expect(member.questions).toBeNull();
    }
  });

  it("has no status for a patient in no program", () => {
    expect(byName("Devon Example").status).toBeNull();
  });

  it("reads Not Started and Completed from the course progress", () => {
    expect(byName("Casey Synthetic").status).toBe("Not Started");
    expect(byName("Emery Fixture").status).toBe("Completed");
  });

  it("never invents Attention Needed", () => {
    expect(countStatus(roster, "Attention Needed")).toBe(0);
  });

  it("shows progress and classes from the server", () => {
    expect(byName("Avery Testpatient").progress).toBe(40);
    expect(byName("Avery Testpatient").currentModule).toBe("8 of 21 classes");
  });
});

describe(`the ${FOLLOW_UP_AFTER_DAYS}-day follow-up rule (client, 2026-10-18)`, () => {
  it("reads how long a member has been quiet", () => {
    expect(daysInactive("Today")).toBe(0);
    expect(daysInactive("6 days ago")).toBe(6);
    expect(daysInactive("2 weeks ago")).toBe(14);
    expect(daysInactive("No activity yet")).toBeNull();
  });

  it("keeps a member active today on track", () => {
    expect(byName("Avery Testpatient").status).toBe("On Track");
  });

  it("flags an in-progress member quiet for 3 days or more", () => {
    expect(byName("Blake Sample").status).toBe("Need Follow-Up");
    const base = {
      programSlug: "journey-21-day",
      progressStatus: "in-progress",
    };
    expect(
      memberStatusFor({ ...base, lastActivityAt: "2026-10-31T12:00:00Z" }, NOW),
    ).toBe("Need Follow-Up");
    expect(
      memberStatusFor({ ...base, lastActivityAt: "2026-11-01T12:00:00Z" }, NOW),
    ).toBe("On Track");
  });
});

describe("filtering and charts", () => {
  it("finds a member by MRN or name", () => {
    expect(filterRoster(roster, { query: "900003" })).toHaveLength(1);
    expect(filterRoster(roster, { query: "blake" })).toHaveLength(1);
  });

  it("narrows by status", () => {
    expect(
      filterRoster(roster, { status: "Need Follow-Up" }).map((m) => m.name),
    ).toEqual(["Blake Sample"]);
  });

  it("splits by program", () => {
    expect(programBreakdownOf(roster).map((s) => s.value)).toEqual([3, 1, 1]);
  });

  it("lists who needs attention, once each, by patientId", () => {
    const items = needsAttention(roster, []);
    expect(items.map((i) => i.member.name)).toEqual([
      "Blake Sample",
      "Casey Synthetic",
    ]);
  });
});
