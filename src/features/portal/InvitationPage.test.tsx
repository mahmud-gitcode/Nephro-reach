import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import {
  apiError,
  memberContext,
  stubApi,
} from "@/features/profile/memberApiStub";
import { InvitationPage, invitationErrorKey } from "./InvitationPage";
import { ApiError } from "@/lib/api/client";

/* /invitations/[token] (D1, D3): every status has its own words; a signed-
   out visitor is sent to sign in or register with `next`; the wrong account
   is told so without the invited email; a staff acceptance signs out (the
   server ended the sessions); the token is never stored. Synthetic only. */

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/invitations/tok",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const signOut = vi.fn(async (_options?: unknown) => true);
vi.mock("@/lib/data/session", async (orig) => ({
  ...(await orig<typeof import("@/lib/data/session")>()),
  signOut: (o: unknown) => signOut(o as never),
}));

const TOKEN = "SyntheticInviteToken_0123456789abcdef";

const preview = (over: Record<string, unknown> = {}) => ({
  data: {
    kind: "STAFF",
    organizationName: "Riverside Test Dialysis",
    inviterFirstName: null,
    role: "Front Desk",
    preset: null,
    expiresAt: "2026-11-10T00:00:00.000Z",
    status: "PENDING",
    ...over,
  },
});

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
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
  window.history.pushState({}, "", `/invitations/${TOKEN}`);
  window.localStorage.clear();
  window.sessionStorage.clear();
  push.mockReset();
  signOut.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.pushState({}, "", "/");
});

describe("/invitations/[token]", () => {
  it("signed out: sign in or create an account, both carrying next (axe clean)", async () => {
    stubApi(
      (c) => (c.path === `/invitations/${TOKEN}` ? preview() : undefined),
      null,
    );
    const { container } = render(<InvitationPage token={TOKEN} />, { wrapper });
    await screen.findByText("Join Riverside Test Dialysis");
    const signIn = await screen.findByRole("link", { name: "Sign in" });
    expect(signIn.getAttribute("href")).toBe(
      `/login?next=${encodeURIComponent(`/invitations/${TOKEN}`)}`,
    );
    expect(
      screen.getByRole("link", { name: "Create account" }).getAttribute("href"),
    ).toContain("/registration?next=");
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each([
    ["EXPIRED", "This invitation has expired. Ask for a new one."],
    ["REVOKED", "This invitation was withdrawn."],
    ["DECLINED", "This invitation was declined."],
    ["ACCEPTED", "This invitation was already accepted."],
  ])(
    "shows %s with its own words and no accept button",
    async (status, text) => {
      stubApi((c) =>
        c.path === `/invitations/${TOKEN}` ? preview({ status }) : undefined,
      );
      render(<InvitationPage token={TOKEN} />, { wrapper });
      await screen.findByText(text);
      expect(
        screen.queryByRole("button", { name: "Accept invitation" }),
      ).toBeNull();
    },
  );

  it("an unknown or replaced link says it does not work", async () => {
    stubApi((c) =>
      c.path === `/invitations/${TOKEN}`
        ? apiError(404, "invitations.invitation_not_found")
        : undefined,
    );
    render(<InvitationPage token={TOKEN} />, { wrapper });
    await screen.findByText("This invitation link does not work");
  });

  it("the wrong account is refused, without showing the invited email", async () => {
    stubApi((c) => {
      if (c.path === `/invitations/${TOKEN}`) return preview();
      if (c.path === `/invitations/${TOKEN}/accept`)
        return apiError(403, "invitations.invitation_for_other_email");
      return undefined;
    });
    render(<InvitationPage token={TOKEN} />, { wrapper });
    await userEvent.click(
      await screen.findByRole("button", { name: "Accept invitation" }),
    );
    await screen.findByText(/sent to a different email address/);
    expect(signOut).not.toHaveBeenCalled();
  });

  it("staff acceptance signs out to sign in again; the token is never stored", async () => {
    const { calls } = stubApi((c) => {
      if (c.path === `/invitations/${TOKEN}`) return preview();
      if (c.path === `/invitations/${TOKEN}/accept`)
        return {
          data: { kind: "STAFF", organizationId: "org-1", patientId: null },
        };
      return undefined;
    });
    render(<InvitationPage token={TOKEN} />, { wrapper });
    await userEvent.click(
      await screen.findByRole("button", { name: "Accept invitation" }),
    );
    await waitFor(() =>
      expect(signOut).toHaveBeenCalledWith({
        destination: "/login?reason=access-changed&next=%2Fdashboard",
      }),
    );
    const accept = calls.find((c) => c.path.endsWith("/accept"));
    expect(accept?.headers["x-organization-id"]).toBeUndefined();
    const stored = JSON.stringify({
      ...window.localStorage,
      ...window.sessionStorage,
    });
    expect(stored).not.toContain(TOKEN);
  });

  it("caregiver acceptance re-reads the context and opens the caregiver portal", async () => {
    let accepted = false;
    const base = memberContext();
    stubApi(
      (c) => {
        if (c.path === `/invitations/${TOKEN}`)
          return preview({
            kind: "CAREGIVER",
            organizationName: null,
            role: null,
            inviterFirstName: "John",
            preset: "full",
          });
        if (c.path === `/invitations/${TOKEN}/accept`) {
          accepted = true;
          return {
            data: { kind: "CAREGIVER", organizationId: null, patientId: "p-2" },
          };
        }
        return undefined;
      },
      { ...base, patient: null },
    );
    render(<InvitationPage token={TOKEN} />, { wrapper });
    await screen.findByText(/John invited you to help with their care/);
    await userEvent.click(
      await screen.findByRole("button", { name: "Accept invitation" }),
    );
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/dashboard/caregiver"),
    );
    expect(accepted).toBe(true);
  });
});

describe("invitationErrorKey", () => {
  it("maps the server's codes, then the status", () => {
    expect(
      invitationErrorKey(
        new ApiError(410, "x", "invitations.invitation_expired"),
      ),
    ).toBe("invitation.errors.expired");
    expect(
      invitationErrorKey(
        new ApiError(409, "x", "invitations.already_a_caregiver"),
      ),
    ).toBe("invitation.errors.alreadyCaregiver");
    expect(invitationErrorKey(new ApiError(410, "x", null))).toBe(
      "invitation.errors.expired",
    );
    expect(invitationErrorKey(new Error("x"))).toBe(
      "invitation.errors.generic",
    );
  });
});
