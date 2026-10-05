import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUICK_ACTIONS,
  cleanChoice,
  toggleChoice,
} from "./quickActions";

describe("quick actions", () => {
  it("falls back to the defaults for missing or unusable data", () => {
    expect(cleanChoice(null)).toEqual(DEFAULT_QUICK_ACTIONS);
    expect(cleanChoice(["nope"])).toEqual(DEFAULT_QUICK_ACTIONS);
  });

  it("keeps the member's order, without repeats, at most four", () => {
    expect(
      cleanChoice(["labs", "labs", "messages", "fluid", "nutrition", "rides"]),
    ).toEqual(["labs", "messages", "fluid", "nutrition"]);
  });

  it("refuses a fifth and removes one already picked", () => {
    const four = cleanChoice(["labs", "messages", "fluid", "nutrition"]);
    expect(toggleChoice(four, "rides")).toEqual(four);
    expect(toggleChoice(four, "labs")).toEqual([
      "messages",
      "fluid",
      "nutrition",
    ]);
  });
});
