import { describe, expect, it } from "vitest";
import {
  activitiesDone,
  attemptsLeft,
  buildAttempt,
  dueVideoQuestion,
  emptyQuestion,
  gradeAnswer,
  hasPassed,
  isAnswered,
  parseClock,
  questionProblem,
  scoreQuiz,
  shuffledBySeed,
  withKind,
} from "./questions.rules";
import type { Answer, Question, VideoQuestion } from "./questions.types";

const answer = (questionId: string, patch: Partial<Answer>): Answer => ({
  questionId,
  answeredAt: "2026-09-17T10:00:00.000Z",
  ...patch,
});

function choice(id: string): Question {
  return {
    ...emptyQuestion("multiple-choice"),
    id,
    promptEn: "Pick one",
    options: [
      { id: "a", textEn: "A", textEs: "", feedbackEn: "", feedbackEs: "" },
      { id: "b", textEn: "B", textEs: "", feedbackEn: "", feedbackEs: "" },
    ],
    correctOptionId: "a",
  };
}

function matching(id: string): Question {
  return {
    ...emptyQuestion("matching"),
    id,
    promptEn: "Match",
    pairs: [
      { id: "p1", leftEn: "L1", leftEs: "", rightEn: "R1", rightEs: "" },
      { id: "p2", leftEn: "L2", leftEs: "", rightEn: "R2", rightEs: "" },
    ],
  };
}

const reflection: Question = {
  ...emptyQuestion("reflection"),
  id: "r",
  promptEn: "How do you feel?",
};

describe("grading", () => {
  it("marks the correct option right and any other wrong", () => {
    expect(gradeAnswer(choice("q"), answer("q", { value: "a" }))).toBe(true);
    expect(gradeAnswer(choice("q"), answer("q", { value: "b" }))).toBe(false);
  });

  it("counts an unanswered scored question as wrong", () => {
    expect(gradeAnswer(choice("q"), undefined)).toBe(false);
  });

  it("marks matching right only when every pair points at itself", () => {
    const q = matching("m");
    expect(gradeAnswer(q, answer("m", { pairs: { p1: "p1", p2: "p2" } }))).toBe(
      true,
    );
    expect(gradeAnswer(q, answer("m", { pairs: { p1: "p2", p2: "p1" } }))).toBe(
      false,
    );
  });

  it("never marks a reflection", () => {
    expect(gradeAnswer(reflection, answer("r", { text: "Fine" }))).toBeNull();
  });
});

describe("answered", () => {
  it("needs every matching pair chosen", () => {
    expect(
      isAnswered(matching("m"), answer("m", { pairs: { p1: "p1" } })),
    ).toBe(false);
  });

  it("ignores a blank reflection", () => {
    expect(isAnswered(reflection, answer("r", { text: "   " }))).toBe(false);
  });
});

describe("scoring", () => {
  const questions = [choice("q1"), choice("q2"), reflection];

  it("scores only the questions with a right answer", () => {
    const score = scoreQuiz(
      questions,
      { q1: answer("q1", { value: "a" }), q2: answer("q2", { value: "b" }) },
      50,
    );
    expect(score).toEqual({ correct: 1, total: 2, percent: 50, passed: true });
  });

  it("fails below the pass mark", () => {
    expect(scoreQuiz(questions, {}, 70).passed).toBe(false);
  });

  it("cannot fail a check with nothing to mark", () => {
    expect(scoreQuiz([reflection], {}, 70)).toMatchObject({
      percent: 100,
      passed: true,
    });
  });

  it("tracks attempts and passes per quiz", () => {
    const failed = buildAttempt("final", [choice("q1")], {}, 70);
    const passed = buildAttempt(
      "final",
      [choice("q1")],
      { q1: answer("q1", { value: "a" }) },
      70,
    );
    expect(hasPassed([failed], "final")).toBe(false);
    expect(hasPassed([failed, passed], "final")).toBe(true);
    expect(attemptsLeft([failed, passed], "final", 3)).toBe(1);
    expect(attemptsLeft([failed], "final", 0)).toBeNull();
  });
});

describe("lessons and video", () => {
  const vq: VideoQuestion = { id: "v1", at: 30, question: choice("vq") };

  it("counts a lesson done once every activity has any answer", () => {
    expect(activitiesDone([reflection], [vq], {})).toBe(false);
    expect(
      activitiesDone([reflection], [vq], {
        r: answer("r", { text: "ok" }),
        vq: answer("vq", { value: "b" }),
      }),
    ).toBe(true);
  });

  it("brings up a video question once its time has passed", () => {
    expect(dueVideoQuestion([vq], 10, {})).toBeUndefined();
    expect(dueVideoQuestion([vq], 45, {})?.id).toBe("v1");
  });

  it("does not ask again once answered or put off", () => {
    expect(
      dueVideoQuestion([vq], 45, { vq: answer("vq", { value: "a" }) }),
    ).toBeUndefined();
    expect(dueVideoQuestion([vq], 45, {}, new Set(["v1"]))).toBeUndefined();
  });
});

describe("authoring", () => {
  it("reads m:ss and plain seconds", () => {
    expect(parseClock("1:05")).toBe(65);
    expect(parseClock("90")).toBe(90);
    expect(parseClock("1:75")).toBeNull();
  });

  it("gives true/false its two fixed options", () => {
    const tf = withKind(emptyQuestion("multiple-choice"), "true-false");
    expect(tf.options.map((option) => option.id)).toEqual(["true", "false"]);
    expect(tf.correctOptionId).toBe("true");
  });

  it("asks for what is missing before a question can be saved", () => {
    expect(questionProblem(emptyQuestion("multiple-choice"))).toBe(
      "Add the question text.",
    );
    expect(questionProblem(choice("q"))).toBeNull();
  });

  it("never shows matching answers in their original order", () => {
    const pairs = matching("m").pairs;
    const shuffled = shuffledBySeed(pairs, "m");
    expect(shuffled.map((pair) => pair.id)).not.toEqual(
      pairs.map((pair) => pair.id),
    );
  });
});
