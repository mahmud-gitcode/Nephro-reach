/* Phase 8: office roster, enrollment and travel on the API (OFFICE lane).
   - J8-1 office roster + enrollment: staff enroll a synthetic patient in the
     UI (two server calls), the roster shows them, a duplicate MRN is shown
     on the MRN field, and the member popup URL is ?patient=<uuid> (no MRN
     in any URL);
   - J8-2..4 trip lifecycle member <-> office: the member's trip is placed
     and confirmed by the office, the member sees Confirmed and the facility,
     asks for a time change, the office answers, the member asks to cancel,
     the office closes it, and the trip stays listed (D20: no delete call);
   - J8-5 cross-office isolation: one account in two offices sees only the
     picked office's roster, every office call names that office, and a
     forged office header from the browser is refused;
   - permissions: an office role without patients read sees no access;
   - API failure: error state with "Try again", never an empty list; a 403
     shows "not shared" with no retry; recovery after the failure lifts;
   - J8-6 retired keys: legacy roster, trip and ride keys are purged and
     never shown.
   Synthetic data only: seed accounts, *.example.test accounts and invented
   names; what the journeys create is closed, ended or deleted again. */
import { request, type Page } from "@playwright/test";
import { ApiClient, currentConsent, json } from "./fixtures/api";
import {
  ACCOUNTS,
  appOrigin,
  env,
  throwawayAccount,
  type Account,
} from "./fixtures/env";
import { extractOtp, mailMark, waitForMail } from "./fixtures/mail";
import { failApi, recordApiCalls } from "./fixtures/network";
import { loginViaUi } from "./fixtures/session";
import { expect, test } from "./fixtures/test";
import { pace } from "./fixtures/throttle";

const NURSE: Account = {
  email: "nurse@nephroreach.com",
  password: "staff123",
  name: "Nurse (seed)",
};

const tag = () => Date.now().toString(36).slice(-5);
const day = (offset: number) =>
  new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

test.setTimeout(240_000);

/** A fresh, verified synthetic account (D6 consent at registration). */
async function freshAccount(name: string): Promise<Account> {
  const account = throwawayAccount(name);
  const consent = await currentConsent();
  const since = mailMark();
  await pace("register");
  const ctx = await request.newContext();
  try {
    const res = await ctx.post(`${env.apiURL}/auth/register`, {
      headers: { "X-Auth-Transport": "bearer", Origin: appOrigin },
      data: { ...account, consent },
    });
    const body = await json(res, `register ${name}`);
    const access = (body.tokens as { access: { token: string } }).access.token;
    const mail = await waitForMail(account.email, { since });
    const v = await ctx.post(`${env.apiURL}/auth/email/verify/confirm`, {
      headers: { Authorization: `Bearer ${access}`, Origin: appOrigin },
      data: { code: extractOtp(mail) },
    });
    expect(v.ok(), `verify ${name}: ${v.status()}`).toBeTruthy();
  } finally {
    await ctx.dispose();
  }
  return account;
}

/** Accept every waiting STAFF invitation (setup only; each acceptance ends
 *  the account's sessions, D2, so sign in for each). */
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

async function noRetiredKeys(page: Page) {
  const keys = await page.evaluate(() => Object.keys(localStorage));
  for (const k of keys) {
    expect(k).not.toBe("nr:clinic-enrollments");
    expect(k).not.toBe("nr:travel-trip-requests");
    expect(k).not.toMatch(/(^|:)(rides|travel-treatments|travel-reflections)$/);
  }
}

const tripBody = (city: string) => ({
  street: "1 Synthetic Shore Dr",
  city,
  state: "SC",
  departDate: day(20),
  returnDate: day(27),
  treatmentsNeeded: 2,
  preferredDays: ["mon", "wed"],
  preferredTime: "morning",
  emergencyName: "Pat Example",
  emergencyPhone: "555-0100",
  documentsReady: [],
  prepDone: [],
});

test("J8-1 office roster and enrollment, ?patient=<uuid> URLs @phase8", async ({
  asUser,
  api,
  storageClean,
}) => {
  const clinicApi = await api(ACCOUNTS.clinic);
  const riverside = await clinicApi.orgId("DIALYSIS_CENTER");
  const { page } = await asUser(ACCOUNTS.clinic);
  const calls = recordApiCalls(page);
  const name = `Synthetic Enrollee${tag()}`;
  const mrn = `7${String(Date.now()).slice(-5)}`;
  let patientId: string | undefined;

  try {
    await page.goto("/dashboard/clinic/enroll-patients");
    await page
      .getByRole("button", { name: /Enroll New Patient/ })
      .first()
      .click();
    const dialog = page.getByRole("dialog", { name: "Enroll New Patient" });
    await dialog.getByRole("textbox", { name: /Full name/ }).fill(name);
    await dialog.getByRole("textbox", { name: /MRN/ }).fill(mrn);
    await dialog.getByRole("button", { name: "Enroll Patient" }).click();
    await expect(page.getByText(`${name} is enrolled.`)).toBeVisible({
      timeout: 20_000,
    });

    /* One server call (roster + program in one transaction, backend
       spec 067), for the office picked. */
    const posts = calls.filter((c) => c.method === "POST");
    expect(posts.map((c) => c.path)).toEqual([
      `/organizations/${riverside}/program-enrollments/with-patient`,
    ]);
    const roster = await json(
      await clinicApi.get(
        `/organizations/${riverside}/patients?search=${encodeURIComponent(name)}`,
        riverside,
      ),
      "roster",
    );
    patientId = (roster.data as Array<{ patientId: string }>)[0]?.patientId;
    expect(patientId, "the patient is on the server roster").toBeTruthy();

    /* The same MRN again: the server's 409 shows on the MRN field. */
    await page
      .getByRole("button", { name: /Enroll New Patient/ })
      .first()
      .click();
    const again = page.getByRole("dialog", { name: "Enroll New Patient" });
    await again
      .getByRole("textbox", { name: /Full name/ })
      .fill("Dup Synthetic");
    await again.getByRole("textbox", { name: /MRN/ }).fill(mrn);
    await again.getByRole("button", { name: "Enroll Patient" }).click();
    await expect(
      again.getByText("A patient with this MRN is already enrolled."),
    ).toBeVisible({ timeout: 20_000 });
    await again.getByRole("button", { name: "Cancel" }).click();

    /* The Member page pages, searches and filters by program on the
       server (QA round 1, H1; BE-2): the table read carries page, limit,
       search and the program slug. */
    const rosterReads: URL[] = [];
    page.on("request", (req) => {
      const u = new URL(req.url());
      if (u.pathname.endsWith(`/organizations/${riverside}/patients`))
        rosterReads.push(u);
    });
    const tableRead = (want: Record<string, string>) =>
      rosterReads.some((u) =>
        Object.entries(want).every(([k, v]) => u.searchParams.get(k) === v),
      );

    /* The Member page opens the member by patientId; no MRN in the URL. */
    await page.goto("/dashboard/clinic/members");
    await expect
      .poll(() => tableRead({ page: "1", limit: "10", status: "ACTIVE" }), {
        timeout: 20_000,
      })
      .toBe(true);
    await page.getByRole("searchbox").first().fill(name);
    await expect
      .poll(() => tableRead({ page: "1", limit: "10", search: name }), {
        timeout: 20_000,
      })
      .toBe(true);
    await page
      .getByRole("combobox", { name: "Program" })
      .selectOption("Journey to Dialysis (21-Day)");
    await expect
      .poll(() => tableRead({ search: name, program: "journey-21-day" }), {
        timeout: 20_000,
      })
      .toBe(true);
    await expect(
      page.getByRole("button", { name: `View ${name}` }),
    ).toBeVisible({ timeout: 20_000 });
    expect(rosterReads.some((u) => u.search.includes(mrn))).toBe(false);
    await page.getByRole("button", { name: `View ${name}` }).click();
    await expect(page.getByRole("dialog", { name })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`[?&]patient=${patientId}`));
    expect(page.url()).not.toContain(mrn);
    expect(page.url()).not.toMatch(/mrn=/);
    const hrefs = await page
      .locator("a[href]")
      .evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
    for (const href of hrefs) {
      expect(href).not.toMatch(/mrn=|[?&]to=/);
      expect(href).not.toContain(mrn);
    }
    for (const c of calls) expect(c.path).not.toContain(mrn);

    /* An old ?mrn= link opens the list, never a member. */
    await page.goto(`/dashboard/clinic/members?mrn=${mrn}`);
    await expect(
      page.getByText(/^Showing \d+–\d+ of \d+ members$/),
    ).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await noRetiredKeys(page);
    await storageClean(page);
  } finally {
    if (patientId)
      await clinicApi.post(
        `/organizations/${riverside}/patients/${patientId}/relationship/end`,
        {},
        riverside,
      );
  }
});

test("J8-2..4 trip lifecycle member <-> office, no delete (D20) @phase8", async ({
  asUser,
  api,
}) => {
  const johnApi = await api(ACCOUNTS.john);
  await johnApi.post("/me/preferences/tour-completed");
  const johnId = await johnApi.patientId();
  const clinicApi = await api(ACCOUNTS.clinic);
  const riverside = await clinicApi.orgId("DIALYSIS_CENTER");
  const city = `Lifecycle${tag()}`;
  const created = await json(
    await johnApi.post(`/patients/${johnId}/trips`, tripBody(city)),
    "create trip",
  );
  const tripId = (created.data as { id: string }).id;

  /* Office: find it by server search, place it and confirm it. */
  const office = await asUser(ACCOUNTS.clinic);
  const officeCalls = recordApiCalls(office.page);
  await office.page.goto("/dashboard/clinic/travel");
  await office.page
    .getByRole("searchbox", { name: "Search travel requests" })
    .fill(city);
  await office.page
    .getByRole("button", { name: new RegExp(`trip to ${city}`) })
    .click({ timeout: 20_000 });
  let manage = office.page.getByRole("dialog");
  await manage.getByLabel("Receiving facility").fill("Synthetic Away Dialysis");
  await manage.getByLabel("Facility phone").fill("555-0199");
  await manage.getByLabel("Treatment date").fill(day(21));
  await manage.getByLabel("Treatment time").fill("07:00");
  await manage.getByRole("button", { name: "Add" }).click();
  await manage.getByLabel("Message to the patient").fill("Booked (synthetic).");
  await manage.getByLabel("Status").selectOption("confirmed");
  await manage.getByRole("button", { name: "Save changes" }).click();
  await expect(manage).toHaveCount(0);
  await expect
    .poll(
      () =>
        officeCalls
          .filter((c) => c.method === "PUT")
          .map((c) => c.path.split("/").pop()),
      { timeout: 20_000 },
    )
    .toEqual(["placement", "facility-note", "status"]);
  expect(officeCalls.find((c) => c.method === "PUT")!.path).toContain(
    `/organizations/${riverside}/trips/${tripId}`,
  );

  /* Member: sees Confirmed and the facility; asks to move the time. */
  const member = await asUser(ACCOUNTS.john);
  const memberCalls = recordApiCalls(member.page);
  await member.page.goto(`/dashboard/travel-log/${tripId}`);
  await expect(
    member.page.getByText("Synthetic Away Dialysis").first(),
  ).toBeVisible({
    timeout: 20_000,
  });
  await expect(member.page.getByText("Confirmed").first()).toBeVisible();
  await expect(member.page.getByText("Booked (synthetic).")).toBeVisible();
  await member.page
    .getByRole("button", { name: "Request a time change" })
    .click();
  const ask = member.page.getByRole("dialog");
  await ask.getByRole("textbox").last().fill("Flight lands late (synthetic).");
  await ask
    .getByRole("button", { name: /Send|Request/ })
    .last()
    .click();
  await expect(
    member.page.getByText("You asked to change the time"),
  ).toBeVisible({
    timeout: 20_000,
  });
  /* A second open request is refused by the server. */
  const second = await johnApi.post(
    `/patients/${johnId}/trips/${tripId}/time-change-requests`,
    { preferredTime: "midday", note: "Again" },
  );
  expect(second.status()).toBe(409);

  /* Office answers it; the member sees the reply. */
  await office.page.reload();
  await office.page
    .getByRole("searchbox", { name: "Search travel requests" })
    .fill(city);
  await office.page
    .getByRole("button", { name: new RegExp(`trip to ${city}`) })
    .click({ timeout: 20_000 });
  manage = office.page.getByRole("dialog");
  await manage
    .getByRole("textbox", { name: "Reply about the time change" })
    .fill("Moved to 17:00 (synthetic).");
  await manage.getByRole("button", { name: "Answer" }).click();
  await expect
    .poll(() => officeCalls.some((c) => /\/answer$/.test(c.path)), {
      timeout: 20_000,
    })
    .toBe(true);
  await manage.getByRole("button", { name: "Cancel" }).click();
  await member.page.reload();
  await expect(
    member.page.getByText("Moved to 17:00 (synthetic)."),
  ).toBeVisible({
    timeout: 20_000,
  });

  /* Member asks to cancel; the trip stays (no delete). */
  await member.page.getByRole("button", { name: "Cancel trip" }).click();
  await member.page
    .getByRole("dialog")
    .getByRole("button", { name: "Request cancellation" })
    .click();
  await expect(
    member.page.getByText("Cancellation requested").first(),
  ).toBeVisible({
    timeout: 20_000,
  });
  expect(
    memberCalls.some(
      (c) => c.method === "DELETE" && /\/trips\/[^/]+$/.test(c.path),
    ),
  ).toBe(false);
  for (const c of memberCalls)
    expect(c.headers["x-organization-id"]).toBeUndefined();

  /* Office closes it through cancellation/close. */
  await office.page.reload();
  await office.page
    .getByRole("searchbox", { name: "Search travel requests" })
    .fill(city);
  await office.page
    .getByRole("button", { name: new RegExp(`trip to ${city}`) })
    .click({ timeout: 20_000 });
  manage = office.page.getByRole("dialog");
  await manage.getByLabel("Status").selectOption("closed");
  await manage.getByRole("button", { name: "Save changes" }).click();
  await expect
    .poll(
      () => officeCalls.some((c) => /\/cancellation\/close$/.test(c.path)),
      {
        timeout: 20_000,
      },
    )
    .toBe(true);

  /* Closed (once the close lands), and still listed, with its history. */
  await expect
    .poll(
      async () =>
        (
          (
            await json(
              await johnApi.get(`/patients/${johnId}/trips/${tripId}`),
              "trip",
            )
          ).data as { status: string }
        ).status,
      { timeout: 20_000 },
    )
    .toBe("closed");
  await member.page.goto("/dashboard/travel-log");
  await expect(member.page.getByText("Your trips")).toBeVisible({
    timeout: 20_000,
  });
  await noRetiredKeys(member.page);
});

test("J8-5 cross-office isolation for a two-membership account @phase8 @needs-mail", async ({
  page,
  api,
}) => {
  const clinicApi = await api(ACCOUNTS.clinic);
  const accessApi = await api(ACCOUNTS.access);
  const riverside = await clinicApi.orgId("DIALYSIS_CENTER");
  const metro = await accessApi.orgId("ACCESS_CENTER");
  /* A patient only Riverside has. */
  const only = `Riverside Only${tag()}`;
  const enrolled = await json(
    await clinicApi.post(
      `/organizations/${riverside}/patients`,
      { firstName: "Riverside", lastName: only.split(" ")[1] },
      riverside,
    ),
    "enroll",
  );
  const onlyId = (enrolled.data as { patientId: string }).patientId;

  try {
    const person = await freshAccount("p8-two-offices");
    for (const [client, org] of [
      [clinicApi, riverside],
      [accessApi, metro],
    ] as const)
      expect(
        (
          await client.post(
            `/organizations/${org}/invitations`,
            { email: person.email, role: "Office Manager" },
            org,
          )
        ).status(),
      ).toBe(201);
    await acceptAllStaff(person);

    const calls = recordApiCalls(page);
    await loginViaUi(page, person);
    await expect(page).toHaveURL(/\/select-portal/, { timeout: 20_000 });
    await page
      .getByRole("button", { name: "Open: Riverside Dialysis Center" })
      .click();
    await page.goto("/dashboard/clinic/members");
    await page.getByRole("searchbox").first().fill(only.split(" ")[1]);
    await expect(page.getByText(only).first()).toBeVisible({ timeout: 20_000 });

    /* Switch to Metro: only Metro's id from here on; Riverside's patient
       never shows. */
    await page.getByRole("link", { name: "Switch portal" }).click();
    await expect(page).toHaveURL(/\/select-portal/);
    const switchedAt = calls.length;
    await page
      .getByRole("button", { name: "Open: Metro Vascular Access Center" })
      .click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(only)).toHaveCount(0);
    const after = calls
      .slice(switchedAt)
      .filter((c) => c.path.startsWith("/organizations/"));
    for (const c of after) {
      expect(c.path.startsWith(`/organizations/${metro}`)).toBe(true);
      const header = c.headers["x-organization-id"];
      if (header) expect(header).toBe(metro);
    }

    /* The browser session, forging the header of an office this account is
       NOT a member of (the nephrology office), on that office's roster and
       travel inbox: the server refuses both. */
    const nephrology = await (
      await api(ACCOUNTS.nephrology)
    ).orgId("NEPHROLOGY_OFFICE");
    const forged = await page.evaluate(
      async ({ apiURL, n }) => {
        const opts = {
          credentials: "include" as const,
          headers: { "X-Organization-Id": n },
        };
        const roster = await fetch(
          `${apiURL}/organizations/${n}/patients`,
          opts,
        );
        const trips = await fetch(`${apiURL}/organizations/${n}/trips`, opts);
        return [roster.status, trips.status];
      },
      { apiURL: env.apiURL, n: nephrology },
    );
    expect(forged).toEqual([403, 403]);
    /* Metro's own roster read in the browser never holds Riverside's
       Riverside-only patient. */
    const metroRows = await page.evaluate(
      async ({ apiURL, m }) => {
        const res = await fetch(
          `${apiURL}/organizations/${m}/patients?limit=150`,
          {
            credentials: "include",
            headers: { "X-Organization-Id": m },
          },
        );
        return res.ok
          ? ((await res.json()).data as Array<{ patientId: string }>).map(
              (r) => r.patientId,
            )
          : [];
      },
      { apiURL: env.apiURL, m: metro },
    );
    expect(metroRows).not.toContain(onlyId);

    /* Metro's owner, by URL, on Riverside's travel inbox: no Riverside row. */
    const metroForeign = await accessApi.get(
      `/organizations/${riverside}/trips`,
      riverside,
    );
    expect(metroForeign.status()).toBe(403);
  } finally {
    await clinicApi.post(
      `/organizations/${riverside}/patients/${onlyId}/relationship/end`,
      {},
      riverside,
    );
  }
});

test("permissions: an office role without patients read gets no roster @phase8", async ({
  asUser,
}) => {
  /* The Riverside Nurse role holds no patients and no travel level (server
     levels from /me/context): no Member, Enroll or Travel menu, and a typed
     address lands on a page the role has (the FE-ORG guard), never the
     roster. The server refuses the roster read itself. */
  const nurse = await asUser(NURSE);
  await nurse.page.goto("/dashboard/clinic/members");
  await expect(nurse.page.getByRole("link", { name: "Check-ins" })).toBeVisible(
    {
      timeout: 20_000,
    },
  );
  for (const name of ["Member", "Enroll Patients", "Travel Requests"])
    await expect(
      nurse.page.getByRole("link", { name, exact: true }),
    ).toHaveCount(0);
  await expect(nurse.page).not.toHaveURL(/\/clinic\/members/);
  await nurse.page.goto("/dashboard/clinic/travel");
  await expect(nurse.page).not.toHaveURL(/\/clinic\/travel/);
  const direct = await nurse.page.evaluate(async (apiURL) => {
    const ctx = await fetch(`${apiURL}/me/context`, { credentials: "include" });
    const org = (await ctx.json()).data.memberships[0].organizationId;
    const res = await fetch(`${apiURL}/organizations/${org}/patients`, {
      credentials: "include",
      headers: { "X-Organization-Id": org },
    });
    const trips = await fetch(`${apiURL}/organizations/${org}/trips`, {
      credentials: "include",
      headers: { "X-Organization-Id": org },
    });
    return [res.status, trips.status];
  }, env.apiURL);
  expect(direct).toEqual([403, 403]);

  /* And when the server says 403 on a page that is open, the page shows
     "not shared", no retry, no rows (the office owner, refusal injected). */
  const owner = await asUser(ACCOUNTS.clinic);
  await failApi(owner.page, /^\/organizations\/[^/]+\/patients$/, {
    kind: "status",
    status: 403,
    code: "access.organization_access_denied",
  });
  await owner.page.goto("/dashboard/clinic/members");
  await expect(
    owner.page.getByText("This has not been shared with you"),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    owner.page.getByRole("button", { name: "Try again" }),
  ).toHaveCount(0);
  await expect(owner.page.getByRole("table")).toHaveCount(0);
});

test("API failure: error is not empty, 403 is not shared, recovery @phase8", async ({
  asUser,
}) => {
  const office = await asUser(ACCOUNTS.clinic);
  const fail = await failApi(
    office.page,
    /^\/organizations\/[^/]+\/patients$/,
    {
      kind: "status",
      status: 500,
    },
  );
  await office.page.goto("/dashboard/clinic/members");
  await expect(
    office.page.getByText("Members could not be loaded"),
  ).toBeVisible({
    timeout: 20_000,
  });
  await expect(office.page.getByText("No members yet")).toHaveCount(0);
  fail.lift();
  await office.page.getByRole("button", { name: "Try again" }).click();
  await expect(
    office.page.getByText(/^Showing \d+–\d+ of \d+ members$/),
  ).toBeVisible({ timeout: 20_000 });

  const member = await asUser(ACCOUNTS.john);
  const forbid = await failApi(member.page, /^\/patients\/[^/]+\/trips$/, {
    kind: "status",
    status: 403,
    code: "access.patient_access_denied",
  });
  await member.page.goto("/dashboard/travel-log");
  await expect(
    member.page.getByText("This has not been shared with you"),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    member.page.getByRole("button", { name: "Try again" }),
  ).toHaveCount(0);
  forbid.lift();
  const down = await failApi(member.page, /^\/patients\/[^/]+\/trips$/, {
    kind: "status",
    status: 500,
  });
  await member.page.reload();
  await expect(member.page.getByText("Your trips did not load")).toBeVisible({
    timeout: 20_000,
  });
  down.lift();
  await member.page.getByRole("button", { name: "Try again" }).click();
  await expect(
    member.page.getByText("Your trips", { exact: true }),
  ).toBeVisible({
    timeout: 20_000,
  });
});

test("J8-6 retired roster, trip and ride keys are purged and never shown @phase8", async ({
  asUser,
  storageClean,
}) => {
  const { page } = await asUser(ACCOUNTS.john);
  await page.addInitScript(() => {
    const legacyTrip = JSON.stringify([
      { id: "legacy-trip", destination: { city: "Legacyville" } },
    ]);
    if (!sessionStorage.getItem("seeded")) {
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem("nr:travel-trip-requests", legacyTrip);
      localStorage.setItem(
        "nr:clinic-enrollments",
        JSON.stringify([{ name: "Legacy Person", mrn: "999999" }]),
      );
      localStorage.setItem(
        "nr:rides",
        JSON.stringify([{ id: "r", name: "Legacy Driver", phone: "1" }]),
      );
      localStorage.setItem(
        "nr:member:user@nephroreach.com:travel-treatments",
        JSON.stringify([{ id: "t", tripId: "legacy-trip" }]),
      );
    }
  });
  await page.goto("/dashboard/travel-log");
  await expect(page.getByText("Your trips", { exact: true })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("Legacyville")).toHaveCount(0);
  await page.goto("/dashboard/my-rides");
  await expect(page.getByText("Legacy Driver")).toHaveCount(0);
  await noRetiredKeys(page);
  /* Phase 8 keys retire at 13 (renumbered at merge); a later phase may
     raise the marker. */
  expect(
    Number(
      await page.evaluate(() => localStorage.getItem("nr:storage-version")),
    ),
  ).toBeGreaterThanOrEqual(13);
  await storageClean(page);
});
