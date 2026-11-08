import { describe, expect, it } from "vitest";
import {
  ALL_PROGRAMS,
  COURSES,
  courseFor,
  CRASH,
  curriculumRowFor,
  filterMembers,
  JOURNEY,
  LIBRARY,
  membersByStatus,
  membersByStatusHeading,
  moduleBreakdown,
  programOptions,
  programOverview,
  recentActivity,
  stepLabel,
  summary,
  summaryFor,
} from "./curriculumProgress.data";
import * as data from "./curriculumProgress.data";
import { rosterRows } from "./rosterTestData";

/* Phase 8: the rows are built from the API roster and its course progress
   (synthetic rows here, through the app's own mapping). */
const NOW = new Date("2026-11-03T12:00:00Z");
const members = rosterRows()
  .filter((p) => p.programSlug !== null)
  .map((p) => curriculumRowFor(p, NOW));
const byName = (name: string) => {
  const member = members.find((m) => m.name === name);
  if (!member) throw new Error(`${name} missing`);
  return member;
};

describe("rows from the server's course progress", () => {
  it("ships no demo members or demo activity", () => {
    expect("members" in data).toBe(false);
    expect(recentActivity).toEqual([]);
  });

  it("keys each row by patientId", () => {
    for (const m of members) expect(m.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("maps the enrollment program to its curriculum", () => {
    expect(byName("Avery Testpatient").program).toBe(JOURNEY);
    expect(byName("Blake Sample").program).toBe(CRASH);
  });

  it("shows classes done of the course's classes, and the percent", () => {
    const avery = byName("Avery Testpatient");
    expect([avery.step, avery.length, avery.progress]).toEqual([8, 21, 40]);
    expect(stepLabel(avery)).toBe("Day 8 of 21");
  });

  it("reads the status from the server, with the client's follow-up rule", () => {
    expect(byName("Avery Testpatient").status).toBe("In Progress");
    /* In progress and quiet for 9 days. */
    expect(byName("Blake Sample").status).toBe("Needs Follow-Up");
    expect(byName("Casey Synthetic").status).toBe("Not Started");
    expect(byName("Casey Synthetic").module).toBe("Not started");
    expect(byName("Emery Fixture").status).toBe("Completed");
  });

  it("filters by MRN and by program and status together", () => {
    expect(filterMembers(members, { query: "900002" })).toHaveLength(1);
    expect(
      filterMembers(members, { program: JOURNEY, status: "In Progress" }).map(
        (m) => m.name,
      ),
    ).toEqual(["Avery Testpatient"]);
  });
});

/* These are the client's numbers and they do not reconcile — see the
   header of curriculumProgress.data.ts. Pinned so a change is a decision, not a
   drive-by "fix" that makes one panel agree and another disagree. */
describe("the client's figures, as given", () => {
  it("summary cards", () => {
    expect(summary).toEqual({
      activeLearners: 23,
      enrolled: 30,
      averageCompletion: 78,
      completed: 12,
      inProgress: 11,
      notStarted: 7,
    });
  });

  it("program progress", () => {
    expect(programOverview.map((p) => p.progress)).toEqual([82, 74, 69]);
  });

  it("module breakdown adds to 23", () => {
    expect(moduleBreakdown.reduce((sum, row) => sum + row.value, 0)).toBe(23);
  });

  it("members by status adds to 33 under a heading of 23", () => {
    expect(membersByStatusHeading).toBe(23);
    expect(membersByStatus.reduce((sum, row) => sum + row.value, 0)).toBe(33);
  });
});

describe("the course catalogue", () => {
  it("is the one place a course is declared", () => {
    // The filter list is derived, so a fourth course is filterable the
    // moment it is added rather than only once somebody remembers to
    // extend a second array by hand.
    expect(programOptions).toHaveLength(COURSES.length + 1);
    expect(programOptions[0]).toBe(ALL_PROGRAMS);
    for (const course of COURSES) {
      expect(programOptions).toContain(course.id);
    }
  });

  it("gives every course a unique id and a short name", () => {
    // The id keys member rows and the tab strip; the short name is what a
    // phone-width tab shows, and an empty one would render a blank tab.
    const ids = COURSES.map((course) => course.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const course of COURSES) {
      expect(course.shortName.length).toBeGreaterThan(0);
      expect(course.length).toBeGreaterThan(0);
    }
  });

  it("counts in the unit the course is actually measured in", () => {
    // "Day 14 of 21" for a course, "Module 3 of 8" for the library. The
    // unit comes from the catalogue, so a new course declares its own.
    expect(courseFor(JOURNEY)?.unit).toBe("Day");
    expect(courseFor(LIBRARY)?.unit).toBe("Module");
    expect(courseFor("Nothing Like This")).toBeUndefined();
  });

  it("takes each course's length from the catalogue, not from 21", () => {
    // Twenty-one days is Journey's length, not the page's.
    expect(courseFor(JOURNEY)?.length).toBe(21);
    expect(courseFor(CRASH)?.length).toBe(5);
    expect(courseFor(LIBRARY)?.length).toBe(8);
  });

  it("points every overview card at a real course", () => {
    // The card is a filter button; an id that matches no course would
    // filter the table down to nothing with no way back.
    for (const overview of programOverview) {
      expect(courseFor(overview.id)).toBeDefined();
    }
  });
});

describe("the key figures, per course", () => {
  it("hands back the client's own numbers across all programs", () => {
    // Verbatim from their mockup (EDU-BIZ moves them to the API).
    expect(summaryFor(members, ALL_PROGRAMS)).toBe(summary);
  });

  it("counts the roster once narrowed to one course", () => {
    const journey = summaryFor(members, JOURNEY);
    expect(journey.enrolled).toBe(3);
    expect(journey.completed).toBe(1);
    expect(journey.notStarted).toBe(1);
    expect(journey.activeLearners).toBe(2);
    expect(journey.averageCompletion).toBe(47);
  });

  it("returns zeroes rather than dividing by zero for an empty course", () => {
    const empty = summaryFor([], LIBRARY);
    expect(empty.enrolled).toBe(0);
    expect(empty.averageCompletion).toBe(0);
  });
});
