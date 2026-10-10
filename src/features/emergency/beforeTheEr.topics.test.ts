import { describe, expect, it } from "vitest";
import {
  BEFORE_THE_ER_TOPICS,
  EMERGENCY_INFORMATION,
  searchTopics,
  topicBySlug,
} from "./beforeTheEr.topics";

describe("Before the ER library", () => {
  it("holds the client's eleven topics, each with every part filled", () => {
    expect(BEFORE_THE_ER_TOPICS).toHaveLength(11);
    for (const topic of BEFORE_THE_ER_TOPICS) {
      expect(topic.reviewed, topic.slug).toBe(true);
      expect(topic.educationEn.length, topic.slug).toBeGreaterThan(0);
      expect(topic.pointsEn.length, topic.slug).toBeGreaterThan(0);
      /* The client's Dialysis Access text has "When to seek help" in place
         of a discussion list. */
      if (topic.slug !== "dialysis-access")
        expect(
          topic.questionsEn.length +
            (topic.questionGroupsEn?.flatMap((g) => g.items).length ?? 0),
          topic.slug,
        ).toBeGreaterThan(0);
      expect(topic.safetyEn.length, topic.slug).toBeGreaterThan(0);
    }
  });

  it("keeps the client's text word for word", () => {
    const fluid = topicBySlug("weight-fluid-swelling")!;
    expect(fluid.titleEn).toBe("Fluid & Swelling");
    expect(fluid.educationEn[0]).toBe(
      "When your kidneys cannot remove enough fluid, extra fluid may build up in your body. Dialysis helps remove extra fluid, but changes in your weight and swelling can still occur between treatments.",
    );
    const access = topicBySlug("dialysis-access")!;
    expect(access.pointsEn.find((p) => p.term === "Thrill or buzz")?.text).toBe(
      "A fistula or graft often has a vibration you can feel, called a thrill. Report changes or loss of this sensation promptly.",
    );
  });

  it("has the new dressing topic and splits home dialysis into HHD and PD", () => {
    expect(topicBySlug("access-dressing-concerns")?.noteEn?.title).toBe(
      "What if your dressing falls off?",
    );
    const home = topicBySlug("home-dialysis-concerns")!;
    expect(home.questionGroupsEn?.map((g) => g.items.length)).toEqual([5, 6]);
  });

  it("never uses triage wording", () => {
    const banned =
      /may mean|call (your clinic )?now|go to the er|based on your symptoms|you should go/i;
    for (const topic of BEFORE_THE_ER_TOPICS) {
      const text = [
        ...topic.educationEn,
        ...topic.pointsEn.map((p) => p.text),
        ...topic.questionsEn,
        ...topic.safetyEn,
      ].join(" ");
      expect(text, topic.slug).not.toMatch(banned);
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
    expect(searchTopics("   ")).toHaveLength(11);
    expect(searchTopics("xylophone")).toEqual([]);
  });

  it('finds the dressing topic for "my dressing fell off"', () => {
    expect(searchTopics("my dressing fell off")[0].slug).toBe(
      "access-dressing-concerns",
    );
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
