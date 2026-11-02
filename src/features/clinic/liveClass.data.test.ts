import { describe, expect, it } from "vitest";
import * as data from "./liveClass.data";
import { classDate, formatClassDate } from "./liveClass.data";

describe("class dates", () => {
  it("parse as the local day, not UTC midnight", () => {
    // new Date("2026-09-12") is the 11th west of Greenwich.
    expect(classDate("2026-09-12").getDate()).toBe(12);
    expect(formatClassDate("2026-09-12")).toBe("Sep 12, 2026");
  });
});

describe("no sample figures once the page is on the API (Phase 13)", () => {
  it("has no summary, recent classes, sources or trend to show", () => {
    const exported = Object.keys(data);
    for (const name of [
      "summary",
      "recentClasses",
      "registrationSources",
      "attendanceTrend",
    ])
      expect(exported).not.toContain(name);
  });
});
