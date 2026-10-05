import { describe, expect, it } from "vitest";
import {
  BEFORE_THE_ER_TOPICS,
  EMERGENCY_INFORMATION,
  searchTopics,
  topicBySlug,
} from "./beforeTheEr.topics";

describe("Before the ER library", () => {
  it("holds the client's ten topics, each in the same three parts", () => {
    expect(BEFORE_THE_ER_TOPICS).toHaveLength(10);
    for (const topic of BEFORE_THE_ER_TOPICS) {
      expect(topic.educationEn.length).toBeGreaterThan(0);
      expect(topic.questionsEn.length).toBeGreaterThan(0);
    }
  });

  it("keeps the client's Fluid & Swelling text word for word", () => {
    const fluid = topicBySlug("weight-fluid-swelling")!;
    expect(fluid.reviewed).toBe(true);
    expect(fluid.educationEn[0]).toBe(
      "Changes in swelling or weight can be important information for your dialysis care team. Your dialysis team uses information about your weight, fluid status and dialysis treatments when managing your dialysis care.",
    );
  });

  it("never uses triage wording in any topic", () => {
    const banned =
      /may mean|call (your clinic )?now|go to the er|you should|emergency|overload|severe|serious/i;
    for (const topic of BEFORE_THE_ER_TOPICS) {
      const text = [...topic.educationEn, ...topic.questionsEn].join(" ");
      /* The ER-visit topic names the ER as a place visited, not advice. */
      const checked =
        topic.slug === "recent-er-visit-or-hospitalization"
          ? text.replace(/emergency room visits/i, "")
          : text;
      expect(checked, topic.slug).not.toMatch(banned);
    }
  });
});

describe("search is retrieval only", () => {
  it('finds Fluid & Swelling for "swollen feet"', () => {
    expect(searchTopics("swollen feet")[0].slug).toBe("weight-fluid-swelling");
  });

  it("matches word stems and returns whole topics", () => {
    expect(searchTopics("cramps after dialysis")[0].slug).toBe(
      "after-dialysis-concerns",
    );
    expect(searchTopics("no buzz in my fistula")[0].slug).toBe(
      "dialysis-access",
    );
  });

  it("returns everything for an empty query and nothing for no match", () => {
    expect(searchTopics("   ")).toHaveLength(10);
    expect(searchTopics("xylophone")).toEqual([]);
  });

  it("keeps emergency information out of results", () => {
    const all = searchTopics("chest pain breathing emergency");
    for (const topic of all) {
      expect(topic.educationEn.join(" ")).not.toContain(
        EMERGENCY_INFORMATION.en[0],
      );
    }
  });
});
