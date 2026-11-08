import { describe, expect, it } from "vitest";
import {
  classIdForQuestion,
  fromApiAttempt,
  fromApiCertificate,
  fromApiCourse,
  fromApiSubmit,
  isFirstPartyMediaUrl,
  toAnswerBody,
  toAnswerMap,
  toApiQuestion,
  toAttemptBody,
  toNotesMap,
  toProgressMap,
  type ApiCourse,
  type ApiQuestion,
} from "./education.mappers";
import { classQuizKey, gradeAnswer } from "./questions.rules";
import { toLessons } from "./classroom";

/* Phase 13 mappers. Synthetic course content only. */

const CLASS_1 = "0b9d4c1e-1111-4a1a-8a1a-111111111111";
const CLASS_2 = "0b9d4c1e-2222-4a1a-8a1a-222222222222";
const EXAM = "0b9d4c1e-3333-4a1a-8a1a-333333333333";

const lessonQuestion: ApiQuestion = {
  id: "q-lesson",
  kind: "multiple-choice",
  promptEn: "What does dialysis do?",
  promptEs: "",
  scenarioEn: "",
  scenarioEs: "",
  options: [
    {
      id: "a",
      textEn: "Cleans the blood",
      textEs: "",
      feedbackEn: "Yes",
      feedbackEs: "",
    },
    {
      id: "b",
      textEn: "Nothing",
      textEs: "",
      feedbackEn: "No",
      feedbackEs: "",
    },
  ],
  correctOptionId: "a",
  pairs: [],
  fields: [],
  destination: "workbook",
  placeholderEn: "",
  placeholderEs: "",
};

/* As the server sends a scored question to a member: no key, no feedback,
   matching as left sides + options. */
const blindChoice: ApiQuestion = {
  ...lessonQuestion,
  id: "q-final-choice",
  options: [
    { id: "a", textEn: "Cleans the blood", textEs: "" },
    { id: "b", textEn: "Nothing", textEs: "" },
  ],
  correctOptionId: undefined,
};
const blindMatch: ApiQuestion = {
  ...lessonQuestion,
  id: "q-final-match",
  kind: "matching",
  options: [],
  correctOptionId: undefined,
  pairs: [{ id: "p-edw", leftEn: "EDW", leftEs: "" }],
  matchOptions: [{ id: "opaque-1", textEn: "Dry weight", textEs: "" }],
};

const course: ApiCourse = {
  id: "c-1",
  slug: "dialysis-journey-21-day",
  titleEn: "21-Day Dialysis Journey",
  titleEs: "",
  descriptionEn: "",
  descriptionEs: "",
  groupLabelEn: "Module",
  groupLabelEs: "Módulo",
  itemLabelEn: "Day",
  itemLabelEs: "Día",
  passMark: 70,
  maxAttempts: 3,
  showAnswers: true,
  certificateEnabled: true,
  requireExamPass: true,
  accessDaysAfterDischarge: null,
  status: "published",
  moduleCount: 1,
  classCount: 3,
  totalMinutes: 15,
  finalExam: [blindChoice, blindMatch],
  modules: [
    {
      id: "m-1",
      courseId: "c-1",
      position: 0,
      titleEn: "Foundation",
      titleEs: "",
      classes: [
        {
          id: CLASS_2,
          moduleId: "m-1",
          position: 1,
          slug: "day-02",
          titleEn: "Day 2",
          titleEs: "",
          summaryEn: "",
          summaryEs: "",
          kind: "video",
          durationMinutes: 5,
          mediaUrl: "https://video.example/day-02.mp4",
          posterUrl: "",
          bodyEn: "",
          bodyEs: "",
          keyPointsEn: [],
          keyPointsEs: [],
          transcript: [],
          documents: [],
          activities: [],
          videoQuestions: [],
        },
        {
          id: CLASS_1,
          moduleId: "m-1",
          position: 0,
          slug: "day-01",
          titleEn: "Day 1",
          titleEs: "",
          summaryEn: "",
          summaryEs: "",
          kind: "video",
          durationMinutes: 5,
          mediaUrl: "/videos/day-01.mp4",
          posterUrl: "/images/Class.jpg",
          bodyEn: "",
          bodyEs: "",
          keyPointsEn: [],
          keyPointsEs: [],
          transcript: [{ id: "cue-1", at: 0, textEn: "Hi", textEs: "Hola" }],
          documents: [],
          activities: [lessonQuestion],
          videoQuestions: [],
        },
        {
          id: EXAM,
          moduleId: "m-1",
          position: 2,
          slug: "exam-module-1",
          titleEn: "Module 1 exam",
          titleEs: "",
          summaryEn: "",
          summaryEs: "",
          kind: "exam",
          durationMinutes: 5,
          mediaUrl: "",
          posterUrl: "",
          bodyEn: "",
          bodyEs: "",
          keyPointsEn: [],
          keyPointsEs: [],
          transcript: [],
          documents: [],
          activities: [blindChoice],
          videoQuestions: [],
        },
      ],
    },
  ],
};

describe("course content from the API", () => {
  const mapped = fromApiCourse(course);

  it("orders classes by position and keeps the server id and slug apart", () => {
    const classes = mapped.modules[0].classes;
    expect(classes.map((c) => c.slug)).toEqual([
      "day-01",
      "day-02",
      "exam-module-1",
    ]);
    expect(classes[0].id).toBe(CLASS_1);
    expect(classes[0].mediaSrc).toBe("/videos/day-01.mp4");
    expect(classes[0].poster).toBe("/images/Class.jpg");
  });

  it("keeps a lesson question's key and feedback (practice feedback)", () => {
    const q = mapped.modules[0].classes[0].activities[0];
    expect(q.correctOptionId).toBe("a");
    expect(q.options[0].feedbackEn).toBe("Yes");
    expect(
      gradeAnswer(q, { questionId: q.id, value: "a", answeredAt: "" }),
    ).toBe(true);
  });

  it("never invents a key for a blinded exam question", () => {
    const [choice, match] = mapped.finalExam;
    expect(choice.correctOptionId).toBeUndefined();
    expect(choice.options[0]).not.toHaveProperty("feedbackEn");
    expect(match.matchOptions).toEqual([
      { id: "opaque-1", textEn: "Dry weight", textEs: "" },
    ]);
    expect(match.pairs[0]).not.toHaveProperty("rightEn");
    expect(
      gradeAnswer(choice, {
        questionId: choice.id,
        value: "a",
        answeredAt: "",
      }),
    ).toBeNull();
  });

  it("lessons route by slug and call the API by id; third-party media never plays (D18)", () => {
    const lessons = toLessons(mapped);
    expect(lessons[0]).toMatchObject({ slug: "day-01", classId: CLASS_1 });
    expect(lessons[0].videoSrc).toBe("/videos/day-01.mp4");
    expect(lessons[1].videoSrc).toBe("");
  });

  it("files exam attempts under class:<uuid>", () => {
    expect(classQuizKey(EXAM)).toBe(`class:${EXAM}`);
  });

  it("finds the lesson a question belongs to, and none for the final exam", () => {
    expect(classIdForQuestion(mapped, "q-lesson")).toBe(CLASS_1);
    expect(classIdForQuestion(mapped, "q-final-match")).toBeUndefined();
  });
});

describe("the learner record", () => {
  const mapped = fromApiCourse(course);
  const rows = [
    {
      classId: CLASS_1,
      status: "completed",
      percent: 100,
      note: "Ask about potassium",
      completedAt: "2026-11-01T10:00:00Z",
      updatedAt: "2026-11-01T10:00:00Z",
    },
    {
      classId: CLASS_2,
      status: "in-progress",
      percent: 42.4,
      note: null,
      completedAt: null,
      updatedAt: "2026-11-01T10:00:00Z",
    },
    {
      classId: "not-in-this-course",
      status: "completed",
      percent: 100,
      note: "x",
      completedAt: null,
      updatedAt: "2026-11-01T10:00:00Z",
    },
  ];

  it("keys progress by slug and drops rows for classes the course lacks", () => {
    expect(toProgressMap(rows, mapped)).toEqual({
      "day-01": {
        status: "completed",
        percent: 100,
        updatedAt: rows[0].updatedAt,
      },
      "day-02": {
        status: "in-progress",
        percent: 42,
        updatedAt: rows[1].updatedAt,
      },
    });
  });

  it("leaves out a null note, so an office view never reads as 'no note'", () => {
    expect(toNotesMap(rows, mapped)).toEqual({
      "day-01": "Ask about potassium",
    });
  });

  it("turns saved answers into a map, and an answer into the API's arrays", () => {
    const map = toAnswerMap([
      { questionId: "m", pairs: { p1: "x" }, answeredAt: "t" },
      { questionId: "f", fields: { f1: "Ask" }, answeredAt: "t" },
    ]);
    expect(map.m.pairs).toEqual({ p1: "x" });
    expect(
      toAnswerBody({ questionId: "m", pairs: { p1: "x", p2: "" } }),
    ).toEqual({
      pairs: [{ leftId: "p1", rightId: "x" }],
    });
    expect(toAnswerBody({ questionId: "f", fields: { f1: "Ask" } })).toEqual({
      fields: [{ fieldId: "f1", text: "Ask" }],
    });
  });

  it("sends an attempt with the quiz key and answers only — nothing to score with", () => {
    const body = toAttemptBody("final", {
      "q-final-choice": { questionId: "q-final-choice", value: "a" },
      "q-final-match": {
        questionId: "q-final-match",
        pairs: { "p-edw": "opaque-1" },
      },
    });
    expect(body).toEqual({
      quizKey: "final",
      answers: [
        { questionId: "q-final-choice", value: "a" },
        {
          questionId: "q-final-match",
          pairs: [{ leftId: "p-edw", rightId: "opaque-1" }],
        },
      ],
    });
    expect(JSON.stringify(body)).not.toMatch(/passMark|correct|percent|passed/);
  });

  it("takes the server's verdict, attempts left and review (D19: null stays null)", () => {
    const base = {
      id: "att-1",
      quizKey: "final",
      correct: 1,
      total: 2,
      percent: 50,
      passed: false,
      submittedAt: "2026-11-01T10:00:00Z",
      answers: null,
    };
    expect(
      fromApiSubmit({ ...base, attemptsLeft: 2, review: null }),
    ).toMatchObject({
      attempt: { passed: false, percent: 50, answers: {} },
      attemptsLeft: 2,
      review: null,
    });
    expect(
      fromApiSubmit({ ...base, attemptsLeft: null, review: [] }).attemptsLeft,
    ).toBeNull();
    expect(
      fromApiAttempt({ ...base, answers: { q: { value: "a" } } }).answers.q
        .value,
    ).toBe("a");
  });

  it("reads the certificate's code and the name the server printed", () => {
    expect(
      fromApiCertificate({
        id: "cert-1",
        courseId: "c-1",
        code: "NR-2026-ABC123",
        nameOnCertificate: "John Test",
        issuedAt: "2026-11-01T10:00:00Z",
      }),
    ).toMatchObject({ code: "NR-2026-ABC123", nameOnCertificate: "John Test" });
  });
});

describe("content the editor sends", () => {
  it("leaves out an empty answer key (matching, reflection, fill-in)", () => {
    const sent = toApiQuestion({
      ...fromApiCourse(course).finalExam[1],
      correctOptionId: "",
      matchOptions: undefined,
    });
    expect(sent).not.toHaveProperty("correctOptionId");
    expect(sent).not.toHaveProperty("matchOptions");
  });

  it("accepts only first-party media addresses (D18)", () => {
    expect(isFirstPartyMediaUrl("")).toBe(true);
    expect(isFirstPartyMediaUrl("/videos/day-01.mp4")).toBe(true);
    expect(isFirstPartyMediaUrl("//evil.example/x.mp4")).toBe(false);
    expect(isFirstPartyMediaUrl("https://www.youtube.com/embed/x")).toBe(false);
    expect(isFirstPartyMediaUrl("javascript:alert(1)")).toBe(false);
  });
});
