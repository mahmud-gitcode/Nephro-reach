/* ==========================================================================
   Sign-in providers (D5-G)
   --------------------------------------------------------------------------
   Google stays disabled and its button hidden until real credentials are
   supplied, tested and disclosed (D5-G, D18). The pages show the Google
   block only when `GET /auth/providers` says `google: true`; any error
   hides it (fails closed). The answer is kept in module memory for five
   minutes (login and registration sit outside the query provider).

   No Google script is loaded and no Google origin is in the CSP. Signing in
   goes through an `IdTokenSource`: none is installed, so even an enabled
   provider answers "not available" until the approved Google Identity
   Services adapter is written (`setIdTokenSource`).
   ========================================================================== */

import { useEffect, useState } from "react";
import { fetchProviders, googleNonce, googleSignIn } from "./auth.api";
import type { SignInResult } from "./auth.api";
import type { AuthProviders } from "./auth.types";

const TTL_MS = 5 * 60 * 1000;
const NONE: AuthProviders = { google: false, apple: false };

let cached: { at: number; value: Promise<AuthProviders> } | null = null;

export function loadProviders(now = Date.now()): Promise<AuthProviders> {
  if (!cached || now - cached.at > TTL_MS) {
    cached = { at: now, value: fetchProviders() };
  }
  return cached.value;
}

/** For tests. */
export function resetProvidersCache(): void {
  cached = null;
}

/** The providers to show. Starts with none, so nothing flashes. */
export function useAuthProviders(): AuthProviders {
  const [providers, setProviders] = useState<AuthProviders>(NONE);
  useEffect(() => {
    let live = true;
    void loadProviders().then((value) => {
      if (live) setProviders(value);
    });
    return () => {
      live = false;
    };
  }, []);
  return providers;
}

/** Gets a Google ID token carrying the server's nonce. */
export type IdTokenSource = { getIdToken: (nonce: string) => Promise<string> };

let idTokenSource: IdTokenSource | null = null;

/** Installs the Google adapter. Only the approved Google Identity Services
 *  adapter may call this in the app; tests install a local mock. */
export function setIdTokenSource(source: IdTokenSource | null): void {
  idTokenSource = source;
}

export class GoogleUnavailableError extends Error {
  constructor() {
    super("Google sign-in is not available.");
    this.name = "GoogleUnavailableError";
  }
}

/** Nonce → ID token (the adapter) → POST /auth/oauth/google. */
export async function signInWithGoogle(): Promise<SignInResult> {
  if (!idTokenSource) throw new GoogleUnavailableError();
  const { nonce } = await googleNonce();
  const idToken = await idTokenSource.getIdToken(nonce);
  return googleSignIn(idToken);
}
