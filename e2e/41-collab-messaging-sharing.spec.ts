/* Phase 11 (COLLAB): messaging, outside shares and support on the API.
   - member <-> office thread: John writes to Riverside in the UI (the
     safety notice first), the clinic sees it unread and replies, John sees
     the reply; no nr:messaging and no data: in the browser;
   - two-office isolation: one account with two memberships (Riverside and
     Riverside Nephrology) sees only the chosen office's thread, and only
     that office's id is ever used;
   - outside share: John shares in the UI (no link to copy), the recipient
     opens the emailed link in a fresh browser, asks for the code, verifies,
     reads, replies twice and is refused a third; the link opened in John's
     own signed-in browser sends no cookie either; John stops sharing and the
     recipient's next load reads "not valid";
   - support: hospital staff open a ticket (dashboard Hospital), the
     NephroReach team sees it in the Support Inbox and answers, the staff
     member sees the answer, a resolved ticket refuses a reply;
   - API failure: an error state with Try again (never an empty inbox),
     recovery, and a 403 shows "not shared" with no retry.
   Synthetic data only: seed accounts and fresh *.example.test accounts. */
import {
  request,
  type BrowserContext,
  type Page,
  type Request,
} from "@playwright/test";
import { ApiClient, currentConsent, json } from "./fixtures/api";
import {
  ACCOUNTS,
  appOrigin,
  env,
  throwawayAccount,
  type Account,
} from "./fixtures/env";
import {
  extractLink,
  extractOtp,
  mailMark,
  waitForMail,
} from "./fixtures/mail";
import { failApi, recordApiCalls } from "./fixtures/network";
import { loginViaUi } from "./fixtures/session";
import { expect, test } from "./fixtures/test";
import { pace } from "./fixtures/throttle";

test.setTimeout(240_000);

const tag = () => `P11E2E-${Date.now().toString(36)}`;

async function skipTour(page: Page) {
  const skip = page.getByRole("button", { name: /skip tour|skip/i });
  if (await skip.isVisible().catch(() => false)) await skip.click();
}

async function noMessagingStore(page: Page) {
  const local = await page.evaluate(() => {
    const out: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      out[k] = localStorage.getItem(k) ?? "";
    }
    return out;
  });
  for (const [k, v] of Object.entries(local)) {
    expect(k).not.toBe("nr:messaging");
    expect(k).not.toBe("nr:outside-shares");
    expect(k).not.toBe("nr:support-tickets");
    expect(v.includes("data:")).toBe(false);
  }
}

/** A fresh, verified synthetic account (D6 consent sent at registration). */
async function freshAccount(label: string): Promise<Account> {
  const account = throwawayAccount(label);
  const consent = await currentConsent();
  const since = mailMark();
  await pace("register");
  const ctx = await request.newContext();
  try {
    const res = await ctx.post(`${env.apiURL}/auth/register`, {
      headers: { "X-Auth-Transport": "bearer", Origin: appOrigin },
      data: { ...account, consent },
    });
    const body = await json(res, `register ${label}`);
    const access = (body.tokens as { access: { token: string } }).access.token;
    const mail = await waitForMail(account.email, { since });
    const v = await ctx.post(`${env.apiURL}/auth/email/verify/confirm`, {
      headers: { Authorization: `Bearer ${access}`, Origin: appOrigin },
      data: { code: extractOtp(mail) },
    });
    expect(v.ok(), `verify ${label}: ${v.status()}`).toBeTruthy();
  } finally {
    await ctx.dispose();
  }
  return account;
}

async function acceptAllStaff(account: Account) {
  for (;;) {
    const client = await ApiClient.login(account);
    try {
      const list = (await json(await client.get("/me/invitations"), "mine"))
        .data as Array<{ id: string; kind: string; status: string }>;
      const next = list.find(
        (i) => i.kind === "STAFF" && i.status === "PENDING",
      );
      if (!next) return;
      const res = await client.post(`/me/invitations/${next.id}/accept`);
      expect(res.ok(), `accept: ${res.status()}`).toBeTruthy();
    } finally {
      await client.dispose();
    }
  }
}

/* The env's LOCAL S3 stand-in (E2E_STORAGE_ORIGIN, loopback only), exactly
   as e2e/52 allows it. Why here (P16f): John's Riverside thread is shared
   seed data, and other suites (the P16a member crawler) send messages with
   synthetic PNG attachments into it. The API has no way to delete a sent
   message (messages are part of the record), so the crawler cannot clean
   them up, and the thread view then loads the image from the stand-in. Every
   other host stays blocked by the shared guard. */
const storageOrigin = (() => {
  const raw = process.env.E2E_STORAGE_ORIGIN ?? "";
  if (!raw) return null;
  const u = new URL(raw);
  if (!["localhost", "127.0.0.1"].includes(u.hostname))
    throw new Error("E2E_STORAGE_ORIGIN must be the local S3 stand-in");
  return u.origin;
})();

/** Lets this context reach the env's local S3 stand-in (and nothing else).
 *  On the context, not the page, so a file opened in a new tab is covered. */
async function allowLocalStorage(context: BrowserContext) {
  if (!storageOrigin) return;
  await context.route(
    (url) => url.origin === storageOrigin,
    (route) => route.continue(),
  );
}

test.beforeEach(async ({ api }) => {
  const john = await api(ACCOUNTS.john);
  await john.post("/me/preferences/tour-completed");
});

test("member <-> office thread: start, unread, reply, read @phase11", async ({
  asUser,
  api,
  storageClean,
}) => {
  const t = tag();
  const question = `${t} Is a little swelling at the access normal?`;
  const answer = `${t} Office answer: please call us today.`;

  const member = await asUser(ACCOUNTS.john);
  await allowLocalStorage(member.context);
  const calls = recordApiCalls(member.page);
  await member.page.goto("/dashboard/messages");
  await skipTour(member.page);
  await member.page.getByRole("button", { name: "New Message" }).click();
  const dialog = member.page.getByRole("dialog");
  await expect(dialog.locator("option").first()).toBeAttached({
    timeout: 20_000,
  });
  const options = await dialog.locator("option").allTextContents();
  const office = options.find((o) => o.includes("Riverside Dialysis Center"));
  expect(office, options.join(" | ")).toBeTruthy();
  await dialog.getByLabel(/^To/).selectOption({ label: office! });
  await dialog.getByLabel(/^Message/).fill(question);
  await dialog.getByRole("button", { name: "Send" }).click();
  const notice = member.page.getByRole("dialog").filter({
    has: member.page.getByRole("button", { name: "Submit Secure Message" }),
  });
  await notice.getByRole("checkbox").check();
  /* Wait on the server's answer to the send, not only on the text on the
     page: on a production build the office can open its inbox before the
     write lands, and the inbox does not poll. */
  const sent = member.page.waitForResponse(
    (res) =>
      res.request().method() === "POST" &&
      /\/patients\/[^/]+\/conversations(\/[^/]+\/messages)?$/.test(
        new URL(res.url()).pathname,
      ),
    { timeout: 20_000 },
  );
  await notice.getByRole("button", { name: "Submit Secure Message" }).click();
  expect([200, 201]).toContain((await sent).status());
  await expect(member.page.getByText(question).first()).toBeVisible({
    timeout: 20_000,
  });
  /* Patient-side calls never carry an office header. */
  for (const c of calls.filter((x) => x.path.startsWith("/patients/")))
    expect(c.headers["x-organization-id"]).toBeUndefined();

  const clinicUi = await asUser(ACCOUNTS.clinic);
  await allowLocalStorage(clinicUi.context);
  await clinicUi.page.goto("/dashboard/clinic/messages");
  /* The row by patient, not by its preview: when the office is closed the
     server adds its automatic reply after John's message, so the preview
     shows that reply (this, not next start, made the test flaky). */
  const row = clinicUi.page
    .getByRole("listitem")
    .filter({ hasText: ACCOUNTS.john.name })
    .first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.click();
  await expect(
    clinicUi.page.getByRole("list", { name: "Messages" }).getByText(question),
  ).toBeVisible({ timeout: 20_000 });
  await clinicUi.page.getByLabel(/^Message John/).fill(answer);
  const replied = clinicUi.page.waitForResponse(
    (res) =>
      res.request().method() === "POST" &&
      /\/organizations\/[^/]+\/conversations\/[^/]+\/messages$/.test(
        new URL(res.url()).pathname,
      ),
    { timeout: 20_000 },
  );
  await clinicUi.page.getByRole("button", { name: "Send message" }).click();
  expect([200, 201]).toContain((await replied).status());
  await expect(
    clinicUi.page.getByRole("list", { name: "Messages" }).getByText(answer),
  ).toBeVisible({ timeout: 20_000 });

  await member.page.reload();
  const thread = member.page
    .getByRole("listitem")
    .filter({ hasText: "Riverside Dialysis Center" })
    .first();
  await thread.click();
  await expect(
    member.page.getByRole("list", { name: "Messages" }).getByText(answer),
  ).toBeVisible({ timeout: 20_000 });

  /* The server's unread count is cleared once John read it. */
  const johnApi = await api(ACCOUNTS.john);
  const pid = await johnApi.patientId();
  await expect
    .poll(async () => {
      const rows = (
        await json(
          await johnApi.get(`/patients/${pid}/conversations?limit=50`),
          "list",
        )
      ).data as Array<{ organizationName: string; unread: number }>;
      return rows.find(
        (r) => r.organizationName === "Riverside Dialysis Center",
      )?.unread;
    })
    .toBe(0);
  await noMessagingStore(member.page);
  await storageClean(member.page);
  await noMessagingStore(clinicUi.page);
});

/* Opens John's thread in an office inbox. The row is found by patient, not
   by its preview: when the office is closed the server adds its automatic
   reply after John's message, so the preview shows that reply and not the
   message the test looks for (the same cause as in the thread test above;
   P16f saw it on the nephrology inbox after office hours). */
async function openJohnThread(page: Page) {
  const row = page
    .getByRole("listitem")
    .filter({ hasText: ACCOUNTS.john.name })
    .first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.click();
}

test("two-office isolation: one account, two memberships, one inbox at a time @phase11 @needs-mail", async ({
  page,
  api,
}) => {
  const t = tag();
  const person = await freshAccount("p11-two-offices");
  const clinic = await api(ACCOUNTS.clinic);
  const nephrology = await api(ACCOUNTS.nephrology);
  const riverside = await clinic.orgId("DIALYSIS_CENTER");
  const neph = await nephrology.orgId("NEPHROLOGY_OFFICE");
  for (const [client, org] of [
    [clinic, riverside],
    [nephrology, neph],
  ] as const) {
    const res = await client.post(`/organizations/${org}/invitations`, {
      email: person.email,
      role: "Social Worker",
    });
    expect(res.status()).toBe(201);
  }
  await acceptAllStaff(person);

  const john = await api(ACCOUNTS.john);
  const pid = await john.patientId();
  const toA = `${t} for the dialysis center only`;
  const toB = `${t} for the nephrology office only`;
  for (const [org, body] of [
    [riverside, toA],
    [neph, toB],
  ] as const) {
    const res = await john.post(`/patients/${pid}/conversations`, {
      organizationId: org,
      body,
    });
    expect(res.status()).toBe(201);
  }

  /* John's threads hold the crawler's synthetic attachments (see
     allowLocalStorage). */
  await allowLocalStorage(page.context());
  const calls = recordApiCalls(page);
  await loginViaUi(page, person);
  await expect(page).toHaveURL(/\/select-portal/, { timeout: 20_000 });
  await page
    .getByRole("button", { name: "Open: Riverside Dialysis Center" })
    .click();
  await page.goto("/dashboard/clinic/messages");
  await openJohnThread(page);
  await expect(page.getByText(toA).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(toB)).toHaveCount(0);

  await page.getByRole("link", { name: "Switch portal" }).click();
  await expect(page).toHaveURL(/\/select-portal/);
  await page
    .getByRole("button", { name: "Open: Riverside Nephrology Associates" })
    .click();
  await page.goto("/dashboard/nephrology/messages");
  await openJohnThread(page);
  await expect(page.getByText(toB).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(toA)).toHaveCount(0);

  for (const c of calls.filter((x) => x.path.includes("/conversations"))) {
    const header = c.headers["x-organization-id"];
    if (c.path.startsWith(`/organizations/${riverside}/`))
      expect(header).toBe(riverside);
    else if (c.path.startsWith(`/organizations/${neph}/`))
      expect(header).toBe(neph);
    else expect(c.path.startsWith("/organizations/")).toBe(false);
  }
});

test("outside share: emailed link, code, two replies, stop sharing @phase11 @needs-mail", async ({
  asUser,
  browser,
  api,
}) => {
  const t = tag();
  const recipient = `p11.share.${Date.now().toString(36)}@example.test`;
  const member = await asUser(ACCOUNTS.john);
  await member.page.goto("/dashboard/messages");
  await skipTour(member.page);
  const since = mailMark();
  await member.page
    .getByRole("button", { name: "Share Outside NephroReach" })
    .click();
  const form = member.page.getByRole("dialog");
  await form.getByLabel(/Recipient's email/).fill(recipient);
  await form.getByLabel(/^Subject/).fill(`${t} subject`);
  await form.getByLabel(/^Message/).fill(`${t} synthetic shared message`);
  await form.getByRole("button", { name: "Share" }).click();
  const notice = member.page.getByRole("dialog").filter({
    has: member.page.getByRole("button", { name: "Confirm & Share" }),
  });
  await notice.getByRole("checkbox").last().check();
  await notice.getByRole("button", { name: "Confirm & Share" }).click();
  await expect(
    member.page.getByText(/A secure link was sent to the recipient/),
  ).toBeVisible({ timeout: 20_000 });
  await expect(member.page.getByText(/Copy link/)).toHaveCount(0);
  await member.page.getByRole("button", { name: "Done" }).click();

  const mail = await waitForMail(recipient, { since });
  const link = extractLink(mail, /^\/secure\/[A-Za-z0-9_-]{43}$/);

  /* The recipient: a fresh browser, no NephroReach session. */
  const outside = await browser.newContext();
  try {
    const page = await outside.newPage();
    const shared: Request[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/v1/shared/")) shared.push(req);
    });
    await page.goto(link.pathname);
    const codeSince = mailMark();
    await page.getByRole("button", { name: "Email me a code" }).click();
    await expect(page.getByText(/We sent a code to/)).toBeVisible();
    /* The code mail, not the link mail sent a moment before. */
    const codeMail = await waitForMail(recipient, {
      since: codeSince,
      subject: /verification code/i,
    });
    const code = extractOtp(codeMail);
    await page.getByLabel(/Your full name/).fill("Test Recipient");
    await page.getByLabel(/Code from the email/).fill(code);
    await page.getByRole("button", { name: "Verify and view" }).click();
    await expect(page.getByText(`${t} synthetic shared message`)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText("2 of 2 replies left")).toBeVisible();
    for (const n of [1, 2]) {
      const box = page.getByLabel(/Your reply/);
      await expect(
        page.getByRole("button", { name: "Send reply" }),
      ).toBeEnabled();
      await box.fill(`${t} reply ${n}`);
      await expect(box).toHaveValue(`${t} reply ${n}`);
      await page.getByRole("button", { name: "Send reply" }).click();
      await expect(page.getByText(`${t} reply ${n}`)).toBeVisible({
        timeout: 20_000,
      });
      if (n === 1)
        await expect(page.getByText("1 of 2 replies left")).toBeVisible();
    }
    await expect(page.getByText("You have used your replies")).toBeVisible();
    /* No cookie, no office header, no Referer on the public calls. */
    expect(shared.length).toBeGreaterThan(3);
    for (const req of shared) {
      /* What the browser actually sent. */
      const sent = await req.allHeaders();
      expect(sent["cookie"]).toBeUndefined();
      expect(sent["x-organization-id"]).toBeUndefined();
      expect(sent["referer"], `referer on ${req.url()}`).toBeUndefined();
    }
    const storage = await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    );
    expect(storage).not.toContain(link.pathname.split("/").pop()!);

    /* QA round 1 (L3): the same link opened in the member's own signed-in
       browser still sends no cookie on the /shared/ calls, although that
       browser holds the member's API session cookies. */
    const memberContext = member.page.context();
    expect(
      (await memberContext.cookies(env.apiURL)).length,
      "the member's browser holds API cookies",
    ).toBeGreaterThan(0);
    const sameBrowser = await memberContext.newPage();
    try {
      const signedIn: Request[] = [];
      sameBrowser.on("request", (req) => {
        if (req.url().includes("/api/v1/shared/")) signedIn.push(req);
      });
      await sameBrowser.goto(link.pathname);
      await expect(
        sameBrowser.getByRole("button", { name: "Email me a code" }),
      ).toBeVisible({ timeout: 20_000 });
      expect(signedIn.length).toBeGreaterThan(0);
      for (const req of signedIn) {
        const sent = await req.allHeaders();
        expect(sent["cookie"], `cookie on ${req.url()}`).toBeUndefined();
        expect(sent["x-organization-id"]).toBeUndefined();
        expect(sent["referer"], `referer on ${req.url()}`).toBeUndefined();
      }
    } finally {
      await sameBrowser.close();
    }

    /* The member stops sharing; the recipient's next load is refused. */
    await member.page.reload();
    await member.page.getByRole("button", { name: /What I've shared/ }).click();
    const item = member.page
      .getByRole("listitem")
      .filter({ hasText: `${t} subject` });
    await expect(item.getByText("Replied")).toBeVisible({ timeout: 20_000 });
    await item.getByRole("button", { name: "Stop sharing" }).click();
    await member.page
      .getByRole("button", { name: "Yes, stop sharing" })
      .click();
    await expect(item.getByText("Sharing stopped")).toBeVisible({
      timeout: 20_000,
    });
    await page.reload();
    await expect(page.getByText("This link is not valid")).toBeVisible({
      timeout: 20_000,
    });
  } finally {
    await outside.close();
  }
  await noMessagingStore(member.page);
  void api;
});

test("support ticket lifecycle: hospital staff, NephroReach team @phase11", async ({
  asUser,
  api,
}) => {
  const t = tag();
  const staff = await asUser(ACCOUNTS.hospital);
  await staff.page.goto("/dashboard/hospital/support");
  await staff.page.getByRole("button", { name: "New Request" }).click();
  await staff.page.getByLabel(/Subject/).fill(`${t} upload fails`);
  await staff.page.getByLabel(/How can we help/).fill(`${t} synthetic detail`);
  const created = staff.page.waitForResponse(
    (r) =>
      r.url().endsWith("/me/support-tickets") &&
      r.request().method() === "POST",
  );
  await staff.page
    .getByRole("dialog")
    .getByRole("button", { name: "Send" })
    .click();
  const ticket = (await (await created).json()).data as {
    id: string;
    dashboard: string;
  };
  expect(ticket.dashboard).toBe("Hospital");

  const admin = await asUser(ACCOUNTS.admin);
  await admin.page.goto("/dashboard/admin-support");
  await expect(admin.page.getByText(`${t} upload fails`).first()).toBeVisible({
    timeout: 20_000,
  });

  const adminApi = await api(ACCOUNTS.admin);
  expect(
    (
      await adminApi.post(`/platform/support-tickets/${ticket.id}/replies`, {
        body: `${t} support answer`,
      })
    ).status(),
  ).toBe(201);
  await staff.page.reload();
  await staff.page.getByText(`${t} upload fails`).first().click();
  await expect(staff.page.getByText(`${t} support answer`)).toBeVisible({
    timeout: 20_000,
  });
  expect(
    (
      await adminApi.patch(`/platform/support-tickets/${ticket.id}/status`, {
        status: "resolved",
      })
    ).status(),
  ).toBe(200);
  const hospitalApi = await api(ACCOUNTS.hospital);
  const late = await hospitalApi.post(
    `/me/support-tickets/${ticket.id}/replies`,
    { body: "one more" },
  );
  expect(late.status()).toBe(409);
  /* A non-admin is refused the platform inbox. */
  const org = await hospitalApi.orgId("HOSPITAL");
  expect(
    (await hospitalApi.get("/platform/support-tickets", org)).status(),
  ).toBe(403);
});

test("API failure: error is not empty, recovery, 403 is not shared @phase11", async ({
  asUser,
}) => {
  const { page } = await asUser(ACCOUNTS.john);
  const fail = await failApi(page, /^\/patients\/[^/]+\/conversations$/, {
    kind: "status",
    status: 500,
  });
  await page.goto("/dashboard/messages");
  await skipTour(page);
  await expect(page.getByText("Your messages did not load")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("No messages yet")).toHaveCount(0);
  fail.lift();
  await page.getByRole("button", { name: /try again/i }).click();
  await expect(page.getByText("Riverside Dialysis Center").first()).toBeVisible(
    { timeout: 20_000 },
  );

  const forbid = await failApi(page, /^\/patients\/[^/]+\/conversations$/, {
    kind: "status",
    status: 403,
    code: "access.forbidden",
  });
  await page.reload();
  await expect(page.getByText("This has not been shared with you")).toBeVisible(
    { timeout: 20_000 },
  );
  await expect(page.getByRole("button", { name: /try again/i })).toHaveCount(0);
  forbid.lift();
});
