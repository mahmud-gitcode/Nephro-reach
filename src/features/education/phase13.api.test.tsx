import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import type { MeContext } from "@/features/auth/auth.types";
import {
  apiError,
  JOHN_ID,
  memberContext,
  pageOf,
  stubApi,
  type StubCall,
  type StubHandler,
} from "@/features/profile/memberApiStub";
import MyClassroomPage from "@/app/(portal)/dashboard/(member)/my-classroom/page";
import FinalExamPage from "@/app/(portal)/dashboard/(member)/my-classroom/exam/page";
import CertificatePage from "@/app/(portal)/dashboard/(member)/my-classroom/certificate/page";
import type { ApiCourse, ApiLearnerCourse } from "./education.mappers";

/* Phase 13 against a stand-in API: the journey is found by slug, John's id
   is in every learner path, no office header, the server scores exams and
   decides the review (D19) and the certificate, legacy browser data never
   shows, and a 403 is "not shared". Synthetic data only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/my-classroom",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const COURSE_ID = "c0ffee00-0000-4000-8000-000000000001";
const DAY_1 = "c0ffee00-0000-4000-8000-0000000000d1";
const DAY_2 = "c0ffee00-0000-4000-8000-0000000000d2";
const LEARNER = `/patients/${JOHN_ID}/education/courses/${COURSE_ID}`;

function cls(id: string, slug: string, position: number) {
  return {
    id,
    moduleId: "m-1",
    position,
    slug,
    titleEn: `Lesson ${slug}`,
    titleEs: "",
    summaryEn: "",
    summaryEs: "",
    kind: "reading",
    durationMinutes: 5,
    mediaUrl: "",
    posterUrl: "",
    bodyEn: "Read this.",
    bodyEs: "",
    keyPointsEn: [],
    keyPointsEs: [],
    transcript: [],
    documents: [],
    activities: [],
    videoQuestions: [],
  };
}

const course: ApiCourse = {
  id: COURSE_ID,
  slug: "dialysis-journey-21-day",
  titleEn: "21-Day Dialysis Journey",
  titleEs: "",
  descriptionEn: "One class a day.",
  descriptionEs: "",
  groupLabelEn: "Module",
  groupLabelEs: "Módulo",
  itemLabelEn: "Day",
  itemLabelEs: "Día",
  passMark: 100,
  maxAttempts: 3,
  showAnswers: true,
  certificateEnabled: true,
  requireExamPass: true,
  accessDaysAfterDischarge: null,
  status: "published",
  moduleCount: 1,
  classCount: 2,
  totalMinutes: 10,
  finalExam: [
    {
      id: "fq-match",
      kind: "matching",
      promptEn: "Match each term.",
      promptEs: "",
      scenarioEn: "",
      scenarioEs: "",
      options: [],
      pairs: [{ id: "p-edw", leftEn: "EDW", leftEs: "" }],
      matchOptions: [
        { id: "mo-a", textEn: "Dry weight", textEs: "" },
        { id: "mo-b", textEn: "Fluid removed", textEs: "" },
      ],
      fields: [],
      destination: "workbook",
      placeholderEn: "",
      placeholderEs: "",
    },
  ],
  modules: [
    {
      id: "m-1",
      courseId: COURSE_ID,
      position: 0,
      titleEn: "Foundation",
      titleEs: "",
      classes: [cls(DAY_1, "day-01", 0), cls(DAY_2, "day-02", 1)],
    },
  ],
};

function learner(patch: Partial<ApiLearnerCourse> = {}): ApiLearnerCourse {
  return {
    courseId: COURSE_ID,
    access: { enrolled: true, open: true, accessUntil: null },
    percent: 0,
    nextClassId: DAY_1,
    progress: [],
    answers: [],
    attempts: [],
    certificate: null,
    certificateStatus: {
      lessonsDone: 0,
      lessonsTotal: 2,
      allLessons: false,
      examNeeded: true,
      examPassed: false,
      eligible: false,
    },
    ...patch,
  };
}

function content(learnerReply: () => ReturnType<StubHandler>): StubHandler {
  return (call) => {
    if (call.path === "/courses")
      return pageOf([{ ...course, finalExam: undefined, modules: undefined }]);
    if (call.path === `/courses/${COURSE_ID}`) return { data: course };
    if (call.path === LEARNER && call.method === "GET") return learnerReply();
    return undefined;
  };
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <AuthProvider>{children}</AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

/* Pages render inside the portal main landmark in the app. */
function inMain({ children }: { children: React.ReactNode }) {
  return wrapper({ children: <main>{children}</main> });
}

const patientCalls = (calls: StubCall[]) =>
  calls.filter((c) => c.path.startsWith("/patients/"));

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("the classroom on the API", () => {
  it("finds the journey by slug, reads John's record by his id, and never shows legacy progress", async () => {
    /* A prototype browser still holding a finished day: it must not show. */
    window.localStorage.setItem(
      "nr:journey-progress",
      JSON.stringify({ "day-01": { status: "completed", percent: 100 } }),
    );
    const { calls } = stubApi(content(() => ({ data: learner() })));
    render(<MyClassroomPage />, { wrapper });

    expect(
      await screen.findByRole("heading", { name: "21-Day Dialysis Journey" }),
    ).toBeInTheDocument();
    expect(screen.getByText("0 of 2 complete")).toBeInTheDocument();
    const learnerCalls = patientCalls(calls);
    expect(learnerCalls.length).toBeGreaterThan(0);
    for (const call of learnerCalls) {
      expect(call.path.startsWith(`/patients/${JOHN_ID}/`)).toBe(true);
      expect(call.headers["x-organization-id"]).toBeUndefined();
      expect(call.method).toBe("GET");
    }
  });

  it("offers 'Start the journey' when not enrolled and enrolls with the course id only", async () => {
    let enrolled = false;
    const { calls } = stubApi((call) => {
      if (
        call.path === `/patients/${JOHN_ID}/education/enrollments` &&
        call.method === "POST"
      ) {
        enrolled = true;
        return { status: 201, data: { id: "e-1" } };
      }
      return content(() => ({
        data: learner({
          access: { enrolled, open: enrolled, accessUntil: null },
        }),
      }))(call);
    });
    render(<MyClassroomPage />, { wrapper });
    await userEvent.click(
      await screen.findByRole("button", { name: /Start the journey/ }),
    );
    await waitFor(() => expect(enrolled).toBe(true));
    const post = calls.find((c) => c.method === "POST");
    expect(post?.body).toEqual({ courseId: COURSE_ID });
    expect(await screen.findByText("0 of 2 complete")).toBeInTheDocument();
  });

  it("shows 'not shared' for a caregiver without the education grant, and no course figures", async () => {
    const caregiver: MeContext = {
      ...memberContext(),
      patient: null,
      caregiving: [
        {
          grantId: "g-1",
          patientId: JOHN_ID,
          firstName: "John",
          lastName: "Test",
          relationship: "Family",
          preset: "custom",
          permissions: { labs: 1 },
        },
      ],
    };
    stubApi(
      content(() => apiError(403, "access.area_not_shared")),
      caregiver,
    );
    render(<MyClassroomPage />, { wrapper });
    expect(
      await screen.findByText("This has not been shared with you"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/of 2 complete/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Try again/ }),
    ).not.toBeInTheDocument();
  });

  it("an API failure is an error with a retry, not an empty classroom", async () => {
    stubApi(content(() => apiError(500, null)));
    render(<MyClassroomPage />, { wrapper });
    expect(
      await screen.findByText("Your classroom did not load"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Try again/ }),
    ).toBeInTheDocument();
  });
});

describe("the final exam (server scoring, D19)", () => {
  async function takeExam(reply: StubHandler) {
    const handler: StubHandler = (call) =>
      call.path === `${LEARNER}/attempts`
        ? reply(call)
        : content(() => ({ data: learner() }))(call);
    const { calls } = stubApi(handler);
    render(<FinalExamPage />, { wrapper: inMain });
    await userEvent.click(await screen.findByRole("button", { name: "Start" }));
    /* The scored matching offers the server's options, never the key. */
    const select = screen.getByLabelText("Match for EDW");
    expect(
      Array.from((select as HTMLSelectElement).options).map((o) => o.value),
    ).toEqual(["", "mo-a", "mo-b"]);
    expect(screen.queryByText("Correct")).not.toBeInTheDocument();
    await userEvent.selectOptions(select, "mo-b");
    await userEvent.click(
      screen.getByRole("button", { name: "Submit answers" }),
    );
    return calls;
  }

  const attempt = (passed: boolean) => ({
    id: "att-1",
    quizKey: "final",
    correct: passed ? 1 : 0,
    total: 1,
    percent: passed ? 100 : 0,
    passed,
    submittedAt: "2026-11-01T10:00:00Z",
    answers: null,
  });

  it("a failed attempt with attempts left shows the score and no answers", async () => {
    const calls = await takeExam(() => ({
      status: 201,
      data: { ...attempt(false), attemptsLeft: 2, review: null },
    }));
    expect(await screen.findByText(/2 attempts left/)).toBeInTheDocument();
    expect(screen.queryByText("Review your answers")).not.toBeInTheDocument();
    expect(screen.queryByText("Correct")).not.toBeInTheDocument();
    const post = calls.find((c) => c.path === `${LEARNER}/attempts`);
    expect(post?.body).toEqual({
      quizKey: "final",
      answers: [
        {
          questionId: "fq-match",
          pairs: [{ leftId: "p-edw", rightId: "mo-b" }],
        },
      ],
    });
  });

  it("shows the review only when the server sends one (pass or last attempt)", async () => {
    await takeExam(() => ({
      status: 201,
      data: {
        ...attempt(false),
        attemptsLeft: 0,
        review: [
          {
            questionId: "fq-match",
            correct: false,
            correctOptionId: null,
            correctPairs: [{ leftId: "p-edw", rightId: "mo-a" }],
            feedback: [],
          },
        ],
      },
    }));
    expect(await screen.findByText("Review your answers")).toBeInTheDocument();
    expect(screen.getByText("Not quite")).toBeInTheDocument();
    expect(screen.getByText(/Answer:/).textContent).toContain("Dry weight");
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("a 409 says no attempts are left; a 400 keeps the answers and counts nothing", async () => {
    await takeExam(() => apiError(409, "education.attempts_used_up"));
    expect(
      await screen.findByText("You have no attempts left for this check."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Try again|Start/ }),
    ).toBeDisabled();
    cleanup();
    vi.unstubAllGlobals();
    await takeExam(() => apiError(400, "education.answer_does_not_fit"));
    expect(
      await screen.findByText(/this attempt was not counted/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Submit answers" }),
    ).toBeInTheDocument();
  });
});

describe("the certificate (server only)", () => {
  it("offers nothing to claim until the server says eligible", async () => {
    stubApi(content(() => ({ data: learner() })));
    render(<CertificatePage />, { wrapper });
    expect(
      await screen.findByText("Finish these steps to unlock it."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Get my certificate/ }),
    ).not.toBeInTheDocument();
  });

  it("asks with no body and shows the code and the name the server printed", async () => {
    let issued = false;
    const status = {
      lessonsDone: 2,
      lessonsTotal: 2,
      allLessons: true,
      examNeeded: true,
      examPassed: true,
      eligible: true,
    };
    const certificate = {
      id: "cert-1",
      courseId: COURSE_ID,
      code: "NR-2026-K7Q2XA",
      nameOnCertificate: "John Test",
      issuedAt: "2026-11-01T10:00:00Z",
    };
    const { calls } = stubApi((call) => {
      if (call.path === `${LEARNER}/certificate`) {
        issued = true;
        return { status: 201, data: certificate };
      }
      return content(() => ({
        data: learner({
          certificateStatus: status,
          certificate: issued ? certificate : null,
        }),
      }))(call);
    });
    render(<CertificatePage />, { wrapper: inMain });
    /* No name box: the server prints the name on the patient's record. */
    expect(
      await screen.findByText(/name on your NephroReach record/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: /Get my certificate/ }),
    );
    expect(await screen.findByText("NR-2026-K7Q2XA")).toBeInTheDocument();
    expect(screen.getByText("John Test")).toBeInTheDocument();
    const post = calls.find((c) => c.path === `${LEARNER}/certificate`);
    expect(post?.method).toBe("POST");
    expect(post?.body).toBeUndefined();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
