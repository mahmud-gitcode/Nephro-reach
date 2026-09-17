/* ==========================================================================
   Classroom questions — the shapes
   --------------------------------------------------------------------------
   One question model for every place a question can appear: inside a
   lesson, as a pop-up while a video plays, in a module check, and in the
   final exam. Where it appears decides whether it is scored; what it is
   decides how it is answered.

   Six kinds, from the curriculum brief:

     multiple-choice   pick the best answer        scored
     true-false        two fixed options           scored
     scenario          a short story, then choose  scored
     matching          pair left items with right  scored
     reflection        free text                   never scored
     fill-in           named fields for the member never scored

   Every learner-facing string ships in English and Spanish, like the rest
   of the course.
   ========================================================================== */

export type QuestionKind =
  | "multiple-choice"
  | "true-false"
  | "scenario"
  | "matching"
  | "reflection"
  | "fill-in";

export interface ChoiceOption {
  id: string;
  textEn: string;
  textEs: string;
  /** Shown after this option is picked: why it is, or is not, the best one. */
  feedbackEn: string;
  feedbackEs: string;
}

export interface MatchPair {
  id: string;
  leftEn: string;
  leftEs: string;
  rightEn: string;
  rightEs: string;
}

/** Where a fill-in answer is also sent once the member saves it. */
export type FillInDestination = "workbook" | "care-team";

export interface FillInField {
  id: string;
  labelEn: string;
  labelEs: string;
}

export interface Question {
  id: string;
  kind: QuestionKind;
  promptEn: string;
  promptEs: string;

  /** Scenario only: the situation the member reads before choosing. */
  scenarioEn: string;
  scenarioEs: string;

  /** Choice kinds (multiple-choice, true-false, scenario). */
  options: ChoiceOption[];
  correctOptionId: string;

  /** Matching only. The right-hand column is shuffled for the member. */
  pairs: MatchPair[];

  /** Fill-in only. */
  fields: FillInField[];
  destination: FillInDestination;

  /** Reflection and fill-in: a nudge shown in the empty box. */
  placeholderEn: string;
  placeholderEs: string;
}

/** A question that pauses the video at a set time. */
export interface VideoQuestion {
  id: string;
  /** Seconds into the recording. */
  at: number;
  question: Question;
}

/* ---- the member's side ------------------------------------------------ */

/**
 * One saved answer.
 *
 *   choice kinds  value = option id
 *   matching      pairs = left pair id -> chosen right pair id
 *   reflection    text
 *   fill-in       fields = field id -> text
 */
export interface Answer {
  questionId: string;
  value?: string;
  pairs?: Record<string, string>;
  text?: string;
  fields?: Record<string, string>;
  answeredAt: string;
}

export type AnswerMap = Record<string, Answer>;

export interface QuizAttempt {
  id: string;
  /** "class:<id>" for an exam class, or "final". */
  quizKey: string;
  answers: AnswerMap;
  correct: number;
  total: number;
  percent: number;
  passed: boolean;
  submittedAt: string;
}

export interface Certificate {
  id: string;
  courseId: string;
  /** The name printed on the certificate, confirmed by the member. */
  name: string;
  issuedAt: string;
}

/** Everything one member has done in the classroom, beyond watching. */
export interface LearnerRecord {
  answers: AnswerMap;
  attempts: QuizAttempt[];
  certificates: Certificate[];
}
