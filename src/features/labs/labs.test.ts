import { describe, expect, it } from "vitest";
import { LAB_CATEGORIES } from "./labs.panels.seed";
import {
  CUSTOM_TEST_CODE,
  PANEL_TEST_CODES,
  isOwnEntry,
  testCodeFor,
  toDrawBody,
  type ApiLabResult,
  type ApiLabTrend,
} from "./labs.mapper";
import {
  compareDays,
  drawsOf,
  kpisOf,
  panelView,
  previousReading,
  statusOf,
  unseenClinicRows,
} from "./labs.view";
import { latestDrawOf } from "./useCustomLabResult";

/* Phase 6: member labs as rows on the API. Synthetic data only. */

/* The backend's LAB_TESTS keys (labs.constants.ts), mirrored by the panels. */
const BACKEND_CODES = [
  "bun",
  "creatinine",
  "egfr",
  "sodium",
  "potassium",
  "chloride",
  "co2",
  "calcium",
  "phosphorus",
  "pth",
  "vitamind",
  "hemoglobin",
  "hematocrit",
  "ferritin",
  "tsat",
  "albumin",
  "bicarbonate",
  "ktv",
];

let seq = 0;
const row = (over: Partial<ApiLabResult> = {}): ApiLabResult => {
  seq += 1;
  return {
    id: `lab-${seq}`,
    patientId: "p-1",
    collectedOn: "2026-10-01",
    resultedOn: null,
    testCode: "potassium",
    testName: "Potassium",
    value: "4.5",
    valueNumeric: 4.5,
    unit: "mEq/L",
    referenceRange: "3.5 – 5.0",
    referenceLow: 3.5,
    referenceHigh: 5,
    abnormalFlag: null,
    notes: null,
    source: "PATIENT_ENTERED",
    enteredById: "u-1",
    organizationId: null,
    hasReport: false,
    seenByPatientAt: null,
    createdAt: `2026-10-01T10:00:${String(seq).padStart(2, "0")}.000Z`,
    updatedAt: "2026-10-01T10:00:00.000Z",
    ...over,
  };
};

describe("test codes", () => {
  it("every panel test name maps to the backend's test code", () => {
    const tests = LAB_CATEGORIES.flatMap((c) => c.tests);
    expect(tests).toHaveLength(18);
    for (const test of tests) expect(testCodeFor(test.name)).toBe(test.id);
    expect([...PANEL_TEST_CODES].sort()).toEqual([...BACKEND_CODES].sort());
  });

  it("matches a panel name without regard to case or spaces", () => {
    expect(testCodeFor("  egfr (ckd-epi) ")).toBe("egfr");
    expect(testCodeFor("Kt/V")).toBe("ktv");
  });

  it("sends anything else as custom", () => {
    expect(testCodeFor("Magnesium")).toBe(CUSTOM_TEST_CODE);
  });
});

describe("toDrawBody", () => {
  it("is one body per draw with one result per filled test", () => {
    const body = toDrawBody(
      {
        collectedOn: "2026-10-30",
        values: {
          BUN: "48",
          Potassium: " 5.2 ",
          Sodium: "",
          Magnesium: "2.1",
        },
        notes: "  Fasting  ",
      },
      "file-7",
    );
    expect(body).toEqual({
      collectedOn: "2026-10-30",
      notes: "Fasting",
      reportFileId: "file-7",
      results: [
        { testCode: "bun", value: "48" },
        { testCode: "potassium", value: "5.2" },
        { testCode: "custom", testName: "Magnesium", value: "2.1" },
      ],
    });
  });

  it("refuses an empty draw and one over the API's 40 results", () => {
    expect(() =>
      toDrawBody({
        collectedOn: "2026-10-30",
        values: { BUN: " " },
        notes: "",
      }),
    ).toThrow(RangeError);
    const many = Object.fromEntries(
      Array.from({ length: 41 }, (_, i) => [`Custom ${i}`, "1"]),
    );
    expect(() =>
      toDrawBody({ collectedOn: "2026-10-30", values: many, notes: "" }),
    ).toThrow(RangeError);
  });
});

describe("statusOf", () => {
  it("reads the lab's flag first, then the number against its range", () => {
    expect(statusOf(row({ abnormalFlag: "HH" }))).toBe("High");
    expect(statusOf(row({ abnormalFlag: "L" }))).toBe("Low");
    expect(statusOf(row({ valueNumeric: 5.6 }))).toBe("High");
    expect(statusOf(row({ valueNumeric: 3.1 }))).toBe("Low");
    expect(statusOf(row())).toBe("In Range");
  });

  it("says nothing when it cannot tell", () => {
    expect(statusOf(row({ valueNumeric: null }))).toBeNull();
    expect(
      statusOf(row({ referenceLow: null, referenceHigh: null })),
    ).toBeNull();
  });
});

describe("panelView", () => {
  const trend: ApiLabTrend = {
    testCode: "potassium",
    testName: "Potassium",
    category: "electrolytes",
    unit: "mEq/L",
    referenceRange: "3.5 – 5.0",
    referenceLow: 3.5,
    referenceHigh: 5,
    latest: 5.6,
    points: [
      {
        id: "a",
        collectedOn: "2026-09-01",
        value: 4.1,
        source: "PATIENT_ENTERED",
      },
      {
        id: "b",
        collectedOn: "2026-10-01",
        value: 5.6,
        source: "FACILITY_CSV_IMPORT",
      },
    ],
    sources: ["PATIENT_ENTERED", "FACILITY_CSV_IMPORT"],
  };
  const rows = [
    row({ collectedOn: "2026-09-01", value: "4.1", valueNumeric: 4.1 }),
    row({
      collectedOn: "2026-10-01",
      value: "5.6",
      valueNumeric: 5.6,
      source: "FACILITY_CSV_IMPORT",
    }),
  ];
  const view = panelView(rows, [trend], "", "2026-10-30");
  const potassium = view
    .flatMap((c) => c.tests)
    .find((t) => t.id === "potassium")!;
  const bun = view.flatMap((c) => c.tests).find((t) => t.id === "bun")!;

  it("shows the latest and previous readings, from any source", () => {
    expect(potassium.latestResult).toBe("5.6 mEq/L");
    expect(potassium.previousResult).toBe("4.1 mEq/L");
    expect(potassium.change).toBe("1.5");
    expect(potassium.changeDirection).toBe("up");
    expect(potassium.status).toBe("High");
    expect(potassium.sparkline).toEqual([4.1, 5.6]);
  });

  it("never shows the panels' sample readings", () => {
    expect(bun.latestResult).toBe("—");
    expect(bun.previousResult).toBe("—");
    expect(bun.sparkline).toEqual([]);
    expect(bun.status).toBeNull();
    expect(bun.change).toBeNull();
    expect(bun.refRange).toBe("7 – 20 mg/dL");
  });

  it("counts the figures from the results, not a fixed 16 / 25", () => {
    const kpis = kpisOf(view, rows);
    expect(kpis).toMatchObject({
      latestDate: "2026-10-01",
      withResult: 1,
      inRange: 0,
      high: 1,
      low: 0,
      trendingUp: 1,
      trendingDown: 0,
    });
    expect(kpisOf(panelView([], [], "", "2026-10-30"), [])).toMatchObject({
      latestDate: null,
      withResult: 0,
    });
  });

  it("compares with a chosen draw day or a preset window", () => {
    const readings = [
      row({ collectedOn: "2026-10-28" }),
      row({ collectedOn: "2026-10-20" }),
      row({ collectedOn: "2026-08-01" }),
    ];
    expect(previousReading(readings, "", "2026-10-30")?.collectedOn).toBe(
      "2026-10-20",
    );
    expect(
      previousReading(readings, "2026-08-01", "2026-10-30")?.collectedOn,
    ).toBe("2026-08-01");
    expect(
      previousReading(readings, "last-30-days", "2026-10-30")?.collectedOn,
    ).toBe("2026-10-20");
    expect(previousReading(readings, "last-7-days", "2026-10-30")).toBeNull();
    expect(compareDays(readings)).toEqual(["2026-10-20", "2026-08-01"]);
  });
});

describe("drawsOf", () => {
  it("is one entry per draw day; only the member's own rows can be edited", () => {
    const draws = drawsOf([
      row({ collectedOn: "2026-10-01", testCode: "bun", testName: "BUN" }),
      row({ collectedOn: "2026-10-01", notes: "Fasting", hasReport: true }),
      row({
        collectedOn: "2026-10-15",
        source: "PROVIDER_ENTERED",
        organizationId: "org-1",
      }),
      row({
        collectedOn: "2026-10-15",
        testCode: "custom",
        testName: "Magnesium",
      }),
    ]);
    expect(draws.map((d) => d.date)).toEqual(["2026-10-15", "2026-10-01"]);
    expect(draws[0].fromClinic).toBe(true);
    const clinicTest = draws[0].groups
      .flatMap((g) => g.tests)
      .find((t) => t.row.source === "PROVIDER_ENTERED")!;
    expect(clinicTest.editable).toBe(false);
    expect(draws[0].groups.map((g) => g.categoryId)).toContain("other");
    expect(draws[1].notes).toBe("Fasting");
    expect(draws[1].withReport).not.toBeNull();
    expect(
      draws[1].groups.flatMap((g) => g.tests).every((t) => t.editable),
    ).toBe(true);
  });

  it("a second draw adds a day; it never replaces the first", () => {
    const first = row({ collectedOn: "2026-09-01" });
    const second = row({ collectedOn: "2026-10-01" });
    expect(drawsOf([first])).toHaveLength(1);
    expect(drawsOf([first, second])).toHaveLength(2);
  });
});

describe("care-team results", () => {
  it("are read-only and unseen until the patient marks them", () => {
    const own = row();
    const clinic = row({ source: "FACILITY_CSV_IMPORT" });
    const seen = row({
      source: "PROVIDER_ENTERED",
      seenByPatientAt: "2026-10-02T10:00:00.000Z",
    });
    expect(isOwnEntry(own)).toBe(true);
    expect(isOwnEntry(clinic)).toBe(false);
    expect(unseenClinicRows([own, clinic, seen])).toEqual([clinic]);
  });
});

describe("the office feed's latest typed draw", () => {
  it("is the newest PATIENT_ENTERED day, keyed by panel name", () => {
    expect(latestDrawOf([])).toBeNull();
    const draw = latestDrawOf([
      row({ collectedOn: "2026-09-01", value: "4.0" }),
      row({ collectedOn: "2026-10-01", value: "5.1", notes: "Synthetic" }),
      row({ collectedOn: "2026-10-01", testCode: "bun", value: "40" }),
      row({ collectedOn: "2026-10-20", source: "PROVIDER_ENTERED" }),
    ]);
    expect(draw).toEqual({
      date: "2026-10-01",
      values: { Potassium: "5.1", BUN: "40" },
      notes: "Synthetic",
    });
  });
});
