import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import type { MeContext } from "@/features/auth/auth.types";
import {
  apiError,
  memberContext,
  pageOf,
  stubApi,
  type StubCall,
  type StubReply,
} from "@/features/profile/memberApiStub";
import SmsAnalyticsPage from "@/app/(portal)/dashboard/(admin)/sms-analytics/page";
import AdminDashboard from "@/features/dashboard/AdminDashboard";
import {
  draftError,
  fromApiTiming,
  timingLabel,
  toCampaignBody,
  toSchedule,
  type CampaignDraft,
} from "@/features/admin/campaigns.mappers";

/* Phase 14.7 and 14.9 (EDU-BIZ): notification campaigns and the admin
   dashboard widgets that have a source, on the API. A stand-in API;
   synthetic data only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const PLATFORM_ORG = "99999999-9999-4999-8999-999999999999";

/** A NephroReach team member: the owner, or a role with these levels. */
function platformContext(
  permissions: Record<string, number> | "owner" = "owner",
): MeContext {
  const base = memberContext();
  return {
    ...base,
    user: { ...base.user, name: "Platform Test", email: "pa@example.test" },
    patient: null,
    platform: {
      organizationId: PLATFORM_ORG,
      organizationName: "NephroReach",
      organizationType: "PLATFORM",
      organizationStatus: "ACTIVE",
      role: permissions === "owner" ? "Owner" : "Custom",
      title: null,
      isOwner: permissions === "owner",
      permissions: permissions === "owner" ? {} : permissions,
    },
  } as MeContext;
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

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

type Routes = Record<string, StubReply | ((call: StubCall) => StubReply)>;

/** A platform API: `METHOD /path` → reply. Unlisted platform reads are an
 *  empty page so a test sees only what it set up. */
function platformApi(routes: Routes, context: MeContext = platformContext()) {
  return stubApi((call) => {
    const key = `${call.method} ${call.path}`;
    const hit = routes[key];
    if (hit) return typeof hit === "function" ? hit(call) : hit;
    if (call.method === "GET" && call.path.startsWith("/platform/"))
      return pageOf([]);
    return undefined;
  }, context);
}

describe("campaign mappers", () => {
  const draft = (over: Partial<CampaignDraft> = {}): CampaignDraft => ({
    title: "Weekly check",
    kind: "check-in",
    message: "How are you this week?",
    question: null,
    channels: ["in_app"],
    timing: { mode: "weekly", weekday: "MO", hour: 9 },
    ...over,
  });

  it("writes the server's schedule shapes, hours in ET", () => {
    expect(toSchedule({ mode: "weekly", weekday: "MO", hour: 9 })).toBe(
      "FREQ=WEEKLY;BYDAY=MO;BYHOUR=9",
    );
    expect(toSchedule({ mode: "daily", hour: 21 })).toBe(
      "FREQ=DAILY;BYHOUR=21",
    );
    expect(() => toSchedule({ mode: "daily", hour: 24 })).toThrow();
    expect(timingLabel({ mode: "weekly", weekday: "MO", hour: 9 })).toBe(
      "Every Monday at 9:00 AM ET",
    );
  });

  it("reads a stored schedule back", () => {
    expect(
      fromApiTiming({ schedule: "FREQ=WEEKLY;BYDAY=FR;BYHOUR=17" }),
    ).toEqual({ mode: "weekly", weekday: "FR", hour: 17 });
    expect(fromApiTiming({ schedule: "FREQ=DAILY;BYHOUR=0" })).toEqual({
      mode: "daily",
      hour: 0,
    });
    expect(
      fromApiTiming({ schedule: null, sendAt: "2030-01-01T14:00:00.000Z" }),
    ).toEqual({ mode: "once", sendAt: "2030-01-01T14:00:00.000Z" });
  });

  it("sends exactly one of schedule and sendAt", () => {
    expect(toCampaignBody(draft())).toMatchObject({
      schedule: "FREQ=WEEKLY;BYDAY=MO;BYHOUR=9",
      sendAt: null,
    });
    const once = toCampaignBody(
      draft({ timing: { mode: "once", sendAt: "2030-01-01T14:00:00.000Z" } }),
    );
    expect(once).toMatchObject({
      schedule: null,
      sendAt: "2030-01-01T14:00:00.000Z",
    });
  });

  it("refuses what the server refuses: education, a question without in-app, a past send", () => {
    expect(draftError(draft({ kind: "education" as never }))).toMatch(/type/);
    expect(
      draftError(draft({ question: "wellbeing", channels: ["email"] })),
    ).toMatch(/in-app/);
    expect(
      draftError(
        draft({ timing: { mode: "once", sendAt: "2020-01-01T00:00:00.000Z" } }),
      ),
    ).toMatch(/future/);
    expect(draftError(draft({ channels: [] }))).toMatch(/channel/);
    expect(draftError(draft({ message: "x".repeat(321) }))).toMatch(/320/);
    expect(draftError(draft())).toBeNull();
  });
});

/* ------------------------------------------------- SMS analytics page */

describe("Notification templates: campaigns on the API", () => {
  const campaign = (over: Record<string, unknown> = {}) => ({
    id: "cp-1",
    title: "SYNTH Weekly Wellness",
    kind: "check-in",
    message: "How are you feeling today?",
    question: "wellbeing",
    channels: ["in_app"],
    schedule: "FREQ=WEEKLY;BYDAY=MO;BYHOUR=9",
    sendAt: null,
    audience: null,
    status: "active",
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    ...over,
  });

  it("lists templates with the server's schedule and reply rate; offers no Education type and no SMS", async () => {
    const { calls } = platformApi({
      "GET /platform/campaigns": (call) =>
        call.query.get("status") === "active"
          ? {
              body: {
                success: true,
                data: [campaign()],
                pagination: {
                  mode: "offset",
                  total: 1,
                  page: 1,
                  limit: 1,
                  totalPages: 1,
                  hasNext: false,
                  hasPrev: false,
                },
              },
            }
          : pageOf([
              campaign(),
              campaign({
                id: "cp-2",
                title: "SYNTH Reminder",
                kind: "reminder",
                question: null,
                status: "inactive",
                schedule: "FREQ=DAILY;BYHOUR=18",
              }),
            ]),
      "GET /platform/campaigns/cp-1/analytics": {
        data: {
          campaignId: "cp-1",
          totalDeliveries: 10,
          deliveries: [],
          inAppDelivered: 10,
          inAppRead: 8,
          readRate: 0.8,
          responseCount: 4,
          responseRate: 0.4,
          answers: [],
        },
      },
      "GET /platform/campaigns/cp-2/analytics": {
        data: {
          campaignId: "cp-2",
          totalDeliveries: 0,
          deliveries: [],
          inAppDelivered: 0,
          inAppRead: 0,
          readRate: 0,
          responseCount: 0,
          responseRate: 0,
          answers: [],
        },
      },
      "GET /platform/notifications/analytics": {
        data: {
          from: "2026-10-10",
          to: "2026-11-08",
          total: 266,
          byKind: [],
          byChannel: [{ channel: "IN_APP", count: 266 }],
          byStatus: [{ status: "SENT", count: 266 }],
          perDay: [],
        },
      },
      "POST /platform/campaigns": {
        status: 201,
        data: campaign({ id: "cp-3", status: "inactive" }),
      },
    });
    const { container } = render(<SmsAnalyticsPage />, { wrapper });
    expect(
      await screen.findByText("SYNTH Weekly Wellness"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Every Monday at 9:00 AM ET/)).toBeInTheDocument();
    expect(screen.getByText(/Every day at 6:00 PM ET/)).toBeInTheDocument();
    expect(await screen.findByText("266")).toBeInTheDocument();
    expect(await screen.findByText("40%")).toBeInTheDocument();
    expect(await screen.findByText("01")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    fireEvent.click(screen.getByRole("button", { name: "New Template" }));
    const dialog = await screen.findByRole("dialog");
    const type = within(dialog).getByLabelText("Message Type");
    expect(within(type).queryByText(/Education/)).toBeNull();
    expect(within(dialog).getByRole("button", { name: "SMS" })).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText("Template Name"), {
      target: { value: "SYNTH Tuesday" },
    });
    fireEvent.change(within(dialog).getByLabelText("Day"), {
      target: { value: "TU" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Time \(Eastern/), {
      target: { value: "14" },
    });
    fireEvent.change(within(dialog).getByLabelText("Message Content"), {
      target: { value: "Synthetic reminder text" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Create Template" }),
    );
    await waitFor(() =>
      expect(
        calls.find(
          (c) => c.method === "POST" && c.path === "/platform/campaigns",
        )?.body,
      ).toEqual({
        title: "SYNTH Tuesday",
        kind: "check-in",
        message: "Synthetic reminder text",
        question: null,
        channels: ["in_app"],
        schedule: "FREQ=WEEKLY;BYDAY=TU;BYHOUR=14",
        sendAt: null,
      }),
    );
  });

  it("a campaigns READ-only role has no edit or activate controls", async () => {
    platformApi(
      {
        "GET /platform/campaigns": pageOf([campaign()]),
        "GET /platform/notifications/analytics": apiError(403, null),
      },
      platformContext({ campaigns: 1, members: 1 }),
    );
    render(<SmsAnalyticsPage />, { wrapper });
    expect(
      await screen.findByText("SYNTH Weekly Wellness"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /Edit|Activate|Deactivate|New Template/,
      }),
    ).toBeNull();
  });
});

/* --------------------------------------------------- admin dashboard */

describe("Admin dashboard: only sourced widgets show numbers", () => {
  it("shows the overview and read rate, and 'not available yet' for the rest", async () => {
    platformApi({
      "GET /platform/reports/overview": {
        data: {
          members: 1247,
          memberSubscriptionsByStatus: [
            { key: "ACTIVE", count: 892 },
            { key: "TRIALING", count: 7 },
          ],
          organizations: [
            { type: "DIALYSIS_CENTER", status: "ACTIVE", count: 2 },
            { type: "HOSPITAL", status: "ACTIVE", count: 1 },
          ],
          activeContracts: 3,
          openSupportTickets: 6,
        },
      },
      "GET /platform/notifications/analytics": {
        data: {
          from: "a",
          to: "b",
          total: 200,
          byKind: [],
          byChannel: [],
          byStatus: [
            { status: "READ", count: 50 },
            { status: "SENT", count: 150 },
          ],
          perDay: [],
        },
      },
    });
    const { container } = render(<AdminDashboard />, { wrapper });
    expect(await screen.findByText("1,247")).toBeInTheDocument();
    expect(screen.getByText("892")).toBeInTheDocument();
    expect(await screen.findByText("25%")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    // the prototype's sample figures and member names are gone
    for (const sample of [
      "$8,340",
      "8,340",
      "+ 36% up",
      "Rakib Roy",
      "28,456",
      "86%",
    ])
      expect(screen.queryByText(sample)).toBeNull();
    expect(
      screen.getAllByText("Not available yet").length,
    ).toBeGreaterThanOrEqual(8);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("a 403 on the overview is a no-access tile, not zeros", async () => {
    platformApi({
      "GET /platform/reports/overview": apiError(
        403,
        "access.platform_permission_required",
      ),
      "GET /platform/notifications/analytics": apiError(500, null),
    });
    render(<AdminDashboard />, { wrapper });
    expect((await screen.findAllByText("No access")).length).toBe(4);
    expect(await screen.findByText("Did not load")).toBeInTheDocument();
    expect(screen.queryByText("0")).toBeNull();
  });
});
