import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import type { MeContext } from "@/features/auth/auth.types";
import { isApiError } from "@/lib/api/client";
import {
  pageOf,
  stubApi,
  type StubCall,
} from "@/features/profile/memberApiStub";
import { apiRoster, officeContext } from "./rosterTestData";
import { NO_PERMISSION_CODE, useClinicData } from "./useClinicData";
import { useRosterPage } from "./useRosterPage";

/* P16d: a staff role whose levels do not allow a shared office read (a
   care coordinator: no programs, no billing) is not sent that read; the
   server would refuse it with a 403 on every page load. The page still
   gets a 403-shaped error, so it shows the same no-access state. A role
   that holds the levels reads both as before. Synthetic office and ids. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/clinic",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const ORG = officeContext().memberships[0].organizationId;
const { patients, enrollments } = apiRoster();
const enrollmentsRead = (c: StubCall) =>
  c.path === `/organizations/${ORG}/program-enrollments`;
const contractRead = (c: StubCall) =>
  c.path === `/organizations/${ORG}/billing/contract`;
const rosterRead = (c: StubCall) =>
  c.method === "GET" && c.path === `/organizations/${ORG}/patients`;

/** A staff member (not the owner) with these levels. */
function staffContext(permissions: Record<string, number>): MeContext {
  const context = officeContext(permissions);
  context.memberships[0] = {
    ...context.memberships[0],
    role: "Care Coordinator",
    isOwner: false,
  };
  return context;
}

function api(context: MeContext) {
  return stubApi((call) => {
    if (rosterRead(call)) return pageOf(patients);
    if (enrollmentsRead(call)) return pageOf(enrollments);
    if (contractRead(call))
      return { data: { seats: { used: 5, allowed: 30, available: 25 } } };
    return undefined;
  }, context);
}

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

describe("useClinicData read gating (P16d)", () => {
  it("sends neither the enrollments nor the contract read for a role without programs or billing", async () => {
    const { calls } = api(staffContext({ patients: 2, messages: 2 }));
    const { result } = renderHook(() => useClinicData(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(isApiError(result.current.error, { status: 403 })).toBe(true);
    expect(isApiError(result.current.error, { code: NO_PERMISSION_CODE })).toBe(
      true,
    );
    expect(result.current.data).toBeUndefined();
    /* The roster itself is still read; the refused reads are not sent. */
    expect(calls.some(rosterRead)).toBe(true);
    expect(calls.filter(enrollmentsRead)).toEqual([]);
    expect(calls.filter(contractRead)).toEqual([]);
    /* A retry asks nothing it may not ask. */
    result.current.refetch();
    await new Promise((r) => setTimeout(r, 20));
    expect(calls.filter(enrollmentsRead)).toEqual([]);
    expect(calls.filter(contractRead)).toEqual([]);
  });

  it("reads both for a role that holds programs and billing read", async () => {
    const { calls } = api(
      staffContext({ patients: 2, programs: 1, billing: 1 }),
    );
    const { result } = renderHook(() => useClinicData(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    await waitFor(() => expect(result.current.data?.seats).not.toBeNull());
    expect(calls.some(enrollmentsRead)).toBe(true);
    expect(calls.some(contractRead)).toBe(true);
    expect(result.current.data?.roster).toHaveLength(patients.length);
  });

  it("reads the enrollments but not the contract for a role with programs and no billing", async () => {
    const { calls } = api(staffContext({ patients: 2, programs: 1 }));
    const { result } = renderHook(() => useClinicData(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.seats).toBeNull();
    expect(calls.some(enrollmentsRead)).toBe(true);
    expect(calls.filter(contractRead)).toEqual([]);
  });
});

describe("useRosterPage read gating (P16d)", () => {
  const input = { search: "", program: null, page: 1, limit: 25 };

  it("does not send the enrollments read for a role without programs, and shows the 403", async () => {
    const { calls } = api(staffContext({ patients: 2, messages: 2 }));
    const { result } = renderHook(() => useRosterPage(input), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(isApiError(result.current.error, { status: 403 })).toBe(true);
    expect(calls.filter(enrollmentsRead)).toEqual([]);
  });

  it("joins the enrollments for a role that holds programs read", async () => {
    const { calls } = api(staffContext({ patients: 2, programs: 1 }));
    const { result } = renderHook(() => useRosterPage(input), { wrapper });
    await waitFor(() => expect(result.current.rows).toBeDefined());
    expect(result.current.error).toBeNull();
    expect(calls.some(enrollmentsRead)).toBe(true);
  });
});
