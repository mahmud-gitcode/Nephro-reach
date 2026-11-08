import { describe, expect, it } from "vitest";
import {
  ALL_PROGRAMS,
  ALL_STATUSES,
  countBy,
  CRASH,
  filterPatients,
  JOURNEY,
  paginate,
  SOURCE_ORDER,
  STATUS_ORDER,
  statusTone,
} from "./enrollment.data";
import * as data from "./enrollment.data";
import { rosterRows } from "./rosterTestData";

/* Phase 8: the roster is the API's. These rows are synthetic (built through
   the app's own mapping); the rules below are what the page does with any
   roster. */
const patients = rosterRows();

describe("no demo roster ships (Phase 8)", () => {
  it("exports no patients list, counts or goal figures", () => {
    for (const gone of [
      "patients",
      "enrolledCount",
      "slotsRemaining",
      "enrollmentGoalPct",
    ])
      expect(gone in data).toBe(false);
  });

  it("gives every status the server can send a badge colour", () => {
    for (const status of [...STATUS_ORDER, "Completed", "No Program"])
      expect(statusTone[status as keyof typeof statusTone]).toBeDefined();
  });
});

describe("filterPatients", () => {
  it("returns everyone with no filters applied", () => {
    expect(filterPatients(patients, {})).toHaveLength(patients.length);
  });

  it("finds a patient by MRN, not just by name", () => {
    const found = filterPatients(patients, { query: "900002" });
    expect(found.map((p) => p.name)).toEqual(["Blake Sample"]);
  });

  it("finds by name regardless of case", () => {
    expect(filterPatients(patients, { query: "avery test" })).toHaveLength(1);
  });

  it("finds by status, because it is a word on screen too", () => {
    expect(filterPatients(patients, { query: "pending" })).toHaveLength(1);
  });

  it("narrows by program", () => {
    expect(filterPatients(patients, { program: CRASH })).toHaveLength(1);
  });

  it("applies program and status together, not one or the other", () => {
    const found = filterPatients(patients, {
      program: JOURNEY,
      status: "Enrolled",
    });
    expect(found.map((p) => p.name)).toEqual(["Avery Testpatient"]);
  });

  it("treats the All options as no filter at all", () => {
    expect(
      filterPatients(patients, { program: ALL_PROGRAMS, status: ALL_STATUSES }),
    ).toHaveLength(patients.length);
  });

  it("returns nothing rather than everything when nothing matches", () => {
    expect(filterPatients(patients, { query: "zzzz" })).toEqual([]);
  });
});

describe("countBy", () => {
  it("counts sources in the order given, zeros included", () => {
    expect(countBy(patients, (p) => p.source, SOURCE_ORDER)).toEqual([
      { label: "Office Referral", value: 1 },
      { label: "Provider Referral", value: 1 },
      { label: "Hospital Discharge", value: 1 },
      { label: "Self-Pay", value: 1 },
    ]);
  });
});

describe("paginate", () => {
  const many = Array.from({ length: 23 }, (_, i) => i);

  it("gives 23 rows three pages at ten a page", () => {
    expect(paginate(many, 1, 10).pageCount).toBe(3);
  });

  it("describes the first page as 1–10 of 23", () => {
    const view = paginate(many, 1, 10);
    expect([view.firstShown, view.lastShown, view.total]).toEqual([1, 10, 23]);
  });

  it("gives the last page only what is left", () => {
    const view = paginate(many, 3, 10);
    expect(view.rows).toHaveLength(3);
    expect([view.firstShown, view.lastShown]).toEqual([21, 23]);
  });

  it("clamps a page past the end rather than showing nothing", () => {
    expect(paginate(many, 99, 10).page).toBe(3);
  });

  it("clamps a page below one", () => {
    expect(paginate(many, 0, 10).page).toBe(1);
  });

  it("reports 0–0 for an empty result, never 1–0", () => {
    const view = paginate([], 1, 10);
    expect([view.firstShown, view.lastShown, view.pageCount]).toEqual([
      0, 0, 1,
    ]);
  });
});
