/* Phase 13: education and live classes on the API (EDU-BIZ lane).
   - journey day + lesson answer: John starts the journey, answers day 1's
     question (saved by question id), finishes the day; after a reload the
     answer and the finished day come back from the server;
   - exam fail then pass with the D19 review rule: a failed final exam with
     attempts left shows the score and NO answers; a pass shows the review;
   - certificate: only after the server marks the course complete; the
     server's code and name show, and stay the same after a reload;
   - live class: register, and joining before the window says so (no link);
   - admin curriculum edit: the content team creates a course in the editor
     and publishes it, a member sees it, and a member cannot reach the
     platform routes;
   - API failure: error with retry (never an empty classroom), then
     recovery; a 403 shows "not shared" with no retry;
   - isolation: Grace's classroom never calls John's id, and her session
     cannot read his record; retired stores are purged.
   Synthetic data only. Run e2e/README.md env 06 after
   integration-evidence/phase-13/reset-learner.mjs (journey state cleared). */
import { ACCOUNTS } from "./fixtures/env";
import type { ApiClient } from "./fixtures/api";
import { failApi, recordApiCalls } from "./fixtures/network";
import { expect, test } from "./fixtures/test";

type Q = {
  id: string;
  kind: string;
  options: { id: string; textEn: string }[];
  correctOptionId?: string;
  pairs: { id: string; leftEn: string; rightEn?: string }[];
  matchOptions?: { id: string; textEn: string }[];
  fields: { id: string; labelEn: string }[];
};
type Cls = {
  id: string;
  slug: string;
  kind: string;
  activities: Q[];
  videoQuestions: { question: Q }[];
};
type Course = {
  id: string;
  slug: string;
  maxAttempts: number;
  finalExam: Q[];
  modules: { classes: Cls[] }[];
};

const JOURNEY = "dialysis-journey-21-day";

/** PUT through the setup client (the shared ApiClient has no put()). */
const put = (client: ApiClient, path: string, data: unknown) =>
  client.ctx.put(`${process.env.E2E_API_URL}${path}`, {
    headers: client.headers(),
    data,
  });

async function journey(client: ApiClient, platform = false): Promise<Course> {
  const list = (await (await client.get("/courses?limit=50")).json()).data as {
    id: string;
    slug: string;
  }[];
  const id = list.find((c) => c.slug === JOURNEY)?.id;
  if (!id) throw new Error("journey not imported (import-courses.mjs)");
  const res = await client.get(
    platform ? `/platform/courses/${id}` : `/courses/${id}`,
  );
  return (await res.json()).data as Course;
}

/** A right (or wrong) API answer, from the content team's copy. */
function answer(member: Q, full: Q, right: boolean) {
  if (member.kind === "matching") {
    const opts = member.matchOptions ?? [];
    return {
      questionId: member.id,
      pairs: member.pairs.map((p) => {
        const want = full.pairs.find((x) => x.id === p.id)?.rightEn;
        const good = opts.find((o) => o.textEn === want) ?? opts[0];
        const bad = opts.find((o) => o.id !== good.id) ?? good;
        return { leftId: p.id, rightId: right ? good.id : bad.id };
      }),
    };
  }
  if (member.kind === "reflection")
    return { questionId: member.id, text: "Synthetic." };
  if (member.kind === "fill-in")
    return {
      questionId: member.id,
      fields: member.fields.map((f) => ({ fieldId: f.id, text: "Synthetic" })),
    };
  const good = full.correctOptionId as string;
  return {
    questionId: member.id,
    value: right ? good : member.options.find((o) => o.id !== good)?.id,
  };
}

test.beforeEach(async ({ api }) => {
  for (const account of [ACCOUNTS.john, ACCOUNTS.grace]) {
    const client = await api(account);
    await client.post("/me/preferences/tour-completed");
  }
});

test("journey day and lesson answer: saved on the server and back after a reload @phase13", async ({
  asUser,
  api,
}) => {
  const john = await api(ACCOUNTS.john);
  const johnId = await john.patientId();
  const course = await journey(john);
  const { page } = await asUser(ACCOUNTS.john);
  const calls = recordApiCalls(page);

  await page.goto("/dashboard/my-classroom");
  const start = page.getByRole("button", { name: "Start the journey" });
  await expect(start.or(page.getByText(/of \d+ complete/)).first()).toBeVisible(
    { timeout: 30_000 },
  );
  if (await start.isVisible()) await start.click();
  await expect(page.getByText(/of \d+ complete/)).toBeVisible();

  const day1 = course.modules[0].classes.find(
    (c) => c.slug === "day-01",
  ) as Cls;
  const q = day1.activities[0];
  await page.goto("/dashboard/my-classroom/day-01");
  await page.getByRole("radio", { name: q.options[0].textEn }).click();
  await page.getByRole("button", { name: "Check answer" }).first().click();
  await expect(
    page.getByRole("button", { name: "Try again" }).first(),
  ).toBeVisible();
  const saved = calls.find(
    (c) => c.method === "PUT" && c.path.includes(`/answers/${q.id}`),
  );
  expect(saved?.path).toBe(
    `/patients/${johnId}/education/classes/${day1.id}/answers/${q.id}`,
  );
  expect(saved?.headers["x-organization-id"]).toBeUndefined();

  /* Every activity of the day answered: the day can be finished. */
  for (const extra of [
    ...day1.activities.slice(1),
    ...day1.videoQuestions.map((v) => v.question),
  ]) {
    const full = (
      await journey(await api(ACCOUNTS.admin), true)
    ).modules[0].classes.find((c) => c.id === day1.id)!;
    const fq = [
      ...full.activities,
      ...full.videoQuestions.map((v) => v.question),
    ].find((x) => x.id === extra.id)!;
    const { questionId, ...body } = answer(extra, fq, true);
    void questionId;
    await put(
      john,
      `/patients/${johnId}/education/classes/${day1.id}/answers/${extra.id}`,
      body,
    );
  }
  await page.reload();
  const done = page
    .getByRole("button", { name: /Mark day complete|Mark as not done/ })
    .first();
  await expect(done).toBeVisible({ timeout: 30_000 });
  if ((await done.textContent())?.includes("Mark day complete"))
    await done.click();
  await expect(
    page.getByRole("button", { name: "Mark as not done" }).first(),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("button", { name: "Try again" }).first(),
  ).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByRole("button", { name: "Mark as not done" }).first(),
  ).toBeVisible();
  const record = (
    await (
      await john.get(`/patients/${johnId}/education/courses/${course.id}`)
    ).json()
  ).data;
  expect(
    record.progress.find((p: { classId: string }) => p.classId === day1.id)
      ?.status,
  ).toBe("completed");
  expect(
    record.answers.some((a: { questionId: string }) => a.questionId === q.id),
  ).toBe(true);
});

test("final exam: a failed attempt hides the answers, a pass shows them (D19); certificate from the server @phase13", async ({
  asUser,
  api,
}) => {
  const grace = await api(ACCOUNTS.grace);
  const graceId = await grace.patientId();
  const member = await journey(grace);
  const full = await journey(await api(ACCOUNTS.admin), true);
  const fullQ = (id: string) =>
    [
      ...full.finalExam,
      ...full.modules.flatMap((m) =>
        m.classes.flatMap((c) => [
          ...c.activities,
          ...c.videoQuestions.map((v) => v.question),
        ]),
      ),
    ].find((x) => x.id === id) as Q;
  const base = `/patients/${graceId}/education`;
  const enroll = await grace.post(`${base}/enrollments`, {
    courseId: member.id,
  });
  expect([201, 409]).toContain(enroll.status());

  /* Setup through the API: every lesson finished and the module exams
     passed, so only the final exam stands between Grace and the
     certificate. The certificate page says so before the exam. */
  for (const c of member.modules.flatMap((m) => m.classes)) {
    if (c.kind === "exam") {
      await grace.post(`${base}/courses/${member.id}/attempts`, {
        quizKey: `class:${c.id}`,
        answers: c.activities.map((q) => answer(q, fullQ(q.id), true)),
      });
      continue;
    }
    for (const q of [
      ...c.activities,
      ...c.videoQuestions.map((v) => v.question),
    ]) {
      const { questionId, ...body } = answer(q, fullQ(q.id), true);
      void questionId;
      await put(grace, `${base}/classes/${c.id}/answers/${q.id}`, body);
    }
    await grace.post(`${base}/classes/${c.id}/complete`);
  }

  const { page } = await asUser(ACCOUNTS.grace);
  await page.goto("/dashboard/my-classroom/certificate");
  await expect(page.getByText("Finish these steps to unlock it.")).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByRole("button", { name: /Get my certificate/ }),
  ).toHaveCount(0);

  async function sit(right: boolean) {
    await page.goto("/dashboard/my-classroom/exam");
    await page
      .getByRole("button", { name: /^(Start|Try again)$/ })
      .first()
      .click();
    for (const q of member.finalExam) {
      const a = answer(q, fullQ(q.id), right) as {
        value?: string;
        pairs?: { leftId: string; rightId: string }[];
      };
      if (a.pairs) {
        for (const pair of a.pairs) {
          const left = q.pairs.find((p) => p.id === pair.leftId)!.leftEn;
          const text = q.matchOptions!.find(
            (o) => o.id === pair.rightId,
          )!.textEn;
          await page
            .getByLabel(`Match for ${left}`)
            .selectOption({ label: text });
        }
      } else if (a.value) {
        const text = q.options.find((o) => o.id === a.value)!.textEn;
        await page.getByRole("radio", { name: text }).first().click();
      }
    }
    await page.getByRole("button", { name: "Submit answers" }).click();
    await expect(
      page.getByRole("heading", { name: "Your result" }),
    ).toBeVisible();
  }

  await sit(false);
  await expect(page.getByText(/attempts? left/)).toBeVisible();
  await expect(page.getByText("Review your answers")).toHaveCount(0);
  await expect(
    page.getByText(
      "The right answers are shown once you pass or use your last attempt.",
    ),
  ).toBeVisible();

  await sit(true);
  await expect(page.getByText(/You passed/)).toBeVisible();
  await expect(page.getByText("Review your answers")).toBeVisible();

  /* Reloading loses the review by design: there is no review read route. */
  await page.reload();
  await expect(page.getByText("Review your answers")).toHaveCount(0);

  await page.goto("/dashboard/my-classroom/certificate");
  await page.getByRole("button", { name: /Get my certificate/ }).click();
  const code = page.getByText(/^NR-\d{4}-/);
  await expect(code).toBeVisible();
  const issued = await code.textContent();
  await page.reload();
  await expect(page.getByText(issued as string)).toBeVisible({
    timeout: 30_000,
  });
  const record = (
    await (await grace.get(`${base}/courses/${member.id}`)).json()
  ).data;
  expect(record.certificate.code).toBe(issued);
});

test("live class: register from the dashboard; joining before the window gives no link @phase13", async ({
  asUser,
  api,
}) => {
  const admin = await api(ACCOUNTS.admin);
  const starts = new Date(Date.now() + 26 * 3600_000);
  const created = await admin.post("/platform/live-classes", {
    startsAt: starts.toISOString(),
    topic: "P13 e2e class (synthetic)",
    program: "all",
    capacity: 5,
    status: "open",
    joinUrl: "https://example.test/meet/p13-e2e",
  });
  expect(created.status()).toBe(201);
  const id = (await created.json()).data.id as string;
  try {
    const { page } = await asUser(ACCOUNTS.john);
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "P13 e2e class (synthetic)" }),
    ).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText("You are registered")).toBeVisible();
    await page.getByRole("button", { name: "Join class" }).click();
    await expect(
      page.getByText("The class opens 30 minutes before it starts."),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open the class link" }),
    ).toHaveCount(0);
    /* No meeting link and no embedded player anywhere on the page (D18). */
    expect(await page.locator("iframe").count()).toBe(0);
    const john = await api(ACCOUNTS.john);
    const johnId = await john.patientId();
    await john.delete(
      `/patients/${johnId}/education/live-classes/${id}/registration`,
    );
  } finally {
    await admin.patch(`/platform/live-classes/${id}`, { status: "cancelled" });
    await admin.delete(`/platform/live-classes/${id}`);
  }
});

test("curriculum editor: the content team creates and publishes a course; members cannot use the platform routes @phase13", async ({
  asUser,
  api,
}) => {
  const title = `P13 e2e course ${Date.now().toString(36)}`;
  const { page } = await asUser(ACCOUNTS.admin);
  await page.goto("/dashboard/manage-curriculum");
  await page.getByRole("button", { name: "New Course" }).click();
  await page.getByLabel("Course name (English)").fill(title);
  await page.getByRole("button", { name: "Create course" }).click();
  const card = page.getByRole("article").filter({ hasText: title });
  await expect(card).toBeVisible({ timeout: 30_000 });
  await expect(card.getByText("draft")).toBeVisible();

  const admin = await api(ACCOUNTS.admin);
  const rows = (await (await admin.get("/platform/courses?limit=150")).json())
    .data as { id: string; titleEn: string; slug: string }[];
  const row = rows.find((r) => r.titleEn === title)!;
  /* A module and a class first: the server publishes no empty course. */
  const mod = (
    await (
      await admin.post(`/platform/courses/${row.id}/modules`, { titleEn: "M1" })
    ).json()
  ).data;
  await admin.post(`/platform/courses/${row.id}/modules/${mod.id}/classes`, {
    titleEn: "Reading one",
    kind: "reading",
  });
  try {
    await card.getByRole("link", { name: "Manage" }).click();
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Unpublish", exact: true }),
    ).toBeVisible();

    const john = await api(ACCOUNTS.john);
    const memberList = (await (await john.get("/courses?limit=50")).json())
      .data as { slug: string }[];
    expect(memberList.some((c) => c.slug === row.slug)).toBe(true);
    for (const res of [
      await john.get("/platform/courses"),
      await john.patch(`/platform/courses/${row.id}`, { titleEn: "Hacked" }),
      await john.post(`/platform/courses/${row.id}/unpublish`),
    ])
      expect(res.status()).toBe(403);

    await page.getByRole("button", { name: "Unpublish", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Publish", exact: true }),
    ).toBeVisible();
    const after = await (await john.get(`/courses/${row.id}`)).status();
    expect(after).toBe(404);
  } finally {
    await admin.delete(`/platform/courses/${row.id}`);
  }
});

test("API failure is an error with retry, and a 403 is 'not shared' with no retry @phase13", async ({
  asUser,
}) => {
  const { page } = await asUser(ACCOUNTS.john);
  const fail = await failApi(page, /\/patients\/[^/]+\/education\/courses\//, {
    kind: "status",
    status: 500,
  });
  await page.goto("/dashboard/my-classroom");
  await expect(page.getByText("Your classroom did not load")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText(/of \d+ complete/)).toHaveCount(0);
  fail.lift();
  await page.getByRole("button", { name: /Try again/ }).click();
  await expect(
    page.getByText(/of \d+ complete|Start the journey/).first(),
  ).toBeVisible();

  await page.unrouteAll({ behavior: "ignoreErrors" });
  await failApi(page, /\/patients\/[^/]+\/education\/courses\//, {
    kind: "status",
    status: 403,
    code: "access.area_not_shared",
  });
  await page.reload();
  await expect(page.getByText("This has not been shared with you")).toBeVisible(
    { timeout: 30_000 },
  );
  await expect(page.getByRole("button", { name: /Try again/ })).toHaveCount(0);
});

test("isolation: Grace never sees John's progress; retired stores are purged @phase13", async ({
  asUser,
  api,
}) => {
  const john = await api(ACCOUNTS.john);
  const johnId = await john.patientId();
  const course = await journey(john);
  const { page } = await asUser(ACCOUNTS.grace);
  const calls = recordApiCalls(page);
  await page.goto("/dashboard");
  const retired = [
    "nr:course-library",
    "nr:clinic-live-class",
    "nr:classroom-learner",
    "nr:journey-progress",
    "nr:journey-notes",
  ];
  await page.evaluate((list) => {
    for (const key of list)
      localStorage.setItem(
        key,
        JSON.stringify({
          "day-01": { status: "completed", percent: 100 },
          note: "Legacy Journey Note",
        }),
      );
  }, retired);
  await page.reload();
  await page.goto("/dashboard/my-classroom");
  await expect(
    page.getByText(/of \d+ complete|Start the journey/).first(),
  ).toBeVisible({ timeout: 30_000 });
  await page.goto("/dashboard/my-classroom/day-01");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Legacy Journey Note")).toHaveCount(0);
  expect(calls.some((c) => c.path.includes(johnId))).toBe(false);
  const left = await page.evaluate(
    (list) => list.filter((k) => localStorage.getItem(k) !== null),
    retired,
  );
  expect(left).toEqual([]);

  /* Grace's own session cannot read John's record or certificate. */
  const statuses = await page.evaluate(
    async ([api, pid, cid]) => {
      const urls = [
        `${api}/patients/${pid}/education/courses/${cid}`,
        `${api}/patients/${pid}/education/enrollments`,
        `${api}/patients/${pid}/education/live-classes`,
      ];
      const out: number[] = [];
      for (const url of urls)
        out.push((await fetch(url, { credentials: "include" })).status);
      return out;
    },
    [process.env.E2E_API_URL as string, johnId, course.id],
  );
  for (const status of statuses) expect([403, 404]).toContain(status);
});
