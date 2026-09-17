import { describe, expect, it } from "vitest";
import {
  AUTO_FLAG_PHRASES,
  canPublishToCommunity,
  checkFlaggedMedicalContent,
} from "./moderation";

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

describe("what may reach the board", () => {
  it("refuses a flagged phrase", () => {
    expect(canPublishToCommunity("I have chest pain since dialysis")).toBe(
      false,
    );
  });

  it("refuses empty text, so callers need only one check", () => {
    expect(canPublishToCommunity("")).toBe(false);
    expect(canPublishToCommunity("   ")).toBe(false);
  });

  it("allows an ordinary message", () => {
    expect(canPublishToCommunity("Congratulations on your transplant!")).toBe(
      true,
    );
  });

  it("gates a reply exactly as it gates a post", () => {
    // These used to disagree: the composer disabled its button on a flagged
    // phrase while the reply box warned and posted anyway, so the strictest
    // path in the feature was also the least used one.
    for (const text of [
      "I want to die",
      "should i skip dialysis",
      "send money",
      "my fistula is bleeding",
    ]) {
      expect(canPublishToCommunity(text)).toBe(
        !checkFlaggedMedicalContent(text),
      );
      expect(canPublishToCommunity(text)).toBe(false);
    }
  });

  it("still lets a word that merely contains a phrase through", () => {
    // Word-boundary, not substring: "cashew" is not "cash app".
    expect(canPublishToCommunity("I brought cashews to treatment")).toBe(true);
  });
});
