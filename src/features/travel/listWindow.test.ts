import { describe, expect, it } from "vitest";
import { countOf, partial, sumCounts } from "./listWindow";

const offset = (items: number, total: number) => ({
  items: Array.from({ length: items }, (_, i) => i),
  pagination: {
    mode: "offset" as const,
    total,
    page: 1,
    limit: 150,
    totalPages: Math.ceil(total / 150),
    hasNext: total > items,
    hasPrev: false,
  },
});

describe("listWindow", () => {
  it("reads the server's total from an offset page", () => {
    expect(countOf(offset(150, 230))).toEqual({ loaded: 150, total: 230 });
    expect(partial(countOf(offset(150, 230)))).toEqual({
      loaded: 150,
      total: 230,
    });
  });

  it("is whole when the page holds everything, or has no paging", () => {
    expect(partial(countOf(offset(3, 3)))).toBeNull();
    expect(partial(countOf({ items: [1], pagination: null }))).toBeNull();
  });

  it("says 'more' for a cursor page with a next one", () => {
    const page = {
      items: [1, 2],
      pagination: {
        mode: "cursor" as const,
        limit: 2,
        cursor: null,
        nextCursor: "c",
        hasNext: true,
      },
    };
    expect(partial(countOf(page))).toEqual({ loaded: 2, total: 3 });
  });

  it("adds two reads shown as one list", () => {
    expect(
      sumCounts({ loaded: 150, total: 200 }, { loaded: 2, total: 2 }),
    ).toEqual({ loaded: 152, total: 202 });
    expect(partial(sumCounts({ loaded: 2, total: 2 }, undefined))).toBeNull();
  });
});
