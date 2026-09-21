import { describe, expect, it } from "vitest";
import {
  curriculumLink,
  enrollment,
  liveClassLink,
  memberLink,
  statusCardLink,
  statusCards,
  statusTone,
  upcomingFrom,
} from "./clinicDashboard.data";
import { patients } from "./enrollment.data";
import { classesOn, upcomingClasses } from "./liveClass.data";
import {
  needsAttention,
  recentActivity,
  roster,
  statusOptions,
} from "./members.data";
import { statusOptions as curriculumStatusOptions } from "./curriculumProgress.data";

describe("enrollment", () => {
  it("is counted from the Enroll Patients roster", () => {
    expect(enrollment.enrolled).toBe(patients.length);
    expect(enrollment.contracted).toBe(30);
    expect(enrollment.remaining).toBe(7);
  });
});

describe("status cards", () => {
  it("give every status a badge tone", () => {
    for (const card of statusCards)
      expect(statusTone[card.status]).toBeDefined();
  });

  it("link to a filter the destination page actually has", () => {
    for (const card of statusCards) {
      const url = new URL(statusCardLink(card.status), "http://x");
      const status = url.searchParams.get("status")!;
      const options = url.pathname.endsWith("/members")
        ? statusOptions
        : curriculumStatusOptions;
      expect(options).toContain(status);
    }
  });

  it("send Completed to Curriculum Progress, the rest to the Member page", () => {
    expect(statusCardLink("Completed")).toBe(
      "/dashboard/clinic/curriculum-progress?status=Completed#member-progress",
    );
    expect(statusCardLink("Need Follow-Up")).toBe(
      "/dashboard/clinic/members?status=Need+Follow-Up",
    );
  });
});

describe("links", () => {
  it("open the Member page on one member", () => {
    expect(memberLink({ mrn: "567890" })).toBe(
      "/dashboard/clinic/members?mrn=567890",
    );
    expect(memberLink({})).toBe("/dashboard/clinic/members");
  });

  it("scroll Curriculum Progress to its table", () => {
    expect(curriculumLink({})).toBe(
      "/dashboard/clinic/curriculum-progress#member-progress",
    );
  });

  it("open Live Class on a day that has a class", () => {
    for (const item of upcomingClasses) {
      expect(liveClassLink(item.date)).toBe(
        `/dashboard/clinic/live-class?date=${item.date}`,
      );
      const [y, m, d] = item.date.split("-").map(Number);
      expect(classesOn(y, m - 1, d)).toHaveLength(1);
    }
  });
});

describe("upcoming classes", () => {
  it("drop classes that have already happened", () => {
    const sept21 = new Date(2026, 8, 21, 15, 0);
    expect(upcomingFrom(upcomingClasses, sept21).map((c) => c.date)).toEqual([
      "2026-09-26",
      "2026-10-03",
      "2026-10-10",
    ]);
  });

  it("keep a class later today", () => {
    const sept26Evening = new Date(2026, 8, 26, 17, 0);
    expect(upcomingFrom(upcomingClasses, sept26Evening)[0].date).toBe(
      "2026-09-26",
    );
  });

  it("come back empty once the schedule has passed", () => {
    expect(upcomingFrom(upcomingClasses, new Date(2026, 10, 1))).toEqual([]);
  });
});

describe("needs attention today", () => {
  const items = needsAttention(roster, recentActivity);

  it("lists every member whose status asks for it", () => {
    const flagged = roster.filter((m) =>
      ["Attention Needed", "Need Follow-Up", "Not Started"].includes(m.status),
    );
    for (const member of flagged)
      expect(items.some((i) => i.member.mrn === member.mrn)).toBe(true);
  });

  it("lists James once, with his missed check-in first", () => {
    const james = items.filter((i) => i.member.name === "James K. Wilson");
    expect(james).toHaveLength(1);
    expect(james[0].reasons[0]).toMatch(/^Missed check-in/);
    expect(james[0].reasons).toHaveLength(2);
  });

  it("puts Attention Needed first and Need Follow-Up after", () => {
    const statuses = items.map((i) => i.member.status);
    const lastUrgent = statuses.lastIndexOf("Attention Needed");
    const firstFollowUp = statuses.indexOf("Need Follow-Up");
    expect(lastUrgent).toBeLessThan(firstFollowUp);
  });

  it("is empty when nobody needs anything", () => {
    const fine = roster.map((m) => ({ ...m, status: "On Track" as const }));
    expect(needsAttention(fine, [])).toEqual([]);
  });
});
