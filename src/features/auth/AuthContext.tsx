"use client";

/* ==========================================================================
   The session, from the API (Phase 2; ADR 0006 steps 2-4 and 8)
   --------------------------------------------------------------------------
   `GET /me/context` is the only source of who is signed in. The API sets
   httpOnly cookies on sign-in; nothing here can read or write them, and
   nothing the browser stores decides the user (INT-2).

   - status "loading" until the first read; "signed-out" on a 401; "error"
     when the read failed for any other reason (5xx, offline): an error is
     NOT signed out, so the guard shows a retry, never the login page and
     never stale data (INT-10).
   - Every sign-in (password, 2FA, register) first resets the API client,
     purges retired storage and clears the query caches, then reads the
     context. login() and register() return; the pages route.
   - Session end (401 `auth.session_no_longer_active` /
     `auth.account_no_longer_available`, a failed refresh, or the idle
     timer) clears everything and goes to /login?reason=expired. A visitor
     who was never signed in in this tab is simply signed out.

   AuthProvider sits above QueryProvider, so it keeps its own small state
   machine rather than a query.
   ========================================================================== */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import {
  ApiError,
  isApiError,
  onSessionEnded,
  resetApiClientState,
  SESSION_ENDED_CODE,
  setActiveOrganization,
} from "@/lib/api/client";
import { purgeLegacyStorage } from "@/lib/data/legacyPurge";
import { clearQueryCaches } from "@/lib/data/queryCache";
import { setLocalScope } from "@/lib/data/storage";
import {
  announceSignOut,
  browser,
  clearLocalSession,
  EXPIRED_LOGIN_PATH,
  listenForSignOut,
  signOut,
} from "@/lib/data/session";

/* Loaded with the session so every permission check reads what each
   organisation turned on or off for its roles (2026-10-13). Phase 3
   replaces it with the membership's server permissions. */
import "@/features/staff/rolePermissions";
import type { AuthUser } from "@/features/auth/auth";
import * as authApi from "./auth.api";
import {
  contextToUser,
  defaultContext,
  localScopeFor,
  type PortalChoice,
  type RegisterForm,
} from "./auth.mapping";
import type { MeContext, TwoFactorType } from "./auth.types";
import { registrationConsent } from "./consent";
import { signInWithGoogle } from "./providers";
import {
  clearPendingChallenge,
  pendingChallenge,
  setPendingChallenge,
} from "./pendingChallenge";
import { IdleWarning } from "./IdleWarning";

export type AuthStatus = "loading" | "signed-out" | "signed-in" | "error";

export type SignInOutcome =
  { kind: "signed-in"; context: MeContext } | { kind: "two-factor" };

type AuthContextValue = {
  status: AuthStatus;
  /** status !== "loading" (kept for the existing callers). */
  ready: boolean;
  /** The active context as the existing screens read it. */
  user: AuthUser | null;
  /** The raw /me/context, for the guard and Phase 3. */
  context: MeContext | null;
  /** Which context Phase 2 landed on. */
  choice: PortalChoice | null;
  /** Why the context read failed (status "error"). */
  error: unknown;
  login: (identifier: string, password: string) => Promise<SignInOutcome>;
  /** Google (D5-G): only reachable when the provider is enabled and an
   *  approved ID-token adapter is installed (providers.ts). */
  loginWithGoogle: () => Promise<SignInOutcome>;
  completeTwoFactor: (
    type: TwoFactorType,
    code: string,
  ) => Promise<SignInOutcome>;
  register: (form: RegisterForm, agreed: boolean) => Promise<MeContext>;
  /** Re-read /me/context (after verify, MFA enrolment, patient setup). */
  refreshContext: () => Promise<MeContext | null>;
  /** Ends the session on the server and in every tab. */
  logout: () => void;
  /** The idle timer's end: clear and go to /login?reason=expired. */
  expire: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* Pages that read the session. The landing page and the public token pages
   (reset, confirm links, shared logs) never ask the API who is signed in. */
const SESSION_PATHS = [
  "/dashboard",
  "/login",
  "/registration",
  "/two-factor",
  "/verify-email",
  "/setup",
  "/caregiver-invite",
];

export function needsSession(pathname: string | null): boolean {
  if (!pathname) return false;
  return SESSION_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

const SESSION_END_CODES: readonly string[] = [
  SESSION_ENDED_CODE,
  "auth.account_no_longer_available",
];

function currentNext(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("next");
}

/** /login?reason=expired, keeping the portal page the user was on. */
export function expiredPath(): string {
  if (typeof window === "undefined") return EXPIRED_LOGIN_PATH;
  /* The path only; the login page checks it again (safeNext) for the role
     that signs in. */
  const here = window.location.pathname;
  const keep = here.startsWith("/dashboard") ? here : null;
  return keep
    ? `${EXPIRED_LOGIN_PATH}&next=${encodeURIComponent(keep)}`
    : EXPIRED_LOGIN_PATH;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [status, setStatusState] = useState<AuthStatus>("loading");
  const [context, setContext] = useState<MeContext | null>(null);
  const [choice, setChoice] = useState<PortalChoice | null>(null);
  const [error, setError] = useState<unknown>(null);
  const statusRef = useRef<AuthStatus>("loading");
  const loadedOnce = useRef(false);
  const ending = useRef(false);

  const setStatus = useCallback((next: AuthStatus) => {
    statusRef.current = next;
    setStatusState(next);
  }, []);

  const user = useMemo(
    () => (context && choice ? contextToUser(context, choice) : null),
    [context, choice],
  );

  const applyContext = useCallback(
    (next: MeContext) => {
      const landing = defaultContext(
        next,
        currentNext() ??
          (typeof window === "undefined" ? null : window.location.pathname),
      );
      setContext(next);
      setChoice(landing);
      setLocalScope(localScopeFor(contextToUser(next, landing)));
      setError(null);
      setStatus("signed-in");
    },
    [setStatus],
  );

  const forget = useCallback(() => {
    setContext(null);
    setChoice(null);
    setLocalScope(null);
  }, []);

  /** Clear everything for this user and go to /login?reason=expired. */
  const expire = useCallback(() => {
    if (ending.current) return;
    ending.current = true;
    setActiveOrganization(null);
    setLocalScope(null);
    clearPendingChallenge();
    clearLocalSession();
    announceSignOut();
    browser.assign(expiredPath());
  }, []);

  /** Reads /me/context. A 401 is "signed out"; anything else is "error". */
  const load = useCallback(async (): Promise<MeContext | null> => {
    try {
      const next = await authApi.fetchContext();
      applyContext(next);
      return next;
    } catch (cause) {
      if (isApiError(cause, { status: 401 })) {
        const wasSignedIn = statusRef.current === "signed-in";
        forget();
        setError(null);
        setStatus("signed-out");
        /* A session that ended while this tab used it, or one the server
           says has ended: the expired page. A visitor who was never signed
           in here is simply signed out (the guard sends them to login). */
        const ended =
          wasSignedIn ||
          (cause.code !== null && SESSION_END_CODES.includes(cause.code));
        if (ended && window.location.pathname.startsWith("/dashboard"))
          expire();
        return null;
      }
      setError(cause);
      setStatus("error");
      return null;
    }
  }, [applyContext, expire, forget, setStatus]);

  /* The API client's session end. Only a tab that was signed in clears and
     redirects; for an anonymous read the failing call answers 401 and
     load() sets "signed out". */
  useEffect(() => {
    onSessionEnded(() => {
      if (statusRef.current === "signed-in") expire();
    });
    return () => onSessionEnded(null);
  }, [expire]);

  /* Boot: purge retired storage (the demo session cookie and the stored
     passwords among them); hear sign-out from other tabs and Back. */
  useEffect(() => {
    purgeLegacyStorage();
    return listenForSignOut();
  }, []);

  /* The first read, when a page that needs the session opens. */
  useEffect(() => {
    if (loadedOnce.current || !needsSession(pathname)) return;
    loadedOnce.current = true;
    void load();
  }, [pathname, load]);

  const startSignIn = useCallback(() => {
    resetApiClientState();
    purgeLegacyStorage();
    clearQueryCaches();
    clearPendingChallenge();
    ending.current = false;
    forget();
  }, [forget]);

  const finishSignIn = useCallback(async (): Promise<{
    kind: "signed-in";
    context: MeContext;
  }> => {
    loadedOnce.current = true;
    const next = await authApi.fetchContext();
    applyContext(next);
    return { kind: "signed-in", context: next };
  }, [applyContext]);

  const afterFirstStep = useCallback(
    async (result: authApi.SignInResult): Promise<SignInOutcome> => {
      if (result.kind === "two-factor") {
        setPendingChallenge({
          challengeId: result.challengeId,
          methods: result.methods,
          next: currentNext(),
        });
        return { kind: "two-factor" };
      }
      return finishSignIn();
    },
    [finishSignIn],
  );

  const login = useCallback(
    async (identifier: string, password: string): Promise<SignInOutcome> => {
      startSignIn();
      return afterFirstStep(await authApi.login(identifier, password));
    },
    [afterFirstStep, startSignIn],
  );

  const loginWithGoogle = useCallback(async (): Promise<SignInOutcome> => {
    startSignIn();
    return afterFirstStep(await signInWithGoogle());
  }, [afterFirstStep, startSignIn]);

  const completeTwoFactor = useCallback(
    async (type: TwoFactorType, code: string): Promise<SignInOutcome> => {
      const challenge = pendingChallenge();
      if (!challenge) throw new ApiError(401, "No sign-in in progress.", null);
      await authApi.verifyChallenge(challenge.challengeId, type, code);
      clearPendingChallenge();
      return finishSignIn();
    },
    [finishSignIn],
  );

  const register = useCallback(
    async (form: RegisterForm, agreed: boolean): Promise<MeContext> => {
      startSignIn();
      await authApi.register(form, registrationConsent(agreed));
      return (await finishSignIn()).context;
    },
    [finishSignIn, startSignIn],
  );

  const logout = useCallback(() => {
    ending.current = true;
    forget();
    clearPendingChallenge();
    setStatus("signed-out");
    void signOut({ destination: "/" });
  }, [forget, setStatus]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      ready: status !== "loading",
      user,
      context,
      choice,
      error,
      login,
      loginWithGoogle,
      completeTwoFactor,
      register,
      refreshContext: load,
      logout,
      expire,
    }),
    [
      status,
      user,
      context,
      choice,
      error,
      login,
      loginWithGoogle,
      completeTwoFactor,
      register,
      load,
      logout,
      expire,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {status === "signed-in" ? (
        <IdleWarning onExpire={expire} onSignOut={logout} />
      ) : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/** The session if an AuthProvider is present, else null. For checks that
 *  must not break a screen rendered on its own (a component test). */
export function useOptionalAuth() {
  return useContext(AuthContext);
}
