import React, { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider, useAuth } from "@/features/auth/AuthContext";
import { memberContext, stubApi } from "@/features/profile/memberApiStub";

/* PM-4 (P15a; D8 stays open): an account switch on one browser never finds
   the previous member's home-HD vitals. Every sign-in starts by removing
   every copy (legacyPurge purgeSignOutStores), before the new account's
   context is read. Synthetic ids and emails only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/login",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const handle: {
  login: ((identifier: string, password: string) => Promise<unknown>) | null;
} = { login: null };
function Probe() {
  const { login } = useAuth();
  useEffect(() => {
    handle.login = login;
  }, [login]);
  return null;
}

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
  handle.login = null;
});

describe("account switch: the previous member's vitals are gone", () => {
  it("removes every vitals copy (and its email) when the next sign-in starts", async () => {
    stubApi((c) =>
      c.path === "/auth/login"
        ? { status: 401, body: { success: false, message: "No", code: null } }
        : undefined,
    );
    window.localStorage.setItem(
      "nr:member-id:0f0f0f0f-0000-4000-8000-0000000000a1:dialysis-treatment-vitals",
      JSON.stringify({ "2026-11-01": { preWeight: 80 } }),
    );
    window.localStorage.setItem(
      "nr:member:previous.member@example.test:dialysis-treatment-vitals",
      "{}",
    );
    window.localStorage.setItem("preferred_language", "EN");
    render(
      <QueryClientProvider client={new QueryClient()}>
        <LanguageProvider>
          <AuthProvider>
            <Probe />
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(handle.login).not.toBeNull());
    await act(async () => {
      await handle.login!("next.member@example.test", "x").catch(
        () => undefined,
      );
    });
    const left = Object.keys(window.localStorage);
    expect(left.filter((k) => k.includes("vitals"))).toEqual([]);
    expect(left.some((k) => k.includes("@"))).toBe(false);
    expect(window.localStorage.getItem("preferred_language")).toBe("EN");
  });

  it("the boot purge alone already drops the email-keyed copy", async () => {
    stubApi(() => undefined, memberContext());
    window.localStorage.setItem(
      "nr:member:previous.member@example.test:dialysis-treatment-vitals",
      "{}",
    );
    render(
      <QueryClientProvider client={new QueryClient()}>
        <LanguageProvider>
          <AuthProvider>
            <Probe />
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>,
    );
    await waitFor(() =>
      expect(
        Object.keys(window.localStorage).some((k) => k.includes("@")),
      ).toBe(false),
    );
  });
});
