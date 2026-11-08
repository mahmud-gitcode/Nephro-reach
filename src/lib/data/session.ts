/* ==========================================================================
   Sign-out and session end (ADR 0006 steps 4, 8, 9; ADR 0007)
   --------------------------------------------------------------------------
   Two ways a session stops, one clean-up:

   - Sign-out (the user asked): start POST /auth/logout (best effort,
     keepalive so it outlives the page), then at once drop the query caches,
     purge retired storage, tell the other tabs, and do a full page load so
     nothing stays in memory. Nothing waits on the network between clearing
     the caches and leaving the page, so no screen can refetch and re-show
     data in between.
   - Session end (the API said so: 401 `auth.session_no_longer_active`, or
     the refresh failed): the API client calls the handler registered with
     `onSessionEnded`. Same clean-up, then /login?reason=expired.

   Another tab that hears "signed-out" on BroadcastChannel("nr-auth") drops
   its caches and, on a portal page, reloads into the sign-in check. A
   portal page restored from the back/forward cache reloads too.

   Navigation goes through `browser` so tests can watch it (jsdom cannot
   navigate).
   ========================================================================== */

import {
  api,
  onSessionEnded,
  resetApiClientState,
  setActiveOrganization,
} from "@/lib/api/client";
import { clearQueryCaches } from "./queryCache";
import { purgeLegacyStorage, purgeSignOutStores } from "./legacyPurge";

export const AUTH_CHANNEL = "nr-auth";
export const SIGNED_OUT_MESSAGE = "signed-out";
export const EXPIRED_LOGIN_PATH = "/login?reason=expired";

/** Page loads, behind a seam for tests. */
export const browser = {
  assign(url: string) {
    // A full load on purpose: it drops every cached screen's patient data.
    window.location.assign(url);
  },
  reload() {
    window.location.reload();
  },
};

/* Set in the tab that signs out, so it goes where it meant to instead of
   reloading on its own message (a channel also hears other instances in
   the same tab). */
let signingOutHere = false;

export function announceSignOut(): void {
  signingOutHere = true;
  if (typeof BroadcastChannel === "undefined") return;
  try {
    const channel = new BroadcastChannel(AUTH_CHANNEL);
    channel.postMessage(SIGNED_OUT_MESSAGE);
    channel.close();
  } catch {
    /* No channel: the other tabs meet the sign-in check on their next load. */
  }
}

/** Tell the API to end this session. Never throws: sign-out must work
 *  even when the API is down. keepalive lets the request finish after the
 *  page has gone; with no body it is a simple CORS request (no preflight),
 *  and the API reads the refresh token from its cookie. */
export async function logoutOnServer(): Promise<boolean> {
  try {
    await api<unknown>("/auth/logout", {
      method: "POST",
      organizationId: null,
      keepalive: true,
    });
    return true;
  } catch {
    return false;
  }
}

/** Everything in this tab that belongs to the signed-in user. */
export function clearLocalSession(clearDemoSession?: () => void): void {
  clearDemoSession?.();
  clearQueryCaches();
  purgeLegacyStorage();
  /* PM-4: member health data still kept in this browser goes with the
     session that wrote it. */
  purgeSignOutStores();
}

/** The whole sign-out. `clearDemoSession` drops the prototype's session
 *  cookie until Phase 2 replaces demo auth. */
export function signOut(
  options: { clearDemoSession?: () => void; destination?: string } = {},
): Promise<boolean> {
  /* Sent first, while the client still holds this session's state; not
     awaited, so the clean-up and the page load follow at once. */
  const loggedOut = logoutOnServer();
  resetApiClientState();
  clearLocalSession(options.clearDemoSession);
  announceSignOut();
  browser.assign(options.destination ?? "/");
  /* For callers that care (tests): whether the API confirmed. */
  return loggedOut;
}

/** Registers the API client's session-end handler; returns the cleanup. */
export function registerSessionEnd(clearDemoSession?: () => void): () => void {
  onSessionEnded(() => {
    /* Not resetApiClientState(): that would let a second failing request
       end the session again while this page is unloading. */
    setActiveOrganization(null);
    clearLocalSession(clearDemoSession);
    announceSignOut();
    browser.assign(EXPIRED_LOGIN_PATH);
  });
  return () => onSessionEnded(null);
}

function inPortal(): boolean {
  return window.location.pathname.startsWith("/dashboard");
}

/**
 * Listens for sign-out in other tabs and for back/forward-cache restores.
 * Returns the cleanup.
 */
export function listenForSignOut(): () => void {
  const channel =
    typeof BroadcastChannel === "undefined"
      ? null
      : new BroadcastChannel(AUTH_CHANNEL);
  if (channel) {
    channel.onmessage = (event: MessageEvent) => {
      if (event.data !== SIGNED_OUT_MESSAGE || signingOutHere) return;
      clearQueryCaches();
      if (inPortal()) browser.reload();
    };
  }
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted && inPortal()) browser.reload();
  };
  window.addEventListener("pageshow", onPageShow);
  return () => {
    channel?.close();
    window.removeEventListener("pageshow", onPageShow);
  };
}

/** For tests only. */
export function __resetSessionForTests(): void {
  signingOutHere = false;
}
