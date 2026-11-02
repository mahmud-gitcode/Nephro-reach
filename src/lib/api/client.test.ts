import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  api,
  ApiError,
  apiRequest,
  isApiError,
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

  it.each(NO_REFRESH.map((p) => [p]))(
    "never refreshes on %s (a 401 there is a wrong code or password)",
    async (prefix) => {
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
      const error = (await api(`${prefix}x`, {
        method: "POST",
        body: {},
      }).catch((e: unknown) => e)) as ApiError;
      expect(error.code).toBe("auth.invalid_code");
      expect(calls).toHaveLength(1);
      expect(calls.some((c) => c.url.endsWith("/auth/refresh"))).toBe(false);
      expect(ended).not.toHaveBeenCalled();
    },
  );

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

describe("onSessionEnded", () => {
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
