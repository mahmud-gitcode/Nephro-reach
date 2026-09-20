import { describe, expect, it } from "vitest";
import {
  ALL_PROGRAMS,
  ALL_STATUSES,
  CONTRACT_SLOTS,
  countBy,
  CRASH,
  enrolledCount,
  enrollmentGoalPct,
  filterPatients,
  JOURNEY,
  paginate,
  patients,
  PROGRAM_ORDER,
  SOURCE_ORDER,
  STATUS_ORDER,
  slotsRemaining,
  statusTone,
} from "./enrollment.data";

/* The client gave totals for 23 patients and named 8 of them. The roster
   carries all 23 so every panel counts the same list — these lock that
   agreement in place, because the whole page is wrong the moment one panel
   disagrees with the table beside it. */
describe("the roster matches the totals the client specified", () => {
  it("holds 23 patients against 30 contracted slots", () => {
    expect(enrolledCount).toBe(23);
    expect(CONTRACT_SLOTS).toBe(30);
    expect(slotsRemaining).toBe(7);
  });

  it("puts the enrollment goal at 77%", () => {
    expect(enrollmentGoalPct).toBe(77);
  });

  it("splits by program 16 / 7 / 0", () => {
    const counts = countBy(patients, (p) => p.program, PROGRAM_ORDER);
    expect(counts).toEqual([
      { label: JOURNEY, value: 16 },
      { label: CRASH, value: 7 },
    ]);
    const other =
      enrolledCount - counts.reduce((sum, entry) => sum + entry.value, 0);
    expect(other).toBe(0);
  });

  it("splits by status 18 / 3 / 2 / 0", () => {
    expect(countBy(patients, (p) => p.status, STATUS_ORDER)).toEqual([
      { label: "Enrolled", value: 18 },
      { label: "Pending Start", value: 3 },
      { label: "Not Started", value: 2 },
      { label: "Withdrawn", value: 0 },
    ]);
  });

  it("splits by source 12 / 6 / 3 / 2", () => {
    expect(countBy(patients, (p) => p.source, SOURCE_ORDER)).toEqual([
      { label: "Office Referral", value: 12 },
      { label: "Provider Referral", value: 6 },
      { label: "Hospital Discharge", value: 3 },
      { label: "Self-Pay", value: 2 },
    ]);
  });

  it("gives every patient a unique MRN, which the table keys and selects on", () => {
    expect(new Set(patients.map((p) => p.mrn)).size).toBe(patients.length);
  });

  it("gives every patient a status the badge can colour", () => {
    for (const patient of patients) {
      expect(statusTone[patient.status]).toBeDefined();
    }
  });

  it("leaves no start date on a patient who has not started", () => {
    for (const patient of patients) {
      if (patient.status === "Not Started") {
        expect(patient.startDate).toBe("—");
        expect(patient.progress).toBe(0);
      }
    }
  });
});

describe("filterPatients", () => {
  it("returns everyone with no filters applied", () => {
    expect(filterPatients(patients, {})).toHaveLength(patients.length);
  });

  it("finds a patient by MRN, not just by name", () => {
    const found = filterPatients(patients, { query: "123456" });
    expect(found.map((p) => p.name)).toEqual(["John D. Smith"]);
  });

  it("finds by name regardless of case", () => {
    expect(filterPatients(patients, { query: "mary s." })).toHaveLength(1);
  });

  it("finds by status, because it is a word on screen too", () => {
    const found = filterPatients(patients, { query: "pending" });
    expect(found).toHaveLength(3);
  });

  it("narrows by program", () => {
    expect(filterPatients(patients, { program: CRASH })).toHaveLength(7);
  });

  it("narrows by status", () => {
    expect(filterPatients(patients, { status: "Enrolled" })).toHaveLength(18);
  });

  it("applies program and status together, not one or the other", () => {
    const found = filterPatients(patients, {
      program: JOURNEY,
      status: "Not Started",
    });
    expect(found.every((p) => p.program === JOURNEY)).toBe(true);
    expect(found.every((p) => p.status === "Not Started")).toBe(true);
  });

  it("treats the All options as no filter at all", () => {
    expect(
      filterPatients(patients, {
        program: ALL_PROGRAMS,
        status: ALL_STATUSES,
      }),
    ).toHaveLength(patients.length);
  });

  it("returns nothing rather than everything when nothing matches", () => {
    expect(filterPatients(patients, { query: "zzzz" })).toEqual([]);
  });
});

describe("paginate", () => {
  it("gives 23 patients three pages at ten a page", () => {
    expect(paginate(patients, 1, 10).pageCount).toBe(3);
  });

  it("describes the first page as 1–10 of 23", () => {
    const view = paginate(patients, 1, 10);
    expect(view.firstShown).toBe(1);
    expect(view.lastShown).toBe(10);
    expect(view.total).toBe(23);
  });

  it("gives the last page only what is left", () => {
    const view = paginate(patients, 3, 10);
    expect(view.rows).toHaveLength(3);
    expect(view.firstShown).toBe(21);
    expect(view.lastShown).toBe(23);
  });

  it("clamps a page past the end rather than showing nothing", () => {
    expect(paginate(patients, 99, 10).page).toBe(3);
  });

  it("clamps a page below one", () => {
    expect(paginate(patients, 0, 10).page).toBe(1);
  });

  it("reports 0–0 for an empty result, never 1–0", () => {
    const view = paginate([], 1, 10);
    expect(view.firstShown).toBe(0);
    expect(view.lastShown).toBe(0);
    expect(view.pageCount).toBe(1);
  });
});
