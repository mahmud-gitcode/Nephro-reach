import { describe, expect, it } from "vitest";
import { paginate, patients } from "./enrollment.data";
import {
  ALL_PROGRAMS,
  COURSES,
  courseFor,
  CRASH,
  curriculumRowFor,
  filterMembers,
  JOURNEY,
  LIBRARY,
  members,
  membersByStatus,
  membersByStatusHeading,
  moduleBreakdown,
  programOptions,
  programOverview,
  stepLabel,
  summary,
  summaryFor,
} from "./curriculumProgress.data";

const byName = (name: string) => {
  const member = members.find((m) => m.name === name);
  if (!member) throw new Error(`${name} missing`);
  return member;
};

describe("the roster is the clinic's roster", () => {
  it("holds the same 23 people as Enroll Patients, with the same MRNs", () => {
    expect(members).toHaveLength(23);
    for (const member of members) {
      const patient = patients.find((p) => p.mrn === member.mrn);
      expect(patient?.name).toBe(member.name);
    }
  });

  it("gives every member a module title", () => {
    for (const member of members) expect(member.module).toBeTruthy();
  });
});

describe("the eight rows the client specified", () => {
  /* name, module, day/module, progress — as written in the spec. */
  const specified: [string, string, string, number][] = [
    ["John D. Smith", "Diet and Fluid Management", "Day 14 of 21", 67],
    ["Mary S. Johnson", "Treatment Day Prep", "Day 3 of 5", 60],
    ["Robert L. Davis", "Access Options", "Day 21 of 21", 100],
    ["Angela T. Brown", "Medications in Dialysis", "Day 12 of 21", 57],
    ["James K. Wilson", "What to Expect", "Day 5 of 5", 100],
    ["Patricia M. Allen", "Transplant Options", "Day 8 of 21", 38],
    ["David R. Carter", "Lab Results Explained", "Module 4 of 8", 50],
    ["Lisa W. Thomas", "Life on Dialysis", "Day 1 of 21", 5],
  ];

  it.each(specified)("%s", (name, module, step, progress) => {
    const member = byName(name);
    expect(member.module).toBe(module);
    expect(stepLabel(member)).toBe(step);
    // Derived from the day, and still lands on the client's figure.
    expect(member.progress).toBe(progress);
  });

  it("come first, in the client's order", () => {
    expect(members.slice(0, 8).map((m) => m.name)).toEqual(
      specified.map(([name]) => name),
    );
  });
});

describe("filtering", () => {
  it("finds a member by MRN", () => {
    const [found] = filterMembers(members, {
      query: byName("Lisa W. Thomas").mrn,
    });
    expect(found.name).toBe("Lisa W. Thomas");
  });

  it("narrows by program and status together", () => {
    const rows = filterMembers(members, {
      program: CRASH,
      status: "Completed",
    });
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.program).toBe(CRASH);
      expect(row.status).toBe("Completed");
    }
  });

  it("has an Education Library member to filter to", () => {
    expect(filterMembers(members, { program: LIBRARY })).toHaveLength(1);
    expect(filterMembers(members, { program: JOURNEY }).length).toBeGreaterThan(
      10,
    );
  });

  it("pages 23 members as 10 / 10 / 3", () => {
    expect(paginate(members, 1, 10).lastShown).toBe(10);
    expect(paginate(members, 3, 10)).toMatchObject({
      firstShown: 21,
      lastShown: 23,
      pageCount: 3,
    });
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

describe("rows for patients enrolled since", () => {
  it("keeps a demo member's specified row", () => {
    const john = patients.find((p) => p.name === "John D. Smith")!;
    expect(curriculumRowFor(john)).toBe(
      members.find((m) => m.name === "John D. Smith"),
    );
  });

  it("gives a new patient a Not started row, not an invented day", () => {
    const row = curriculumRowFor({
      ...patients[0],
      name: "Maria L. Gomez",
      mrn: "700001",
      program: "Crash Dialysis (5-Day)",
    });
    expect(row).toMatchObject({
      program: CRASH,
      step: 0,
      progress: 0,
      status: "Not Started",
    });
    expect(stepLabel(row)).toBe("Not started");
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
    // Verbatim from their mockup, and they do not reconcile with a 23-row
    // roster. Recomputing them here would quietly "fix" a client decision.
    expect(summaryFor(members, ALL_PROGRAMS)).toBe(summary);
  });

  it("counts the roster once narrowed to one course", () => {
    const crash = summaryFor(members, CRASH);
    const inCrash = members.filter((member) => member.program === CRASH);

    expect(crash.enrolled).toBe(inCrash.length);
    expect(crash.completed).toBe(
      inCrash.filter((m) => m.status === "Completed").length,
    );
    expect(crash.inProgress).toBe(
      inCrash.filter((m) => m.status === "In Progress").length,
    );
  });

  it("does not call somebody who has not started an active learner", () => {
    // Enrolled and learning are different questions, and the card asks the
    // second one.
    const journey = summaryFor(members, JOURNEY);
    expect(journey.activeLearners).toBe(journey.enrolled - journey.notStarted);
  });

  it("averages the progress actually on the roster", () => {
    const library = summaryFor(members, LIBRARY);
    const inLibrary = members.filter((m) => m.program === LIBRARY);
    const mean = Math.round(
      inLibrary.reduce((total, m) => total + m.progress, 0) / inLibrary.length,
    );

    expect(library.averageCompletion).toBe(mean);
    expect(library.averageCompletion).toBeLessThanOrEqual(100);
  });

  it("returns zeroes rather than dividing by zero for an empty course", () => {
    // A course nobody has joined yet must not show NaN%.
    const empty = summaryFor([], JOURNEY);
    expect(empty.enrolled).toBe(0);
    expect(empty.averageCompletion).toBe(0);
  });
});
