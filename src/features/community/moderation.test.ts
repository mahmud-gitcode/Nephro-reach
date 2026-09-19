import { describe, expect, it } from "vitest";
import {
  ALL_FLAG_PHRASES,
  autoReplyForText,
  canPublishToCommunity,
  checkFlaggedMedicalContent,
  detectsPersonalInfo,
  flagCategory,
  flagDetail,
  flagLevel,
  routeForCommunity,
} from "./moderation";
import {
  ACCESS_PHRASES,
  CONDUCT_PHRASES,
  CRISIS_PHRASES,
  EMERGENCY_PHRASES,
  MEDICAL_ADVICE_PHRASES,
  PRIVACY_PHRASES,
  SCAM_PHRASES,
  SYMPTOM_PHRASES,
} from "./moderation.phrases";

/* This decides whether a post on a dialysis peer-support board is published
 * or held, and what the member is told. The board once let "Die already"
 * post to a patient's milestone, and once answered every flag — including
 * chest pain and "I want to die" — with the same note about contacting your
 * dialysis clinic. */

describe("matching", () => {
  it("passes an ordinary post", () => {
    expect(
      checkFlaggedMedicalContent(
        "Had a rough run today but the cramping settled by the evening.",
      ),
    ).toBe(false);
  });

  it("matches on word boundaries, not substrings", () => {
    // The reason the check builds a boundary regex rather than calling
    // includes(): a member writing about food is not asking for money.
    expect(checkFlaggedMedicalContent("I snack on cashews between runs")).toBe(
      false,
    );
  });

  it("flags a phrase sitting against punctuation", () => {
    expect(checkFlaggedMedicalContent("...send money!")).toBe(true);
    expect(checkFlaggedMedicalContent("(scam)")).toBe(true);
  });

  it("ignores capitalisation", () => {
    expect(checkFlaggedMedicalContent("CASH APP please")).toBe(true);
    expect(checkFlaggedMedicalContent("Cash App please")).toBe(true);
  });

  it("treats empty or blank text as nothing to flag", () => {
    expect(checkFlaggedMedicalContent("")).toBe(false);
    expect(checkFlaggedMedicalContent("   ")).toBe(false);
  });

  it("fires for every phrase on every list", () => {
    // A phrase on a list that silently fails to match is the worst
    // outcome here — it reads as covered and is not.
    for (const phrase of ALL_FLAG_PHRASES) {
      expect(checkFlaggedMedicalContent(`something ${phrase} something`)).toBe(
        true,
      );
    }
  });
});

describe("the three levels", () => {
  it("puts a possible emergency at level 1", () => {
    for (const text of [
      "I have chest pain right now",
      "my husband is not breathing",
      "my catheter came out",
      "the access bleeding will not stop",
      "face drooping and trouble speaking",
    ]) {
      expect(flagLevel(text)).toBe(1);
    }
  });

  it("puts a mental health crisis at level 1, in its own category", () => {
    // Level 1, but answered in different words: someone saying they want
    // to die must not be met with a note about clinic office hours.
    expect(flagLevel("I want to die")).toBe(1);
    expect(flagCategory("I want to die")).toBe("crisis");
    expect(flagCategory("I can't take this anymore")).toBe("crisis");
    expect(flagCategory("someone is hurting me")).toBe("crisis");
  });

  it("puts care-team concerns at level 2", () => {
    for (const text of [
      "there is no bruit in my fistula",
      "my PD drain bag is cloudy",
      "I missed dialysis on Tuesday",
      "should i skip dialysis this week",
      "my potassium is high",
    ]) {
      expect(flagLevel(text)).toBe(2);
    }
  });

  it("puts conduct, scams and personal details at level 3", () => {
    expect(flagLevel("Die already")).toBe(3);
    expect(flagCategory("Die already")).toBe("conduct");
    expect(flagCategory("send me money for pills")).toBe("scam");
    expect(flagCategory("dm me your information")).toBe("privacy");
  });

  it("reads a member in trouble before a member misbehaving", () => {
    // "kill myself" is crisis and "kill yourself" is conduct; a text that
    // trips both must be treated as the former.
    expect(flagCategory("I could kill myself, you idiot")).toBe("crisis");
  });

  it("reports the phrase that fired, so the list can be audited", () => {
    expect(flagDetail("Die already")).toMatchObject({
      category: "conduct",
      level: 3,
      phrase: "die already",
    });
  });

  it("has nothing to report on clean text", () => {
    expect(flagDetail("Congratulations on your transplant!")).toBeNull();
    expect(flagLevel("")).toBeNull();
  });

  it("assigns every listed phrase to the level its list implies", () => {
    const expectations: [string[], number][] = [
      [EMERGENCY_PHRASES, 1],
      [CRISIS_PHRASES, 1],
      [ACCESS_PHRASES, 2],
      [SYMPTOM_PHRASES, 2],
      [MEDICAL_ADVICE_PHRASES, 2],
      [CONDUCT_PHRASES, 3],
      [SCAM_PHRASES, 3],
      [PRIVACY_PHRASES, 3],
    ];

    for (const [phrases, level] of expectations) {
      for (const phrase of phrases) {
        // Padding words only, so nothing in the padding can change the tier.
        expect(flagLevel(`please ${phrase} okay`)).toBe(level);
      }
    }
  });
});

describe("a story about the past", () => {
  it("eases a level 1 to level 2 rather than shouting 911", () => {
    // "I had chest pain last week at dialysis" is a member talking about
    // their care. Answering it with "call 911 now" is the false alarm
    // that teaches members to ignore the real one.
    const detail = flagDetail("I had chest pain last week at dialysis");
    expect(detail?.level).toBe(2);
    expect(detail?.softenedByContext).toBe(true);
  });

  it("still holds the post, never lets it through", () => {
    // Only ever softens, and never below level 2.
    expect(routeForCommunity("I had chest pain last week")).toBe("review");
    expect(flagLevel("I had chest pain last week")).toBe(2);
  });

  it("leaves a present-tense emergency at level 1", () => {
    const detail = flagDetail("I have chest pain and cannot breathe");
    expect(detail?.level).toBe(1);
    expect(detail?.softenedByContext).toBe(false);
  });

  it("does not ease a level 2 or 3 any further", () => {
    expect(flagLevel("I missed dialysis last week")).toBe(2);
    expect(flagLevel("you were an idiot yesterday")).toBe(3);
  });
});

describe("what may reach the board", () => {
  it("holds everything flagged, at every level", () => {
    // Held, not refused. Refusing takes away the only thing a member in
    // trouble actually did, which was ask.
    for (const text of [
      "I have chest pain",
      "I want to die",
      "should i skip dialysis",
      "Die already",
    ]) {
      expect(routeForCommunity(text)).toBe("review");
      expect(canPublishToCommunity(text)).toBe(false);
    }
  });

  it("lets an ordinary message straight through", () => {
    expect(routeForCommunity("Congratulations on your transplant!")).toBe(
      "allow",
    );
    expect(canPublishToCommunity("I brought cashews to treatment")).toBe(true);
  });

  it("treats empty text as unpublishable", () => {
    expect(routeForCommunity("")).toBe("block");
    expect(routeForCommunity("   ")).toBe("block");
  });
});

describe("what the member is told", () => {
  it("answers a possible emergency with 911 and a way to dial it", () => {
    const reply = autoReplyForText("I have chest pain right now");
    expect(reply?.tone).toBe("danger");
    expect(reply?.offersEmergencyCall).toBe(true);
    expect(reply?.body.en).toContain("911");
  });

  it("answers a mental health crisis with 988, not the clinic", () => {
    const reply = autoReplyForText("I want to die");
    expect(reply?.body.en).toContain("988");
    expect(reply?.offersEmergencyCall).toBe(true);
  });

  it("answers a care-team concern with the clinic, not a crisis line", () => {
    const reply = autoReplyForText("should i skip dialysis");
    expect(reply?.tone).toBe("warning");
    expect(reply?.offersEmergencyCall).toBe(false);
    expect(reply?.body.en).toContain("dialysis clinic");
  });

  it("answers a conduct flag without any medical advice at all", () => {
    const reply = autoReplyForText("Die already");
    expect(reply?.body.en).not.toContain("911");
    expect(reply?.body.en).toContain("support space");
  });

  it("uses the calmer wording once a level 1 has been eased", () => {
    const reply = autoReplyForText("I had chest pain last week");
    expect(reply?.offersEmergencyCall).toBe(false);
    expect(reply?.body.en).toContain("dialysis clinic");
  });

  it("never claims anyone was contacted, in any reply", () => {
    // The one promise this board must not make. A member who believes
    // their care team got the message may wait instead of calling.
    for (const text of [
      "I have chest pain",
      "I want to die",
      "should i skip dialysis",
    ]) {
      const reply = autoReplyForText(text);
      expect(reply?.body.en.toLowerCase()).toMatch(
        /has not been sent|nobody has been contacted|does not contact them for you/,
      );
    }
  });

  it("says nothing at all about clean text", () => {
    expect(autoReplyForText("Congratulations!")).toBeNull();
  });

  it("carries both languages for every reply", () => {
    for (const text of ["I have chest pain", "I want to die", "Die already"]) {
      const reply = autoReplyForText(text);
      expect(reply?.body.es.length).toBeGreaterThan(20);
      expect(reply?.title.es.length).toBeGreaterThan(5);
    }
  });
});

describe("personal information typed out", () => {
  it("spots a phone number, an email, an SSN and a card", () => {
    expect(detectsPersonalInfo("call me on (305) 555-0142")).toBe(true);
    expect(detectsPersonalInfo("email me at someone@example.com")).toBe(true);
    expect(detectsPersonalInfo("my ssn is 123-45-6789")).toBe(true);
    expect(detectsPersonalInfo("4111 1111 1111 1111")).toBe(true);
  });

  it("does not read 911 as a phone number", () => {
    // It is three digits and nothing else, and it is already caught as an
    // emergency phrase; reading it as a leak would bury that.
    expect(detectsPersonalInfo("call 911 if it gets worse")).toBe(false);
  });

  it("leaves ordinary text alone", () => {
    expect(detectsPersonalInfo("I have been on dialysis for 3 years")).toBe(
      false,
    );
    expect(detectsPersonalInfo("")).toBe(false);
  });
});
