import { describe, expect, it } from "vitest";
import { AUTO_FLAG_PHRASES, checkFlaggedMedicalContent } from "./moderation";

/* This decides whether a post on a dialysis peer-support board is published
 * or held for a human to read. It was written inside the community page,
 * imported from there by the dialysis journal, and never tested. */

describe("checkFlaggedMedicalContent", () => {
  it("passes an ordinary post", () => {
    expect(
      checkFlaggedMedicalContent(
        "Had a rough run today but the cramping settled by the evening.",
      ),
    ).toBe(false);
  });

  it("flags a request for money", () => {
    expect(checkFlaggedMedicalContent("Can you send money via cash app?")).toBe(
      true,
    );
  });

  it("flags regardless of how it is capitalised", () => {
    expect(checkFlaggedMedicalContent("CASH APP please")).toBe(true);
    expect(checkFlaggedMedicalContent("Cash App please")).toBe(true);
  });

  it("matches on word boundaries, not substrings", () => {
    // The reason the check builds a boundary regex rather than calling
    // includes(): a member writing about food should not be held for review.
    expect(checkFlaggedMedicalContent("I snack on cashews between runs")).toBe(
      false,
    );
  });

  it("flags a phrase sitting against punctuation", () => {
    expect(checkFlaggedMedicalContent("...send money!")).toBe(true);
    expect(checkFlaggedMedicalContent("(scam)")).toBe(true);
  });

  it("treats an empty or blank post as nothing to flag", () => {
    expect(checkFlaggedMedicalContent("")).toBe(false);
    expect(checkFlaggedMedicalContent("   ")).toBe(false);
  });

  it("flags every phrase on the list", () => {
    // If a phrase is on the list it has to actually fire; a regex that
    // silently fails to match is the worst outcome here.
    for (const phrase of AUTO_FLAG_PHRASES) {
      expect(checkFlaggedMedicalContent(`something ${phrase} something`)).toBe(
        true,
      );
    }
  });
});
