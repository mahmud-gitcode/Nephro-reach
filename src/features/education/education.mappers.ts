/* ==========================================================================
   Education: API shapes <-> classroom shapes (Phase 13)
   --------------------------------------------------------------------------
   Pure functions, no I/O. The API's course content keeps the classroom's
   field names except where noted, so most of this is renames:
   - a class's `mediaUrl` / `posterUrl` are the classroom's `mediaSrc` /
     `poster` (an empty poster shows the default picture, display only);
   - every class has a server id (a UUID, used in API calls) and a `slug`
     (used in the `/my-classroom/[day]` URL);
   - scored exam questions come blinded: no `correctOptionId`, no option
     feedback, matching as `pairs` (left sides) + `matchOptions`;
   - the learner record arrives as arrays (`progress`, `answers`) and is
     keyed here by class slug / question id for the screens;
   - attempt answers go out as arrays (`pairs: [{leftId, rightId}]`,
     `fields: [{fieldId, text}]`); saved answers come back keyed by id.
   Nothing here scores an answer: the server does (spec 019, D19).
   ========================================================================== */

import type {
  Course,
  CourseClass,
  CourseClassKind,
  CourseDocument,
  CourseModule,
  CourseTranscriptCue,
} from "./courseLibrary";
import type {
  Answer,
  AnswerMap,
  Certificate,
  CertificateStatus,
  ChoiceOption,
  FillInDestination,
  Question,
  QuestionKind,
  QuizAttempt,
  QuizReviewItem,
  QuizSubmitResult,
  VideoQuestion,
} from "./questions.types";
import type { JourneyDayProgress, JourneyDayStatus } from "./journey.types";

/* ---- API shapes (backend dto/response) --------------------------------- */

export type ApiQuestion = {
  id: string;
  kind: QuestionKind;
  promptEn: string;
  promptEs: string;
  scenarioEn: string;
  scenarioEs: string;
  options: {
    id: string;
    textEn: string;
    textEs: string;
    feedbackEn?: string;
    feedbackEs?: string;
  }[];
  correctOptionId?: string;
  pairs: {
    id: string;
    leftEn: string;
    leftEs: string;
    rightEn?: string;
    rightEs?: string;
  }[];
  matchOptions?: { id: string; textEn: string; textEs: string }[];
  fields: { id: string; labelEn: string; labelEs: string }[];
  destination: string;
  placeholderEn: string;
  placeholderEs: string;
};

export type ApiCourseClass = {
  id: string;
  moduleId: string;
  position: number;
  slug: string;
  titleEn: string;
  titleEs: string;
  summaryEn: string;
  summaryEs: string;
  kind: string;
  durationMinutes: number;
  mediaUrl: string;
  posterUrl: string;
  bodyEn: string;
  bodyEs: string;
  keyPointsEn: string[];
  keyPointsEs: string[];
  transcript: CourseTranscriptCue[];
  documents: CourseDocument[];
  activities: ApiQuestion[];
  videoQuestions: { id: string; at: number; question: ApiQuestion }[];
  updatedAt?: string;
};

export type ApiCourseModule = {
  id: string;
  courseId: string;
  position: number;
  titleEn: string;
  titleEs: string;
  classes: ApiCourseClass[];
};

export type ApiCourseSummary = {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  groupLabelEn: string;
  groupLabelEs: string;
  itemLabelEn: string;
  itemLabelEs: string;
  passMark: number;
  maxAttempts: number;
  showAnswers: boolean;
  certificateEnabled: boolean;
  requireExamPass: boolean;
  accessDaysAfterDischarge: number | null;
  status: string;
  moduleCount: number;
  classCount: number;
  totalMinutes: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiCourse = ApiCourseSummary & {
  finalExam: ApiQuestion[];
  modules: ApiCourseModule[];
};

export type ApiClassProgress = {
  classId: string;
  status: string;
  percent: number;
  note: string | null;
  completedAt: string | null;
  updatedAt: string;
};

export type ApiLearnerAnswer = {
  questionId: string;
  value?: string;
  pairs?: Record<string, string>;
  text?: string;
  fields?: Record<string, string>;
  answeredAt: string;
};

export type ApiQuizAttempt = {
  id: string;
  quizKey: string;
  correct: number;
  total: number;
  percent: number;
  passed: boolean;
  submittedAt: string;
  answers: Record<string, unknown> | null;
};

export type ApiSubmitAttempt = ApiQuizAttempt & {
  attemptsLeft: number | null;
  review: QuizReviewItem[] | null;
};

export type ApiCertificate = {
  id: string;
  courseId: string;
  code: string;
  nameOnCertificate: string;
  issuedAt: string;
};

export type ApiLearnerCourse = {
  courseId: string;
  access: { enrolled: boolean; open: boolean; accessUntil: string | null };
  percent: number;
  nextClassId: string | null;
  progress: ApiClassProgress[];
  answers: ApiLearnerAnswer[];
  attempts: ApiQuizAttempt[];
  certificate: ApiCertificate | null;
  certificateStatus: CertificateStatus;
};

export type ApiPatientEnrollment = {
  id: string;
  program: string;
  courseId: string | null;
  courseTitleEn: string;
  courseTitleEs: string;
  source: string;
  status: string;
  startDate: string | null;
  diagnosis: string | null;
  dischargedAt: string | null;
  accessUntil: string | null;
  hasAccess: boolean;
  enrolledAt: string;
  organizationId: string | null;
  organizationName: string | null;
};

/** The 21-day journey and the 3-day crash course are the two contracted
 *  programs; every other published course is one the team added since.
 *  Course slugs set by the content importer (Q-EDU-6). */
export const JOURNEY_COURSE_SLUG = "dialysis-journey-21-day";
export const CRASH_COURSE_SLUG = "kidney-failure-crash-3-day";
export const CONTRACT_COURSE_SLUGS: readonly string[] = [
  JOURNEY_COURSE_SLUG,
  CRASH_COURSE_SLUG,
];

/* ---- course content ---------------------------------------------------- */

const CLASS_KINDS: readonly CourseClassKind[] = [
  "video",
  "audio",
  "reading",
  "exam",
];
const DESTINATIONS: readonly FillInDestination[] = ["workbook", "care-team"];

function classKind(value: string): CourseClassKind {
  return (CLASS_KINDS as readonly string[]).includes(value)
    ? (value as CourseClassKind)
    : "reading";
}

export function fromApiQuestion(api: ApiQuestion): Question {
  const question: Question = {
    id: api.id,
    kind: api.kind,
    promptEn: api.promptEn ?? "",
    promptEs: api.promptEs ?? "",
    scenarioEn: api.scenarioEn ?? "",
    scenarioEs: api.scenarioEs ?? "",
    options: (api.options ?? []).map((option): ChoiceOption => {
      const mapped: ChoiceOption = {
        id: option.id,
        textEn: option.textEn,
        textEs: option.textEs,
      };
      /* Feedback only when the server sent it (lesson questions). */
      if (option.feedbackEn !== undefined)
        mapped.feedbackEn = option.feedbackEn;
      if (option.feedbackEs !== undefined)
        mapped.feedbackEs = option.feedbackEs;
      return mapped;
    }),
    pairs: (api.pairs ?? []).map((pair) => {
      const mapped: Question["pairs"][number] = {
        id: pair.id,
        leftEn: pair.leftEn,
        leftEs: pair.leftEs,
      };
      if (pair.rightEn !== undefined) mapped.rightEn = pair.rightEn;
      if (pair.rightEs !== undefined) mapped.rightEs = pair.rightEs;
      return mapped;
    }),
    fields: api.fields ?? [],
    destination: (DESTINATIONS as readonly string[]).includes(api.destination)
      ? (api.destination as FillInDestination)
      : "workbook",
    placeholderEn: api.placeholderEn ?? "",
    placeholderEs: api.placeholderEs ?? "",
  };
  if (api.correctOptionId) question.correctOptionId = api.correctOptionId;
  /* A scored matching question: the right sides come only as options. The
     member view of an exam always carries the list (even empty). */
  if (api.kind === "matching" && Array.isArray(api.matchOptions)) {
    const blinded = api.pairs.some((pair) => pair.rightEn === undefined);
    if (blinded || api.matchOptions.length > 0)
      question.matchOptions = api.matchOptions;
  }
  return question;
}

export function fromApiClass(api: ApiCourseClass): CourseClass {
  return {
    id: api.id,
    slug: api.slug,
    titleEn: api.titleEn,
    titleEs: api.titleEs,
    summaryEn: api.summaryEn,
    summaryEs: api.summaryEs,
    kind: classKind(api.kind),
    durationMinutes: api.durationMinutes,
    mediaSrc: api.mediaUrl ?? "",
    bodyEn: api.bodyEn ?? "",
    bodyEs: api.bodyEs ?? "",
    keyPointsEn: api.keyPointsEn ?? [],
    keyPointsEs: api.keyPointsEs ?? [],
    transcript: api.transcript ?? [],
    documents: api.documents ?? [],
    poster: api.posterUrl ?? "",
    activities: (api.activities ?? []).map(fromApiQuestion),
    videoQuestions: (api.videoQuestions ?? []).map((entry): VideoQuestion => ({
      id: entry.id,
      at: entry.at,
      question: fromApiQuestion(entry.question),
    })),
  };
}

const byPosition = <T extends { position: number }>(a: T, b: T) =>
  a.position - b.position;

export function fromApiModule(api: ApiCourseModule): CourseModule {
  return {
    id: api.id,
    titleEn: api.titleEn,
    titleEs: api.titleEs,
    classes: [...(api.classes ?? [])].sort(byPosition).map(fromApiClass),
  };
}

/** A course list row (no modules: the list does not send them). */
export function fromApiCourseSummary(api: ApiCourseSummary): Course {
  return {
    id: api.id,
    slug: api.slug,
    status: api.status,
    titleEn: api.titleEn,
    titleEs: api.titleEs,
    descriptionEn: api.descriptionEn,
    descriptionEs: api.descriptionEs,
    seeded: CONTRACT_COURSE_SLUGS.includes(api.slug),
    modules: [],
    groupLabelEn: api.groupLabelEn,
    groupLabelEs: api.groupLabelEs,
    itemLabelEn: api.itemLabelEn,
    itemLabelEs: api.itemLabelEs,
    passMark: api.passMark,
    maxAttempts: api.maxAttempts,
    showAnswers: api.showAnswers,
    certificateEnabled: api.certificateEnabled,
    requireExamPass: api.requireExamPass,
    accessDaysAfterDischarge: api.accessDaysAfterDischarge,
    finalExam: [],
    counts: {
      modules: api.moduleCount,
      classes: api.classCount,
      minutes: api.totalMinutes,
    },
  };
}

export function fromApiCourse(api: ApiCourse): Course {
  return {
    ...fromApiCourseSummary(api),
    finalExam: (api.finalExam ?? []).map(fromApiQuestion),
    modules: [...(api.modules ?? [])].sort(byPosition).map(fromApiModule),
  };
}

/* ---- the learner record ------------------------------------------------ */

const STATUSES: readonly JourneyDayStatus[] = [
  "not-started",
  "in-progress",
  "completed",
];

function progressStatus(value: string): JourneyDayStatus {
  return (STATUSES as readonly string[]).includes(value)
    ? (value as JourneyDayStatus)
    : "not-started";
}

/** class id -> slug, for every class of the course. */
export function slugsById(course: Course | undefined): Map<string, string> {
  const map = new Map<string, string>();
  for (const courseModule of course?.modules ?? [])
    for (const courseClass of courseModule.classes)
      map.set(courseClass.id, courseClass.slug);
  return map;
}

/** Progress rows keyed by the class slug the screens use. A row for a
 *  class the course no longer has is dropped. */
export function toProgressMap(
  rows: ApiClassProgress[],
  course: Course | undefined,
): Record<string, JourneyDayProgress> {
  const slugs = slugsById(course);
  const map: Record<string, JourneyDayProgress> = {};
  for (const row of rows) {
    const slug = slugs.get(row.classId);
    if (!slug) continue;
    map[slug] = {
      status: progressStatus(row.status),
      percent: Math.max(0, Math.min(100, Math.round(row.percent))),
      updatedAt: row.updatedAt,
    };
  }
  return map;
}

/** Notes keyed by class slug. A null note (an office reading the record)
 *  is left out, so it never reads as "the member wrote nothing". */
export function toNotesMap(
  rows: ApiClassProgress[],
  course: Course | undefined,
): Record<string, string> {
  const slugs = slugsById(course);
  const map: Record<string, string> = {};
  for (const row of rows) {
    const slug = slugs.get(row.classId);
    if (slug && typeof row.note === "string") map[slug] = row.note;
  }
  return map;
}

const asStringMap = (value: unknown): Record<string, string> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const out: Record<string, string> = {};
  for (const [key, text] of Object.entries(value))
    if (typeof text === "string") out[key] = text;
  return out;
};

export function fromApiAnswer(api: ApiLearnerAnswer): Answer {
  const answer: Answer = {
    questionId: api.questionId,
    answeredAt: api.answeredAt,
  };
  if (typeof api.value === "string") answer.value = api.value;
  if (typeof api.text === "string") answer.text = api.text;
  const pairs = asStringMap(api.pairs);
  if (pairs) answer.pairs = pairs;
  const fields = asStringMap(api.fields);
  if (fields) answer.fields = fields;
  return answer;
}

export function toAnswerMap(rows: ApiLearnerAnswer[]): AnswerMap {
  const map: AnswerMap = {};
  for (const row of rows) map[row.questionId] = fromApiAnswer(row);
  return map;
}

/** An attempt row. Its stored answers come back only to the member
 *  (staff get null); a missing map is an empty one. */
export function fromApiAttempt(api: ApiQuizAttempt): QuizAttempt {
  const answers: AnswerMap = {};
  if (api.answers && typeof api.answers === "object") {
    for (const [questionId, raw] of Object.entries(api.answers)) {
      if (raw && typeof raw === "object")
        answers[questionId] = fromApiAnswer({
          ...(raw as ApiLearnerAnswer),
          questionId,
          answeredAt: String(
            (raw as { answeredAt?: unknown }).answeredAt ?? api.submittedAt,
          ),
        });
    }
  }
  return {
    id: api.id,
    quizKey: api.quizKey,
    answers,
    correct: api.correct,
    total: api.total,
    percent: api.percent,
    passed: api.passed,
    submittedAt: api.submittedAt,
  };
}

export function fromApiSubmit(api: ApiSubmitAttempt): QuizSubmitResult {
  return {
    attempt: fromApiAttempt(api),
    attemptsLeft:
      typeof api.attemptsLeft === "number" ? api.attemptsLeft : null,
    /* D19: shown only when the server sent it; never inferred. */
    review: Array.isArray(api.review) ? api.review : null,
  };
}

export function fromApiCertificate(api: ApiCertificate): Certificate {
  return {
    id: api.id,
    courseId: api.courseId,
    code: api.code,
    nameOnCertificate: api.nameOnCertificate,
    issuedAt: api.issuedAt,
  };
}

/* ---- request bodies ---------------------------------------------------- */

export type AnswerBody = {
  value?: string;
  pairs?: { leftId: string; rightId: string }[];
  text?: string;
  fields?: { fieldId: string; text: string }[];
};

/** One answer as the API takes it (only the parts the member gave). */
export function toAnswerBody(answer: Omit<Answer, "answeredAt">): AnswerBody {
  const body: AnswerBody = {};
  if (answer.value !== undefined && answer.value !== "")
    body.value = answer.value;
  if (answer.text !== undefined) body.text = answer.text;
  if (answer.pairs)
    body.pairs = Object.entries(answer.pairs)
      .filter(([, rightId]) => rightId !== "")
      .map(([leftId, rightId]) => ({ leftId, rightId }));
  if (answer.fields)
    body.fields = Object.entries(answer.fields).map(([fieldId, text]) => ({
      fieldId,
      text,
    }));
  return body;
}

export type AttemptBody = {
  quizKey: string;
  answers: (AnswerBody & { questionId: string })[];
};

/** A whole attempt: the quiz key and every answer, nothing to score with. */
export function toAttemptBody(
  quizKey: string,
  answers: AnswerMap | Record<string, Omit<Answer, "answeredAt">>,
): AttemptBody {
  return {
    quizKey,
    answers: Object.values(answers).map((answer) => ({
      questionId: answer.questionId,
      ...toAnswerBody(answer),
    })),
  };
}

/** The lesson a question belongs to (question ids are unique within a
 *  course, the server checks it). Final-exam questions have none. */
export function classIdForQuestion(
  course: Course | undefined,
  questionId: string,
): string | undefined {
  for (const courseModule of course?.modules ?? [])
    for (const courseClass of courseModule.classes) {
      if (courseClass.activities.some((q) => q.id === questionId))
        return courseClass.id;
      if (courseClass.videoQuestions.some((v) => v.question.id === questionId))
        return courseClass.id;
    }
  return undefined;
}

/** Class media and posters: same-origin paths, or the storage origin the
 *  CSP allows (D18). Anything else is refused by the editor and not played
 *  by the classroom. "" (none) is fine. */
export function isFirstPartyMediaUrl(url: string): boolean {
  const value = url.trim();
  if (value === "") return true;
  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
  )
    return true;
  const storage = process.env.NEXT_PUBLIC_STORAGE_ORIGIN;
  if (!storage) return false;
  try {
    return new URL(value).origin === new URL(storage).origin;
  } catch {
    return false;
  }
}

/** A question as the platform API takes it. The editor keeps an empty
 *  `correctOptionId` on kinds that have no options (matching, reflection,
 *  fill-in); the API accepts the key only as a content id, so an empty one
 *  is left out. */
export function toApiQuestion(question: Question): ApiQuestion {
  const { correctOptionId, matchOptions, ...rest } = question;
  void matchOptions;
  const body = { ...rest } as ApiQuestion;
  if (correctOptionId) body.correctOptionId = correctOptionId;
  return body;
}
