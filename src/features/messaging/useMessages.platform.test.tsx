import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/context/LanguageContext";
import { useMessages } from "./useMessages";

/* P16e click-through: the header read the platform organization's office
   inbox for every platform admin, a 403 on every page for an admin
   without the messages permission. A platform admin has no inbox, so
   nothing is read; an office user still reads its own. Synthetic ids. */

const auth = vi.hoisted(() => ({ role: "admin" as string }));

vi.mock("@/features/auth/AuthContext", () => ({
  useOptionalAuth: () => ({
    user: {
      role: auth.role,
      organizationId: "00000000-0000-4000-8000-00000000p16e",
      org: "Synthetic Org",
      orgPermissions: {},
    },
  }),
}));

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(() => new Promise<Response>(() => undefined));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <LanguageProvider>{children}</LanguageProvider>
    </QueryClientProvider>
  );
}

const conversationReads = () =>
  fetchMock.mock.calls.filter(([url]) =>
    String(url).includes("/conversations"),
  );

describe("useMessages for a platform admin", () => {
  it("reads no office inbox", async () => {
    auth.role = "admin";
    const { result } = renderHook(() => useMessages(), { wrapper });
    await new Promise((r) => setTimeout(r, 50));
    expect(conversationReads()).toEqual([]);
    expect(result.current.conversations).toEqual([]);
  });

  it("an office user still reads its own inbox (positive control)", async () => {
    auth.role = "clinic";
    renderHook(() => useMessages(), { wrapper });
    await waitFor(() => expect(conversationReads().length).toBeGreaterThan(0));
    expect(String(conversationReads()[0][0])).toContain(
      "/organizations/00000000-0000-4000-8000-00000000p16e/conversations",
    );
  });
});
