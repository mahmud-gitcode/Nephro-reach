import { describe, expect, it } from "vitest";
import {
  ALL_FLAG_PHRASES,
  AUTO_FLAG_PHRASES,
  HARASSMENT_PHRASES,
  canPublishToCommunity,
  checkFlaggedMedicalContent,
  flagDetail,
  flagReason,
  routeForCommunity,
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
    for (const phrase of ALL_FLAG_PHRASES) {
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

describe("hostility aimed at another member", () => {
  it("refuses the reply that got through", () => {
    // The whole reason this list exists. "Die already" was typed under
    // another member's post and the Reply button stayed enabled.
    expect(canPublishToCommunity("Die already")).toBe(false);
    expect(flagReason("Die already")).toBe("harassment");
  });

  it("refuses a death wish however it is phrased", () => {
    for (const text of [
      "just die",
      "you should die",
      "hope you die",
      "kill yourself",
      "kys",
      "drop dead",
      "wish you were dead",
    ]) {
      expect(canPublishToCommunity(text)).toBe(false);
      expect(flagReason(text)).toBe("harassment");
    }
  });

  it("refuses contempt aimed at someone", () => {
    expect(flagReason("you are pathetic")).toBe("harassment");
    expect(flagReason("nobody cares what you think")).toBe("harassment");
  });

  it("still lets a member describe their own bad day", () => {
    // These were left off the list deliberately: on a dialysis board they
    // are overwhelmingly self-directed, and flagging them would train
    // members that the board fights them.
    for (const text of [
      "I feel like garbage today",
      "I felt useless after my run",
      "Some days I feel like a burden to my family",
      "Low fat diet is working for me",
    ]) {
      expect(canPublishToCommunity(text)).toBe(true);
      expect(flagReason(text)).toBeNull();
    }
  });
});

describe("why something was held", () => {
  it("tells medical apart from hostile, so the member is told the truth", () => {
    // The board used to answer every flag with "call 911", including a
    // reply that was simply abusive.
    expect(flagReason("I have chest pain since dialysis")).toBe("medical");
    expect(flagReason("Die already")).toBe("harassment");
  });

  it("has no reason to give for an ordinary message", () => {
    expect(flagReason("Congratulations on your transplant!")).toBeNull();
    expect(flagReason("")).toBeNull();
  });

  it("names harassment first when a text trips both lists", () => {
    // "stupid" is on the medical list's unsafe-behaviour section and
    // "loser" is harassment; the member needs the conduct message, not one
    // about symptoms.
    expect(flagReason("you stupid loser")).toBe("harassment");
  });

  it("gives a reason for every phrase that blocks a post", () => {
    for (const phrase of HARASSMENT_PHRASES) {
      expect(flagReason(`something ${phrase} something`)).toBe("harassment");
    }
    for (const phrase of AUTO_FLAG_PHRASES) {
      expect(flagReason(`something ${phrase} something`)).not.toBeNull();
    }
  });
});

describe("how text is routed", () => {
  it("holds hostility for a moderator instead of refusing it", () => {
    // A member who keeps typing abuse is exactly what a moderator needs to
    // see, so this is held rather than silently bounced.
    expect(routeForCommunity("Die already")).toBe("review");
    expect(routeForCommunity("you are pathetic")).toBe("review");
  });

  it("refuses urgent medical content outright", () => {
    // Telling someone with chest pain that a moderator will get to their
    // post soon would invite them to wait for it.
    expect(routeForCommunity("I have chest pain since dialysis")).toBe("block");
    expect(routeForCommunity("should i skip dialysis")).toBe("block");
  });

  it("lets an ordinary message straight through", () => {
    expect(routeForCommunity("Congratulations on your transplant!")).toBe(
      "allow",
    );
  });

  it("treats empty text as unpublishable", () => {
    expect(routeForCommunity("")).toBe("block");
    expect(routeForCommunity("   ")).toBe("block");
  });
});

describe("flagDetail", () => {
  it("reports the phrase that fired, not just the category", () => {
    expect(flagDetail("Die already")).toEqual({
      category: "harassment",
      phrase: "die already",
    });
  });

  it("has nothing to report on clean text", () => {
    expect(flagDetail("Congratulations!")).toBeNull();
  });
});
