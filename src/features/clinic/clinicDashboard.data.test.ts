import { describe, expect, it } from "vitest";
import {
  curriculumLink,
  liveClassLink,
  memberLink,
  messageLink,
  STATUS_CARD_ORDER,
  statusCardLink,
  statusCardsFor,
  statusTone,
  upcomingFrom,
} from "./clinicDashboard.data";
import { classesOn, upcomingClasses } from "./liveClass.data";
import {
  needsAttention,
  rosterMemberFor,
  statusOptions,
  type ActivityEvent,
} from "./members.data";
import { rosterRows } from "./rosterTestData";
import { statusOptions as curriculumStatusOptions } from "./curriculumProgress.data";

const NOW = new Date("2026-11-03T12:00:00Z");
const roster = rosterRows().map((p) => rosterMemberFor(p, NOW));
const statusCards = statusCardsFor(roster);

describe("status cards (Phase 8: counted from the live roster)", () => {
  it("give every status a badge tone", () => {
    for (const card of statusCards)
      expect(statusTone[card.status]).toBeDefined();
  });

  it("count the roster, and show Attention Needed as no source (NEW-2)", () => {
    expect(statusCards.map((c) => [c.status, c.count])).toEqual([
      ["On Track", 1],
      ["Need Follow-Up", 1],
      ["Attention Needed", null],
      ["Not Started", 1],
      ["Completed", 1],
    ]);
    expect(statusCards[0].share).toBe("20%");
    expect(STATUS_CARD_ORDER).toHaveLength(5);
  });

  it("are all zero, never demo figures, for an empty office", () => {
    expect(statusCardsFor([]).map((c) => c.count)).toEqual([0, 0, null, 0, 0]);
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
  it("open the Member page on one member by patientId, never an MRN", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    expect(memberLink({ patientId: id })).toBe(
      `/dashboard/clinic/members?patient=${id}`,
    );
    expect(memberLink({})).toBe("/dashboard/clinic/members");
    expect(messageLink(id)).toBe(`/dashboard/clinic/messages?patient=${id}`);
    expect(curriculumLink({ patientId: id })).toBe(
      `/dashboard/clinic/curriculum-progress?patient=${id}#member-progress`,
    );
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
    expect(
      upcomingFrom(upcomingClasses, sept21)
        .slice(0, 3)
        .map((c) => c.date),
    ).toEqual(["2026-09-26", "2026-10-03", "2026-10-10"]);
  });

  it("keep a class later today", () => {
    const sept26Evening = new Date(2026, 8, 26, 17, 0);
    expect(upcomingFrom(upcomingClasses, sept26Evening)[0].date).toBe(
      "2026-09-26",
    );
  });

  it("come back empty once the schedule has passed", () => {
    expect(upcomingFrom(upcomingClasses, new Date(2027, 0, 1))).toEqual([]);
  });
});

describe("needs attention today", () => {
  const missed: ActivityEvent = {
    patientId: roster[1].id,
    name: roster[1].name,
    kind: "missed",
    text: "missed check-in",
    when: "Yesterday",
  };
  const items = needsAttention(roster, [missed]);

  it("lists every member whose status asks for it", () => {
    const flagged = roster.filter((m) =>
      ["Attention Needed", "Need Follow-Up", "Not Started"].includes(
        m.status ?? "",
      ),
    );
    for (const member of flagged)
      expect(items.some((i) => i.member.id === member.id)).toBe(true);
  });

  it("lists a member once, with a missed check-in first (matched by id)", () => {
    const blake = items.filter((i) => i.member.id === roster[1].id);
    expect(blake).toHaveLength(1);
    expect(blake[0].reasons[0]).toMatch(/^Missed check-in/);
    expect(blake[0].reasons).toHaveLength(2);
  });

  it("is empty when nobody needs anything", () => {
    const fine = roster.map((m) => ({ ...m, status: "On Track" as const }));
    expect(needsAttention(fine, [])).toEqual([]);
  });
});
