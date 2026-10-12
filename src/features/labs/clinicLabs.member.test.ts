import { describe, expect, it } from "vitest";
import type { LabResult } from "@/features/clinic/labs.data";
import { hasUnseen, latestByPanel, newestUpload } from "./clinicLabs.member";

const row = (over: Partial<LabResult>): LabResult => ({
  id: "r",
  mrn: "1",
  date: "2026-10-01",
  test: "Potassium",
  value: "5.0",
  unit: "mEq/L",
  reference: "3.5-5.0",
  uploadedAt: "2026-10-01T10:00:00.000Z",
  uploadedBy: "Clinic",
  ...over,
});

describe("clinic labs on the member's panels", () => {
  const state = {
    results: [
      row({ id: "a", date: "2026-09-01", value: "4.1" }),
      row({ id: "b", date: "2026-10-01", value: "5.6" }),
      row({ id: "c", test: "Kt/V", value: "1.4", unit: "", reference: "" }),
      row({ id: "d", mrn: "2", value: "9.9" }),
    ],
  };

  it("takes the newest value per test, mapped to the panel id", () => {
    const latest = latestByPanel(state, "1");
    expect(latest.potassium).toMatchObject({ value: "5.6", flag: "High" });
    expect(latest.ktv.value).toBe("1.4");
  });

  it("shows nothing without the member's MRN", () => {
    expect(latestByPanel(state, null)).toEqual({});
  });

  it("announces an upload once", () => {
    const newest = newestUpload(state, "1");
    expect(hasUnseen(newest, null)).toBe(true);
    expect(hasUnseen(newest, newest!.uploadedAt)).toBe(false);
  });
});
