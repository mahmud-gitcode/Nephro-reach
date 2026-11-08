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
  /** Shown after this option is picked: why it is, or is not, the best one.
   *  Absent on scored exam questions: the server sends feedback only in an
   *  attempt review (D19). */
  feedbackEn?: string;
  feedbackEs?: string;
}

export interface MatchPair {
  id: string;
  leftEn: string;
  leftEs: string;
  /** Absent on scored exam questions: the right sides come as
   *  `matchOptions`, with ids that do not reveal the pairing. */
  rightEn?: string;
  rightEs?: string;
}

/** A right-hand choice of a scored matching question (server ids). */
export interface MatchOption {
  id: string;
  textEn: string;
  textEs: string;
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
  /** The right option. Lesson (practice) questions carry it; scored exam
   *  questions never do: the server marks them (spec 019, D19). */
  correctOptionId?: string;

  /** Matching only. The right-hand column is shuffled for the member. */
  pairs: MatchPair[];
  /** Scored matching only: the right-hand choices, answered by id. */
  matchOptions?: MatchOption[];

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

/** A certificate the server issued (POST …/certificate). */
export interface Certificate {
  id: string;
  courseId: string;
  /** The verification code the server drew. */
  code: string;
  /** The name on the patient NephroReach record: the server prints it
   *  (Q-EDU-2). The member never types it. */
  nameOnCertificate: string;
  issuedAt: string;
}

/** The server answer review for one question of a submitted attempt.
 *  Present only when the course shows answers and no further attempt can
 *  benefit (D19): the attempt passed, or it was the last one allowed. */
export interface QuizReviewItem {
  questionId: string;
  correct: boolean;
  correctOptionId: string | null;
  /** Matching: each left pair id with the matchOptions id that is right. */
  correctPairs: { leftId: string; rightId: string }[];
  feedback: { optionId: string; feedbackEn: string; feedbackEs: string }[];
}

/** What a submit returns: the attempt, the attempts left (null means
 *  unlimited) and the review (null unless D19 allows it). Held in component
 *  state only: never cached or stored. */
export interface QuizSubmitResult {
  attempt: QuizAttempt;
  attemptsLeft: number | null;
  review: QuizReviewItem[] | null;
}

/** Where the member stands on the certificate, as the server reckons it. */
export interface CertificateStatus {
  lessonsDone: number;
  lessonsTotal: number;
  allLessons: boolean;
  examNeeded: boolean;
  examPassed: boolean;
  eligible: boolean;
}
