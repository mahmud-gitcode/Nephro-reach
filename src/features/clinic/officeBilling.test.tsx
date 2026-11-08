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
  isRetiredKey,
  purgeLegacyStorage,
  STORAGE_VERSION,
} from "@/lib/data/legacyPurge";
import {
  apiError,
  memberContext,
  pageOf,
  stubApi,
  type StubHandler,
} from "@/features/profile/memberApiStub";
import ClinicBilling from "./ClinicBilling";
import {
  contractStatusLabel,
  formatCents,
  invoiceStatusLabel,
  localDate,
  paidThisMonthPct,
  toInvoice,
} from "./billing.data";
import { changeRequestError, renewalLabel } from "./billing.actions";

/* Phase 14 office billing against a stand-in API. Synthetic data only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/clinic/billing",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const ORG = "99999999-9999-4999-8999-999999999999";
const USER = memberContext().user.id;

function officeContext(permissions: Record<string, number>): MeContext {
  return {
    ...memberContext(),
    patient: null,
    memberships: [
      {
        organizationId: ORG,
        organizationName: "Synthetic Dialysis Center",
        organizationType: "DIALYSIS_CENTER",
        organizationStatus: "ACTIVE",
        role: "Office Manager",
        title: null,
        isOwner: false,
        permissions,
      },
    ],
  } as MeContext;
}

const MANAGER = officeContext({ billing: 2, settings: 1 });
const VIEWER = officeContext({ billing: 1 });

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
  vi.unstubAllEnvs();
  window.localStorage.clear();
});

const org = (rest: string) => `/organizations/${ORG}${rest}`;

const CONTRACT = {
  contract: {
    id: "k-1",
    contractNumber: "NR-SYN-0001",
    plan: { name: "Dialysis Center Plan" },
    status: "ACTIVE",
    startsOn: "2026-01-01",
    endsOn: "2026-12-31",
    patientsAllowed: 30,
    monthlyFeeCents: 199595,
    billingCycle: "monthly",
    autoRenew: true,
    renewalChoice: "review",
    primaryContact: { id: "u-1", name: "Synthetic Contact" },
  },
  pendingContract: null,
  seats: { used: 2, allowed: 30, available: 28 },
};

const INVOICES = [
  {
    id: "i-1",
    number: "NR-INV-SYN-10",
    periodLabel: "Oct 2026",
    issuedOn: "2026-10-01",
    dueOn: "2026-11-15",
    amountCents: 1995,
    currency: "USD",
    status: "DUE",
    paidAt: null,
    hasPdf: true,
  },
  {
    id: "i-2",
    number: "NR-INV-SYN-09",
    periodLabel: "Sep 2026",
    issuedOn: "2026-09-01",
    dueOn: "2026-09-30",
    amountCents: 199500,
    currency: "USD",
    status: "PAID",
    paidAt: "2026-09-18T15:00:00.000Z",
    hasPdf: false,
  },
];

function billingApi(over: StubHandler = () => undefined, ctx = MANAGER) {
  return stubApi((c) => {
    const o = over(c);
    if (o) return o;
    if (c.path === org("/billing/contract")) return { data: CONTRACT };
    if (c.path === org("/billing/invoices")) return pageOf(INVOICES);
    if (c.path === org("/billing/change-requests") && c.method === "GET")
      return pageOf([]);
    if (c.path === org("")) return apiError(403, "access.permission_denied");
    return undefined;
  }, ctx);
}

describe("billing mapping", () => {
  it("money keeps its cents", () => {
    expect(formatCents(1995)).toBe("$19.95");
    expect(formatCents(199500)).toBe("$1,995.00");
    expect(formatCents(0)).toBe("$0.00");
  });
  it("statuses map both ways, ENDED included; unknown is never paid or active", () => {
    expect(contractStatusLabel("ACTIVE")).toBe("Active");
    expect(contractStatusLabel("PENDING")).toBe("Pending");
    expect(contractStatusLabel("EXPIRING_SOON")).toBe("Expiring Soon");
    expect(contractStatusLabel("ENDED")).toBe("Ended");
    expect(contractStatusLabel("WHATEVER")).toBe("Ended");
    expect(invoiceStatusLabel("PAID")).toBe("Paid");
    expect(invoiceStatusLabel("OVERDUE")).toBe("Overdue");
    expect(invoiceStatusLabel("??")).toBe("Due");
  });
  it("contract days are local days, not UTC", () => {
    expect(localDate("2026-01-01").getDate()).toBe(1);
    expect(toInvoice(INVOICES[0]).issued.getMonth()).toBe(9);
  });
  it("this month's paid share is null when no invoice of the month is shown", () => {
    const rows = INVOICES.map(toInvoice);
    expect(paidThisMonthPct(rows, new Date(2026, 9, 20))).toBe(0);
    expect(paidThisMonthPct(rows, new Date(2026, 8, 20))).toBe(100);
    expect(paidThisMonthPct(rows, new Date(2026, 10, 20))).toBeNull();
  });
  it("change requests follow the server's limits; renewal reads as text", () => {
    expect(changeRequestError("short")).not.toBeNull();
    expect(changeRequestError("x".repeat(1001))).not.toBeNull();
    expect(changeRequestError("We need ten more seats")).toBeNull();
    expect(renewalLabel(null)).toBe("Not set");
    expect(renewalLabel("end")).toBe("Do not renew");
  });
});

describe("office billing page", () => {
  it("shows the server's contract; no pay or renewal controls; PDF only when issued; axe", async () => {
    const { calls } = billingApi();
    const { container } = render(<ClinicBilling />, { wrapper });
    expect(await screen.findAllByText("NR-SYN-0001")).not.toHaveLength(0);
    expect(screen.getAllByText("$1,995.95").length).toBeGreaterThan(0);
    expect((await screen.findAllByText("$19.95")).length).toBeGreaterThan(0);
    expect(screen.getByText("28 slots remaining")).toBeInTheDocument();
    expect(
      screen.getByText("Renewal choice: Contact me before renewal"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /pay/i })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /renewal options/i }),
    ).toBeNull();
    expect(screen.queryByText(/mark paid/i)).toBeNull();
    expect(
      screen.getByRole("button", { name: "Download NR-INV-SYN-10" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Download NR-INV-SYN-09" }),
    ).toBeDisabled();
    for (const c of calls.filter((c) => c.path.startsWith("/organizations/")))
      expect(c.headers["x-organization-id"]).toBe(ORG);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("an issued PDF opens through the short-lived link", async () => {
    vi.stubEnv("NEXT_PUBLIC_STORAGE_ORIGIN", "http://localhost:5906");
    const opened = vi.fn();
    vi.stubGlobal("open", opened);
    const { calls } = billingApi((c) =>
      c.path === org("/billing/invoices/i-1/download-link")
        ? {
            data: {
              url: "http://localhost:5906/bucket/inv.pdf?sig=x",
              expiresIn: 300,
            },
          }
        : undefined,
    );
    render(<ClinicBilling />, { wrapper });
    await userEvent.click(
      await screen.findByRole("button", { name: "Download NR-INV-SYN-10" }),
    );
    await waitFor(() => expect(opened).toHaveBeenCalledTimes(1));
    expect(opened.mock.calls[0][0]).toContain("inv.pdf");
    expect(opened.mock.calls[0][2]).toContain("noopener");
    expect(
      calls.some((c) => c.path === org("/billing/invoices/i-1/download-link")),
    ).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "data:image/svg+xml,<svg onload=alert(1)>",
    "data:application/pdf;base64,JVBERi0",
    "blob:http://localhost:4000/1234",
    "http://files.example/inv.pdf",
    "https://elsewhere.example/inv.pdf",
  ])("an unsafe invoice link (%s) is never opened", async (url) => {
    vi.stubEnv("NEXT_PUBLIC_STORAGE_ORIGIN", "http://localhost:5906");
    const opened = vi.fn();
    vi.stubGlobal("open", opened);
    billingApi((c) =>
      c.path === org("/billing/invoices/i-1/download-link")
        ? { data: { url, expiresIn: 300 } }
        : undefined,
    );
    render(<ClinicBilling />, { wrapper });
    await userEvent.click(
      await screen.findByRole("button", { name: "Download NR-INV-SYN-10" }),
    );
    expect(
      await screen.findByText(
        "The invoice link was not valid. Nothing was opened.",
      ),
    ).toBeInTheDocument();
    expect(opened).not.toHaveBeenCalled();
  });

  it("a change request is sent to the server and listed as yours", async () => {
    let sent: unknown = null;
    billingApi((c) => {
      if (c.path === org("/billing/change-requests") && c.method === "POST") {
        sent = c.body;
        return { status: 201, data: { id: "r-1" } };
      }
      if (c.path === org("/billing/change-requests") && sent)
        return pageOf([
          {
            id: "r-1",
            topic: "seats",
            detail: "We need ten more seats",
            requestedById: USER,
            requestedAt: "2026-11-08T12:00:00.000Z",
            resolvedAt: null,
          },
        ]);
      return undefined;
    });
    render(<ClinicBilling />, { wrapper });
    await userEvent.click(
      await screen.findByRole("button", { name: "Request a Change" }),
    );
    await userEvent.type(
      screen.getByLabelText("Details"),
      "We need ten more seats",
    );
    await userEvent.click(screen.getByRole("button", { name: "Send Request" }));
    await waitFor(() =>
      expect(sent).toEqual({
        topic: "seats",
        detail: "We need ten more seats",
      }),
    );
    expect(
      await screen.findByText(/Change requested by you: Patient slots/),
    ).toBeInTheDocument();
  });

  it("a read-only billing role cannot open the request form", async () => {
    billingApi(undefined, VIEWER);
    render(<ClinicBilling />, { wrapper });
    expect(
      await screen.findByRole("button", { name: "Request a Change" }),
    ).toBeDisabled();
  });

  it("no contract is its own state", async () => {
    billingApi((c) =>
      c.path === org("/billing/contract")
        ? { data: { contract: null, pendingContract: null, seats: null } }
        : undefined,
    );
    render(<ClinicBilling />, { wrapper });
    expect(await screen.findByText("No contract")).toBeInTheDocument();
  });

  it("a 403 is the no-access state; a 500 is an error, never the demo contract", async () => {
    billingApi((c) =>
      c.path === org("/billing/contract")
        ? apiError(403, "access.permission_denied")
        : undefined,
    );
    render(<ClinicBilling />, { wrapper });
    expect(
      await screen.findByText("This has not been shared with you"),
    ).toBeInTheDocument();
    cleanup();
    billingApi((c) =>
      c.path === org("/billing/contract") ? apiError(500, null) : undefined,
    );
    render(<ClinicBilling />, { wrapper });
    expect(await screen.findByText("Billing did not load")).toBeInTheDocument();
    expect(screen.queryByText("NR-2026-0125")).toBeNull();
  });
});

describe("retired billing storage", () => {
  it("nr:clinic-billing-actions is purged and nothing reads it", () => {
    expect(STORAGE_VERSION).toBeGreaterThanOrEqual(14);
    const keys = [
      "nr:clinic-billing-actions",
      "nr:member:demo@example.test:clinic-billing-actions",
    ];
    for (const key of keys) {
      expect(isRetiredKey(key)).toBe(true);
      window.localStorage.setItem(
        key,
        JSON.stringify({ paidInvoices: ["INV-2026-01"], renewal: "end" }),
      );
    }
    purgeLegacyStorage(window.localStorage);
    for (const key of keys) expect(window.localStorage.getItem(key)).toBeNull();
    for (const file of [
      "src/features/clinic/ClinicBilling.tsx",
      "src/features/clinic/BillingModals.tsx",
      "src/features/clinic/billing.data.ts",
      "src/features/clinic/billing.actions.ts",
      "src/features/clinic/useBillingActions.ts",
      "src/features/clinic/officeBilling.repository.ts",
    ]) {
      const text = fs.readFileSync(path.join(process.cwd(), file), "utf8");
      expect(text, file).not.toMatch(
        /readJson|writeJson|storageKey|localStorage|invoicesUpTo|markPaid|buildPdf/,
      );
    }
  });
});
