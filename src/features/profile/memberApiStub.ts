/* ==========================================================================
   A stand-in API for member tests (Phases 4-5). Test-only: imported by
   *.test.* files, never by the app. Synthetic ids and names only.
   --------------------------------------------------------------------------
   `stubApi(handler)` replaces `fetch`: `/me/context` answers a signed-in
   member (John, synthetic), every other call goes to the handler, and every
   call is recorded with its method, path, query, body and headers so a test
   can check the patient id is in the path and no office header is sent.
   ========================================================================== */

import { vi } from "vitest";
import type { MeContext } from "@/features/auth/auth.types";

export const JOHN_ID = "11111111-1111-4111-8111-111111111111";
export const GRACE_ID = "22222222-2222-4222-8222-222222222222";

export function memberContext(patientId = JOHN_ID): MeContext {
  return {
    user: {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "John Test",
      email: "john.test@example.test",
      phone: null,
      avatarUrl: null,
      language: "EN",
      timeZone: "America/New_York",
      isAccountVerified: true,
      mfaEnabled: false,
      mfaSetupRequired: false,
    },
    patient: { id: patientId, firstName: "John", lastName: "Test" },
    caregiving: [],
    memberships: [],
    platform: null,
  };
}

export type StubCall = {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
  headers: Record<string, string>;
};

export type StubReply = { status?: number; data?: unknown; body?: unknown };

export type StubHandler = (call: StubCall) => StubReply | undefined;

const API_PREFIX = "/api/v1";

/** Replaces fetch. Unhandled calls answer `{ data: null }` with 200. */
export function stubApi(
  handler: StubHandler = () => undefined,
  context: MeContext | null = memberContext(),
) {
  const calls: StubCall[] = [];
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const path = url.pathname.startsWith(API_PREFIX)
        ? url.pathname.slice(API_PREFIX.length)
        : url.pathname;
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(
        (init?.headers as Record<string, string>) ?? {},
      ))
        headers[k.toLowerCase()] = v;
      const call: StubCall = {
        method: init?.method ?? "GET",
        path,
        query: url.searchParams,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
        headers,
      };
      calls.push(call);
      let reply: StubReply | undefined;
      if (path === "/me/context")
        reply = context
          ? { data: context }
          : { status: 401, body: { success: false, message: "Unauthorized" } };
      else reply = handler(call);
      const status = reply?.status ?? 200;
      const body =
        reply?.body ??
        (status < 400
          ? {
              success: true,
              message: "Success",
              statusCode: status,
              data: reply?.data ?? null,
            }
          : {
              success: false,
              message: "Request failed",
              statusCode: status,
              code: null,
            });
      return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    },
  );
  vi.stubGlobal("fetch", fetchMock);
  return { calls, fetchMock };
}

/** A paged list envelope, as the API sends it. */
export function pageOf<T>(items: T[], more = false): StubReply {
  return {
    body: {
      success: true,
      message: "Success",
      statusCode: 200,
      data: items,
      pagination: {
        mode: "offset",
        total: items.length + (more ? 1 : 0),
        page: 1,
        limit: 150,
        totalPages: more ? 2 : 1,
        hasNext: more,
        hasPrev: false,
      },
    },
  };
}

/** An API error with the server's code, as the API sends it. */
export function apiError(
  status: number,
  code: string | null,
  message = "No",
): StubReply {
  return {
    status,
    body: { success: false, message, statusCode: status, code, data: null },
  };
}
