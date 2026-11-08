import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  api,
  ApiError,
  apiRequest,
  isApiError,
  isNoRefreshRoute,
  NO_REFRESH,
  onSessionEnded,
  resetApiClientState,
  SESSION_ENDED_CODE,
  setActiveOrganization,
} from "./client";

/* The API client's contract (ADR 0006 step 5, ADR 0007, spec 019 §4). */

type Reply = { status: number; body?: unknown };

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** fetch that answers each call from a script, and records the calls. */
function scriptFetch(handler: (url: string, init: RequestInit) => Reply) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init: init ?? {} });
      const { status, body } = handler(url, init ?? {});
      return json(status, body ?? null);
    },
  );
  vi.stubGlobal("fetch", fetchMock);
  return { calls, fetchMock };
}

const ok = (data: unknown, extra: object = {}) => ({
  status: 200,
  body: { success: true, statusCode: 200, message: "OK", data, ...extra },
});

function headerOf(init: RequestInit, name: string): string | undefined {
  return (init.headers as Record<string, string> | undefined)?.[name];
}

beforeEach(() => {
  resetApiClientState();
  onSessionEnded(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ApiError keeps the server's code", () => {
  it("carries status, message and code from the envelope", async () => {
    scriptFetch(() => ({
      status: 403,
      body: {
        success: false,
        statusCode: 403,
        message: "Not shared",
        code: "dialysis.dialysis_not_shared",
        data: null,
      },
    }));
    const error = await api("/patients/p1/dialysis/prescription").catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 403,
      code: "dialysis.dialysis_not_shared",
      message: "Not shared",
    });
    expect((error as ApiError).isForbidden).toBe(true);
    expect(isApiError(error, { code: "dialysis.dialysis_not_shared" })).toBe(
      true,
    );
    expect(isApiError(error, { status: 404 })).toBe(false);
  });

  it("has a null code for validation lists", async () => {
    scriptFetch(() => ({
      status: 400,
      body: {
        success: false,
        statusCode: 400,
        message: ["limit must not be greater than 150"],
        code: null,
        data: null,
      },
    }));
    const error = (await api("/x").catch((e: unknown) => e)) as ApiError;
    expect(error.code).toBeNull();
    expect(error.messages).toEqual(["limit must not be greater than 150"]);
  });

  it("survives a body that is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response("<html>bad gateway</html>", { status: 502 }),
      ),
    );
    const error = (await api("/x").catch((e: unknown) => e)) as ApiError;
    expect(error.status).toBe(502);
    expect(error.code).toBeNull();
  });
});

describe("X-Organization-Id only in office mode (INT-6)", () => {
  it("is not sent in patient or caregiver mode", async () => {
    const { calls } = scriptFetch(() => ok([]));
    await api("/patients/p1/blood-pressure");
    expect(headerOf(calls[0].init, "X-Organization-Id")).toBeUndefined();
  });

  it("is sent once an office is chosen, and stops when it is cleared", async () => {
    const { calls } = scriptFetch(() => ok([]));
    setActiveOrganization("org-1");
    await api("/organizations/org-1/patients");
    setActiveOrganization(null);
    await api("/patients/p1/blood-pressure");
    expect(headerOf(calls[0].init, "X-Organization-Id")).toBe("org-1");
    expect(headerOf(calls[1].init, "X-Organization-Id")).toBeUndefined();
  });

  it("can be suppressed for one call in office mode", async () => {
    const { calls } = scriptFetch(() => ok(null));
    setActiveOrganization("org-1");
    await api("/me/context", { organizationId: null });
    expect(headerOf(calls[0].init, "X-Organization-Id")).toBeUndefined();
  });

  it("is forgotten on reset (sign-in, sign-out)", async () => {
    const { calls } = scriptFetch(() => ok(null));
    setActiveOrganization("org-1");
    resetApiClientState();
    await api("/me/context");
    expect(headerOf(calls[0].init, "X-Organization-Id")).toBeUndefined();
  });
});

describe("refresh", () => {
  it("refreshes once and retries a 401 on a data route", async () => {
    let first = true;
    const { calls } = scriptFetch((url) => {
      if (url.endsWith("/auth/refresh")) return ok(null);
      if (first) {
        first = false;
        return {
          status: 401,
          body: { success: false, message: "Unauthorized", code: null },
        };
      }
      return ok({ id: 1 });
    });
    await expect(api("/me/context")).resolves.toEqual({ id: 1 });
    expect(calls.map((c) => new URL(c.url).pathname)).toEqual([
      "/api/v1/me/context",
      "/api/v1/auth/refresh",
      "/api/v1/me/context",
    ]);
  });

  /* An entry ending in "/" covers the paths under it; any other entry is
     exactly that path. */
  it.each(NO_REFRESH.map((p) => [p.endsWith("/") ? `${p}x` : p]))(
    "never refreshes on %s (a 401 there is a wrong code or password)",
    async (route) => {
      const ended = vi.fn();
      onSessionEnded(ended);
      const { calls } = scriptFetch(() => ({
        status: 401,
        body: {
          success: false,
          message: "Invalid code",
          code: "auth.invalid_code",
        },
      }));
      const error = (await api(route, {
        method: "POST",
        body: {},
      }).catch((e: unknown) => e)) as ApiError;
      expect(error.code).toBe("auth.invalid_code");
      /* One call: the route itself (which, for /auth/refresh, is the
         refresh), and no refresh after it. */
      expect(calls).toHaveLength(1);
      expect(new URL(calls[0].url).pathname).toBe(`/api/v1${route}`);
      expect(ended).not.toHaveBeenCalled();
    },
  );

  /* Phase 2 (B6): the old prefixes "/auth/2fa/" and "/auth/sudo" also
     caught authenticated reads, so an MFA or sudo page left open longer than
     the access token's life got an unrefreshed 401. */
  it.each([
    "/auth/2fa/methods",
    "/auth/2fa/backup-codes",
    "/auth/sudo",
    "/auth/sudo/options",
    "/auth/sessions",
    "/auth/me",
    "/auth/email/verify/resend/me",
  ])("refreshes a bare 401 on the authenticated read %s", async (route) => {
    let first = true;
    const { calls } = scriptFetch((url) => {
      if (url.endsWith("/auth/refresh")) return ok(null);
      if (first) {
        first = false;
        return { status: 401, body: { success: false, code: null } };
      }
      return ok({});
    });
    await expect(api(route)).resolves.toEqual({});
    expect(calls.map((c) => new URL(c.url).pathname)).toEqual([
      `/api/v1${route}`,
      "/api/v1/auth/refresh",
      `/api/v1${route}`,
    ]);
  });

  /* Spec 025 §5: a refresh is activity. The idle timer reads GET
     /auth/session; if that read could refresh, an idle tab would keep its
     session alive for ever. */
  it("never refreshes or ends the session on the passive GET /auth/session", async () => {
    const ended = vi.fn();
    onSessionEnded(ended);
    const { calls } = scriptFetch(() => ({
      status: 401,
      body: { success: false, code: null },
    }));
    const error = (await api("/auth/session").catch(
      (e: unknown) => e,
    )) as ApiError;
    expect(error.status).toBe(401);
    expect(calls).toHaveLength(1);
    expect(ended).not.toHaveBeenCalled();
  });

  it("shares one refresh between requests that fail together", async () => {
    let refreshes = 0;
    const seen = new Set<string>();
    scriptFetch((url) => {
      if (url.endsWith("/auth/refresh")) {
        refreshes++;
        return ok(null);
      }
      if (!seen.has(url)) {
        seen.add(url);
        return { status: 401, body: { success: false, message: "x" } };
      }
      return ok(url);
    });
    await Promise.all([api("/a"), api("/b"), api("/c")]);
    expect(refreshes).toBe(1);
  });
});

/* Every API route that answers a wrong code, link or password with a 401
   (backend src/core/auth/controllers/*, src/modules/sharing
   shared-links.controller.ts, as of beta cee89b6). Pinned by path, not by
   iterating NO_REFRESH, so a route missing from the list fails here. */
const BACKEND_401_CODE_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/oauth/google",
  "/auth/oauth/apple",
  "/auth/2fa/enroll/totp/confirm",
  "/auth/2fa/enroll/email/confirm",
  "/auth/2fa/enroll/sms/confirm",
  "/auth/2fa/challenge/verify",
  "/auth/sudo/password",
  "/auth/sudo/otp/confirm",
  "/auth/sudo/2fa",
  "/auth/password/reset",
  "/auth/password/reset/otp",
  "/auth/password/change",
  "/auth/password/set",
  "/auth/email/verify",
  "/auth/email/verify/otp",
  "/auth/email/verify/confirm",
  "/auth/phone/verify/otp",
  "/auth/phone/verify/confirm",
  "/auth/email/change/confirm",
  "/auth/email/change/confirm/otp",
  "/auth/phone/change/confirm",
  "/auth/identifiers/email/confirm",
  "/auth/identifiers/email/confirm/otp",
  "/auth/identifiers/phone/confirm",
  "/auth/account/deactivate",
  "/shared/synthetic-token/verify",
] as const;

describe("a wrong code never refreshes, resubmits or ends the session", () => {
  it.each(
    BACKEND_401_CODE_ROUTES.flatMap((route) => [
      [route, "auth.code_invalid_or_expired"],
      [route, null],
    ]),
  )("%s with 401 code %s", async (route, code) => {
    const ended = vi.fn();
    onSessionEnded(ended);
    const { calls } = scriptFetch(() => ({
      status: 401,
      body: { success: false, statusCode: 401, message: "Invalid", code },
    }));
    const error = (await api(route, { method: "POST", body: {} }).catch(
      (e: unknown) => e,
    )) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(calls).toHaveLength(1);
    expect(ended).not.toHaveBeenCalled();
  });

  it.each([
    "auth.code_invalid_or_expired",
    "auth.invalid_credentials",
    "auth.current_password_incorrect",
    "auth.session_not_found",
    "sharing.code_invalid_or_expired",
  ])(
    "a 401 carrying %s is thrown as is on any route, with no refresh",
    async (code) => {
      const ended = vi.fn();
      onSessionEnded(ended);
      const { calls } = scriptFetch(() => ({
        status: 401,
        body: { success: false, statusCode: 401, message: "No", code },
      }));
      const error = (await api("/some/future/code-route", {
        method: "POST",
        body: {},
      }).catch((e: unknown) => e)) as ApiError;
      expect(error.code).toBe(code);
      expect(calls).toHaveLength(1);
      expect(ended).not.toHaveBeenCalled();
    },
  );

  it("still refreshes a bare 401 on the identifier list", async () => {
    let first = true;
    const { calls } = scriptFetch((url) => {
      if (url.endsWith("/auth/refresh")) return ok(null);
      if (first) {
        first = false;
        return { status: 401, body: { success: false, code: null } };
      }
      return ok([]);
    });
    await expect(api("/auth/identifiers")).resolves.toEqual([]);
    expect(calls).toHaveLength(3);
  });

  it("does not end the session when the retry is a coded answer", async () => {
    const ended = vi.fn();
    onSessionEnded(ended);
    let first = true;
    scriptFetch((url) => {
      if (url.endsWith("/auth/refresh")) return ok(null);
      if (first) {
        first = false;
        return { status: 401, body: { success: false, code: null } };
      }
      return {
        status: 401,
        body: { success: false, code: "auth.invalid_credentials" },
      };
    });
    await api("/x", { method: "POST", body: {} }).catch(() => undefined);
    expect(ended).not.toHaveBeenCalled();
  });
});

describe("onSessionEnded", () => {
  it("fires on 401 account_no_longer_available without a refresh", async () => {
    const ended = vi.fn();
    onSessionEnded(ended);
    const { calls } = scriptFetch(() => ({
      status: 401,
      body: { success: false, code: "auth.account_no_longer_available" },
    }));
    await api("/me/context").catch(() => undefined);
    expect(calls).toHaveLength(1);
    expect(ended).toHaveBeenCalledWith("expired");
  });

  it("fires once when the refresh fails, however many requests failed", async () => {
    const ended = vi.fn();
    onSessionEnded(ended);
    scriptFetch(() => ({
      status: 401,
      body: { success: false, message: "Unauthorized", code: null },
    }));
    const results = await Promise.allSettled([api("/a"), api("/b"), api("/c")]);
    expect(results.every((r) => r.status === "rejected")).toBe(true);
    expect(ended).toHaveBeenCalledTimes(1);
    expect(ended).toHaveBeenCalledWith("expired");
    // Later failures in the same page do not fire it again.
    await api("/d").catch(() => undefined);
    expect(ended).toHaveBeenCalledTimes(1);
  });

  it("fires on 401 session_no_longer_active without trying a refresh", async () => {
    const ended = vi.fn();
    onSessionEnded(ended);
    const { calls } = scriptFetch(() => ({
      status: 401,
      body: {
        success: false,
        statusCode: 401,
        message: "Your session has ended. Sign in again",
        code: SESSION_ENDED_CODE,
      },
    }));
    const error = (await api("/me/context").catch(
      (e: unknown) => e,
    )) as ApiError;
    expect(error.code).toBe(SESSION_ENDED_CODE);
    expect(calls).toHaveLength(1);
    expect(ended).toHaveBeenCalledTimes(1);
  });

  it("fires when the retry after a good refresh is still refused", async () => {
    const ended = vi.fn();
    onSessionEnded(ended);
    scriptFetch((url) =>
      url.endsWith("/auth/refresh")
        ? ok(null)
        : { status: 401, body: { success: false, message: "Unauthorized" } },
    );
    await api("/me/context").catch(() => undefined);
    expect(ended).toHaveBeenCalledTimes(1);
  });

  it("can fire again after a new sign-in resets the client", async () => {
    const ended = vi.fn();
    onSessionEnded(ended);
    scriptFetch(() => ({
      status: 401,
      body: { success: false, message: "x" },
    }));
    await api("/a").catch(() => undefined);
    resetApiClientState();
    await api("/b").catch(() => undefined);
    expect(ended).toHaveBeenCalledTimes(2);
  });

  it("does not fire on a 403", async () => {
    const ended = vi.fn();
    onSessionEnded(ended);
    scriptFetch(() => ({
      status: 403,
      body: { success: false, message: "No" },
    }));
    await api("/a").catch(() => undefined);
    expect(ended).not.toHaveBeenCalled();
  });
});

describe("the 2FA challenge is reachable through apiRequest", () => {
  it("returns root fields next to the envelope", async () => {
    scriptFetch(() => ({
      status: 200,
      body: {
        success: true,
        statusCode: 200,
        message: "Two-factor authentication required",
        data: null,
        challengeId: "ch-1",
        methods: ["totp", "backup_code"],
      },
    }));
    const reply = await apiRequest<
      null,
      { challengeId: string; methods: string[] }
    >("/auth/login", {
      method: "POST",
      body: { identifier: "a", password: "b" },
    });
    expect(reply.challengeId).toBe("ch-1");
    expect(reply.methods).toEqual(["totp", "backup_code"]);
  });
});

describe("requests", () => {
  it("send cookies, JSON and the query string", async () => {
    const { calls } = scriptFetch(() => ok([]));
    await api("/patients/p1/blood-pressure", {
      query: { page: 2, limit: 10, from: "", cursor: undefined },
    });
    const url = new URL(calls[0].url);
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.has("from")).toBe(false);
    expect(url.searchParams.has("cursor")).toBe(false);
    expect(calls[0].init.credentials).toBe("include");
  });
});

describe("outside-share links (Phase 11 P-1)", () => {
  it("omit cookies, the office header, the cache and the referrer", async () => {
    setActiveOrganization("org-1");
    const { calls } = scriptFetch(() => ok({ kind: "message" }));
    await api("/shared/abc/content", { shareSession: "s".repeat(43) });
    const init = calls[0].init;
    expect(init.credentials).toBe("omit");
    expect(init.cache).toBe("no-store");
    expect(init.referrerPolicy).toBe("no-referrer");
    expect(headerOf(init, "X-Organization-Id")).toBeUndefined();
    expect(headerOf(init, "x-share-session")).toBe("s".repeat(43));
  });

  it("send no session header when none is given", async () => {
    const { calls } = scriptFetch(() => ok({ kind: "message" }));
    await api("/shared/abc");
    expect(headerOf(calls[0].init, "x-share-session")).toBeUndefined();
    expect(calls[0].init.credentials).toBe("omit");
  });

  it("refuse a share session on any other route", async () => {
    const { fetchMock } = scriptFetch(() => ok([]));
    await expect(
      api("/patients/p1/conversations", { shareSession: "x" }),
    ).rejects.toThrow(/only to \/shared\//);
    await expect(api("/sharedx/abc", { shareSession: "x" })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never refresh or end the session on a share 401", async () => {
    const ended = vi.fn();
    onSessionEnded(ended);
    const { calls } = scriptFetch(() => ({
      status: 401,
      body: {
        success: false,
        statusCode: 401,
        message: "Verify again",
        code: "sharing.verification_required",
      },
    }));
    await expect(
      api("/shared/abc/content", { shareSession: "x" }),
    ).rejects.toMatchObject({
      status: 401,
      code: "sharing.verification_required",
    });
    expect(calls).toHaveLength(1);
    expect(ended).not.toHaveBeenCalled();
  });

  /* QA round 1 (L1): even a bare 401 (no code) on a share route is an
     answer: no /auth/refresh with the member's cookies, no sign-out. */
  it("never refresh or end the session on a bare 401 from a share route", async () => {
    expect(isNoRefreshRoute("/shared/abc/content")).toBe(true);
    const ended = vi.fn();
    onSessionEnded(ended);
    const { calls } = scriptFetch(() => ({
      status: 401,
      body: { success: false, statusCode: 401, message: "Unauthorized" },
    }));
    await expect(
      api("/shared/abc/content", { shareSession: "x" }),
    ).rejects.toMatchObject({ status: 401 });
    expect(calls.map((c) => new URL(c.url).pathname)).toEqual([
      "/api/v1/shared/abc/content",
    ]);
    expect(ended).not.toHaveBeenCalled();
  });

  it("keep cookies on member routes", async () => {
    const { calls } = scriptFetch(() => ok([]));
    await api("/patients/p1/outside-shares");
    expect(calls[0].init.credentials).toBe("include");
    expect(calls[0].init.referrerPolicy).toBeUndefined();
  });
});
