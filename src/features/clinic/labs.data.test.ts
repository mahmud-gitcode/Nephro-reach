import { describe, expect, it } from "vitest";
import {
  LAB_CSV_TEMPLATE,
  importLabs,
  labFlag,
  labsFor,
  normalDate,
  parseLabCsv,
  seedLabs,
} from "./labs.data";

const NOW = new Date(2026, 9, 3, 12).getTime();

describe("lab CSV", () => {
  it("reads the template", () => {
    const parsed = parseLabCsv(LAB_CSV_TEMPLATE, ["123456"]);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0]).toEqual({
      mrn: "123456",
      date: "2026-09-28",
      test: "Potassium",
      value: "5.6",
      unit: "mEq/L",
      reference: "3.5-5.0",
    });
  });

  it("takes columns in any order, quotes, CRLF and US dates", () => {
    const csv =
      'Test,Value,MRN,Date\r\n"Kt/V, single pool",1.4,123456,9/2/2026\r\n';
    const parsed = parseLabCsv(csv, ["123456"]);
    expect(parsed.rows[0]).toMatchObject({
      test: "Kt/V, single pool",
      date: "2026-09-02",
      unit: "",
    });
  });

  it("refuses unknown patients, bad dates and blank values, by line", () => {
    const csv = [
      "mrn,date,test,value",
      "999999,2026-09-01,Potassium,4.0",
      "123456,2026-02-30,Potassium,4.0",
      "123456,2026-09-01,Potassium,",
      "123456,2026-09-01,Potassium,4.0",
    ].join("\n");
    const parsed = parseLabCsv(csv, ["123456"]);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.errors.map((e) => e.line)).toEqual([2, 3, 4]);
  });

  it("says which header columns are missing", () => {
    expect(parseLabCsv("mrn,test\n", []).errors[0].message).toContain(
      "date, value",
    );
    expect(parseLabCsv("   \n", []).errors[0].message).toContain("empty");
  });

  it("normalises dates and rejects impossible ones", () => {
    expect(normalDate("2026-9-5")).toBe("2026-09-05");
    expect(normalDate("13/01/2026")).toBeNull();
    expect(normalDate("yesterday")).toBeNull();
  });
});

describe("lab charts", () => {
  it("a re-upload of the same draw replaces it, others stay", () => {
    const seed = seedLabs(NOW);
    const before = labsFor(seed, "123456").length;
    const next = importLabs(
      seed,
      [
        {
          mrn: "123456",
          date: labsFor(seed, "123456")[0].date,
          test: "potassium",
          value: "4.8",
          unit: "mEq/L",
          reference: "3.5-5.0",
        },
      ],
      "Admin",
      NOW,
    );
    const chart = labsFor(next, "123456");
    expect(chart).toHaveLength(before);
    expect(chart.find((r) => r.test === "potassium")?.uploadedBy).toBe("Admin");
  });

  it("flags values outside the printed range", () => {
    expect(labFlag({ value: "5.6", reference: "3.5-5.0" })).toBe("High");
    expect(labFlag({ value: "3.3", reference: "3.5-5.0" })).toBe("Low");
    expect(labFlag({ value: "4.0", reference: "3.5-5.0" })).toBeNull();
    expect(labFlag({ value: "pos", reference: "" })).toBeNull();
  });
});
