import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import {
  memberContext,
  pageOf,
  stubApi,
  type StubCall,
} from "@/features/profile/memberApiStub";
import AdminReviewsPage from "./admin-reviews/page";
import AdminTestimonialsPage from "./admin-testimonials/page";
import AdminCommunityPage from "./admin-community/page";

/* QA Phase 12 M1 (D52): the admin controls that have no API route yet
   (delete and "move back to pending" on reviews and testimonials, "Delete
   record" on a decided community post) are shown, disabled, and explained.
   Pressing one calls nothing and changes nothing on the page. Decline keeps
   working. Synthetic data only. */

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

const ADMIN_ID = memberContext().user.id;

const review = (id: string, status: string) => ({
  id,
  rating: 5,
  role: "Dialysis Member",
  comment: `SYNTH-REVIEW-${id}`,
  status,
  adminFeedback: null,
  createdAt: "2026-11-02T10:00:00.000Z",
  approvedAt: status === "approved" ? "2026-11-02T11:00:00.000Z" : null,
  authorId: "33333333-3333-4333-8333-333333333333",
  authorName: `Synth ${id}`,
  location: null,
  personalInfoDetected: false,
  decidedById: null,
});

const story = (id: string, status: string) => ({
  id,
  authorId: "33333333-3333-4333-8333-333333333333",
  authorName: `Synth ${id}`,
  title: `SYNTH-STORY-${id}`,
  role: "Dialysis Member",
  hasVideo: false,
  videoUrl: null,
  thumbnailUrl: null,
  duration: null,
  summary: "A synthetic story.",
  personalInfoDetected: false,
  status,
  adminFeedback: null,
  decidedById: null,
  createdAt: "2026-11-02T10:00:00.000Z",
  approvedAt: status === "approved" ? "2026-11-02T11:00:00.000Z" : null,
});

const heldPost = (id: string, status: string) => ({
  id,
  authorId: "33333333-3333-4333-8333-333333333333",
  authorName: `Synth ${id}`,
  categoryId: "general",
  body: `SYNTH-POST-${id}`,
  hasImage: false,
  status,
  flagReason: "conduct",
  flagLevel: 3,
  matchedPhrase: "synthetic",
  softenedByContext: false,
  submittedAt: "2026-11-02T10:00:00.000Z",
  decidedById: status === "pending" ? null : ADMIN_ID,
  decidedAt: status === "pending" ? null : "2026-11-02T12:00:00.000Z",
  decisionNote: status === "rejected" ? "Synthetic reason" : null,
});

/** heading-order judges the whole page, not one card. */
const PAGE_LEVEL_OFF = { rules: { "heading-order": { enabled: false } } };

/** Every call that is not a read. A disabled control must add none. */
const writes = (calls: StubCall[]) => calls.filter((c) => c.method !== "GET");

describe("admin reviews: delete and unpublish wait on D52", () => {
  function stub() {
    return stubApi((call) =>
      call.path === "/platform/content/reviews"
        ? pageOf([review("r1", "approved"), review("r2", "pending")])
        : { data: {} },
    );
  }

  it("shows them disabled, explained, and pressing them calls no route", async () => {
    const { calls } = stub();
    const { container } = render(<AdminReviewsPage />, { wrapper });
    await screen.findByText(/SYNTH-REVIEW-r1/);

    const unpublish = screen.getByRole("button", { name: "Unpublish" });
    const deletes = screen.getAllByRole("button", {
      name: /^Delete review by Synth/,
    });
    expect(deletes).toHaveLength(2);
    for (const button of [unpublish, ...deletes]) {
      expect(button).toBeDisabled();
      const noteId = button.getAttribute("aria-describedby");
      expect(noteId).toBeTruthy();
      expect(container.querySelector(`#${noteId}`)).toHaveTextContent(
        /not available yet/,
      );
    }

    const before = calls.length;
    for (const button of [unpublish, ...deletes]) fireEvent.click(button);
    expect(calls.length).toBe(before);
    expect(writes(calls)).toEqual([]);
    // Nothing changed locally: both reviews are still listed as they were.
    expect(screen.getByText(/SYNTH-REVIEW-r1/)).toBeInTheDocument();
    expect(screen.getByText(/SYNTH-REVIEW-r2/)).toBeInTheDocument();
    expect(screen.getByText("Approved (Live on site)")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // axe on each review card that carries the restored controls. The page
    // as a whole has older findings outside this change (Tabs aria-controls
    // with no panel id, an h3 under the h1), recorded in the evidence README.
    for (const button of [unpublish, ...deletes]) {
      const card = button.closest("div.rounded-card") as HTMLElement;
      expect(await axe(card, PAGE_LEVEL_OFF)).toHaveNoViolations();
    }
  });

  it("Decline still works and still needs a reason", async () => {
    const { calls } = stub();
    render(<AdminReviewsPage />, { wrapper });
    await screen.findByText(/SYNTH-REVIEW-r2/);
    const declines = screen.getAllByRole("button", { name: "Decline..." });
    fireEvent.click(declines[declines.length - 1]);
    const confirm = screen.getByRole("button", { name: "Confirm Decline" });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Synthetic reason" },
    });
    fireEvent.click(confirm);
    await vi.waitFor(() =>
      expect(writes(calls).map((c) => c.path)).toEqual([
        "/platform/content/reviews/r2/decline",
      ]),
    );
  });

  it("speaks Spanish when the moderator does", async () => {
    window.localStorage.setItem("preferred_language", "ES");
    stub();
    render(<AdminReviewsPage />, { wrapper });
    await screen.findByText(/SYNTH-REVIEW-r1/);
    expect(
      await screen.findByRole("button", { name: "Mover a Pendiente" }),
    ).toBeDisabled();
    expect(
      screen.getAllByText(/aún no está disponible/).length,
    ).toBeGreaterThan(0);
  });
});

describe("admin testimonials: delete and unpublish wait on D52", () => {
  it("shows them disabled, explained, and pressing them calls no route", async () => {
    const { calls } = stubApi((call) =>
      call.path === "/platform/content/testimonials"
        ? pageOf([story("t1", "approved"), story("t2", "pending")])
        : { data: {} },
    );
    const { container } = render(<AdminTestimonialsPage />, { wrapper });
    await screen.findByText(/SYNTH-STORY-t1/);

    const unpublish = screen.getByRole("button", { name: "Unpublish" });
    const deletes = screen.getAllByRole("button", { name: "Delete" });
    expect(deletes).toHaveLength(2);
    for (const button of [unpublish, ...deletes]) {
      expect(button).toBeDisabled();
      const noteId = button.getAttribute("aria-describedby");
      expect(container.querySelector(`#${noteId}`)).toHaveTextContent(
        /not available yet/,
      );
    }

    const before = calls.length;
    for (const button of [unpublish, ...deletes]) fireEvent.click(button);
    expect(calls.length).toBe(before);
    expect(writes(calls)).toEqual([]);
    expect(screen.getByText(/SYNTH-STORY-t1/)).toBeInTheDocument();
    expect(screen.getByText(/SYNTH-STORY-t2/)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // An approved story is still taken down with Decline (enabled).
    const approvedCard = unpublish.closest("div.flex-wrap") as HTMLElement;
    expect(
      within(approvedCard).getByRole("button", { name: "Decline" }),
    ).toBeEnabled();

    // axe on the action rows that carry the restored controls and notes
    // (the thumbnail button beside them has an older, separate finding).
    for (const button of [unpublish, ...deletes])
      expect(
        await axe(button.parentElement as HTMLElement),
      ).toHaveNoViolations();
  });
});

describe("admin community: 'Delete record' waits on D52", () => {
  it("is shown on a decided record, disabled, explained, and calls nothing", async () => {
    const { calls } = stubApi((call) => {
      if (call.path !== "/platform/content/community/posts") return undefined;
      return call.query.get("status") === "decided"
        ? pageOf([heldPost("c1", "rejected")])
        : pageOf([]);
    });
    const { container } = render(<AdminCommunityPage />, { wrapper });
    fireEvent.click(await screen.findByRole("tab", { name: /decided/i }));
    await screen.findByText(/SYNTH-POST-c1/);

    const remove = screen.getByRole("button", {
      name: "Delete the record from Synth c1",
    });
    expect(remove).toBeDisabled();
    expect(
      container.querySelector(`#${remove.getAttribute("aria-describedby")}`),
    ).toHaveTextContent("Deleting a decided record is not available yet.");

    const before = calls.length;
    fireEvent.click(remove);
    expect(calls.length).toBe(before);
    expect(writes(calls)).toEqual([]);
    expect(screen.getByText(/SYNTH-POST-c1/)).toBeInTheDocument();

    expect(
      await axe(remove.closest("li") as HTMLElement, PAGE_LEVEL_OFF),
    ).toHaveNoViolations();
  });
});
