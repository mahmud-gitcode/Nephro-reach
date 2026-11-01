/* ==========================================================================
   API client
   --------------------------------------------------------------------------
   The one place the frontend talks to the NephroReach API. Repositories call
   `api()` instead of reading localStorage (ADR 0001); nothing else should
   call fetch.

   - Web auth is httpOnly cookies set by the API, so every request sends
     credentials and no token is ever visible to JavaScript.
   - An expired access cookie (401) triggers one refresh, shared by every
     request that failed at the same time, then the request is retried once.
   - Staff send X-Organization-Id on patient routes; the portal sets the
     active organization after login.
   - When the session cannot be renewed (idle or absolute limit, revoked,
     signed out elsewhere) the registered `onSessionEnded` handler runs once,
     so the app can clear cached patient data and send the user to sign in.
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

export type ApiEnvelope<T> = {
  success: boolean;
  message: string | string[];
  statusCode: number;
  data: T;
  metadata?: unknown;
  pagination?: Pagination;
};

export class ApiError extends Error {
  readonly status: number;
  readonly messages: string[];

  constructor(status: number, message: string | string[] | undefined) {
    const messages = Array.isArray(message)
      ? message
      : message
        ? [message]
        : [];
    super(messages[0] ?? `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.messages = messages;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

export type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  /** Overrides the active organization for this call; null sends none. */
  organizationId?: string | null;
  signal?: AbortSignal;
};

let activeOrganizationId: string | null = null;

export function setActiveOrganization(id: string | null): void {
  activeOrganizationId = id;
}

type SessionEndedHandler = (reason: "expired" | "signed-out") => void;
let sessionEndedHandler: SessionEndedHandler | null = null;

/** The app registers one handler: clear caches, then route to sign-in. */
export function onSessionEnded(handler: SessionEndedHandler | null): void {
  sessionEndedHandler = handler;
}

/** Forget everything tied to the signed-in user (call on sign-out). */
export function resetApiClientState(): void {
  activeOrganizationId = null;
  refreshing = null;
}

/* Routes where a 401 means "wrong code or password", not "expired session":
   retrying them after a refresh would resubmit a one-time code. */
const NO_REFRESH = [
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
];

let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

function buildUrl(path: string, query?: Query): string {
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

async function send(path: string, options: ApiOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const organizationId =
    options.organizationId === undefined
      ? activeOrganizationId
      : options.organizationId;
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

/** Full envelope: use when you need `pagination` or the server's message. */
export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {},
): Promise<ApiEnvelope<T>> {
  let res = await send(path, options);

  if (res.status === 401 && !NO_REFRESH.some((p) => path.startsWith(p))) {
    if (await refreshSession()) {
      res = await send(path, options);
    } else {
      sessionEndedHandler?.("expired");
    }
  }

  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || !json || json.success === false) {
    throw new ApiError(res.status, json?.message);
  }
  return json;
}

/** The `data` of a successful response. */
export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  return (await apiRequest<T>(path, options)).data;
}
