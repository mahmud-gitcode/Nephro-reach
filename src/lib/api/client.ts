/* ==========================================================================
   API client
   --------------------------------------------------------------------------
   The one place the frontend talks to the NephroReach API. Repositories call
   `api()` instead of reading localStorage (ADR 0001, amended by ADR 0007);
   nothing else should call fetch, except `uploadFile` for the storage PUT.

   - Web auth is httpOnly cookies set by the API, so every request sends
     credentials and no token is ever visible to JavaScript.
   - An expired access cookie (401 with no code: the API's auth guard sends
     a bare 401) triggers one refresh, shared by every request that failed
     at the same time, then the request is retried once. A 401 that carries
     any other code (`auth.code_invalid_or_expired`,
     `auth.invalid_credentials`, ...) is an answer, not an expired session:
     it is thrown as is, with no refresh and no retry. Code and password
     routes (NO_REFRESH) never refresh whatever the 401 says: a retry would
     resubmit a one-time code.
   - X-Organization-Id is sent only in office mode (INT-6). A patient or a
     caregiver call that carried it would be judged as staff, and audited
     as staff. Office mode is switched on explicitly with
     `setActiveOrganization(id)` when the user picks an office membership,
     and off with `setActiveOrganization(null)`.
   - Errors keep the server's machine-readable `code` (spec 019 §4), so
     screens branch on `code` where it exists and on the status otherwise.
   - When the session cannot be renewed (idle or absolute limit, revoked,
     signed out elsewhere: 401 `auth.session_no_longer_active`, or a failed
     refresh) the registered `onSessionEnded` handler runs once, so the app
     can clear cached patient data and send the user to sign in.
   ========================================================================== */

const CONFIGURED_API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

/* Local development falls back to the dev API; a production build must say
   where the API is, so it can never quietly talk to the wrong host. */
export const API_URL =
  CONFIGURED_API_URL ??
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000/api/v1");

/* Mirrors the API's PaginationMeta (backend src/common/pagination). */
export type Pagination =
  | {
      mode: "offset";
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    }
  | {
      mode: "cursor";
      limit: number;
      cursor: string | null;
      nextCursor: string | null;
      hasNext: boolean;
    };

/** The API's envelope (spec 019 §4). Some routes add fields at the root,
 *  e.g. the 2FA challenge `{ challengeId, methods }` on sign-in; `Root`
 *  types them. */
export type ApiEnvelope<T, Root extends object = object> = {
  success: boolean;
  message: string | string[];
  statusCode: number;
  code?: string | null;
  data: T;
  metadata?: unknown;
  pagination?: Pagination;
} & Partial<Root>;

/** The code the API sends when a session has ended for good. */
export const SESSION_ENDED_CODE = "auth.session_no_longer_active";

/* 401 codes that end the session: no refresh can bring it back. */
const SESSION_END_CODES: readonly string[] = [
  SESSION_ENDED_CODE,
  "auth.account_no_longer_available",
];

/* 401 codes that mean "the access cookie is missing or expired", so a
   refresh may help. The API's guard sends a bare 401 (code null) today;
   `auth.access_token_required` is the strategy's own message, kept in case
   the guard starts passing it through. */
const REFRESHABLE_CODES: readonly (string | null)[] = [
  null,
  "auth.access_token_required",
];

export class ApiError extends Error {
  readonly status: number;
  readonly messages: string[];
  /** The server's stable error code (`dialysis.dialysis_not_shared`), or
   *  null for validation lists and bare framework errors (spec 019 §4). */
  readonly code: string | null;

  constructor(
    status: number,
    message: string | string[] | undefined,
    code: string | null = null,
  ) {
    const messages = Array.isArray(message)
      ? message
      : message
        ? [message]
        : [];
    super(messages[0] ?? `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.messages = messages;
    this.code = code;
  }

  /** 403: not shared with this user, or no access. Never show cached data. */
  get isForbidden(): boolean {
    return this.status === 403;
  }
}

/** True for an ApiError, optionally with this status and/or code. */
export function isApiError(
  error: unknown,
  match?: { status?: number; code?: string },
): error is ApiError {
  if (!(error instanceof ApiError)) return false;
  if (match?.status !== undefined && error.status !== match.status)
    return false;
  if (match?.code !== undefined && error.code !== match.code) return false;
  return true;
}

type Query = Record<string, string | number | boolean | null | undefined>;

export type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  /**
   * Office calls only. A string sends that organization for this call;
   * null sends none even in office mode. Leave it out to follow the mode:
   * the active office in office mode, nothing otherwise.
   */
  organizationId?: string | null;
  signal?: AbortSignal;
};

/* Office mode: the office membership the user is acting for. null means
   patient or caregiver mode, where no organization header is ever sent. */
let activeOrganizationId: string | null = null;

/** Enter office mode for this membership, or leave it with null. Callers in
 *  the app use `switchPortalContext` (lib/data/queryCache), which also
 *  clears the query cache so one context never shows another's data. */
export function setActiveOrganization(id: string | null): void {
  activeOrganizationId = id;
}

/** The office the user is acting for, or null outside office mode. */
export function activeOrganization(): string | null {
  return activeOrganizationId;
}

export type SessionEndReason = "expired" | "signed-out";
type SessionEndedHandler = (reason: SessionEndReason) => void;
let sessionEndedHandler: SessionEndedHandler | null = null;
/* Several requests can fail together; the app hears about it once. */
let sessionEnded = false;

/** The app registers one handler: clear caches, then route to sign-in. */
export function onSessionEnded(handler: SessionEndedHandler | null): void {
  sessionEndedHandler = handler;
}

/** Whether a handler is registered. */
export function hasSessionEndedHandler(): boolean {
  return sessionEndedHandler !== null;
}

function endSession(reason: SessionEndReason) {
  if (sessionEnded) return;
  sessionEnded = true;
  sessionEndedHandler?.(reason);
}

/** Forget everything tied to the signed-in user (sign-in and sign-out). */
export function resetApiClientState(): void {
  activeOrganizationId = null;
  refreshing = null;
  sessionEnded = false;
}

/* Routes where a 401 means "wrong code or password", not "expired session":
   retrying them after a refresh would resubmit a one-time code. The code
   rule above already covers them; this list holds even if a route's 401
   ever arrives without a code. Kept in step with the API's 401-throwing
   routes (backend src/core/auth/controllers, src/modules/sharing). */
export const NO_REFRESH = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/2fa/",
  "/auth/sudo",
  "/auth/password/",
  "/auth/oauth/",
  "/auth/email/",
  "/auth/phone/",
  /* Adding an email or phone: confirm by link token or one-time code. */
  "/auth/identifiers/email/confirm",
  "/auth/identifiers/phone/confirm",
  /* Sudo-consuming, one shot. */
  "/auth/account/deactivate",
  /* Outside-share links: public, verified by a one-time code, never by
     the member's session. */
  "/shared/",
] as const;

function isNoRefreshRoute(path: string): boolean {
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return NO_REFRESH.some((p) => normalised.startsWith(p));
}

let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(buildUrl("/auth/refresh"), {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export function buildUrl(path: string, query?: Query): string {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not set for this build.");
  }
  const url = new URL(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "")
      url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function organizationHeader(options: ApiOptions): string | null {
  if (options.organizationId !== undefined) return options.organizationId;
  return activeOrganizationId;
}

async function send(path: string, options: ApiOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const organizationId = organizationHeader(options);
  if (organizationId) headers["X-Organization-Id"] = organizationId;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  return fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    credentials: "include",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });
}

type ErrorBody = {
  success?: boolean;
  message?: string | string[];
  code?: string | null;
};

function readBody(res: Response): Promise<unknown> {
  return res.json().catch(() => null);
}

function errorCode(json: unknown): string | null {
  const code = (json as ErrorBody | null)?.code;
  return typeof code === "string" ? code : null;
}

function endsSession(json: unknown): boolean {
  const code = errorCode(json);
  return code !== null && SESSION_END_CODES.includes(code);
}

function mayRefresh(json: unknown): boolean {
  return REFRESHABLE_CODES.includes(errorCode(json));
}

/** Full envelope: use when you need `pagination`, the server's message, or
 *  fields the API puts at the root (the 2FA challenge on sign-in). */
export async function apiRequest<T, Root extends object = object>(
  path: string,
  options: ApiOptions = {},
): Promise<ApiEnvelope<T, Root>> {
  let res = await send(path, options);
  let json = await readBody(res);

  /* A 401 with any other code (a wrong code or password) is thrown as is. */
  if (res.status === 401 && !isNoRefreshRoute(path)) {
    if (endsSession(json)) {
      endSession("expired");
    } else if (mayRefresh(json)) {
      if (await refreshSession()) {
        res = await send(path, options);
        json = await readBody(res);
        if (res.status === 401 && (endsSession(json) || mayRefresh(json)))
          endSession("expired");
      } else {
        endSession("expired");
      }
    }
  }

  const body = json as (ApiEnvelope<T, Root> & ErrorBody) | null;
  if (!res.ok || !body || body.success === false) {
    throw new ApiError(res.status, body?.message, errorCode(json));
  }
  return body;
}

/** The `data` of a successful response. */
export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  return (await apiRequest<T>(path, options)).data;
}
