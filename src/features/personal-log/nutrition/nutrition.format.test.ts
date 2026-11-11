import { describe, expect, it } from "vitest";
import {
  amountProblem,
  formatNumber,
  parseAmount,
  statusForPercent,
  toNumber,
} from "./nutrition.format";

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

describe("parseAmount", () => {
  it("reads a typed amount, with or without a thousands comma", () => {
    expect(parseAmount("120")).toBe(120);
    expect(parseAmount("1.5")).toBe(1.5);
    expect(parseAmount("1,900")).toBe(1900);
    expect(parseAmount(" 42 ")).toBe(42);
  });

  it("reads an empty field as 0 (optional, and 'no goal' on the goals form)", () => {
    expect(parseAmount("")).toBe(0);
    expect(parseAmount("   ")).toBe(0);
  });

  it("does not turn a negative or unreadable amount into 0 (P16b QA round 2)", () => {
    // Goals saved "-5" as a calorie goal of 0 with no message.
    expect(parseAmount("-5")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("12abc")).toBeNull();
    expect(parseAmount("1.2.3")).toBeNull();
    expect(parseAmount("1e5")).toBeNull();
  });
});

describe("amountProblem", () => {
  it("names what is wrong, using the server's limit", () => {
    expect(amountProblem("-5", 100_000)).toBe("not-a-number");
    expect(amountProblem("100001", 100_000)).toBe("too-large");
    expect(amountProblem("100000", 100_000)).toBeNull();
    expect(amountProblem("", 100_000)).toBeNull();
  });
});
