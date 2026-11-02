import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DEFAULT_SCHEDULE, useDialysisSchedule } from "./useDialysisSchedule";

/* INT-10: the typical week must not stand in for a schedule that failed to
   load. */

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useDialysisSchedule", () => {
  it("reports a failed read as an error, not the default week", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    const { result } = renderHook(() => useDialysisSchedule(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
    expect(result.current.periods).toEqual([]);
  });

  it("uses the default week when nothing was ever saved", async () => {
    window.localStorage.clear();
    const { result } = renderHook(() => useDialysisSchedule(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.isError).toBe(false);
    expect(result.current.periods).toEqual(DEFAULT_SCHEDULE);
  });
});
