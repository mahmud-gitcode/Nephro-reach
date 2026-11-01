"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useIsMounted } from "@/lib/utils/useIsMounted";
import { resetApiClientState } from "@/lib/api/client";

const AUTH_CHANNEL = "nr-auth";

/* Set in the tab that signs out, so it goes home as before instead of
   reloading on its own message (a channel also hears other instances in
   the same tab). */
let signingOutHere = false;

function announceSignOut() {
  signingOutHere = true;
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(AUTH_CHANNEL);
  channel.postMessage("signed-out");
  channel.close();
}
/* Loaded with the session so every permission check reads what each
   organisation turned on or off for its roles (2026-10-13). */
import "@/features/staff/rolePermissions";
import {
  authenticate,
  AuthUser,
  clearSessionCookie,
  readSessionFromDocument,
  registerUser,
  writeSessionCookie,
} from "@/features/auth/auth";

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => AuthUser | null;
  loginAs: (user: AuthUser) => void;
  register: (input: {
    name: string;
    email: string;
    password: string;
  }) => "ok" | "exists";
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  /* The session lives in a cookie, which the server render cannot read, so
     `user` stays null until React hydrates. `session` holds what login and
     logout set during this page's life; before either happens we fall back
     to whatever the cookie already says. `ready` is just "have we looked
     yet" — consumers use it to avoid flashing a signed-out UI. */
  const [session, setSession] = useState<AuthUser | null>(null);
  const ready = useIsMounted();
  const user = ready ? (session ?? readSessionFromDocument()) : null;

  const loginAs = useCallback((next: AuthUser) => {
    writeSessionCookie(next);
    setSession(next);
  }, []);

  const login = useCallback(
    (email: string, password: string) => {
      const next = authenticate(email, password);
      if (!next) return null;
      loginAs(next);
      return next;
    },
    [loginAs],
  );

  const register = useCallback(
    (input: { name: string; email: string; password: string }) => {
      const result = registerUser(input);
      if ("error" in result) return result.error;
      loginAs(result.user);
      return "ok";
    },
    [loginAs],
  );

  /* A full page load to the home page (client, 2026-10-12: "when I click
     log out, it don't log me out"). Navigating inside the app raced the
     dashboard's own redirect to the login page, and every screen's cached
     data stayed in memory for whoever signed in next in that tab. */
  const logout = useCallback(() => {
    clearSessionCookie();
    resetApiClientState();
    setSession(null);
    announceSignOut();
    // A full load on purpose: it drops every cached screen's patient data.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/");
  }, []);

  /* Patient data must not stay on screen once the user has signed out:
     - another tab of the portal reloads (and so meets the sign-in check)
       when this tab signs out;
     - a portal page the browser restores from its back/forward cache after
       sign-out reloads instead of showing the old page. */
  useEffect(() => {
    const inPortal = () => window.location.pathname.startsWith("/dashboard");
    const channel =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel(AUTH_CHANNEL);
    if (channel) {
      channel.onmessage = (event) => {
        if (event.data === "signed-out" && inPortal() && !signingOutHere)
          window.location.reload();
      };
    }
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted && inPortal()) window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      channel?.close();
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, loginAs, register, logout }),
    [user, ready, login, loginAs, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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
