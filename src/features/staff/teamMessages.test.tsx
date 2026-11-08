import React from "react";
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
  type StubReply,
} from "@/features/profile/memberApiStub";
import { TeamMessages } from "./TeamMessages";
import { viewTeamMessages, type ApiTeamMessage } from "./teamMessages.data";

/* Team messages on the API (P15c, INT-P15-1): the active office's
   /organizations/{orgId}/team-messages, as that office; names from the
   staff list when the role may read it; nothing in browser storage.
   Synthetic ids and names only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/clinic/messages",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const ORG = "0c0c0c0c-0000-4000-8000-00000000000a";
const ME = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const DOC = "dddddddd-0000-4000-8000-00000000000d";

function officeContext(permissions: Record<string, number>): MeContext {
  return {
    ...memberContext(),
    patient: null,
    memberships: [
      {
        organizationId: ORG,
        organizationName: "Riverside Test Dialysis",
        organizationType: "DIALYSIS_CENTER",
        organizationStatus: "ACTIVE",
        role: "Nurse",
        title: null,
        isOwner: false,
        permissions,
      },
    ],
  };
}

const FROM_DOC: ApiTeamMessage = {
  id: "11111111-0000-4000-8000-000000000001",
  fromId: DOC,
  toId: ME,
  body: "Please review the test labs.",
  sentAt: "2026-11-08T10:00:00.000Z",
  readAt: null,
};

const STAFF = [
  {
    id: "m-1",
    userId: DOC,
    name: "Dr. Test Physician",
    email: "doc@example.test",
    role: "Physician",
    title: null,
    isOwner: false,
    status: "ACTIVE",
    deactivatedAt: null,
    createdAt: "2026-11-01T00:00:00.000Z",
  },
];

const base = `/organizations/${ORG}/team-messages`;

function handler(extra?: (c: StubCall) => StubReply | undefined) {
  return (c: StubCall) => {
    const hit = extra?.(c);
    if (hit) return hit;
    if (c.path === base && c.method === "GET") return pageOf([FROM_DOC]);
    if (c.path === `/organizations/${ORG}/staff`) return pageOf(STAFF);
    if (c.path === base && c.method === "POST")
      return { status: 201, data: { ...FROM_DOC, id: "new" } };
    if (c.path === `${base}/read`) return { data: { count: 1 } };
    return undefined;
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

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

const teamCalls = (calls: StubCall[]) =>
  calls.filter((c) => c.path.startsWith(base));

describe("viewTeamMessages", () => {
  it("names people from the staff list and never shows an id", () => {
    const [view] = viewTeamMessages(
      [FROM_DOC],
      { userId: ME, name: "Nina Test", role: "Nurse" },
      [{ userId: DOC, name: "Dr. Test Physician", role: "Physician" }],
    );
    expect(view).toMatchObject({
      from: "Dr. Test Physician",
      fromRole: "Physician",
      to: "Nina Test",
      isNew: true,
      toMe: true,
    });
    const [unknown] = viewTeamMessages(
      [{ ...FROM_DOC, fromId: "unknown-user" }],
      { userId: ME, name: "Nina Test", role: "Nurse" },
      [],
    );
    expect(unknown.from).toBe("A colleague");
    expect(JSON.stringify(unknown)).not.toContain("Dr.");
  });
});

describe("TeamMessages on the API", () => {
  it("reads the office's messages as that office, names them, and has no axe violations", async () => {
    const { calls } = stubApi(
      handler(),
      officeContext({ team_messages: 2, staff: 1 }),
    );
    const { container } = render(<TeamMessages />, { wrapper });
    expect(
      await screen.findByText("Please review the test labs."),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Dr\. Test Physician/, { selector: "p" }),
    ).toBeInTheDocument();
    for (const c of teamCalls(calls))
      expect(c.headers["x-organization-id"]).toBe(ORG);
    expect(await axe(container)).toHaveNoViolations();
    expect(
      Object.keys(window.localStorage).filter((k) =>
        k.includes("team-messages"),
      ),
    ).toEqual([]);
  });

  it("sends a message to a colleague by user id and reads the list again", async () => {
    const user = userEvent.setup();
    const { calls } = stubApi(
      handler(),
      officeContext({ team_messages: 2, staff: 1 }),
    );
    render(<TeamMessages />, { wrapper });
    const start = await screen.findByRole("button", {
      name: "Message a Physician",
    });
    await waitFor(() => expect(start).toBeEnabled());
    await user.click(start);
    await user.type(
      await screen.findByLabelText(/Message/, { selector: "textarea" }),
      "Test note for the physician",
    );
    await user.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() =>
      expect(
        teamCalls(calls).some((c) => c.method === "POST" && c.path === base),
      ).toBe(true),
    );
    const post = teamCalls(calls).find(
      (c) => c.method === "POST" && c.path === base,
    )!;
    expect(post.body).toEqual({
      toId: DOC,
      body: "Test note for the physician",
    });
    expect(post.headers["x-organization-id"]).toBe(ORG);
  });

  it("marks the caller's messages read on the server", async () => {
    const user = userEvent.setup();
    const { calls } = stubApi(
      handler((c) =>
        c.path === base && c.query.get("unread") === "true"
          ? pageOf([FROM_DOC])
          : undefined,
      ),
      officeContext({ team_messages: 2, staff: 1 }),
    );
    render(<TeamMessages />, { wrapper });
    await user.click(await screen.findByRole("button", { name: "Mark read" }));
    await waitFor(() =>
      expect(
        teamCalls(calls).some(
          (c) => c.method === "POST" && c.path === `${base}/read`,
        ),
      ).toBe(true),
    );
  });

  it("without the staff list: replies work, starting a message is disabled and explained", async () => {
    const user = userEvent.setup();
    const { calls } = stubApi(handler(), officeContext({ team_messages: 2 }));
    render(<TeamMessages />, { wrapper });
    expect(
      await screen.findByText("Please review the test labs."),
    ).toBeInTheDocument();
    const start = screen.getByRole("button", { name: "Message a Physician" });
    expect(start).toBeDisabled();
    expect(start).toHaveAccessibleDescription(/Not available yet/);
    expect(calls.some((c) => c.path.endsWith("/staff"))).toBe(false);
    await user.click(
      screen.getByRole("button", { name: "Reply to A colleague" }),
    );
    await user.type(
      await screen.findByLabelText(/Message/, { selector: "textarea" }),
      "On it",
    );
    await user.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() =>
      expect(
        teamCalls(calls).find((c) => c.method === "POST" && c.path === base)
          ?.body,
      ).toEqual({ toId: DOC, body: "On it" }),
    );
  });

  it("a refused read is shown as no access, never as no messages", async () => {
    stubApi(
      handler((c) =>
        c.path === base && c.method === "GET"
          ? apiError(403, "access.forbidden")
          : undefined,
      ),
      officeContext({ team_messages: 2 }),
    );
    render(<TeamMessages />, { wrapper });
    expect(
      await screen.findByText("Team messages are not available to your role"),
    ).toBeInTheDocument();
    expect(screen.queryByText("No team messages yet")).toBeNull();
  });

  it("never reads a legacy browser copy", async () => {
    window.localStorage.setItem(
      "nr:team-messages",
      JSON.stringify([
        {
          id: "tm-1",
          org: "Riverside Test Dialysis",
          from: "Old Office",
          fromRole: "Nurse",
          to: "John Test",
          body: "Legacy test chat",
          sentAt: "2026-11-01T00:00:00.000Z",
        },
      ]),
    );
    stubApi(
      handler((c) =>
        c.path === base && c.method === "GET" ? pageOf([]) : undefined,
      ),
      officeContext({ team_messages: 2, staff: 1 }),
    );
    render(<TeamMessages />, { wrapper });
    expect(await screen.findByText("No team messages yet")).toBeInTheDocument();
    expect(screen.queryByText("Legacy test chat")).toBeNull();
  });

  it("renders nothing outside office mode", async () => {
    const { calls } = stubApi(handler());
    const { container } = render(<TeamMessages />, { wrapper });
    await waitFor(() =>
      expect(calls.some((c) => c.path === "/me/context")).toBe(true),
    );
    expect(container.textContent).toBe("");
    expect(teamCalls(calls)).toEqual([]);
  });
});
