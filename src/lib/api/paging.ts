/* ==========================================================================
   Paging and windowing (ADR 0007)
   --------------------------------------------------------------------------
   Every list the API returns is paged (backend src/common/pagination):
   - offset: `page` + `limit`;
   - cursor: `cursor` + `limit` (used when no `page` is sent; the two never
     go together);
   - dated logs also take `from` / `to`, inclusive days, YYYY-MM-DD.
   The server's default limit is 10 and its maximum 150. A screen never asks
   for "everything": it asks for a page, or for a window of days.
   ========================================================================== */

import { apiRequest, type ApiOptions, type Pagination } from "./client";

export const DEFAULT_PAGE_LIMIT = 10;
export const MAX_PAGE_LIMIT = 150;

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export type PageParams = {
  page?: number;
  limit?: number;
  cursor?: string | null;
  from?: string;
  to?: string;
};

export type PageQuery = {
  page?: number;
  limit: number;
  cursor?: string;
  from?: string;
  to?: string;
};

function clampLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return DEFAULT_PAGE_LIMIT;
  return Math.min(MAX_PAGE_LIMIT, Math.max(1, Math.trunc(limit)));
}

function isDay(value: string): boolean {
  if (!DAY.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

/**
 * The query string for one page, shaped the way the API accepts it: a
 * cursor or a page (never both), a limit within 1–150, and a valid,
 * ordered day window. Throws for a window the API would refuse, so the
 * mistake shows up in development rather than as a 400.
 */
export function pageQuery(params: PageParams = {}): PageQuery {
  const query: PageQuery = { limit: clampLimit(params.limit) };
  if (params.cursor) {
    query.cursor = params.cursor;
  } else {
    query.page = Math.max(1, Math.trunc(params.page ?? 1));
  }
  if (params.from !== undefined) {
    if (!isDay(params.from))
      throw new RangeError(`Bad from day: ${params.from}`);
    query.from = params.from;
  }
  if (params.to !== undefined) {
    if (!isDay(params.to)) throw new RangeError(`Bad to day: ${params.to}`);
    query.to = params.to;
  }
  if (query.from && query.to && query.from > query.to)
    throw new RangeError("from must be on or before to");
  return query;
}

/** A local YYYY-MM-DD for a date (the member's own calendar day). */
export function toDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** The window of the last `days` days, ending on (and including) `today`. */
export function lastDays(
  days: number,
  today: Date = new Date(),
): { from: string; to: string } {
  const span = Math.max(1, Math.trunc(days));
  const start = new Date(today);
  start.setDate(start.getDate() - (span - 1));
  return { from: toDay(start), to: toDay(today) };
}

export type Page<T> = {
  items: T[];
  pagination: Pagination | null;
};

/** One page of a list route. */
export async function fetchPage<T>(
  path: string,
  params: PageParams = {},
  options: Omit<ApiOptions, "query" | "method" | "body"> & {
    query?: ApiOptions["query"];
  } = {},
): Promise<Page<T>> {
  const envelope = await apiRequest<T[]>(path, {
    ...options,
    query: { ...options.query, ...pageQuery(params) },
  });
  return {
    items: Array.isArray(envelope.data) ? envelope.data : [],
    pagination: envelope.pagination ?? null,
  };
}

/** The params of the page after this one, or undefined at the end. Shaped
 *  for TanStack Query's `getNextPageParam`. */
export function nextPageParams(
  pagination: Pagination | null | undefined,
  current: PageParams = {},
): PageParams | undefined {
  if (!pagination || !pagination.hasNext) return undefined;
  if (pagination.mode === "cursor") {
    if (!pagination.nextCursor) return undefined;
    return {
      ...current,
      page: undefined,
      cursor: pagination.nextCursor,
      limit: pagination.limit,
    };
  }
  return {
    ...current,
    cursor: undefined,
    page: pagination.page + 1,
    limit: pagination.limit,
  };
}
