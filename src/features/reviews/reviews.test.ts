import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getApprovedReviews,
  invalidatePublicReviews,
  PUBLIC_REVIEWS_LIMIT,
  REVIEWS_EVENT,
} from "./reviews";

/* The landing banner's reader (Phase 12). The landing page is protected UI
   and is not changed: it still calls getApprovedReviews() and listens for
   REVIEWS_EVENT. What changed is where the reviews come from. Synthetic
   reviews only. */

const publicPage = (rows: unknown[]) =>
  new Response(
    JSON.stringify({
      success: true,
      message: "Success",
      statusCode: 200,
      data: rows,
      pagination: { mode: "offset", total: rows.length, page: 1, limit: 12 },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );

const ROW = {
  id: "r1",
  authorName: "Test M.",
  role: "Dialysis Member",
  rating: 5,
  comment: "The lessons helped.",
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  invalidatePublicReviews();
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("the landing reviews reader", () => {
  it("returns nothing until the server answers, then fills and rings once", async () => {
    const fetchMock = vi.fn(async () => publicPage([ROW]));
    vi.stubGlobal("fetch", fetchMock);
    const heard = vi.fn();
    window.addEventListener(REVIEWS_EVENT, heard);

    // The first paint must not show sample reviews as members' words.
    expect(getApprovedReviews()).toEqual([]);
    expect(getApprovedReviews()).toEqual([]);
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(heard).toHaveBeenCalledTimes(1);
    expect(getApprovedReviews()).toEqual([
      expect.objectContaining({
        id: "r1",
        userName: "Test M.",
        userEmail: "",
        status: "approved",
        comment: "The lessons helped.",
      }),
    ]);
    window.removeEventListener(REVIEWS_EVENT, heard);
  });

  it("asks the public route for one bounded page, with no credentials", async () => {
    const fetchMock = vi.fn(async () => publicPage([]));
    vi.stubGlobal("fetch", fetchMock);
    getApprovedReviews();
    await flush();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const parsed = new URL(url);
    expect(parsed.pathname).toMatch(/\/public\/reviews$/);
    expect(parsed.searchParams.get("limit")).toBe(String(PUBLIC_REVIEWS_LIMIT));
    // A signed-in visitor's cookies never travel with a public read.
    expect(init.credentials).toBe("omit");
    expect(JSON.stringify(init.headers)).not.toMatch(/organization|cookie/i);
  });

  it("keeps [] on failure and tries at most twice (no retry storm)", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(getApprovedReviews()).toEqual([]);
    await flush();
    await flush();
    expect(getApprovedReviews()).toEqual([]);
    expect(getApprovedReviews()).toEqual([]);
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("drops rows that are not the public shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        publicPage([ROW, { id: "x", comment: 3 }, null, "nonsense"]),
      ),
    );
    getApprovedReviews();
    await flush();
    expect(getApprovedReviews().map((r) => r.id)).toEqual(["r1"]);
  });

  it("never reads browser storage, so a legacy review cannot come back", async () => {
    // A browser that used the prototype still holds its reviews array.
    window.localStorage.setItem(
      "nr:community-reviews",
      JSON.stringify([
        {
          id: "legacy",
          userName: "LEGACY-REVIEW-X",
          userEmail: "legacy@example.test",
          rating: 5,
          role: "Dialysis Member",
          comment: "LEGACY-REVIEW-X",
          status: "approved",
          createdAt: "2026-01-01",
        },
      ]),
    );
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => publicPage([])),
    );
    expect(getApprovedReviews()).toEqual([]);
    await flush();
    expect(getApprovedReviews()).toEqual([]);
    expect(getItem).not.toHaveBeenCalled();
  });

  it("asks again after a moderation decision drops the cache", async () => {
    const fetchMock = vi.fn(async () => publicPage([ROW]));
    vi.stubGlobal("fetch", fetchMock);
    getApprovedReviews();
    await flush();
    invalidatePublicReviews();
    expect(getApprovedReviews()).toEqual([]);
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getApprovedReviews()).toHaveLength(1);
  });
});
