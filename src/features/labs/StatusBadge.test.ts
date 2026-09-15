import { describe, expect, it } from "vitest";
import { sparklineTone } from "./StatusBadge";

/* The trend line beside a reading has to agree with the badge on it. A
 * reading that is High and a line drawn in the "good" colour is a chart
 * contradicting the words next to it. */

describe("sparklineTone", () => {
  it("draws an in-range reading in the success tone", () => {
    expect(sparklineTone("In Range")).toBe("success");
  });

  it("draws a high reading in the danger tone", () => {
    expect(sparklineTone("High")).toBe("danger");
  });

  it("draws a low reading in the warning tone, not danger", () => {
    // Low and High are both out of range, but they are not the same news.
    expect(sparklineTone("Low")).toBe("warning");
  });
});
