import { describe, expect, it } from "vitest";
import { paginate, patients } from "./enrollment.data";
import {
  CRASH,
  curriculumRowFor,
  filterMembers,
  JOURNEY,
  LIBRARY,
  members,
  membersByStatus,
  membersByStatusHeading,
  moduleBreakdown,
  programOverview,
  stepLabel,
  summary,
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
