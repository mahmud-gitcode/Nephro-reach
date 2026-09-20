import { describe, expect, it } from "vitest";
import {
  enrollment,
  filterMembers,
  members,
  statusTone,
  type ClinicMember,
} from "./clinicDashboard.data";

describe("filterMembers", () => {
  it("returns everyone when the search is empty or blank", () => {
    expect(filterMembers(members, "")).toHaveLength(members.length);
    expect(filterMembers(members, "   ")).toHaveLength(members.length);
  });

  it("matches a name regardless of case", () => {
    const found = filterMembers(members, "mary");
    expect(found.map((m) => m.name)).toEqual(["Mary S."]);
  });

  it("matches on the program, so a clinic can pull one cohort", () => {
    const found = filterMembers(members, "Crash Dialysis");
    expect(found).toHaveLength(2);
    expect(found.every((m) => m.program.includes("Crash"))).toBe(true);
  });

  it("matches on the status, because it is a word on screen too", () => {
    const found = filterMembers(members, "follow");
    expect(found.every((m) => m.status === "Need Follow-Up")).toBe(true);
    expect(found.length).toBeGreaterThan(0);
  });

  it("returns nothing rather than everything when nothing matches", () => {
    expect(filterMembers(members, "zzz")).toEqual([]);
  });
});

describe("the members table", () => {
  it("gives every row a status the badge knows how to colour", () => {
    for (const member of members) {
      expect(statusTone[member.status]).toBeDefined();
    }
  });

  it("keeps every progress figure inside 0–100", () => {
    for (const member of members) {
      expect(member.progress).toBeGreaterThanOrEqual(0);
      expect(member.progress).toBeLessThanOrEqual(100);
    }
  });

  it("names each member once, so React keys stay unique", () => {
    const names = new Set(members.map((m: ClinicMember) => m.name));
    expect(names.size).toBe(members.length);
  });
});

describe("enrollment", () => {
  it("derives the remaining slots rather than restating them", () => {
    expect(enrollment.remaining).toBe(
      enrollment.contracted - enrollment.enrolled,
    );
  });

  it("never shows more enrolled than the contract allows", () => {
    expect(enrollment.enrolled).toBeLessThanOrEqual(enrollment.contracted);
  });
});
