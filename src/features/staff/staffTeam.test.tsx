import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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
} from "@/features/profile/memberApiStub";
import { StaffTeamCard } from "./StaffTeam";

/* Staff administration on the API (D3, D4): buttons follow the server's
   levels; the invite form has no password; roles above the inviter's own
   are not offered; the role editor is read-only without roles Manage and
   locks levels above the editor's own; a server refusal is shown; a 403 is
   "not shared", never an empty table. Synthetic data only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/clinic/team",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const ORG = "org-river";

function staffContext(
  permissions: Record<string, number>,
  isOwner = false,
): MeContext {
  return {
    ...memberContext(),
    patient: null,
    memberships: [
      {
        organizationId: ORG,
        organizationName: "Riverside Test Dialysis",
        organizationType: "DIALYSIS_CENTER",
        organizationStatus: "ACTIVE",
        role: isOwner ? "Owner" : "Office Manager",
        title: null,
        isOwner,
        permissions,
      },
    ],
  };
}

/* The dialysis Office Manager default (final-matrix.md §3). */
const OM = {
  settings: 2,
  staff: 3,
  roles: 1,
  patients: 2,
  labs: 1,
  referrals: 1,
  vascular_access: 1,
  check_ins: 1,
  travel: 1,
  programs: 1,
  reports: 1,
  billing: 1,
  prescriptions: 1,
};
const OWNER = { "*": 3 };

const ROLES = [
  {
    name: "Front Desk",
    isBuiltIn: true,
    isCustom: false,
    isOverridden: false,
    permissions: { patients: 2, referrals: 1, vascular_access: 1 },
    defaultPermissions: { patients: 2 },
    memberCount: 1,
  },
  {
    name: "Physician",
    isBuiltIn: true,
    isCustom: false,
    isOverridden: false,
    permissions: { patients: 1, prescriptions: 3, clinical_actions: 2 },
    defaultPermissions: { patients: 1 },
    memberCount: 1,
  },
];

const MEMBER = {
  id: "m-1",
  userId: "u-2",
  name: "Sam Test",
  email: "sam@example.test",
  role: "Front Desk",
  title: null,
  isOwner: false,
  status: "ACTIVE",
  deactivatedAt: null,
  createdAt: "2026-11-01T00:00:00.000Z",
};

function handler(
  extra?: (c: StubCall) => ReturnType<Parameters<typeof stubApi>[0]>,
) {
  return (c: StubCall) => {
    const hit = extra?.(c);
    if (hit) return hit;
    if (c.path === `/organizations/${ORG}/staff`) return pageOf([MEMBER]);
    if (c.path === `/organizations/${ORG}/invitations` && c.method === "GET")
      return pageOf([]);
    if (c.path === `/organizations/${ORG}/roles` && c.method === "GET")
      return { data: ROLES };
    return { data: {} };
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
  window.history.pushState({}, "", "/dashboard/clinic/team");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.pushState({}, "", "/");
});

describe("Staff & Roles on the API", () => {
  it("lists the office's staff by its id, with no header and no password (axe clean)", async () => {
    const { calls } = stubApi(handler(), staffContext(OM));
    const { container } = render(<StaffTeamCard />, { wrapper });
    await screen.findByText("Sam Test");
    expect(await axe(container)).toHaveNoViolations();
    for (const c of calls.filter((x) => x.path.startsWith("/organizations/"))) {
      expect(c.path.startsWith(`/organizations/${ORG}/`)).toBe(true);
      expect(c.headers["x-organization-id"]).toBeUndefined();
    }
    /* Office Manager: role change and sign-in buttons, never ownership. */
    expect(
      screen.getByRole("button", { name: "Change role of Sam Test" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /the owner/ })).toBeNull();
  });

  it("a 403 on the staff list is not shared, never an empty table", async () => {
    stubApi(
      handler((c) =>
        c.path.endsWith("/staff")
          ? apiError(403, "access.organization_access_denied")
          : undefined,
      ),
      staffContext(OM),
    );
    render(<StaffTeamCard />, { wrapper });
    await screen.findByText("This has not been shared with you");
    expect(screen.queryByText("No staff yet.")).toBeNull();
  });

  it("invites by email and role only (D3): no password, no role above the inviter's", async () => {
    const { calls } = stubApi(handler(), staffContext(OM));
    render(<StaffTeamCard />, { wrapper });
    await userEvent.click(
      await screen.findByRole("tab", { name: /Invitations/ }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Invite staff" }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByLabelText(/password/i)).toBeNull();
    const role = await within(dialog).findByLabelText(/Role/);
    await waitFor(() =>
      expect(within(role).queryByText("Front Desk")).toBeTruthy(),
    );
    expect(within(role).queryByText("Physician")).toBeNull();
    await userEvent.type(
      within(dialog).getByLabelText(/Their email/),
      "new@example.test",
    );
    await userEvent.selectOptions(role, "Front Desk");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Send invitation" }),
    );
    await screen.findByText(/Invitation sent to new@example.test/);
    const post = calls.find(
      (c) => c.method === "POST" && c.path.endsWith("/invitations"),
    );
    expect(post?.body).toEqual({
      email: "new@example.test",
      role: "Front Desk",
    });
  });

  it("the server's refusal of an invitation is shown", async () => {
    stubApi(
      handler((c) =>
        c.method === "POST" && c.path.endsWith("/invitations")
          ? apiError(403, "invitations.cannot_invite_higher_role")
          : undefined,
      ),
      staffContext(OM),
    );
    render(<StaffTeamCard />, { wrapper });
    await userEvent.click(
      await screen.findByRole("tab", { name: /Invitations/ }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Invite staff" }),
    );
    const dialog = await screen.findByRole("dialog");
    const role = await within(dialog).findByLabelText(/Role/);
    await waitFor(() =>
      expect(within(role).queryByText("Front Desk")).toBeTruthy(),
    );
    await userEvent.type(
      within(dialog).getByLabelText(/Their email/),
      "new@example.test",
    );
    await userEvent.selectOptions(role, "Front Desk");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Send invitation" }),
    );
    await screen.findByText(
      "You can't invite someone into a role with more access than your own.",
    );
  });

  it("the role editor is read only without roles Manage", async () => {
    stubApi(handler(), staffContext(OM));
    render(<StaffTeamCard />, { wrapper });
    await userEvent.click(await screen.findByRole("tab", { name: /Roles/ }));
    await screen.findByText(/View only: your role can't change roles/);
    expect(screen.queryByRole("button", { name: "Save role" })).toBeNull();
    expect(
      (screen.getByLabelText("Patients and charts level") as HTMLSelectElement)
        .disabled,
    ).toBe(true);
  });

  it("the owner edits a role, is warned about sign-out, and sees the server's refusal", async () => {
    const { calls } = stubApi(
      handler((c) =>
        c.method === "PUT"
          ? apiError(403, "access.cannot_grant_higher_level")
          : undefined,
      ),
      staffContext(OWNER, true),
    );
    const { container } = render(<StaffTeamCard />, { wrapper });
    await userEvent.click(await screen.findByRole("tab", { name: /Roles/ }));
    const level = await screen.findByLabelText("Check-ins level");
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.selectOptions(level, "1");
    await userEvent.click(screen.getByRole("button", { name: "Save role" }));
    await screen.findByText(/will be signed out/);
    await userEvent.click(
      screen.getByRole("button", { name: "Save and sign out" }),
    );
    await screen.findByText(
      "You can't give or take away a permission level you don't hold yourself.",
    );
    const put = calls.find((c) => c.method === "PUT");
    expect(put?.path).toBe(`/organizations/${ORG}/roles/permissions`);
    const body = put?.body as {
      role: string;
      permissions: Record<string, number>;
    };
    expect(body.role).toBe("Front Desk");
    expect(body.permissions.check_ins).toBe(1);
    expect(body.permissions.patients).toBe(2);
    expect(body.permissions.prescriptions).toBe(0);
  });
});
