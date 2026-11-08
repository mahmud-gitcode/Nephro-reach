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
import {
  purgeLegacyStorage,
  RETIRED_STORES,
  STORAGE_VERSION,
} from "@/lib/data/legacyPurge";
import SupportCenter from "./SupportCenter";
import SupportInbox from "./SupportInbox";

/* Support on the API (Phase 11): the requester's tab and the NephroReach
   team's inbox. Synthetic data only. */

let pathname = "/dashboard/support";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const HOSPITAL = "org-hospital";

function membership(
  organizationId: string,
  organizationType: string,
  name: string,
) {
  return {
    organizationId,
    organizationName: name,
    organizationType,
    organizationStatus: "ACTIVE",
    role: "Owner",
    title: null,
    isOwner: true,
    permissions: {},
  } as MeContext["memberships"][number];
}

function hospitalContext(): MeContext {
  return {
    ...memberContext(),
    patient: null,
    memberships: [membership(HOSPITAL, "HOSPITAL", "Test Hospital")],
  };
}

function platformContext(): MeContext {
  return {
    ...memberContext(),
    patient: null,
    platform: membership("org-platform", "PLATFORM", "NephroReach"),
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

const ticket = (over: Record<string, unknown> = {}) => ({
  id: "abcdef12-1111-4111-8111-111111111111",
  dashboard: "Hospital",
  organizationId: HOSPITAL,
  organizationName: "Test Hospital",
  subject: "Upload fails",
  category: "technical",
  message: "The upload fails.",
  status: "open",
  createdAt: "2026-11-02T10:00:00.000Z",
  updatedAt: "2026-11-02T10:00:00.000Z",
  ...over,
});

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

describe("the requester's Support tab", () => {
  it("sends Hospital and the office in office mode, never a name or email", async () => {
    pathname = "/dashboard/hospital/support";
    const created: StubCall[] = [];
    stubApi((call): StubReply | undefined => {
      if (call.path === "/me/support-tickets" && call.method === "POST") {
        created.push(call);
        return { status: 201, data: ticket() };
      }
      if (call.path === "/me/support-tickets") return pageOf([]);
      return undefined;
    }, hospitalContext());
    render(<SupportCenter href="/dashboard/hospital/support" />, { wrapper });
    await screen.findByText("No requests yet");
    fireEvent.click(screen.getByRole("button", { name: "New Request" }));
    fireEvent.change(screen.getByLabelText(/Subject/), {
      target: { value: "Upload fails" },
    });
    fireEvent.change(screen.getByLabelText(/How can we help/), {
      target: { value: "The upload fails." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0].body).toEqual({
      subject: "Upload fails",
      category: "technical",
      message: "The upload fails.",
      dashboard: "Hospital",
      organizationId: HOSPITAL,
    });
    expect(created[0].headers["x-organization-id"]).toBe(HOSPITAL);
  });

  it("sends Patient and no office for a member, and lists the server's tickets", async () => {
    pathname = "/dashboard/support";
    const created: StubCall[] = [];
    stubApi((call) => {
      if (call.path === "/me/support-tickets" && call.method === "POST") {
        created.push(call);
        return { status: 201, data: ticket({ dashboard: "Patient" }) };
      }
      if (call.path === "/me/support-tickets")
        return pageOf([ticket({ dashboard: "Patient" })]);
      if (call.path.startsWith("/me/support-tickets/"))
        return {
          data: ticket({
            replies: [
              {
                id: "r1",
                side: "support",
                body: "We fixed it.",
                at: "2026-11-02T11:00:00.000Z",
              },
            ],
          }),
        };
      return undefined;
    });
    const { container } = render(<SupportCenter href="/dashboard/support" />, {
      wrapper,
    });
    const row = await screen.findByText("Upload fails");
    expect(screen.getByText(/ABCDEF12/)).toBeTruthy();
    fireEvent.click(row);
    expect(await screen.findByText("We fixed it.")).toBeTruthy();
    expect(await axe(container)).toHaveNoViolations();

    fireEvent.click(screen.getByRole("button", { name: "New Request" }));
    fireEvent.change(screen.getByLabelText(/Subject/), {
      target: { value: "Login help" },
    });
    fireEvent.change(screen.getByLabelText(/How can we help/), {
      target: { value: "I cannot sign in." },
    });
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Send" }),
    );
    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0].body).toMatchObject({ dashboard: "Patient" });
    expect(created[0].body).not.toHaveProperty("organizationId");
    expect(JSON.stringify(created[0].body)).not.toMatch(/john|email/i);
  });

  it("shows the error state, never an empty list, when the read fails", async () => {
    pathname = "/dashboard/support";
    stubApi((call) =>
      call.path === "/me/support-tickets" ? apiError(500, null) : undefined,
    );
    render(<SupportCenter href="/dashboard/support" />, { wrapper });
    expect(await screen.findByText("Your requests did not load")).toBeTruthy();
    expect(screen.queryByText("No requests yet")).toBeNull();
  });

  it("shows the server's refusal of a reply on a resolved ticket", async () => {
    pathname = "/dashboard/support";
    stubApi((call) => {
      if (call.path === "/me/support-tickets")
        return pageOf([ticket({ status: "answered" })]);
      if (call.path.endsWith("/replies"))
        return apiError(
          409,
          "support.ticket_resolved",
          "This ticket is resolved.",
        );
      if (call.path.startsWith("/me/support-tickets/"))
        return { data: ticket({ status: "answered", replies: [] }) };
      return undefined;
    });
    render(<SupportCenter href="/dashboard/support" />, { wrapper });
    fireEvent.click(await screen.findByText("Upload fails"));
    fireEvent.change(await screen.findByLabelText("Reply"), {
      target: { value: "One more thing" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("This ticket is resolved.")).toBeTruthy();
    expect((screen.getByLabelText("Reply") as HTMLTextAreaElement).value).toBe(
      "One more thing",
    );
  });
});

describe("the NephroReach team's Support Inbox", () => {
  it("reads tickets and organization requests from the platform routes", async () => {
    pathname = "/dashboard/admin-support";
    const { calls } = stubApi((call) => {
      if (call.path === "/platform/support-tickets")
        return pageOf([
          ticket({
            requester: {
              id: "u1",
              name: "Pat Staff",
              email: "pat@example.test",
            },
          }),
        ]);
      if (call.path === "/platform/support-info-requests")
        return pageOf([
          {
            id: "i1",
            shareId: "s1",
            shareKind: "message",
            sharedByOrganizationName: null,
            name: "Outside Coordinator",
            organization: "Outside Office",
            email: "coord@example.test",
            phone: "",
            at: "2026-11-02T10:00:00.000Z",
            contacted: false,
            contactedAt: null,
          },
        ]);
      if (call.path === "/platform/support-info-requests/i1")
        return { data: {} };
      return undefined;
    }, platformContext());
    const { container } = render(<SupportInbox />, { wrapper });
    expect(await screen.findByText("Upload fails")).toBeTruthy();
    expect(screen.getByText(/Pat Staff \(Hospital/)).toBeTruthy();
    const list = calls.find((c) => c.path === "/platform/support-tickets");
    expect(list?.query.get("status")).toBe("open");
    expect(list?.headers["x-organization-id"]).toBeUndefined();
    expect(await axe(container)).toHaveNoViolations();

    fireEvent.click(screen.getByRole("tab", { name: /Organization Requests/ }));
    expect(await screen.findByText("Outside Office")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Mark Contacted" }));
    await waitFor(() =>
      expect(
        calls.find(
          (c) =>
            c.path === "/platform/support-info-requests/i1" &&
            c.method === "PATCH",
        )?.body,
      ).toEqual({ contacted: true }),
    );
  });

  it("shows no access, never an empty inbox, on a 403", async () => {
    pathname = "/dashboard/admin-support";
    stubApi((call) =>
      call.path.startsWith("/platform/")
        ? apiError(403, "access.platform_permission_required")
        : undefined,
    );
    render(<SupportInbox />, { wrapper });
    expect(
      (await screen.findAllByText("This has not been shared with you")).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Nothing here")).toBeNull();
    expect(screen.queryByRole("button", { name: /try again/i })).toBeNull();
  });
});

describe("the retired support store", () => {
  it("is purged and never read back", async () => {
    pathname = "/dashboard/support";
    window.localStorage.setItem(
      "nr:support-tickets",
      JSON.stringify({
        tickets: [
          {
            id: "SUP-1001",
            subject: "Legacy ticket",
            category: "other",
            message: "From the prototype",
            status: "open",
            createdAt: "2026-10-01T10:00:00.000Z",
            from: {
              name: "Legacy",
              email: "legacy@example.test",
              dashboard: "Patient",
            },
            replies: [],
          },
        ],
        contacted: [],
      }),
    );
    expect(
      RETIRED_STORES.find((s) => s.name === "support-tickets")?.since,
    ).toBe(12);
    expect(STORAGE_VERSION).toBeGreaterThanOrEqual(12);
    purgeLegacyStorage();
    expect(window.localStorage.getItem("nr:support-tickets")).toBeNull();
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    stubApi((call) =>
      call.path === "/me/support-tickets" ? pageOf([]) : undefined,
    );
    render(<SupportCenter href="/dashboard/support" />, { wrapper });
    await screen.findByText("No requests yet");
    expect(screen.queryByText("Legacy ticket")).toBeNull();
    expect(
      getItem.mock.calls.some(([key]) => key === "nr:support-tickets"),
    ).toBe(false);
  });
});
