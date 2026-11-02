import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import {
  isRetiredKey,
  purgeLegacyStorage,
  RETIRED_STORES,
  STORAGE_VERSION,
  STORAGE_VERSION_KEY,
} from "@/lib/data/legacyPurge";
import { isNotShared } from "@/lib/data/asyncState";
import {
  apiError,
  memberContext,
  pageOf,
  stubApi,
} from "@/features/profile/memberApiStub";
import { uploadFile } from "@/lib/api/upload";
import { ServerSafetyNotice } from "./ServerSafetyNotice";
import { ComposeModal } from "./ComposeModal";
import { useCommunityBoard, useCreatePost, useLikePost } from "./useCommunity";
import { useModerationQueue } from "./useModerationQueue";
import {
  useMyReviews,
  useReviewModeration,
} from "@/features/reviews/useReviews";
import { useLibrary } from "@/features/library/useLibrary";
import { useTableTalk } from "@/features/table-talk/useTableTalk";
import { SuggestQuestionModal } from "@/features/table-talk/SuggestQuestionModal";
import {
  useMyTestimonials,
  usePublicTestimonials,
} from "@/features/testimonials/useTestimonials";
import SubmitTestimonialModal from "@/features/testimonials/SubmitTestimonialModal";

/* Phase 12 (community, reviews, Table Talk, library, testimonials) against a
   stand-in API. Synthetic data only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

vi.mock("@/lib/api/upload", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/upload")>()),
  uploadFile: vi.fn(async () => "file-9"),
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
  vi.mocked(uploadFile).mockClear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

const LABELS = { badge: "Member", isEs: false };

const boardRow = (over: Record<string, unknown> = {}) => ({
  id: "p1",
  authorName: "Test M.",
  categoryId: "general",
  body: "A good day.",
  hasImage: false,
  likeCount: 2,
  likedByMe: false,
  mine: false,
  submittedAt: "2026-11-02T10:00:00.000Z",
  ...over,
});

describe("the server's answer to a post", () => {
  const crisis = {
    tier: "crisis",
    tone: "danger",
    offersEmergencyCall: true,
    titleEn: "You deserve support right now",
    titleEs: "Mereces apoyo ahora",
    bodyEn: "Call or text 988.",
    bodyEs: "Llama o textea al 988.",
  };
  const notice = {
    titleEn: "Is that a personal detail?",
    titleEs: "¿Son datos personales?",
    bodyEn: "This board is visible to every member.",
    bodyEs: "Este tablero es visible.",
  };

  it("shows the crisis guidance with the emergency calls, from the reply", async () => {
    const { container } = render(
      <ServerSafetyNotice
        safety={crisis}
        privacyNotice={notice}
        isEs={false}
      />,
    );
    expect(
      screen.getByText("You deserve support right now"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /call 911/i })).toHaveAttribute(
      "href",
      "tel:911",
    );
    expect(
      screen.getByRole("link", { name: /call or text 988/i }),
    ).toHaveAttribute("href", "tel:988");
    expect(screen.getByText("Is that a personal detail?")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("speaks Spanish when the member does, and shows nothing for a clean post", () => {
    const { rerender } = render(
      <ServerSafetyNotice safety={crisis} privacyNotice={null} isEs />,
    );
    expect(screen.getByText("Mereces apoyo ahora")).toBeInTheDocument();
    rerender(
      <ServerSafetyNotice safety={null} privacyNotice={null} isEs={false} />,
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("the board", () => {
  it("shows the server's posts, filtered by the server", async () => {
    const { calls } = stubApi((call) =>
      call.path === "/community/posts" ? pageOf([boardRow()]) : undefined,
    );
    const { result } = renderHook(() => useCommunityBoard("dialysis", LABELS), {
      wrapper,
    });
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    const read = calls.find((c) => c.path === "/community/posts")!;
    expect(read.query.get("categoryId")).toBe("dialysis");
    expect(read.query.get("limit")).toBe("20");
    expect(read.headers["x-organization-id"]).toBeUndefined();
  });

  it("an error is an error, never sample posts", async () => {
    stubApi((call) =>
      call.path === "/community/posts" ? apiError(500, null) : undefined,
    );
    const { result } = renderHook(() => useCommunityBoard("all", LABELS), {
      wrapper,
    });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.items).toEqual([]);
  });

  it("likes and unlikes explicitly, never as a toggle", async () => {
    const { calls } = stubApi(() => ({ data: null }));
    const { result } = renderHook(() => useLikePost(), { wrapper });
    await act(() => result.current.mutateAsync({ postId: "p1", liked: true }));
    await act(() => result.current.mutateAsync({ postId: "p1", liked: false }));
    const likes = calls.filter((c) => c.path === "/me/community/likes/p1");
    expect(likes.map((c) => c.method)).toEqual(["PUT", "DELETE"]);
  });

  it("uploads the photo through /files first, then posts its id with no name", async () => {
    const { calls } = stubApi((call) =>
      call.path === "/community/posts" && call.method === "POST"
        ? {
            data: {
              post: { id: "n1", status: "pending" },
              safety: null,
              privacyNotice: null,
            },
          }
        : undefined,
    );
    const { result } = renderHook(() => useCreatePost(), { wrapper });
    const photo = new Blob(["x"], { type: "image/jpeg" });
    const reply = await act(() =>
      result.current.mutateAsync({
        body: "  Hello board ",
        categoryId: "recipes",
        photo,
      }),
    );
    expect(reply.post.status).toBe("pending");
    expect(uploadFile).toHaveBeenCalledWith(photo, {
      filename: "community-photo.jpg",
    });
    const post = calls.find(
      (c) => c.path === "/community/posts" && c.method === "POST",
    )!;
    expect(post.body).toEqual({
      categoryId: "recipes",
      body: "Hello board",
      imageFileId: "file-9",
    });
  });

  it("keeps what was written when the post fails, and says so", async () => {
    const onPost = vi.fn(async () => {
      throw new Error("The server is busy.");
    });
    const onClose = vi.fn();
    const { container } = render(
      <LanguageProvider>
        <ComposeModal open onClose={onClose} onPost={onPost} />
      </LanguageProvider>,
    );
    fireEvent.change(screen.getByLabelText("Your message"), {
      target: { value: "Sending encouragement" },
    });
    fireEvent.click(screen.getByRole("button", { name: /post to community/i }));
    await screen.findByText("The server is busy.");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Your message")).toHaveValue(
      "Sending encouragement",
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("moderation follows the server", () => {
  it("a rejection sends the moderator's reason; an approval sends no name", async () => {
    const { calls } = stubApi((call) =>
      call.path === "/platform/content/community/posts"
        ? pageOf([])
        : { data: { id: "h1" } },
    );
    const { result } = renderHook(() => useModerationQueue("pending"), {
      wrapper,
    });
    await act(() => result.current.reject("h1", "  Not for the board "));
    await act(() => result.current.approve("h2"));
    expect(calls.find((c) => c.path.endsWith("/h1/reject"))?.body).toEqual({
      reason: "Not for the board",
    });
    expect(calls.find((c) => c.path.endsWith("/h2/approve"))?.body).toEqual({});
  });

  it("a 403 from the queue is 'no access', not an empty queue", async () => {
    stubApi((call) =>
      call.path.startsWith("/platform/")
        ? apiError(403, "access.platform_permission_required")
        : undefined,
    );
    const { result } = renderHook(() => useReviewModeration("all"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(isNotShared(result.current.error)).toBe(true);
    expect(result.current.reviews).toEqual([]);
  });

  it("a review decline needs the reason the member will see", async () => {
    const { calls } = stubApi((call) =>
      call.path === "/platform/content/reviews" ? pageOf([]) : { data: {} },
    );
    const { result } = renderHook(() => useReviewModeration("pending"), {
      wrapper,
    });
    await act(() => result.current.decline("r1", " Please remove the phone "));
    expect(calls.find((c) => c.path.endsWith("/r1/decline"))?.body).toEqual({
      reason: "Please remove the phone",
    });
    // The tab counts are the server's totals, one per status.
    const statuses = calls
      .filter((c) => c.path === "/platform/content/reviews")
      .map((c) => c.query.get("status"));
    expect(statuses).toEqual(
      expect.arrayContaining(["all", "pending", "approved", "declined"]),
    );
  });
});

describe("a Table Talk question", () => {
  it("shows the server's refusal of urgent wording, and the hint before sending", async () => {
    const onSubmit = vi.fn(async () => {
      const { ApiError } = await import("@/lib/api/client");
      throw new ApiError(
        400,
        "What you wrote mentions something urgent. Call 911 or your dialysis clinic now. Nobody reads this form in real time.",
        "content.question_urgent",
      );
    });
    const { container } = render(
      <LanguageProvider>
        <SuggestQuestionModal onClose={() => {}} onSubmit={onSubmit} />
      </LanguageProvider>,
    );
    const box = screen.getByRole("textbox");
    // The client hint: an urgent phrase never reaches the send.
    fireEvent.change(box, { target: { value: "I have chest pain now" } });
    fireEvent.click(screen.getByRole("button", { name: /send question/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText("This needs attention now, not an episode"),
    ).toBeInTheDocument();

    // Wording the hint misses: the server's 400 is shown in the same place.
    fireEvent.change(box, {
      target: { value: "Something the server flags as urgent" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send question/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByText(/Nobody reads this form in real time/),
    ).toBeInTheDocument();
    expect(screen.queryByText("Question received")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("a testimonial", () => {
  it("refuses a 15 MB video before upload, with the 10 MB limit", async () => {
    stubApi();
    const { container } = render(
      <SubmitTestimonialModal open onClose={() => {}} user={{ name: "T" }} />,
      { wrapper },
    );
    const input = container.ownerDocument.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const big = new File([new Uint8Array(1)], "clip.mp4", {
      type: "video/mp4",
    });
    Object.defineProperty(big, "size", { value: 15 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [big] } });
    expect(
      await screen.findByText(/15 MB\. The limit is 10 MB/),
    ).toBeInTheDocument();
    expect(uploadFile).not.toHaveBeenCalled();
    // The name comes from the account and cannot be typed over.
    expect(screen.getByLabelText(/your name/i)).toHaveAttribute("readonly");
  });

  it("reads published stories and the member's own from their routes", async () => {
    const { calls } = stubApi((call) =>
      call.path === "/public/testimonials" || call.path === "/me/testimonials"
        ? pageOf([])
        : undefined,
    );
    const { result } = renderHook(
      () => ({ pub: usePublicTestimonials(), mine: useMyTestimonials() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.mine.isPending).toBe(false));
    expect(calls.some((c) => c.path === "/public/testimonials")).toBe(true);
    expect(calls.some((c) => c.path === "/me/testimonials")).toBe(true);
  });
});

describe("retired Phase 12 stores", () => {
  const PHASE_12 = [
    "community-reviews",
    "community-moderation-queue",
    "community-likes",
    "table-talk-episodes",
    "table-talk-categories",
    "table-talk-questions",
    "table-talk-favorites",
    "library-resources",
    "library-saved",
    "video-testimonials",
  ];

  it("registers every Phase 12 key at version 8", () => {
    expect(STORAGE_VERSION).toBeGreaterThanOrEqual(8);
    for (const name of PHASE_12) {
      const entry = RETIRED_STORES.find((s) => s.name === name);
      expect(entry?.since).toBe(8);
      expect(isRetiredKey(`nr:${name}`)).toBe(true);
    }
    // Member-owned copies go too.
    expect(isRetiredKey("nr:member:test@example.test:community-likes")).toBe(
      true,
    );
    expect(isRetiredKey("nr:caregiver-none:library-saved")).toBe(true);
    // The pricing store is EDU-BIZ's and stays live until it moves.
    expect(isRetiredKey("nr:subscription-plans")).toBe(false);
  });

  it("purges legacy content and it cannot come back: the screens show only the API", async () => {
    const legacy: Record<string, unknown> = {
      "nr:community-reviews": [
        {
          id: "l",
          userName: "LEGACY-REVIEW-X",
          comment: "LEGACY-REVIEW-X",
          status: "approved",
        },
      ],
      "nr:community-moderation-queue": [
        {
          id: "l",
          content: "LEGACY-POST-X",
          status: "approved",
          imageUrl: "data:image/jpeg;base64,AA",
        },
      ],
      "nr:member:john.test@example.test:community-likes": { l: true },
      "nr:table-talk-episodes": [
        { id: "l", slug: "legacy-episode", titleEn: "LEGACY-EPISODE-X" },
      ],
      "nr:table-talk-categories": [{ id: "l", labelEn: "LEGACY-CAT" }],
      "nr:member:john.test@example.test:table-talk-questions": [
        { id: "l", body: "LEGACY-Q" },
      ],
      "nr:member:john.test@example.test:table-talk-favorites": [
        "legacy-episode",
      ],
      "nr:library-resources": [
        {
          id: "l",
          slug: "legacy-slug",
          titleEn: "LEGACY-LIB-X",
          poster: "data:image/png;base64,AA",
        },
      ],
      "nr:member:john.test@example.test:library-saved": ["legacy-slug"],
      "nr:video-testimonials": [
        {
          id: "l",
          title: "LEGACY-STORY",
          memberEmail: "legacy@example.test",
          videoUrl: "blob:http://x/1",
        },
      ],
    };
    for (const [key, value] of Object.entries(legacy))
      window.localStorage.setItem(key, JSON.stringify(value));

    const { removed } = purgeLegacyStorage(window.localStorage);
    for (const key of Object.keys(legacy)) {
      expect(removed).toContain(key);
      expect(window.localStorage.getItem(key)).toBeNull();
    }
    expect(window.localStorage.getItem(STORAGE_VERSION_KEY)).toBe(
      String(STORAGE_VERSION),
    );

    // Even if an old tab wrote a key again, nothing reads it: with the API
    // answering empty lists, every reader is empty.
    for (const [key, value] of Object.entries(legacy))
      window.localStorage.setItem(key, JSON.stringify(value));
    stubApi((call) =>
      call.path === "/table-talk/categories"
        ? { data: [] }
        : call.path === "/table-talk/episodes/featured"
          ? { data: null }
          : pageOf([]),
    );
    const { result } = renderHook(
      () => ({
        reviews: useMyReviews(),
        board: useCommunityBoard("all", LABELS),
        library: useLibrary(),
        tableTalk: useTableTalk(),
        stories: usePublicTestimonials(),
      }),
      { wrapper },
    );
    await waitFor(() => {
      expect(result.current.reviews.isPending).toBe(false);
      expect(result.current.board.isPending).toBe(false);
      expect(result.current.library.isPending).toBe(false);
      expect(result.current.tableTalk.isPending).toBe(false);
      expect(result.current.stories.isPending).toBe(false);
    });
    const everything = JSON.stringify({
      reviews: result.current.reviews.reviews,
      board: result.current.board.items,
      library: result.current.library.resources,
      saved: result.current.library.saved,
      episodes: result.current.tableTalk.episodes,
      favorites: result.current.tableTalk.favorites,
      categories: result.current.tableTalk.categories,
      stories: result.current.stories.items,
    });
    expect(everything).not.toMatch(
      /LEGACY|legacy-slug|legacy-episode|data:|blob:/,
    );
    expect(result.current.library.resources).toEqual([]);
    expect(result.current.tableTalk.episodes).toEqual([]);
  });

  it("the member context used here is synthetic", () => {
    expect(memberContext().user.email).toMatch(/example\.test$/);
  });
});
