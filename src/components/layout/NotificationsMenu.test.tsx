import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider, useAuth } from "@/features/auth/AuthContext";
import type { MeContext } from "@/features/auth/auth.types";
import {
  pageOf,
  stubApi,
  type StubCall,
} from "@/features/profile/memberApiStub";
import { officeContext } from "@/features/clinic/rosterTestData";
import { MessagesMenu } from "./NotificationsMenu";

/* P16d: the header's Messages button reads the office inbox only for a
   role whose Messages page lists it. A hospital, or office staff without
   messages read, would get a 403 from the server on every page load; a
   nephrology or dialysis office member with messages read still gets its
   inbox. Synthetic offices and ids only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const ORG = "0f0f0f0f-0000-4000-8000-0000000000dd";
const inboxRead = (c: StubCall) =>
  c.method === "GET" && c.path === `/organizations/${ORG}/conversations`;

function context(
  organizationType: "HOSPITAL" | "DIALYSIS_CENTER" | "NEPHROLOGY_OFFICE",
  permissions: Record<string, number>,
  isOwner = false,
): MeContext {
  const ctx = officeContext(permissions, ORG);
  ctx.memberships[0] = {
    ...ctx.memberships[0],
    organizationName: "Synthetic Test Office",
    organizationType,
    role: isOwner ? "Owner" : "Staff",
    isOwner,
  };
  return ctx;
}

/** Shows the portal role once the session has loaded. */
function Signed() {
  const { user } = useAuth();
  return <span data-testid="role">{user?.role ?? ""}</span>;
}

function renderMenu(ctx: MeContext) {
  const api = stubApi(
    (call) => (inboxRead(call) ? pageOf([]) : undefined),
    ctx,
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <AuthProvider>
          <Signed />
          <MessagesMenu />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>,
  );
  return { ...view, ...api };
}

async function signedInAs(role: string) {
  await waitFor(() =>
    expect(screen.getByTestId("role")).toHaveTextContent(role),
  );
  /* Give any query the menu would start a moment to be sent. */
  await new Promise((r) => setTimeout(r, 30));
}

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("header Messages button: which roles read the office inbox (P16d)", () => {
  it("a hospital owner reads no office inbox and shows no Messages button", async () => {
    const { calls } = renderMenu(context("HOSPITAL", {}, true));
    await signedInAs("hospital");
    expect(calls.filter(inboxRead)).toEqual([]);
    expect(
      screen.queryByRole("button", { name: /^Messages/ }),
    ).not.toBeInTheDocument();
  });

  it("dialysis office staff without messages read reads no inbox", async () => {
    const { calls } = renderMenu(context("DIALYSIS_CENTER", { patients: 2 }));
    await signedInAs("clinic");
    expect(calls.filter(inboxRead)).toEqual([]);
    expect(
      screen.queryByRole("button", { name: /^Messages/ }),
    ).not.toBeInTheDocument();
  });

  it("nephrology staff with messages read reads its own office inbox", async () => {
    const { calls, container } = renderMenu(
      context("NEPHROLOGY_OFFICE", { patients: 2, messages: 1 }),
    );
    await signedInAs("nephrology");
    await waitFor(() => expect(calls.some(inboxRead)).toBe(true));
    expect(
      await screen.findByRole("button", { name: /^Messages/ }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("a dialysis office owner reads its own office inbox", async () => {
    const { calls } = renderMenu(context("DIALYSIS_CENTER", {}, true));
    await signedInAs("clinic");
    await waitFor(() => expect(calls.some(inboxRead)).toBe(true));
  });
});
