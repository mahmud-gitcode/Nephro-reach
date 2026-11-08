import React from "react";
import fs from "node:fs";
import path from "node:path";
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
  memberContext,
  pageOf,
  stubApi,
  type StubCall,
  type StubHandler,
} from "@/features/profile/memberApiStub";
import ClinicReports from "./ClinicReports";
import { axisMax, monthLabel, shares } from "./reports.data";
import { clampMonths } from "./officeReports.repository";

/* Phase 14 office reports against a stand-in API. Synthetic data only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/clinic/reports",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const ORG = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function officeContext(type: string): MeContext {
  return {
    ...memberContext(),
    patient: null,
    memberships: [
      {
        organizationId: ORG,
        organizationName: "Synthetic Office",
        organizationType: type,
        organizationStatus: "ACTIVE",
        role: "Office Manager",
        title: null,
        isOwner: false,
        permissions: { reports: 1, messages: 1 },
      },
    ],
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

class NoResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal("ResizeObserver", NoResizeObserver);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

const org = (rest: string) => `/organizations/${ORG}${rest}`;

const months6 = [
  "2026-06",
  "2026-07",
  "2026-08",
  "2026-09",
  "2026-10",
  "2026-11",
];
const REPORTS: Record<string, unknown> = {
  roster: {
    activePatients: 17,
    endedRelationships: 3,
    newLinksPerMonth: months6.map((month, i) => ({ month, count: i })),
  },
  programs: {
    totalEnrollments: 9,
    byStatus: [
      { key: "enrolled", count: 6 },
      { key: "completed", count: 3 },
    ],
    withCourse: 8,
    courseCompleted: 3,
    courseCompletionPercent: 38,
  },
  "check-in-notices": {
    delivered: 10,
    seen: 8,
    seenRatePercent: 80,
    perMonth: months6.map((month) => ({ month, delivered: 2, seen: 1 })),
  },
  messages: {
    fromMembers: 12,
    fromOffice: 9,
    perMonth: [],
    conversationsReplied: 4,
    medianFirstReplyMinutes: 30,
  },
  ccm: {
    month: "2026-11",
    thresholdMinutes: 30,
    totalMinutes: 50,
    countedMinutes: 40,
    pendingMinutes: 10,
    activities: 7,
    patients: 4,
    patientsAtThreshold: 2,
  },
};

function reportsApi(
  type = "DIALYSIS_CENTER",
  over: StubHandler = () => undefined,
) {
  return stubApi((c: StubCall) => {
    const o = over(c);
    if (o) return o;
    const m = /^\/organizations\/[^/]+\/reports\/([a-z-]+)$/.exec(c.path);
    if (m && REPORTS[m[1]]) return { data: REPORTS[m[1]] };
    if (c.path.startsWith(org("/conversations"))) return pageOf([]);
    return undefined;
  }, officeContext(type));
}

describe("report helpers", () => {
  it("months clamp to 1-24; labels and shares", () => {
    expect(clampMonths(undefined)).toBe(6);
    expect(clampMonths(0)).toBe(1);
    expect(clampMonths(99)).toBe(24);
    expect(monthLabel("2026-10")).toBe("Oct");
    expect(
      shares([
        { label: "a", count: 1 },
        { label: "b", count: 3 },
      ]).map((s) => s.pct),
    ).toEqual([25, 75]);
    expect(shares([{ label: "a", count: 0 }])[0].pct).toBe(0);
    expect(axisMax([0, 3])).toBe(5);
    expect(axisMax([17])).toBe(20);
  });
});

describe("office reports page", () => {
  it("figures are the server's; no sample figures; per-member files not available; axe", async () => {
    const { calls } = reportsApi();
    const { container } = render(<ClinicReports />, { wrapper });
    expect(await screen.findByText("17")).toBeInTheDocument();
    expect((await screen.findAllByText("38%")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Diet and Fluid Management")).toBeNull();
    expect(screen.queryByText(/Sample figures/)).toBeNull();
    expect(screen.queryByText("Journey to Dialysis")).toBeNull();
    expect(screen.getAllByText("No data yet").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Member Activity Export (CSV)" }),
    ).toBeDisabled();
    const roster = calls.find((c) => c.path === org("/reports/roster"))!;
    expect(roster.query.get("months")).toBe("6");
    expect(roster.headers["x-organization-id"]).toBe(ORG);
    /* CCM is a nephrology report: a dialysis center never asks for it. */
    expect(calls.some((c) => c.path === org("/reports/ccm"))).toBe(false);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("the CCM card shows for a nephrology office", async () => {
    const { calls } = reportsApi("NEPHROLOGY_OFFICE");
    render(<ClinicReports />, { wrapper });
    expect(await screen.findByText("CCM This Month")).toBeInTheDocument();
    expect(
      await screen.findByText("At the time threshold"),
    ).toBeInTheDocument();
    expect(calls.some((c) => c.path === org("/reports/ccm"))).toBe(true);
  });

  it("the period goes to the server", async () => {
    const { calls } = reportsApi();
    render(<ClinicReports />, { wrapper });
    await screen.findByText("17");
    await userEvent.selectOptions(screen.getByLabelText(/Period/), "12");
    await waitFor(() =>
      expect(
        calls.some(
          (c) =>
            c.path === org("/reports/roster") && c.query.get("months") === "12",
        ),
      ).toBe(true),
    );
  });

  it("export downloads the server's CSV (no CSV is built from rows)", async () => {
    const { calls, fetchMock } = reportsApi();
    const blobs: string[] = [];
    vi.stubGlobal(
      "URL",
      Object.assign(URL, {
        createObjectURL: () => {
          blobs.push("x");
          return "blob:x";
        },
        revokeObjectURL: () => undefined,
      }),
    );
    const base = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (input, init) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/export")) {
        calls.push({
          method: "GET",
          path: url.pathname.replace("/api/v1", ""),
          query: url.searchParams,
          body: undefined,
          headers: Object.fromEntries(
            Object.entries((init?.headers as Record<string, string>) ?? {}).map(
              ([k, v]) => [k.toLowerCase(), v],
            ),
          ),
        });
        return new Response("metric,group,value\nactive,,17\n", {
          status: 200,
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition":
              'attachment; filename="roster-2026-11-08.csv"',
          },
        });
      }
      return base(input, init);
    });
    render(<ClinicReports />, { wrapper });
    await screen.findByText("17");
    await userEvent.click(
      screen.getByRole("button", { name: /Export Report/ }),
    );
    /* The external-share notice asks first. */
    await userEvent.click(await screen.findByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /Confirm/ }));
    await waitFor(() =>
      expect(calls.some((c) => c.path === org("/reports/roster/export"))).toBe(
        true,
      ),
    );
    const call = calls.find((c) => c.path === org("/reports/roster/export"))!;
    expect(call.headers.accept).toBe("text/csv");
    expect(call.headers["x-organization-id"]).toBe(ORG);
    expect(call.query.get("months")).toBe("6");
    await waitFor(() => expect(blobs).toHaveLength(1));
  });

  it("a 403 on a report is that card's no-access state, never zeros", async () => {
    reportsApi("DIALYSIS_CENTER", (c) =>
      c.path === org("/reports/programs")
        ? apiError(403, "access.permission_denied")
        : undefined,
    );
    render(<ClinicReports />, { wrapper });
    expect(
      (await screen.findAllByText("This has not been shared with you")).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("0%")).toBeNull();
  });

  it("no per-member CSV is built in the browser any more", () => {
    const text = fs.readFileSync(
      path.join(process.cwd(), "src/features/clinic/ClinicReports.tsx"),
      "utf8",
    );
    expect(text).not.toMatch(/toCsv|memberActivityCsv|downloadText/);
    const data = fs.readFileSync(
      path.join(process.cwd(), "src/features/clinic/reports.data.ts"),
      "utf8",
    );
    expect(data).not.toMatch(
      /engagementSeries|topTopics|outcomes =|recentActivity/,
    );
  });
});
