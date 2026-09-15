import { describe, expect, it } from "vitest";
import { formatNumber, statusForPercent, toNumber } from "./nutrition.format";

/* These decide what a member reads on a diet where potassium is measured in
 * milligrams and getting it wrong matters. */

describe("toNumber", () => {
  it("reads a typed amount", () => {
    expect(toNumber("120")).toBe(120);
    expect(toNumber("1.5")).toBe(1.5);
  });

  it("treats anything unreadable as nothing, not as NaN", () => {
    // These come from text inputs, so all three are reachable.
    expect(toNumber("")).toBe(0);
    expect(toNumber("   ")).toBe(0);
    expect(toNumber("a lot")).toBe(0);
  });

  it("refuses a negative amount", () => {
    expect(toNumber("-50")).toBe(0);
  });
});

describe("statusForPercent", () => {
  it("is within goal below 80 percent", () => {
    expect(statusForPercent(0)).toBe("within");
    expect(statusForPercent(79)).toBe("within");
  });

  it("warns from 80 percent, before the goal is reached", () => {
    // The warning has to come early enough to act on.
    expect(statusForPercent(80)).toBe("near");
    expect(statusForPercent(94)).toBe("near");
  });

  it("reads as over from 95 percent", () => {
    expect(statusForPercent(95)).toBe("over");
    expect(statusForPercent(140)).toBe("over");
  });
});

describe("formatNumber", () => {
  it("groups thousands so a large milligram figure stays readable", () => {
    expect(formatNumber(2300)).toBe("2,300");
  });

  it("does not print a decimal tail on a whole number", () => {
    expect(formatNumber(120)).toBe("120");
  });
});
