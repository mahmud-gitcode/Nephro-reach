/* ==========================================================================
   Education: one function per server operation (ADR 0007 §1, Phase 13)
   --------------------------------------------------------------------------
   - Catalogue: GET /courses (published only, paged) and /courses/:id
     (scored questions blinded by the server).
   - Learner record: /patients/:pid/education/courses/:cid (+ class
     progress, notes, lesson answers, exam attempts, the certificate).
   - Enrollments: /patients/:pid/education/enrollments.
   - Content team: /platform/courses/** and /platform/course-media
     (platform `content` permission; the server refuses everyone else).
   No function here reads or writes browser storage.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import { patientPath } from "@/features/profile/patientScope";
import type {
  AnswerBody,
  ApiCertificate,
  ApiClassProgress,
  ApiCourse,
  ApiCourseClass,
  ApiCourseModule,
  ApiCourseSummary,
  ApiLearnerAnswer,
  ApiLearnerCourse,
  ApiPatientEnrollment,
  ApiQuestion,
  ApiSubmitAttempt,
  AttemptBody,
} from "./education.mappers";

const enc = encodeURIComponent;

/* ---- catalogue (any signed-in user) ------------------------------------ */

export const listPublishedCourses = (params: PageParams) =>
  fetchPage<ApiCourseSummary>("/courses", params);

export const getPublishedCourse = (courseId: string) =>
  api<ApiCourse>(`/courses/${enc(courseId)}`);

/* ---- the learner record (patient area `education`) --------------------- */

const learnerCourse = (scope: PatientScope, courseId: string) =>
  patientPath(scope, `/education/courses/${enc(courseId)}`);
const learnerClass = (scope: PatientScope, classId: string) =>
  patientPath(scope, `/education/classes/${enc(classId)}`);

export const getLearnerCourse = (scope: PatientScope, courseId: string) =>
  api<ApiLearnerCourse>(learnerCourse(scope, courseId));

export const openClass = (scope: PatientScope, classId: string) =>
  api<ApiClassProgress>(`${learnerClass(scope, classId)}/open`, {
    method: "POST",
  });

export const recordWatched = (
  scope: PatientScope,
  classId: string,
  percent: number,
) =>
  api<ApiClassProgress>(`${learnerClass(scope, classId)}/watched`, {
    method: "POST",
    body: { percent },
  });

export const completeClass = (scope: PatientScope, classId: string) =>
  api<ApiClassProgress>(`${learnerClass(scope, classId)}/complete`, {
    method: "POST",
  });

export const reopenClass = (scope: PatientScope, classId: string) =>
  api<ApiClassProgress>(`${learnerClass(scope, classId)}/reopen`, {
    method: "POST",
  });

export const saveClassNote = (
  scope: PatientScope,
  classId: string,
  note: string,
) =>
  api<ApiClassProgress>(`${learnerClass(scope, classId)}/note`, {
    method: "PUT",
    body: { note },
  });

export const saveLessonAnswer = (
  scope: PatientScope,
  classId: string,
  questionId: string,
  body: AnswerBody,
) =>
  api<ApiLearnerAnswer>(
    `${learnerClass(scope, classId)}/answers/${enc(questionId)}`,
    { method: "PUT", body },
  );

export const clearLessonAnswer = (
  scope: PatientScope,
  classId: string,
  questionId: string,
) =>
  api<unknown>(`${learnerClass(scope, classId)}/answers/${enc(questionId)}`, {
    method: "DELETE",
  });

export const submitQuizAttempt = (
  scope: PatientScope,
  courseId: string,
  body: AttemptBody,
) =>
  api<ApiSubmitAttempt>(`${learnerCourse(scope, courseId)}/attempts`, {
    method: "POST",
    body,
  });

/** No body: the server checks eligibility and prints the chart name. */
export const issueCertificate = (scope: PatientScope, courseId: string) =>
  api<ApiCertificate>(`${learnerCourse(scope, courseId)}/certificate`, {
    method: "POST",
  });

/* ---- enrollments ------------------------------------------------------- */

export const listMyEnrollments = (scope: PatientScope, params: PageParams) =>
  fetchPage<ApiPatientEnrollment>(
    patientPath(scope, "/education/enrollments"),
    params,
  );

export const selfEnroll = (scope: PatientScope, courseId: string) =>
  api<ApiPatientEnrollment>(patientPath(scope, "/education/enrollments"), {
    method: "POST",
    body: { courseId },
  });

/* ---- the content team (platform `content`) ----------------------------- */

export type PlatformCourseBody = Partial<{
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
  finalExam: ApiQuestion[];
}>;

export type PlatformClassBody = Partial<
  Omit<ApiCourseClass, "id" | "moduleId" | "position" | "updatedAt">
>;

const platformCourse = (courseId: string) =>
  `/platform/courses/${enc(courseId)}`;

export const listPlatformCourses = (
  params: PageParams & { status?: string },
) => {
  const { status, ...page } = params;
  return fetchPage<ApiCourseSummary>("/platform/courses", page, {
    query: status ? { status } : undefined,
  });
};

export const getPlatformCourse = (courseId: string) =>
  api<ApiCourse>(platformCourse(courseId));

export const createPlatformCourse = (body: PlatformCourseBody) =>
  api<ApiCourse>("/platform/courses", { method: "POST", body });

export const updatePlatformCourse = (
  courseId: string,
  body: PlatformCourseBody,
) => api<ApiCourse>(platformCourse(courseId), { method: "PATCH", body });

export const deletePlatformCourse = (courseId: string) =>
  api<unknown>(platformCourse(courseId), { method: "DELETE" });

export type CourseStatusAction = "publish" | "unpublish" | "archive";

export const setPlatformCourseStatus = (
  courseId: string,
  action: CourseStatusAction,
) =>
  api<ApiCourseSummary>(`${platformCourse(courseId)}/${action}`, {
    method: "POST",
  });

export const createPlatformModule = (
  courseId: string,
  body: { titleEn: string; titleEs?: string },
) =>
  api<ApiCourseModule>(`${platformCourse(courseId)}/modules`, {
    method: "POST",
    body,
  });

export const updatePlatformModule = (
  courseId: string,
  moduleId: string,
  body: { titleEn?: string; titleEs?: string },
) =>
  api<ApiCourseModule>(`${platformCourse(courseId)}/modules/${enc(moduleId)}`, {
    method: "PATCH",
    body,
  });

export const deletePlatformModule = (courseId: string, moduleId: string) =>
  api<unknown>(`${platformCourse(courseId)}/modules/${enc(moduleId)}`, {
    method: "DELETE",
  });

export const createPlatformClass = (
  courseId: string,
  moduleId: string,
  body: PlatformClassBody,
) =>
  api<ApiCourseClass>(
    `${platformCourse(courseId)}/modules/${enc(moduleId)}/classes`,
    { method: "POST", body },
  );

export const updatePlatformClass = (
  courseId: string,
  classId: string,
  body: PlatformClassBody,
) =>
  api<ApiCourseClass>(`${platformCourse(courseId)}/classes/${enc(classId)}`, {
    method: "PATCH",
    body,
  });

export const deletePlatformClass = (courseId: string, classId: string) =>
  api<unknown>(`${platformCourse(courseId)}/classes/${enc(classId)}`, {
    method: "DELETE",
  });

/** Makes an uploaded PUBLIC file course content; returns its address. */
export const claimCourseMedia = (fileId: string) =>
  api<{ url: string; contentType: string }>("/platform/course-media", {
    method: "POST",
    body: { fileId },
  });
