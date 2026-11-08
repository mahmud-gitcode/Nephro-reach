/* Phase 10: vascular access, rides and referrals on the API (OFFICE lane C).
   - J10-1: the member reports a concern with a photo, sent to the access
     center only: the photo is uploaded first and sent by file id; the
     access center sees it with the photo (through the record link); the
     dialysis center never gets it;
   - J10-2: the access center books a visit, the member asks for a ride, the
     dialysis center's Social Worker acknowledges and confirms it (HH:mm);
     the member sees the provider and the pickup time; a Nurse (no transport
     level, D4/PM-2) gets no ride controls and the server refuses her;
   - J10-3: a private message reaches the dialysis center only as the
     "hidden" placeholder; shared again, the body shows;
   - J10-4: the nephrology office sends a referral to an access center
     picked from the directory (by id); the access center acknowledges and
     replies; the office reads the reply; other offices cannot open it;
   - cross-office isolation with one account in two offices;
   - API failure: an error with retry (never an empty record), recovery,
     and a 403 as "not shared";
   - storage: no nr:vascular-access, no data: images.
   Synthetic data only: seed accounts, fresh *.example.test accounts and a
   P10 test office. Rows made here are removed again where the API allows.

   Uploads go to the env's LOCAL S3 stand-in (E2E_STORAGE_ORIGIN, loopback
   only); this spec lets the page reach that one origin. Every other host
   stays blocked by the shared guard. */
import { request, type Page } from "@playwright/test";
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

const NURSE: Account = {
  email: "nurse@nephroreach.com",
  password: "staff123",
  name: "Nurse (seed)",
};

/* A 1x1 PNG, synthetic. */
const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8cfc0f01f0005000201a5f5b2a40000000049454e44ae426082",
  "hex",
);

const storageOrigin = (() => {
  const raw = process.env.E2E_STORAGE_ORIGIN ?? "";
  if (!raw) return null;
  const u = new URL(raw);
  if (!["localhost", "127.0.0.1"].includes(u.hostname))
    throw new Error("E2E_STORAGE_ORIGIN must be the local S3 stand-in");
  return u.origin;
})();

/** Lets this page reach the env's local S3 stand-in (and nothing else). */
async function allowLocalStorage(page: Page) {
  if (!storageOrigin) return;
  await page.route(
    (url) => url.origin === storageOrigin,
    (route) => route.continue(),
  );
}

const day = (offset: number) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + offset * 86_400_000));

type Profile = {
  id: string;
  accessCenter: { id: string; name: string };
  dialysisCenter: { id: string } | null;
};

/** John's seeded record at Metro (dialysis center Riverside). */
async function johnAtMetro(john: ApiClient) {
  const johnId = await john.patientId();
  const list = (
    await json(
      await john.get(`/patients/${johnId}/access-profiles?limit=50`),
      "profiles",
    )
  ).data as Profile[];
  const metro = list.find((p) =>
    p.accessCenter.name.startsWith("Metro Vascular"),
  );
  if (!metro) throw new Error("seed: John has no record at Metro");
  return { johnId, profileId: metro.id, several: list.length > 1 };
}

/** On the member page, open the Metro record when there are several. */
async function openMetro(page: Page, several: boolean) {
  await page.goto("/dashboard/vascular-access");
  if (several) {
    const pick = page.getByLabel("Access center");
    await expect(pick).toBeVisible({ timeout: 30_000 });
    const label = await pick
      .locator("option", { hasText: "Metro Vascular" })
      .textContent();
    await pick.selectOption({ label: label!.trim() });
  }
  await expect(
    page.getByRole("button", { name: /report a concern/i }),
  ).toBeVisible({ timeout: 30_000 });
}

async function confirmSafety(page: Page) {
  const notice = page.getByRole("dialog", { name: /health & safety notice/i });
  await notice.getByRole("checkbox").check();
  await notice.getByRole("button", { name: "Submit Secure Message" }).click();
}

async function noAccessStorage(page: Page) {
  const dump = await page.evaluate(() => {
    const out: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      out[k] = localStorage.getItem(k) ?? "";
    }
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)!;
      out[`session:${k}`] = sessionStorage.getItem(k) ?? "";
    }
    return out;
  });
  expect(Object.keys(dump)).not.toContain("nr:vascular-access");
  expect(JSON.stringify(dump)).not.toContain("data:image");
}

test.beforeEach(async ({ api }) => {
  for (const account of [ACCOUNTS.john]) {
    const client = await api(account);
    await client.post("/me/preferences/tour-completed");
  }
});

test("J10-1: a concern with a photo goes to the access center only @phase10 @needs-storage", async ({
  asUser,
  api,
  storageClean,
}) => {
  test.skip(!storageOrigin, "E2E_STORAGE_ORIGIN (local S3 stand-in) not set");
  const john = await api(ACCOUNTS.john);
  const clinic = await api(ACCOUNTS.clinic);
  const { johnId, profileId, several } = await johnAtMetro(john);
  const riverside = await clinic.orgId("DIALYSIS_CENTER");
  const token = `P10 swelling ${Date.now().toString(36)} (synthetic)`;

  const { page } = await asUser(ACCOUNTS.john);
  await allowLocalStorage(page);
  const calls = recordApiCalls(page);
  let concernId: string | undefined;
  try {
    await openMetro(page, several);
    await page.getByRole("button", { name: /report a concern/i }).click();
    const dialog = page.getByRole("dialog", {
      name: "Report an Access Concern",
    });
    await dialog.getByRole("button", { name: "Swelling" }).click();
    await dialog.getByLabel(/^Details/).fill(token);
    /* Both are chosen by default: send it to the access center only. */
    await dialog.getByRole("button", { name: "Dialysis center" }).click();
    await dialog.locator('input[type="file"]').setInputFiles({
      name: "arm.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    await expect(dialog.getByAltText("Photo to send")).toBeVisible();
    await dialog.getByRole("button", { name: "Send Report" }).click();
    const saved = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r
          .url()
          .endsWith(
            `/patients/${johnId}/access-profiles/${profileId}/concerns`,
          ),
      { timeout: 60_000 },
    );
    await confirmSafety(page);
    expect((await saved).status()).toBe(201);
    await expect(dialog).toBeHidden({ timeout: 30_000 });
    await expect(
      page.getByRole("region", { name: "My reports" }).getByText(token),
    ).toBeVisible({ timeout: 30_000 });

    /* Uploaded through /files, then sent by id: never a data: URL. */
    const post = calls.find(
      (c) =>
        c.method === "POST" &&
        c.path === `/patients/${johnId}/access-profiles/${profileId}/concerns`,
    );
    expect(post, "the concern POST").toBeTruthy();
    expect(calls.some((c) => c.path === "/files/upload-url")).toBe(true);
    const concerns = (
      await json(
        await john.get(
          `/patients/${johnId}/access-profiles/${profileId}/concerns?limit=150`,
        ),
        "concerns",
      )
    ).data as Array<{
      id: string;
      detail: string;
      hasImage: boolean;
      sendTo: string[];
    }>;
    const mine = concerns.find((c) => c.detail === token);
    expect(mine?.hasImage).toBe(true);
    expect(mine?.sendTo).toEqual(["access"]);
    concernId = mine?.id;

    /* The dialysis center never gets it (the server omits it). */
    const forClinic = (
      await json(
        await clinic.get(
          `/organizations/${riverside}/access-profiles/${profileId}/concerns?limit=150`,
        ),
        "clinic concerns",
      )
    ).data as Array<{ id: string }>;
    expect(forClinic.some((c) => c.id === concernId)).toBe(false);

    /* The access center sees it, with the photo through the record link. */
    const metro = await asUser(ACCOUNTS.access);
    await allowLocalStorage(metro.page);
    await metro.page.goto("/dashboard/access-center");
    await metro.page
      .getByRole("button", { name: `View ${ACCOUNTS.john.name}` })
      .first()
      .click();
    const record = metro.page.getByRole("dialog");
    await expect(record.getByText(token)).toBeVisible({ timeout: 30_000 });
    const photo = record.getByRole("img", {
      name: `Photo from ${ACCOUNTS.john.name}`,
    });
    await expect(photo).toBeVisible();
    await expect(
      record.locator(`img[alt="Photo from ${ACCOUNTS.john.name}"]`).first(),
    ).toHaveAttribute("src", new RegExp(`^${storageOrigin}/`));
    await noAccessStorage(metro.page);

    /* The dialysis center's screen does not list it. */
    const river = await asUser(ACCOUNTS.clinic);
    await allowLocalStorage(river.page);
    await river.page.goto("/dashboard/clinic/vascular-access");
    await river.page
      .getByRole("button", { name: `View ${ACCOUNTS.john.name}` })
      .first()
      .click();
    await expect(river.page.getByRole("dialog")).toBeVisible();
    await expect(river.page.getByText(token)).toHaveCount(0);

    await noAccessStorage(page);
    await storageClean(page);
  } finally {
    if (concernId)
      await john.delete(
        `/patients/${johnId}/access-profiles/${profileId}/concerns/${concernId}`,
      );
  }
});

test("J10-2: ride lifecycle, member and dialysis center (D4/PM-2) @phase10", async ({
  asUser,
  api,
}) => {
  const john = await api(ACCOUNTS.john);
  const access = await api(ACCOUNTS.access);
  const { johnId, profileId, several } = await johnAtMetro(john);
  const metro = await access.orgId("ACCESS_CENTER");
  /* Leftover open rides from an earlier run would share the queue. */
  const open = (
    await json(
      await john.get(
        `/patients/${johnId}/access-profiles/${profileId}/transport?limit=150`,
      ),
      "old rides",
    )
  ).data as Array<{ id: string; status: string }>;
  for (const old of open.filter((r) => r.status !== "Cancelled"))
    await john.post(
      `/patients/${johnId}/access-profiles/${profileId}/transport/${old.id}/cancel`,
    );
  const visitDay = day(40 + Math.floor(Math.random() * 200));
  const booked = await json(
    await access.post(
      `/organizations/${metro}/access-profiles/${profileId}/appointments`,
      {
        date: visitDay,
        time: "14:30",
        title: "Fistulogram",
        place: "Metro Vascular Access Center",
        team: "vascular",
      },
    ),
    "book",
  );
  const appointmentId = (booked.data as { id: string }).id;
  let rideId: string | undefined;
  try {
    /* The member asks for a ride. */
    const { page } = await asUser(ACCOUNTS.john);
    await allowLocalStorage(page);
    await openMetro(page, several);
    await page.getByRole("button", { name: "Request a Ride" }).click();
    const ask = page.getByRole("dialog", { name: "Request a Ride" });
    /* The visit booked above, by its id (older test visits may exist). */
    await ask.getByLabel("Appointment").selectOption(appointmentId);
    await ask.getByLabel(/^Pickup address/).fill("1 Synthetic Way, Columbia");
    await ask.getByRole("button", { name: "Submit Request" }).click();
    await expect(ask).toBeHidden({ timeout: 20_000 });
    const rides = (
      await json(
        await john.get(
          `/patients/${johnId}/access-profiles/${profileId}/transport?limit=150`,
        ),
        "rides",
      )
    ).data as Array<{ id: string; appointmentId: string; status: string }>;
    rideId = rides.find(
      (r) => r.appointmentId === appointmentId && r.status === "Requested",
    )?.id;
    expect(rideId, "the member's ride request").toBeTruthy();

    /* A Nurse has no transport level: no ride panel, and the server says no. */
    const nurse = await asUser(NURSE);
    await allowLocalStorage(nurse.page);
    await nurse.page.goto("/dashboard/clinic/messages");
    await expect(nurse.page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      nurse.page.getByRole("heading", { name: "Ride Requests" }),
    ).toHaveCount(0);
    const nurseApi = await api(NURSE);
    const riverside = await nurseApi.orgId("DIALYSIS_CENTER");
    expect(
      (
        await nurseApi.post(
          `/organizations/${riverside}/access-profiles/${profileId}/transport/${rideId}/acknowledge`,
        )
      ).status(),
    ).toBe(403);

    /* The Social Worker works it from the office-wide queue (BE-12). */
    const sw = await asUser(ACCOUNTS.socialWorker);
    await allowLocalStorage(sw.page);
    const swCalls = recordApiCalls(sw.page);
    await sw.page.goto("/dashboard/clinic/messages");
    const panel = sw.page
      .locator("section")
      .filter({ has: sw.page.getByRole("heading", { name: "Ride Requests" }) });
    const row = panel.locator("li").filter({ hasText: "Fistulogram" }).filter({
      hasText: ACCOUNTS.john.name,
    });
    await expect(row.first()).toBeVisible({ timeout: 30_000 });
    expect(
      swCalls.some((c) => c.path === `/organizations/${riverside}/transport`),
    ).toBe(true);
    await row.first().getByRole("button", { name: "Acknowledge" }).click();
    await expect(
      row.first().getByRole("button", { name: "Acknowledge" }),
    ).toHaveCount(0, { timeout: 20_000 });
    await row.first().getByRole("button", { name: "Confirm Ride" }).click();
    const book = sw.page.getByRole("dialog", { name: "Confirm Ride" });
    await book.getByLabel(/^Pickup time/).fill("09:30");
    await book.getByLabel(/^Return pickup time/).fill("13:45");
    await book.getByLabel(/^Transport company/).fill("Synthetic Rides Co");
    await book.getByLabel(/^Phone/).fill("555-010-0199");
    await book.getByLabel(/^Confirmation number/).fill("P10-E2E-1");
    await book
      .getByRole("button", { name: "Confirm & Notify Patient" })
      .click();
    await expect(book).toBeHidden({ timeout: 20_000 });
    const confirm = swCalls.find(
      (c) => c.method === "POST" && c.path.endsWith(`/${rideId}/confirm`),
    );
    expect(confirm?.path).toBe(
      `/organizations/${riverside}/access-profiles/${profileId}/transport/${rideId}/confirm`,
    );

    /* The member sees who drives and when. */
    await page.reload();
    if (several) await openMetro(page, several);
    await expect(page.getByText("Synthetic Rides Co").first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("9:30 AM").first()).toBeVisible();
    await noAccessStorage(page);
  } finally {
    if (rideId)
      await john.post(
        `/patients/${johnId}/access-profiles/${profileId}/transport/${rideId}/cancel`,
      );
  }
});

test("J10-3: a private message is hidden from the dialysis center until shared @phase10", async ({
  asUser,
  api,
}) => {
  const john = await api(ACCOUNTS.john);
  const { johnId, profileId, several } = await johnAtMetro(john);
  const body = `P10 private note ${Date.now().toString(36)} (synthetic)`;

  const { page } = await asUser(ACCOUNTS.john);
  await allowLocalStorage(page);
  await openMetro(page, several);
  await page.getByRole("button", { name: /access care team/i }).click();
  const thread = page.getByRole("dialog", { name: "Access care team" });
  await thread.getByRole("textbox").fill(body);
  await thread.getByRole("switch", { name: "Private message" }).click();
  await thread.getByRole("button", { name: "Send" }).click();
  const posted = page.waitForResponse(
    (r) =>
      r.request().method() === "POST" &&
      r.url().endsWith(`/access-profiles/${profileId}/messages`),
    { timeout: 60_000 },
  );
  await confirmSafety(page);
  expect((await posted).status()).toBe(201);
  await expect(thread.locator("li").getByText(body)).toBeVisible({
    timeout: 20_000,
  });

  const messages = (
    await json(
      await john.get(
        `/patients/${johnId}/access-profiles/${profileId}/messages?limit=50`,
      ),
      "messages",
    )
  ).data as Array<{ id: string; body: string | null; isPrivate: boolean }>;
  const sent = messages.find((m) => m.body === body);
  expect(sent?.isPrivate).toBe(true);

  /* The dialysis center sees only the placeholder. */
  const river = await asUser(ACCOUNTS.clinic);
  await allowLocalStorage(river.page);
  await river.page.goto("/dashboard/clinic/vascular-access");
  await river.page
    .getByRole("button", {
      name: new RegExp(`^Messages for ${ACCOUNTS.john.name}`),
    })
    .first()
    .click();
  const view = river.page.getByRole("dialog");
  await expect(
    view
      .getByText("Private message between the patient and the access center")
      .first(),
  ).toBeVisible({ timeout: 30_000 });
  await expect(view.getByText(body)).toHaveCount(0);

  /* Shared again by the member: the body shows. */
  await john.patch(
    `/patients/${johnId}/access-profiles/${profileId}/messages/${sent!.id}/privacy`,
    { isPrivate: false },
  );
  await river.page.reload();
  await river.page
    .getByRole("button", {
      name: new RegExp(`^Messages for ${ACCOUNTS.john.name}`),
    })
    .first()
    .click();
  await expect(river.page.getByRole("dialog").getByText(body)).toBeVisible({
    timeout: 30_000,
  });
  await noAccessStorage(river.page);
});

test("J10-4: a referral to a directory access center, acknowledged and answered @phase10", async ({
  asUser,
  api,
}) => {
  const neph = await api(ACCOUNTS.nephrology);
  const access = await api(ACCOUNTS.access);
  const clinic = await api(ACCOUNTS.clinic);
  const nephId = await neph.orgId("NEPHROLOGY_OFFICE");
  const metro = await access.orgId("ACCESS_CENTER");
  const riverside = await clinic.orgId("DIALYSIS_CENTER");
  const detail = `P10 referral ${Date.now().toString(36)} (synthetic)`;

  const { page } = await asUser(ACCOUNTS.nephrology);
  await allowLocalStorage(page);
  const calls = recordApiCalls(page);
  await page.goto("/dashboard/nephrology/access-messages");
  await page.getByRole("button", { name: "New Message" }).click();
  const modal = page.getByRole("dialog", { name: "Message Access Center" });
  const to = modal.getByLabel(/^Access center/);
  if (await to.count()) {
    await expect(
      to.locator("option", { hasText: "Metro Vascular" }),
    ).toHaveCount(1, { timeout: 20_000 });
    await to.selectOption({ label: ACCOUNTS.access.name });
  }
  await modal.getByLabel(/^Type/).selectOption("General Message");
  await modal.getByLabel(/^Patient/).selectOption("");
  await modal.getByLabel(/^Message/).fill(detail);
  await modal.getByRole("button", { name: "Send" }).click();
  await expect(modal).toBeHidden({ timeout: 20_000 });

  const post = calls.find(
    (c) =>
      c.method === "POST" && c.path === `/organizations/${nephId}/referrals`,
  );
  expect(post, "the referral POST").toBeTruthy();
  const sentList = (
    await json(
      await neph.get(`/organizations/${nephId}/referrals?box=sent&limit=50`),
      "sent",
    )
  ).data as Array<{
    id: string;
    detail: string;
    toOrganization: { id: string };
  }>;
  const referral = sentList.find((r) => r.detail === detail);
  expect(referral?.toOrganization.id).toBe(metro);

  /* The access center acknowledges and replies. */
  await json(
    await access.patch(
      `/organizations/${metro}/referrals/${referral!.id}/status`,
      { status: "Acknowledged" },
    ),
    "acknowledge",
  );
  await json(
    await access.post(
      `/organizations/${metro}/referrals/${referral!.id}/replies`,
      {
        body: "P10 reply from the access center (synthetic)",
      },
    ),
    "reply",
  );

  /* The office reads the reply in its thread. */
  await page.reload();
  await page
    .getByRole("button", {
      name: /^General message General Message .*Just now · 1 reply/,
    })
    .first()
    .click();
  await expect(page.getByRole("dialog").getByText(detail)).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByText("P10 reply from the access center (synthetic)"),
  ).toBeVisible({ timeout: 30_000 });

  /* Other offices cannot open the thread. */
  const hospital = await api(ACCOUNTS.hospital);
  const hospitalId = (await hospital.context()).memberships[0].organizationId;
  for (const [client, org] of [
    [clinic, riverside],
    [hospital, hospitalId],
  ] as const) {
    const status = (
      await client.get(`/organizations/${org}/referrals/${referral!.id}`)
    ).status();
    expect([403, 404]).toContain(status);
  }
  await noAccessStorage(page);
});

/** A fresh, verified synthetic account (D6 consent sent at registration). */
async function freshAccount(tag: string): Promise<Account> {
  const account = throwawayAccount(tag);
  const consent = await currentConsent();
  const since = mailMark();
  await pace("register");
  const ctx = await request.newContext();
  try {
    const res = await ctx.post(`${env.apiURL}/auth/register`, {
      headers: { "X-Auth-Transport": "bearer", Origin: appOrigin },
      data: { ...account, consent },
    });
    const body = await json(res, `register ${tag}`);
    const access = (body.tokens as { access: { token: string } }).access.token;
    const mail = await waitForMail(account.email, { since });
    const v = await ctx.post(`${env.apiURL}/auth/email/verify/confirm`, {
      headers: { Authorization: `Bearer ${access}`, Origin: appOrigin },
      data: { code: extractOtp(mail) },
    });
    expect(v.ok(), `verify ${tag}: ${v.status()}`).toBeTruthy();
  } finally {
    await ctx.dispose();
  }
  return account;
}

test("cross-office isolation: one account in two dialysis centers @phase10 @needs-mail", async ({
  page,
  api,
}) => {
  test.skip(!env.mailDir, "E2E_MAIL_DIR not set");
  const person = await freshAccount("p10-two-offices");
  const clinic = await api(ACCOUNTS.clinic);
  const admin = await api(ACCOUNTS.admin);
  const riverside = await clinic.orgId("DIALYSIS_CENTER");

  /* Riverside: Office Manager (vascular access View). */
  expect(
    (
      await clinic.post(`/organizations/${riverside}/invitations`, {
        email: person.email,
        role: "Office Manager",
      })
    ).status(),
  ).toBe(201);
  /* A second dialysis center (synthetic), owned by the same person. */
  const name = `P10 E2E Lakeside Dialysis ${Date.now().toString(36)}`;
  const office = (
    await json(
      await admin.post("/platform/organizations", {
        name,
        type: "DIALYSIS_CENTER",
        timeZone: "America/New_York",
      }),
      "create office",
    )
  ).data as { id: string };
  const since = mailMark();
  expect(
    (
      await admin.post(
        `/platform/organizations/${office.id}/owner-invitation`,
        {
          email: person.email,
        },
      )
    ).status(),
  ).toBeLessThan(300);
  const mail = await waitForMail(person.email, { since, subject: /invit/i });
  const link = extractLink(mail, /^\/invitations\/[A-Za-z0-9_-]{20,}$/);
  /* Each acceptance ends the account's sessions (D2): sign in for each. */
  const owner = await ApiClient.login(person);
  try {
    await owner.post(`${link.pathname}/accept`);
  } finally {
    await owner.dispose();
  }
  for (;;) {
    const client = await ApiClient.login(person);
    try {
      const list = (await json(await client.get("/me/invitations"), "mine"))
        .data as Array<{ id: string; status: string }>;
      const next = list.find((i) => i.status === "PENDING");
      if (!next) break;
      const res = await client.post(`/me/invitations/${next.id}/accept`);
      expect(res.ok(), `accept: ${res.status()}`).toBeTruthy();
    } finally {
      await client.dispose();
    }
  }

  await allowLocalStorage(page);
  const calls = recordApiCalls(page);
  await loginViaUi(page, person);
  await expect(page).toHaveURL(/\/select-portal/, { timeout: 20_000 });
  /* The portal choice lives in memory (D45): move by the menu, not a reload. */
  await page
    .getByRole("button", { name: "Open: Riverside Dialysis Center" })
    .click();
  await page.getByRole("link", { name: "Vascular Access" }).first().click();
  await expect(
    page.getByRole("button", { name: `View ${ACCOUNTS.john.name}` }).first(),
  ).toBeVisible({ timeout: 30_000 });

  await page.getByRole("link", { name: "Switch portal" }).click();
  await expect(page).toHaveURL(/\/select-portal/);
  await page.getByRole("button", { name: `Open: ${name}` }).click();
  /* Wait on the second office's own roster answer and its rendered result,
     not on network idle (a production build keeps background requests). */
  const secondRoster = page.waitForResponse(
    (res) =>
      new URL(res.url()).pathname.endsWith(
        `/organizations/${office.id}/access-profiles`,
      ) && res.request().method() === "GET",
    { timeout: 30_000 },
  );
  await page.getByRole("link", { name: "Vascular Access" }).first().click();
  await expect(page.getByText("Access Patients").first()).toBeVisible({
    timeout: 30_000,
  });
  const mark = calls.length;
  expect((await secondRoster).status()).toBe(200);
  /* The new office keeps no records: its empty roster is the loaded state. */
  await expect(page.getByText("No patients match these filters.")).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByRole("button", { name: `View ${ACCOUNTS.john.name}` }),
  ).toHaveCount(0);
  /* After the switch only the second office's id is used. */
  const after = calls
    .slice(mark - 5 < 0 ? 0 : mark - 5)
    .filter((c) => c.path.startsWith("/organizations/"));
  expect(after.length).toBeGreaterThan(0);
  expect(
    after.every((c) => !c.path.startsWith(`/organizations/${riverside}`)),
  ).toBe(true);
  await noAccessStorage(page);
});

test("API failure: error with retry, recovery, and 403 as not shared @phase10", async ({
  asUser,
  api,
}) => {
  const john = await api(ACCOUNTS.john);
  const { several } = await johnAtMetro(john);
  const { page } = await asUser(ACCOUNTS.john);
  await allowLocalStorage(page);

  /* Legacy data in the browser is purged and never shown. */
  await page.goto("/dashboard");
  await page.evaluate(() =>
    localStorage.setItem(
      "nr:vascular-access",
      JSON.stringify({
        version: 5,
        records: [
          {
            mrn: "999999",
            memberName: "Test Person",
            concerns: [{ imageUrl: "data:image/jpeg;base64,AAAA" }],
          },
        ],
        referrals: [],
      }),
    ),
  );
  await page.evaluate(() => localStorage.removeItem("nr:storage-version"));

  const failure = await failApi(page, /^\/patients\/[^/]+\/access-profiles$/, {
    kind: "status",
    status: 500,
  });
  await page.goto("/dashboard/vascular-access");
  await expect(page.getByText("Your access could not be loaded")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("No access on file")).toHaveCount(0);
  await expect(page.getByText("Test Person")).toHaveCount(0);
  failure.lift();
  await page.getByRole("button", { name: /try again/i }).click();
  if (several)
    await expect(page.getByLabel("Access center")).toBeVisible({
      timeout: 30_000,
    });
  await expect(
    page.getByRole("button", { name: /report a concern/i }),
  ).toBeVisible({ timeout: 30_000 });
  await noAccessStorage(page);

  const denied = await failApi(page, /^\/patients\/[^/]+\/access-profiles$/, {
    kind: "status",
    status: 403,
    code: "access.forbidden",
  });
  await page.reload();
  await expect(page.getByText("This has not been shared with you")).toBeVisible(
    { timeout: 30_000 },
  );
  await expect(page.getByRole("button", { name: /try again/i })).toHaveCount(0);
  denied.lift();
});
