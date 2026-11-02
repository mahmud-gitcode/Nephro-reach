/* ==========================================================================
   The pending 2FA challenge, in module memory only
   --------------------------------------------------------------------------
   Sign-in answers with a challenge id when the account has MFA. It is a
   one-time secret: never in the URL, never in storage. A reload or a deep
   link to /two-factor finds nothing here and goes back to /login.
   ========================================================================== */

import type { TwoFactorType } from "./auth.types";

export type PendingChallenge = {
  challengeId: string;
  methods: TwoFactorType[];
  next: string | null;
};

let pending: PendingChallenge | null = null;

export function setPendingChallenge(value: PendingChallenge): void {
  pending = value;
}

/** The challenge, if this tab has one. */
export function pendingChallenge(): PendingChallenge | null {
  return pending;
}

export function clearPendingChallenge(): void {
  pending = null;
}
