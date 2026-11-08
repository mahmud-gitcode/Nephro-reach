/* Phase 14 part B (EDU-BIZ): the NephroReach admin consoles on the API.
   - plans: an edit to a published plan a member is on is saved by the
     server as a NEW version (the screen says so, the old row is replaced),
     publish/retire from the screen, prices in cents;
   - contracts: a change request an office sends is resolved by the platform
     owner in the UI; an invoice is marked paid in the UI;
   - campaigns: a weekly Monday 9 AM ET in-app check-in is created in the UI,
     activated and deactivated; SMS is not offered; no "Education" type;
   - dashboard: only sourced numbers; a failed or refused overview shows
     its state, never zeros;
   - no access: an office owner and a member are refused the screens and
     every platform API call they would make (403);
   - retired stores: nr:subscription-plans / nr:org-subscriptions are purged
     and nothing comes back.
   Synthetic data only. What a test creates stays inactive / resolved /
   paid in the lane database; John's subscription is restored exactly. */
import type { Page } from "@playwright/test";
import { ACCOUNTS, env } from "./fixtures/env";
import { failApi } from "./fixtures/network";
import { expect, test } from "./fixtures/test";

const tag = () => `P14BE2E-${Date.now().toString(36)}`;

type Json = Record<string, unknown>;

const config = (name: string, cents: number) => ({
  structure: name,
  priceLabel: `$${(cents / 100).toFixed(2)}`,
  billingLabel: "/Month",
  billingType: "recurring",
  billingPeriodLabel: "Recurring monthly",
  trialLabel: null,
  description: "Synthetic e2e plan",
  popular: false,
  badge: null,
  features: [{ label: "Synthetic feature", included: true }],
  limits: { accessDays: null, trialDays: 0 },
});

async function data<T = Json>(res: {
  ok(): boolean;
  status(): number;
  json(): Promise<unknown>;
}): Promise<T> {
  expect(res.ok(), `status ${res.status()}`).toBe(true);
  return ((await res.json()) as { data: T }).data;
}

async function openAdmin(page: Page, path: string) {
  await page.goto(path);
  await expect(page).toHaveURL(new RegExp(path.replace(/\//g, "\\/")), {
    timeout: 30_000,
  });
}

test("plans: editing a plan in use saves a new version; publish and retire from the screen @phase14", async ({
  asUser,
  api,
}) => {
  const admin = await api(ACCOUNTS.admin);
  const john = await api(ACCOUNTS.john);
  const johnId = (await john.context()).patient!.id;
  const t = tag();
  const name = `${t} Plan`;
  const created = await data<{ id: string }>(
    await admin.post("/platform/member-plans", {
      code: t.toLowerCase(),
      priceCents: 1999,
      configuration: config(name, 1999),
    }),
  );
  await data(await admin.post(`/platform/member-plans/${created.id}/publish`));
  const subs = await data<Array<Json & { patientId: string }>>(
    await admin.get("/platform/member-subscriptions?limit=150"),
  );
  const before = subs.find((s) => s.patientId === johnId) as
    | (Json & {
        plan: { id: string };
        status: string;
        trialEndsAt: string | null;
        currentPeriodEnd: string | null;
      })
    | undefined;
  await data(
    await admin.ctx.put(
      `${env.apiURL}/platform/member-subscriptions/${johnId}`,
      {
        headers: admin.headers(),
        data: { planId: created.id, status: "ACTIVE" },
      },
    ),
  );

  try {
    const { page } = await asUser(ACCOUNTS.admin);
    await openAdmin(page, "/dashboard/subscriptions");
    const card = page.getByRole("article").filter({ hasText: name });
    await expect(card).toBeVisible({ timeout: 30_000 });
    await expect(card.getByText("$19.99")).toBeVisible();
    await expect(card.getByText("Published")).toBeVisible();

    await card.getByRole("button", { name: "Edit Plan" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/Price/).fill("21.49");
    const patched = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/platform/member-plans/${created.id}`) &&
        r.request().method() === "PATCH",
    );
    await dialog.getByRole("button", { name: "Save Changes" }).click();
    const reply = (await (await patched).json()) as {
      data: { id: string; priceCents: number; replacesId: string };
    };
    expect(reply.data.id).not.toBe(created.id);
    expect(reply.data.priceCents).toBe(2149);
    expect(reply.data.replacesId).toBe(created.id);
    await expect(page.getByText(/Saved as a new version/)).toBeVisible();

    const old = await data<{ replacedById: string; priceCents: number }>(
      await admin.get(`/platform/member-plans/${created.id}`),
    );
    expect(old.replacedById).toBe(reply.data.id);
    expect(old.priceCents).toBe(1999);

    // The screen shows the new version (one card, $21.49, version 2).
    const current = page.getByRole("article").filter({ hasText: name });
    await expect(current).toHaveCount(1);
    await expect(current.getByText("$21.49")).toBeVisible();
    await expect(current.getByText(/Version 2/)).toBeVisible();

    await current.getByRole("button", { name: `Retire ${name}` }).click();
    await expect(current.getByText("Not published")).toBeVisible({
      timeout: 20_000,
    });
    const retired = await data<{ active: boolean }>(
      await admin.get(`/platform/member-plans/${reply.data.id}`),
    );
    expect(retired.active).toBe(false);
  } finally {
    if (before) {
      await admin.ctx.put(
        `${env.apiURL}/platform/member-subscriptions/${johnId}`,
        {
          headers: admin.headers(),
          data: {
            planId: before.plan.id,
            status: before.status,
            trialEndsAt: before.trialEndsAt,
            currentPeriodEnd: before.currentPeriodEnd,
          },
        },
      );
    }
  }
});

test("contracts: an office's change request is resolved and an invoice marked paid in the UI @phase14", async ({
  asUser,
  api,
}) => {
  const admin = await api(ACCOUNTS.admin);
  const clinic = await api(ACCOUNTS.clinic);
  const clinicOrg = await clinic.orgId("DIALYSIS_CENTER");
  const t = tag();
  const request = await data<{ id: string }>(
    await clinic.post(
      `/organizations/${clinicOrg}/billing/change-requests`,
      { topic: "fee", detail: `${t} synthetic fee question` },
      clinicOrg,
    ),
  );
  const contracts = await data<Array<{ id: string; status: string }>>(
    await admin.get(`/platform/contracts?organizationId=${clinicOrg}&limit=5`),
  );
  const number = `${t}-INV`.slice(0, 40);
  await data(
    await admin.post("/platform/invoices", {
      subscriptionId: contracts.find((c) => c.status !== "ENDED")!.id,
      number,
      periodLabel: "Synthetic",
      issuedOn: "2026-11-01",
      dueOn: "2026-11-30",
      amountCents: 123456,
    }),
  );

  const { page } = await asUser(ACCOUNTS.admin);
  await openAdmin(page, "/dashboard/subscriptions");
  const row = page.getByRole("row").filter({ hasText: number });
  await expect(row).toBeVisible({ timeout: 30_000 });
  await expect(row.getByText("$1,234.56")).toBeVisible();
  await row.getByRole("button", { name: `Mark ${number} paid` }).click();
  await expect(row.getByText("Paid", { exact: true })).toBeVisible({
    timeout: 20_000,
  });

  const reqRow = page
    .getByRole("row")
    .filter({ hasText: `${t} synthetic fee question` });
  await expect(reqRow).toBeVisible();
  await reqRow.getByRole("button", { name: /Resolve the Fee request/ }).click();
  await expect(reqRow).toHaveCount(0, { timeout: 20_000 });
  const resolved = await data<Array<{ id: string; resolvedAt: string | null }>>(
    await admin.get(
      `/platform/contract-change-requests?organizationId=${clinicOrg}&status=resolved&limit=50`,
    ),
  );
  expect(resolved.find((r) => r.id === request.id)?.resolvedAt).toBeTruthy();
});

test("campaigns: a weekly in-app check-in is created, activated and deactivated; no Education, no SMS @phase14", async ({
  asUser,
}) => {
  const t = tag();
  const { page } = await asUser(ACCOUNTS.admin);
  await openAdmin(page, "/dashboard/sms-analytics");
  await expect(page.getByText("Active Automations")).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole("button", { name: "New Template" }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog
      .getByLabel("Message Type")
      .locator("option", { hasText: /Education/ }),
  ).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "SMS" })).toBeDisabled();
  await dialog.getByLabel("Template Name").fill(`${t} Weekly`);
  await dialog.getByLabel("Day").selectOption("MO");
  await dialog.getByLabel(/Time \(Eastern/).selectOption("9");
  await dialog
    .getByLabel("Message Content")
    .fill("Synthetic check-in, no PHI.");
  const created = page.waitForResponse(
    (r) =>
      r.url().endsWith("/platform/campaigns") &&
      r.request().method() === "POST",
  );
  await dialog.getByRole("button", { name: "Create Template" }).click();
  const body = (await (await created).json()) as {
    data: { schedule: string; channels: string[]; kind: string };
  };
  expect(body.data).toMatchObject({
    schedule: "FREQ=WEEKLY;BYDAY=MO;BYHOUR=9",
    channels: ["in_app"],
    kind: "check-in",
  });

  const card = page.getByRole("article").filter({ hasText: `${t} Weekly` });
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card.getByText(/Every Monday at 9:00 AM ET/)).toBeVisible();
  await card.getByRole("button", { name: `Activate ${t} Weekly` }).click();
  await expect(
    card.getByRole("button", { name: `Deactivate ${t} Weekly` }),
  ).toBeVisible({ timeout: 20_000 });
  await card.getByRole("button", { name: `Deactivate ${t} Weekly` }).click();
  await expect(
    card.getByRole("button", { name: `Activate ${t} Weekly` }),
  ).toBeVisible({ timeout: 20_000 });
});

test("dashboard: sourced numbers only; a failed or refused overview is a state, never zeros @phase14", async ({
  asUser,
  api,
}) => {
  const admin = await api(ACCOUNTS.admin);
  const overview = await data<{ members: number; activeContracts: number }>(
    await admin.get("/platform/reports/overview"),
  );
  const { page } = await asUser(ACCOUNTS.admin);
  await page.goto("/dashboard");
  const members = page
    .getByRole("article")
    .filter({ hasText: "Total Members" });
  await expect(
    members.getByText(overview.members.toLocaleString("en-US")),
  ).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Not available yet").first()).toBeVisible();
  await expect(page.getByText("Rakib Roy")).toHaveCount(0);
  await expect(page.getByText("$8,340")).toHaveCount(0);

  const failure = await failApi(page, /^\/platform\/reports\/overview$/, {
    kind: "status",
    status: 500,
  });
  await page.reload();
  await expect(members.getByText("Did not load")).toBeVisible({
    timeout: 30_000,
  });
  failure.lift();
  const refuse = await failApi(page, /^\/platform\/reports\/overview$/, {
    kind: "status",
    status: 403,
    code: "access.platform_permission_required",
  });
  await page.reload();
  await expect(members.getByText("No access")).toBeVisible({
    timeout: 30_000,
  });
  refuse.lift();
});

test("no access: an office owner and a member get neither the screens nor the platform API @phase14", async ({
  asUser,
}) => {
  for (const account of [ACCOUNTS.clinic, ACCOUNTS.john]) {
    const { page } = await asUser(account);
    for (const path of [
      "/dashboard/subscriptions",
      "/dashboard/sms-analytics",
      "/dashboard/members",
    ]) {
      await page.goto(path);
      await expect(page).not.toHaveURL(new RegExp(`${path}$`), {
        timeout: 30_000,
      });
    }
    for (const path of [
      "/platform/member-plans",
      "/platform/organization-plans",
      "/platform/contracts",
      "/platform/invoices",
      "/platform/contract-change-requests",
      "/platform/member-subscriptions",
      "/platform/campaigns",
      "/platform/notifications/analytics",
      "/platform/reports/overview",
    ]) {
      const res = await page.request.get(`${env.apiURL}${path}`);
      expect(res.status(), `${account.email} ${path}`).toBe(403);
    }
  }
});

test("retired plan stores are purged and do not come back @phase14", async ({
  asUser,
  storageClean,
}) => {
  const { context, page } = await asUser(ACCOUNTS.admin);
  await context.addInitScript(() => {
    if (sessionStorage.getItem("p14b-seeded")) return;
    sessionStorage.setItem("p14b-seeded", "1");
    localStorage.setItem(
      "nr:subscription-plans",
      JSON.stringify([{ id: "legacy", name: "LEGACY-PLAN-X", price: "$0.01" }]),
    );
    localStorage.setItem(
      "nr:org-subscriptions",
      JSON.stringify({
        plans: [{ id: "x", name: "LEGACY-ORG-X" }],
        assignments: {},
      }),
    );
  });
  await page.goto("/dashboard/subscriptions");
  await expect(page.getByText("Office & Clinic Subscriptions")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText(/LEGACY-/)).toHaveCount(0);
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).not.toContain("nr:subscription-plans");
  expect(keys).not.toContain("nr:org-subscriptions");
  await page.goto("/dashboard/sms-analytics");
  await page.goto("/dashboard/members");
  await page.evaluate(() => sessionStorage.removeItem("p14b-seeded"));
  await storageClean(page);
});
