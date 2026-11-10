import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider, useAuth } from "@/features/auth/AuthContext";
import {
  pageOf,
  stubApi,
  type StubCall,
} from "@/features/profile/memberApiStub";
import { officeContext } from "@/features/clinic/rosterTestData";
import { useStaffList } from "./useStaffAccounts";

/* P16d: the CCM activity form lists assignees only for a user with staff
   read. Without it the staff list must not be asked for at all (the server
   answered 403 when a care coordinator opened the form). Synthetic ids. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/nephrology",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const ORG = officeContext().memberships[0].organizationId;
const staffRead = (c: StubCall) =>
  c.method === "GET" && c.path === `/organizations/${ORG}/staff`;

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
  window.localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useStaffList enabled (P16d)", () => {
  it("asks nothing when disabled, once the session has loaded", async () => {
    const { calls } = stubApi(
      (c) => (staffRead(c) ? pageOf([]) : undefined),
      officeContext(),
    );
    const { result } = renderHook(
      () => ({
        auth: useAuth(),
        list: useStaffList({ page: 1, limit: 150 }, { enabled: false }),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.auth.user).not.toBeNull());
    await new Promise((r) => setTimeout(r, 30));
    expect(calls.filter(staffRead)).toEqual([]);
    expect(result.current.list.rows).toEqual([]);
    expect(result.current.list.isPending).toBe(false);
    expect(result.current.list.error).toBeNull();
  });

  it("reads the office's staff when enabled (the default)", async () => {
    const { calls } = stubApi(
      (c) => (staffRead(c) ? pageOf([]) : undefined),
      officeContext(),
    );
    renderHook(() => useStaffList({ page: 1, limit: 150 }), { wrapper });
    await waitFor(() => expect(calls.some(staffRead)).toBe(true));
  });
});
