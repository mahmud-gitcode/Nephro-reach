/* Phase 12 (COLLAB): community, reviews and the landing readers on the API.
   - post + moderation: a member's post is held (with the server's own crisis
     guidance), another member cannot see it, a moderator rejects one (with a
     reason) and approves one in the admin UI, the other member then sees and
     likes it; a member is refused the moderation screen and its API;
   - review lifecycle: a member's review stays off the landing page while
     pending, a moderator approves it in the UI, the signed-out landing page
     then shows it (after the server's 60 s public cache), a decline with a
     reason reaches the member;
   - landing readers signed out: /public/reviews and /member-plans are read
     with no cookie (also from a signed-in browser), no PHI, no stored data;
   - API failure: an error state with "Try again" (never sample posts), then
     recovery; a 403 shows "not shared" with no retry;
   - retired prototype stores are purged and cannot come back.
   Synthetic data only; what is created is removed or declined again. */
import type { Page } from "@playwright/test";
import { ACCOUNTS, env } from "./fixtures/env";
import { failApi, recordApiCalls } from "./fixtures/network";
import { expect, test } from "./fixtures/test";

const tag = () => `P12E2E-${Date.now().toString(36)}`;

async function skipTour(page: Page) {
  // The member tour can cover the page on a first visit; it is not under test.
  const skip = page.getByRole("button", { name: /skip tour|skip/i });
  if (await skip.isVisible().catch(() => false)) await skip.click();
}

test.beforeEach(async ({ api }) => {
  for (const account of [ACCOUNTS.john, ACCOUNTS.grace]) {
    const client = await api(account);
    await client.post("/me/preferences/tour-completed");
  }
});

test("post + moderation: held, screened by the server, decided by a moderator @phase12", async ({
  asUser,
  api,
}) => {
  const johnApi = await api(ACCOUNTS.john);
  const graceApi = await api(ACCOUNTS.grace);
  const t = tag();
  const routine = `${t} Lemon and herbs instead of salt tonight.`;
  const crisis = `${t} I want to end my life`;
  const made: string[] = [];

  try {
    const { page } = await asUser(ACCOUNTS.john);
    await page.goto("/dashboard/community");
    await skipTour(page);

    // A routine post: held, with the "sent to a moderator" notice.
    await page.getByRole("button", { name: /create a new post/i }).click();
    await page.getByLabel("Your message").fill(routine);
    await page.getByRole("button", { name: /post to community/i }).click();
    await expect(page.getByText(/sent to a moderator/i)).toBeVisible({
      timeout: 20_000,
    });

    // A crisis phrase: the SERVER's guidance, with the emergency calls.
    const created = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/v1/community/posts") &&
        r.request().method() === "POST",
    );
    await page.getByRole("button", { name: /create a new post/i }).click();
    await page.getByLabel("Your message").fill(crisis);
    await page.getByRole("button", { name: /post to community/i }).click();
    const reply = await (await created).json();
    expect(reply.data.post.status).toBe("pending");
    expect(reply.data.safety?.offersEmergencyCall).toBe(true);
    await expect(page.getByText(reply.data.safety.titleEn)).toBeVisible();
    await expect(page.getByRole("link", { name: /call 911/i })).toHaveAttribute(
      "href",
      "tel:911",
    );

    const mine = (
      await (await johnApi.get("/me/community/posts?limit=50")).json()
    ).data as Array<{ id: string; body: string }>;
    const routineId = mine.find((p) => p.body === routine)?.id;
    const crisisId = mine.find((p) => p.body === crisis)?.id;
    expect(routineId && crisisId).toBeTruthy();
    made.push(routineId!, crisisId!);

    // Pending is not public: Grace's board does not list either.
    const { page: gracePage } = await asUser(ACCOUNTS.grace);
    await gracePage.goto("/dashboard/community");
    await skipTour(gracePage);
    await expect(gracePage.getByRole("article").first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(gracePage.getByText(t)).toHaveCount(0);

    // A member is refused the moderation screen, and its API.
    await page.goto("/dashboard/admin-community");
    await expect(page).not.toHaveURL(/admin-community/, { timeout: 20_000 });
    const direct = await page.request.get(
      `${env.apiURL}/platform/content/community/posts`,
    );
    expect(direct.status()).toBe(403);

    // The moderator decides in the UI: reject with a reason, approve.
    const { page: adminPage } = await asUser(ACCOUNTS.admin);
    await adminPage.goto("/dashboard/admin-community");
    const crisisCard = adminPage
      .getByRole("listitem")
      .filter({ hasText: crisis });
    await expect(crisisCard).toBeVisible({ timeout: 20_000 });
    await expect(crisisCard.getByText(/level 1/i)).toBeVisible();
    await crisisCard.getByRole("button", { name: /^reject$/i }).click();
    const dialog = adminPage.getByRole("dialog");
    await expect(
      dialog.getByRole("button", { name: /^reject$/i }),
    ).toBeDisabled();
    await dialog.getByLabel(/reason for rejecting/i).fill(`${t} needs care`);
    await dialog.getByRole("button", { name: /^reject$/i }).click();
    await expect(crisisCard).toHaveCount(0, { timeout: 20_000 });

    const routineCard = adminPage
      .getByRole("listitem")
      .filter({ hasText: routine });
    await routineCard
      .getByRole("button", { name: /approve and publish/i })
      .click();
    await expect(routineCard).toHaveCount(0, { timeout: 20_000 });

    // "Delete record" stays visible but disabled (D52: a decision is the
    // audit trail and there is no route), with its "not available yet" note.
    await adminPage.getByRole("tab", { name: /decided/i }).click();
    const decided = adminPage.getByRole("listitem").filter({ hasText: crisis });
    await expect(decided).toBeVisible({ timeout: 20_000 });
    await expect(decided.getByText(/you/)).toBeVisible();
    const deleteRecord = decided.getByRole("button", {
      name: /delete the record/i,
    });
    await expect(deleteRecord).toBeVisible();
    await expect(deleteRecord).toBeDisabled();
    await expect(
      decided.getByText("Deleting a decided record is not available yet."),
    ).toBeVisible();

    // Grace now sees the approved post and likes it; the count is the server's.
    await gracePage.reload();
    const post = gracePage.getByRole("article").filter({ hasText: routine });
    await expect(post).toBeVisible({ timeout: 20_000 });
    await expect(gracePage.getByText(crisis)).toHaveCount(0);
    await post.getByRole("button", { name: /like post/i }).click();
    await expect(
      post.getByRole("button", { name: /like post/i }),
    ).toHaveAttribute("aria-pressed", "true", { timeout: 20_000 });
    await expect(post.getByText("1", { exact: true })).toBeVisible();
    const board = (
      await (
        await graceApi.get("/community/posts?categoryId=general&limit=150")
      ).json()
    ).data as Array<{ id: string; likeCount: number; likedByMe: boolean }>;
    expect(board.find((p) => p.id === routineId)).toMatchObject({
      likeCount: 1,
      likedByMe: true,
    });
  } finally {
    for (const id of made)
      await johnApi.delete(`/me/community/posts/${id}`).catch(() => undefined);
  }
});

test("review lifecycle: pending off the landing, approved on it, declined with a reason @phase12", async ({
  asUser,
  api,
  browser,
}) => {
  test.setTimeout(240_000);
  const adminApi = await api(ACCOUNTS.admin);
  const t = tag();
  const comment = `${t} The lessons helped me feel ready.`;
  let reviewId: string | undefined;

  try {
    const { page } = await asUser(ACCOUNTS.grace);
    await page.goto("/dashboard/reviews");
    await page.getByRole("button", { name: /^other$/i }).click();
    await page
      .getByRole("textbox", { name: "Your role", exact: true })
      .fill("Kidney donor");
    await page.getByLabel(/your review/i).fill(comment);
    const sent = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/v1/reviews") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: /submit review/i }).click();
    const body = (await sent).request().postDataJSON();
    // No name or email: the server knows the author.
    expect(body).toEqual({
      rating: 5,
      role: "Other",
      otherRole: "Kidney donor",
      comment,
    });
    reviewId = (await (await sent).json()).data.id;
    await expect(page.getByText(/submitted for moderation/i)).toBeVisible();
    const mine = page.getByRole("article").filter({ hasText: comment });
    await expect(mine.getByText(/pending review/i)).toBeVisible({
      timeout: 20_000,
    });
    await expect(mine.getByText("Kidney donor")).toBeVisible();

    // The signed-out landing page does not show a pending review.
    const anon = await browser.newContext();
    const landing = await anon.newPage();
    await landing.goto("/");
    await expect(landing.getByText(comment).first()).toHaveCount(0);

    // The moderator approves it in the UI. The All tab is newest first, so
    // the new review is on its first page however long the pending queue is
    // (the Pending tab is oldest first, 20 a page: QA Phase 12 L1).
    const { page: adminPage } = await asUser(ACCOUNTS.admin);
    await adminPage.goto("/dashboard/admin-reviews");
    await adminPage.getByRole("tab", { name: /^all/i }).click();
    const card = adminPage
      .locator("div.rounded-card")
      .filter({ hasText: comment });
    await expect(card).toBeVisible({ timeout: 20_000 });
    await expect(card.getByText("Pending Review")).toBeVisible();
    await card.getByRole("button", { name: /accept \(publish\)/i }).click();
    await expect(card.getByText("Approved (Live on site)")).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      card.getByRole("button", { name: /accept \(publish\)/i }),
    ).toHaveCount(0);
    // Delete and Unpublish stay visible but disabled (D52), explained.
    await expect(
      card.getByRole("button", { name: "Unpublish" }),
    ).toBeDisabled();
    await expect(
      card.getByRole("button", { name: /delete review by/i }),
    ).toBeDisabled();
    await expect(card.getByText(/not available yet/)).toBeVisible();

    // The landing page shows it once the server's public cache (60 s) turns.
    await expect
      .poll(
        async () => {
          await landing.reload();
          await landing.waitForLoadState("networkidle");
          return landing.getByText(comment, { exact: false }).count();
        },
        { timeout: 120_000, intervals: [5_000, 10_000, 15_000] },
      )
      .toBeGreaterThan(0);
    await anon.close();

    // A decline needs a reason, and the member sees it.
    await adminPage.getByRole("tab", { name: /approved/i }).click();
    const approved = adminPage
      .locator("div.rounded-card")
      .filter({ hasText: comment });
    await approved.getByRole("button", { name: /decline/i }).click();
    const confirm = approved.getByRole("button", { name: /confirm decline/i });
    await expect(confirm).toBeDisabled();
    await approved.getByRole("textbox").fill(`${t} please shorten it`);
    await confirm.click();
    await expect(approved).toHaveCount(0, { timeout: 20_000 });
    await page.reload();
    const declined = page.getByRole("article").filter({ hasText: comment });
    await expect(declined.getByText(`${t} please shorten it`)).toBeVisible({
      timeout: 20_000,
    });
  } finally {
    if (reviewId)
      await adminApi
        .post(`/platform/content/reviews/${reviewId}/decline`, {
          reason: "E2E cleanup",
        })
        .catch(() => undefined);
  }
});

test("landing readers: public reads with no cookie, no PHI, nothing stored @phase12", async ({
  asUser,
  browser,
  storageClean,
}) => {
  // Signed out.
  const anon = await browser.newContext();
  const page = await anon.newPage();
  const seen: Array<{ path: string; cookie: boolean }> = [];
  page.on("request", (req) => {
    const u = new URL(req.url());
    if (u.pathname.startsWith("/api/v1/"))
      seen.push({
        path: u.pathname.replace("/api/v1", ""),
        cookie: Boolean(req.headers()["cookie"]),
      });
  });
  const reviews = page.waitForResponse((r) =>
    r.url().includes("/api/v1/public/reviews"),
  );
  await page.goto("/");
  const res = await reviews;
  expect(res.status()).toBe(200);
  const rows = (await res.json()).data as Array<Record<string, unknown>>;
  for (const row of rows)
    expect(Object.keys(row).sort()).toEqual([
      "authorName",
      "comment",
      "id",
      "rating",
      "role",
    ]);
  await page.waitForLoadState("networkidle");
  expect(seen.map((s) => s.path)).toEqual(
    expect.arrayContaining(["/public/reviews", "/member-plans"]),
  );
  expect(seen.every((s) => !s.cookie)).toBe(true);
  // The banner shows the API's reviews (first name and initial).
  if (rows.length > 0)
    await expect(
      page.getByText(String(rows[0].authorName)).first(),
    ).toBeAttached();
  await storageClean(page);
  await anon.close();

  // Signed in: the landing readers still send no cookie.
  const { page: signedIn } = await asUser(ACCOUNTS.john);
  const calls: Array<{ path: string; cookie: boolean }> = [];
  signedIn.on("request", (req) => {
    const u = new URL(req.url());
    if (/\/api\/v1\/(public\/reviews|member-plans)/.test(u.pathname))
      calls.push({
        path: u.pathname,
        cookie: Boolean(req.headers()["cookie"]),
      });
  });
  await signedIn.goto("/");
  await signedIn.waitForLoadState("networkidle");
  expect(calls.length).toBeGreaterThan(0);
  expect(calls.every((c) => !c.cookie)).toBe(true);
});

test("API failure: error, never sample posts; recovery; 403 is 'not shared' @phase12", async ({
  asUser,
}) => {
  const { page } = await asUser(ACCOUNTS.john);
  const calls = recordApiCalls(page);
  const failure = await failApi(
    page,
    /^\/community\/posts$/,
    { kind: "status", status: 500 },
    "GET",
  );
  await page.goto("/dashboard/community");
  await skipTour(page);
  await expect(page.getByText("The posts did not load")).toBeVisible({
    timeout: 20_000,
  });
  // The prototype's sample authors never stand in for a failed read.
  for (const sample of ["Marcus T.", "Linda R.", "James W.", "Rosa M."])
    await expect(page.getByText(sample)).toHaveCount(0);
  failure.lift();
  await page.getByRole("button", { name: /try again/i }).click();
  await expect(page.getByText("The posts did not load")).toHaveCount(0, {
    timeout: 20_000,
  });
  expect(calls.every((c) => c.headers["x-organization-id"] === undefined)).toBe(
    true,
  );

  // The library and Table Talk fail the same way.
  const lib = await failApi(page, /^\/library$/, {
    kind: "status",
    status: 503,
  });
  await page.goto("/dashboard/my-library");
  await expect(page.getByText(/your library did not load/i)).toBeVisible({
    timeout: 20_000,
  });
  lib.lift();

  // A 403 on a moderation screen is "not shared", with no retry.
  const { page: adminPage } = await asUser(ACCOUNTS.admin);
  await failApi(adminPage, /^\/platform\/content\/reviews$/, {
    kind: "status",
    status: 403,
    code: "access.platform_permission_required",
  });
  await adminPage.goto("/dashboard/admin-reviews");
  await expect(
    adminPage.getByText("This has not been shared with you"),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    adminPage.getByRole("button", { name: /try again/i }),
  ).toHaveCount(0);
});

test("retired Phase 12 stores are purged and never shown @phase12", async ({
  asUser,
  storageClean,
}) => {
  const { context, page } = await asUser(ACCOUNTS.john);
  await context.addInitScript(() => {
    if (sessionStorage.getItem("p12-seeded")) return;
    sessionStorage.setItem("p12-seeded", "1");
    const put = (k: string, v: unknown) =>
      localStorage.setItem(k, JSON.stringify(v));
    put("nr:community-reviews", [
      { id: "l", comment: "LEGACY-REVIEW-X", status: "approved" },
    ]);
    put("nr:community-moderation-queue", [
      { id: "l", content: "LEGACY-POST-X", status: "approved", kind: "post" },
    ]);
    put("nr:library-resources", [
      {
        id: "l",
        slug: "legacy-slug",
        titleEn: "LEGACY-LIB-X",
        published: true,
      },
    ]);
    put("nr:table-talk-episodes", [
      { id: "l", slug: "legacy-ep", titleEn: "LEGACY-EPISODE-X" },
    ]);
    put("nr:video-testimonials", [
      { id: "l", title: "LEGACY-STORY", status: "approved" },
    ]);
  });
  for (const path of [
    "/dashboard/community",
    "/dashboard/my-library",
    "/dashboard/table-talk",
    "/dashboard/reviews",
    "/dashboard",
  ]) {
    await page.goto(path);
    await skipTour(page);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/LEGACY-/)).toHaveCount(0);
  }
  const keys = await page.evaluate(() => Object.keys(localStorage));
  for (const retired of [
    "nr:community-reviews",
    "nr:community-moderation-queue",
    "nr:library-resources",
    "nr:table-talk-episodes",
    "nr:video-testimonials",
  ])
    expect(keys).not.toContain(retired);
  await storageClean(page, { forbidStrings: ["LEGACY-"] });
});
