import { describe, expect, it } from "vitest";
import { cycleStatusIn, statusForNew } from "./questions.rules";
import type { CareTeamQuestion } from "./questions.types";

/* This is the list a member opens in the chair, so the status is the part
 * they read at a glance. The cycle was a lookup table written inline in an
 * event handler, with a `|| "Answered"` fallback that could silently mark
 * an unanswered question answered. */

const question: CareTeamQuestion = {
  id: "q1",
  role: "Provider",
  question: "Why am I cramping at the end of a run?",
  status: "Submitted",
};

describe("care team question rules", () => {
  it("cycles Submitted to Discussed to Answered and back", () => {
    const submitted = [question];
    const discussed = cycleStatusIn(submitted, "q1");
    expect(discussed[0].status).toBe("Discussed");

    const answered = cycleStatusIn(discussed, "q1");
    expect(answered[0].status).toBe("Answered");

    expect(cycleStatusIn(answered, "q1")[0].status).toBe("Submitted");
  });

  it("changes only the question that was tapped", () => {
    const other = { ...question, id: "q2" };
    const next = cycleStatusIn([question, other], "q1");
    expect(next[1]).toBe(other);
  });

  it("marks a question answered when it is written down with the answer", () => {
    expect(statusForNew("Submitted", "Drink less between runs")).toBe(
      "Answered",
    );
  });

  it("leaves an empty answer as submitted", () => {
    expect(statusForNew("Submitted", "   ")).toBe("Submitted");
  });

  it("does not override a status the member chose themselves", () => {
    expect(statusForNew("Discussed", "Some answer")).toBe("Discussed");
  });
});
