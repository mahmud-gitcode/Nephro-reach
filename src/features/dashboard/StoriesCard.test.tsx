import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import { pageOf, stubApi } from "@/features/profile/memberApiStub";
import { StoriesCard } from "./StoriesCard";

/* QA Phase 12 M1 (D52): a member's own story keeps its Edit (while under
   review) and Delete buttons, disabled and explained, because there is no
   API route for either yet. Pressing one calls nothing and changes nothing.
   Synthetic data only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

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
  vi.restoreAllMocks();
  window.localStorage.clear();
});

const mine = (id: string, status: string) => ({
  id,
  title: `SYNTH-MINE-${id}`,
  role: "Dialysis Member",
  hasVideo: true,
  duration: null,
  summary: "A synthetic story.",
  status,
  adminFeedback: null,
  createdAt: "2026-11-02T10:00:00.000Z",
  approvedAt: null,
});

describe("the member's own stories", () => {
  it("keeps Edit and Delete visible but disabled, explained, calling nothing", async () => {
    const { calls } = stubApi((call) =>
      call.path === "/me/testimonials"
        ? pageOf([mine("s1", "pending"), mine("s2", "approved")])
        : call.path === "/public/testimonials"
          ? pageOf([])
          : undefined,
    );
    const { container } = render(<StoriesCard isEs={false} />, { wrapper });
    await screen.findByText(/SYNTH-MINE-s1/);

    // Edit only while the story is under review, as before; Delete on each.
    const edit = screen.getByRole("button", { name: "Edit SYNTH-MINE-s1" });
    expect(
      screen.queryByRole("button", { name: "Edit SYNTH-MINE-s2" }),
    ).not.toBeInTheDocument();
    const deletes = [
      screen.getByRole("button", { name: "Delete SYNTH-MINE-s1" }),
      screen.getByRole("button", { name: "Delete SYNTH-MINE-s2" }),
    ];
    for (const button of [edit, ...deletes]) {
      expect(button).toBeDisabled();
      expect(
        container.querySelector(`#${button.getAttribute("aria-describedby")}`),
      ).toHaveTextContent(
        "Editing or deleting your story is not available yet.",
      );
    }

    const before = calls.length;
    for (const button of [edit, ...deletes]) fireEvent.click(button);
    expect(calls.length).toBe(before);
    expect(calls.filter((c) => c.method !== "GET")).toEqual([]);
    // No dialog opened and both stories are still listed.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText(/SYNTH-MINE-s1/)).toBeInTheDocument();
    expect(screen.getByText(/SYNTH-MINE-s2/)).toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });

  it("explains in Spanish", async () => {
    stubApi((call) =>
      call.path === "/me/testimonials"
        ? pageOf([mine("s1", "pending")])
        : call.path === "/public/testimonials"
          ? pageOf([])
          : undefined,
    );
    render(<StoriesCard isEs />, { wrapper });
    expect(
      await screen.findByRole("button", { name: "Eliminar SYNTH-MINE-s1" }),
    ).toBeDisabled();
    expect(
      screen.getByText("Editar o eliminar su historia aún no está disponible."),
    ).toBeInTheDocument();
  });

  it("shows no note when the member has no story", async () => {
    stubApi((call) =>
      call.path === "/me/testimonials" || call.path === "/public/testimonials"
        ? pageOf([])
        : undefined,
    );
    render(<StoriesCard isEs={false} />, { wrapper });
    await screen.findByText(/No stories published yet/);
    expect(screen.queryByText(/not available yet/)).not.toBeInTheDocument();
  });
});
