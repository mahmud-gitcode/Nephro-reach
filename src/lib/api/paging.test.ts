import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PAGE_LIMIT,
  fetchPage,
  lastDays,
  MAX_PAGE_LIMIT,
  nextPageParams,
  pageQuery,
} from "./paging";

afterEach(() => vi.unstubAllGlobals());

describe("pageQuery", () => {
  it("defaults to page 1 and the server's default limit", () => {
    expect(pageQuery()).toEqual({ page: 1, limit: DEFAULT_PAGE_LIMIT });
  });

  it("keeps the limit within 1–150", () => {
    expect(pageQuery({ limit: 1000 }).limit).toBe(MAX_PAGE_LIMIT);
    expect(pageQuery({ limit: 0 }).limit).toBe(1);
  });

  it("never sends page with a cursor", () => {
    expect(pageQuery({ cursor: "c1", page: 3 })).toEqual({
      cursor: "c1",
      limit: DEFAULT_PAGE_LIMIT,
    });
  });

  it("takes an ordered window of real days", () => {
    expect(pageQuery({ from: "2026-10-01", to: "2026-10-31" })).toMatchObject({
      from: "2026-10-01",
      to: "2026-10-31",
    });
    expect(() => pageQuery({ from: "2026-10-31", to: "2026-10-01" })).toThrow();
    expect(() => pageQuery({ from: "2026-02-30" })).toThrow();
    expect(() => pageQuery({ to: "10/01/2026" })).toThrow();
  });
});

describe("lastDays", () => {
  it("includes today", () => {
    expect(lastDays(7, new Date(2026, 10, 2))).toEqual({
      from: "2026-10-27",
      to: "2026-11-02",
    });
    expect(lastDays(1, new Date(2026, 0, 1))).toEqual({
      from: "2026-01-01",
      to: "2026-01-01",
    });
  });
});

describe("nextPageParams", () => {
  it("moves an offset list to the next page", () => {
    expect(
      nextPageParams(
        {
          mode: "offset",
          total: 30,
          page: 1,
          limit: 10,
          totalPages: 3,
          hasNext: true,
          hasPrev: false,
        },
        { from: "2026-10-01" },
      ),
    ).toEqual({ from: "2026-10-01", page: 2, cursor: undefined, limit: 10 });
  });

  it("follows a cursor", () => {
    expect(
      nextPageParams({
        mode: "cursor",
        limit: 10,
        cursor: null,
        nextCursor: "n2",
        hasNext: true,
      }),
    ).toMatchObject({ cursor: "n2", page: undefined });
  });

  it("stops at the end", () => {
    expect(
      nextPageParams({
        mode: "cursor",
        limit: 10,
        cursor: "n2",
        nextCursor: null,
        hasNext: false,
      }),
    ).toBeUndefined();
    expect(nextPageParams(null)).toBeUndefined();
  });
});

describe("fetchPage", () => {
  it("sends the page query and returns items with the pagination", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            success: true,
            statusCode: 200,
            message: "",
            data: [{ id: "r1" }],
            pagination: {
              mode: "offset",
              total: 1,
              page: 1,
              limit: 10,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
          }),
          { status: 200 },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const page = await fetchPage<{ id: string }>(
      "/patients/p1/blood-pressure",
      {
        ...lastDays(30, new Date(2026, 10, 2)),
      },
    );
    expect(page.items).toEqual([{ id: "r1" }]);
    expect(page.pagination?.mode).toBe("offset");
    const url = new URL(String((fetchMock.mock.calls[0] as unknown[])[0]));
    expect(Object.fromEntries(url.searchParams)).toEqual({
      page: "1",
      limit: "10",
      from: "2026-10-04",
      to: "2026-11-02",
    });
  });
});
