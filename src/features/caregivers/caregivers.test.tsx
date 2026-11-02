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
import {
  JOHN_ID,
  apiError,
  pageOf,
  stubApi,
  type StubCall,
  type StubReply,
} from "@/features/profile/memberApiStub";
import { inviteBody } from "./caregivers.api";
import {
  customMapFor,
  fromCaregivingRow,
  fromContext,
  journalMap,
} from "./caregivers.mapping";
import MyCaregivers from "./MyCaregivers";

/* D1 on the patient's side: no access level is preselected; Full Access is
   sent only after the patient authorizes it; the journal is never in an
   invitation and has its own explicit grant; a custom edit never drops a
   key it does not show; errors are not empty and 403 is "not shared".
   Synthetic data only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/my-caregivers",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const GRANT = {
  id: "g-1",
  patientId: JOHN_ID,
  caregiverId: "c-1",
  caregiverName: "Casey Test",
  caregiverEmail: "casey@example.test",
  relationship: "Friend",
  preset: "full",
  permissions: { profile: 2, labs: 2, messages: 2, sharing: 1 },
  status: "ACTIVE",
  acceptedAt: "2026-11-01T00:00:00.000Z",
  revokedAt: null,
};

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

function handler(extra?: (c: StubCall) => StubReply | undefined) {
  return (c: StubCall) => {
    const hit = extra?.(c);
    if (hit) return hit;
    if (c.path === `/patients/${JOHN_ID}/caregivers` && c.method === "GET")
      return pageOf([GRANT]);
    if (
      c.path === `/patients/${JOHN_ID}/caregiver-invitations` &&
      c.method === "GET"
    )
      return pageOf([]);
    if (c.path.endsWith("/activity")) return pageOf([]);
    return { data: {} };
  };
}

beforeEach(() => {
  window.history.pushState({}, "", "/dashboard/my-caregivers");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.pushState({}, "", "/");
});

describe("caregiver bodies and maps", () => {
  it("sends a map only with custom, and never opens the journal in an invitation", () => {
    expect(
      inviteBody({
        email: " A@Example.TEST ",
        relationship: "Friend",
        preset: "full",
      }),
    ).toEqual({
      email: "a@example.test",
      relationship: "Friend",
      preset: "full",
    });
    const custom = inviteBody({
      email: "a@example.test",
      relationship: "Friend",
      preset: "custom",
      permissions: { labs: 1, journal: 2 },
    });
    expect(custom.permissions).toEqual({ labs: 1, journal: 0 });
  });

  it("keeps keys the editor does not show (journal, sharing) on a custom edit", () => {
    const next = customMapFor(
      { profile: 2, journal: 1, sharing: 1 },
      { profile: 1, labs: 2 },
    );
    expect(next.journal).toBe(1);
    expect(next.sharing).toBe(1);
    expect(next.profile).toBe(1);
    expect(next.labs).toBe(2);
    expect(next.dialysis).toBe(0);
    expect(journalMap({ profile: 2 }, true)).toEqual({
      profile: 2,
      journal: 1,
    });
    expect(journalMap({ profile: 2, journal: 1 }, false)).toEqual({
      profile: 2,
      journal: 0,
    });
  });

  it("maps both caregiving shapes to one patient type", () => {
    const a = fromContext({
      grantId: "g",
      patientId: "p",
      firstName: "Ann",
      lastName: "Test",
      relationship: "Son",
      preset: "full",
      permissions: {},
    });
    const b = fromCaregivingRow({
      grantId: "g",
      patientId: "p",
      patientFirstName: "Ann",
      patientLastName: "Test",
      relationship: "Son",
      preset: "full",
      permissions: {},
    });
    expect(a).toEqual(b);
    expect(a.patientName).toBe("Ann Test");
  });
});

describe("My Caregivers on the API", () => {
  it("lists the server's caregivers (axe clean) with no office header", async () => {
    const { calls } = stubApi(handler());
    const { container } = render(<MyCaregivers />, { wrapper });
    await screen.findByText("Casey Test");
    expect(await axe(container)).toHaveNoViolations();
    for (const c of calls.filter((x) => x.path.startsWith("/patients/"))) {
      expect(c.path.startsWith(`/patients/${JOHN_ID}/`)).toBe(true);
      expect(c.headers["x-organization-id"]).toBeUndefined();
    }
  });

  it("a 403 shows not shared, never an empty list", async () => {
    stubApi(
      handler((c) =>
        c.path.endsWith("/caregivers")
          ? apiError(403, "access.patient_access_denied")
          : undefined,
      ),
    );
    render(<MyCaregivers />, { wrapper });
    await screen.findByText("This has not been shared with you");
    expect(screen.queryByText("No caregivers yet")).toBeNull();
  });

  it("preselects nothing and sends Full Access only after the authorization", async () => {
    const { calls } = stubApi(handler());
    render(<MyCaregivers />, { wrapper });
    await screen.findByText("Casey Test");
    await userEvent.click(
      screen.getAllByRole("button", { name: "Invite caregiver" })[0],
    );
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("radio", { checked: true })).toBeNull();
    await userEvent.type(
      within(dialog).getByLabelText(/Their email/),
      "new@example.test",
    );
    await userEvent.selectOptions(
      within(dialog).getByLabelText(/Relationship/),
      "Friend",
    );
    await userEvent.click(
      within(dialog).getByRole("radio", { name: /Full access/ }),
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Continue" }),
    );
    await screen.findByText("It never covers");
    expect(screen.getByText("Your security settings")).toBeTruthy();
    expect(calls.some((c) => c.method === "POST")).toBe(false);
    await userEvent.click(
      screen.getByRole("button", { name: "I authorize Full Access" }),
    );
    await screen.findByText("Invitation sent");
    const post = calls.find(
      (c) => c.method === "POST" && c.path.endsWith("/caregiver-invitations"),
    );
    expect(post?.body).toEqual({
      email: "new@example.test",
      relationship: "Friend",
      preset: "full",
    });
  });

  it("a custom invitation sends the map with journal 0", async () => {
    const { calls } = stubApi(handler());
    render(<MyCaregivers />, { wrapper });
    await screen.findByText("Casey Test");
    await userEvent.click(
      screen.getAllByRole("button", { name: "Invite caregiver" })[0],
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(
      within(dialog).getByLabelText(/Their email/),
      "c@example.test",
    );
    await userEvent.selectOptions(
      within(dialog).getByLabelText(/Relationship/),
      "Son",
    );
    await userEvent.click(
      within(dialog).getByRole("radio", { name: /Custom/ }),
    );
    await userEvent.selectOptions(within(dialog).getByLabelText("Labs"), "1");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Send invitation" }),
    );
    await screen.findByText("Invitation sent");
    const post = calls.find(
      (c) => c.method === "POST" && c.path.endsWith("/caregiver-invitations"),
    );
    const body = post?.body as {
      preset: string;
      permissions: Record<string, number>;
    };
    expect(body.preset).toBe("custom");
    expect(body.permissions.labs).toBe(1);
    expect(body.permissions.journal).toBe(0);
  });

  it("the server's refusal is shown in the invitation form", async () => {
    stubApi(
      handler((c) =>
        c.method === "POST"
          ? apiError(409, "invitations.already_a_caregiver")
          : undefined,
      ),
    );
    render(<MyCaregivers />, { wrapper });
    await screen.findByText("Casey Test");
    await userEvent.click(
      screen.getAllByRole("button", { name: "Invite caregiver" })[0],
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(
      within(dialog).getByLabelText(/Their email/),
      "casey@example.test",
    );
    await userEvent.selectOptions(
      within(dialog).getByLabelText(/Relationship/),
      "Friend",
    );
    await userEvent.click(
      within(dialog).getByRole("radio", { name: /View only/ }),
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Send invitation" }),
    );
    await screen.findByText("This person is already your caregiver.");
  });

  it("the journal is its own grant: a confirmation, then a custom map with journal 1 and every other key kept", async () => {
    const { calls } = stubApi(handler());
    render(<MyCaregivers />, { wrapper });
    await screen.findByText("Casey Test");
    await userEvent.click(
      screen.getByRole("switch", { name: /Private journal/ }),
    );
    await screen.findByText(/read your private journal\?/);
    expect(calls.some((c) => c.method === "PATCH")).toBe(false);
    await userEvent.click(
      screen.getByRole("button", { name: "Allow journal access" }),
    );
    await waitFor(() =>
      expect(calls.some((c) => c.method === "PATCH")).toBe(true),
    );
    const patch = calls.find((c) => c.method === "PATCH");
    expect(patch?.path).toBe(`/patients/${JOHN_ID}/caregivers/g-1`);
    expect(patch?.body).toEqual({
      preset: "custom",
      permissions: { ...GRANT.permissions, journal: 1 },
    });
  });

  it("revoking is one server call after a confirmation", async () => {
    const { calls } = stubApi(handler());
    render(<MyCaregivers />, { wrapper });
    await screen.findByText("Casey Test");
    await userEvent.click(
      screen.getByRole("button", { name: "Remove caregiver" }),
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Remove caregiver" }),
    );
    await waitFor(() =>
      expect(
        calls.some(
          (c) =>
            c.method === "POST" &&
            c.path === `/patients/${JOHN_ID}/caregivers/g-1/revoke`,
        ),
      ).toBe(true),
    );
  });
});
