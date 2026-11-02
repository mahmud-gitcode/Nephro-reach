/* ==========================================================================
   API error → what the auth pages say (design §2.4)
   --------------------------------------------------------------------------
   Pages branch on the server's `code`, then the status. Server text is
   never echoed: a validation list may name internals, and one generic line
   per case is enough for a sign-in form.
   ========================================================================== */

import { isApiError } from "@/lib/api/client";

export type AuthErrorKind =
  | "invalid-credentials"
  | "too-many"
  | "locked"
  | "code-invalid"
  | "code-expired"
  | "challenge-ended"
  | "link-invalid"
  | "exists"
  | "google-unavailable"
  | "google-conflict"
  | "google-unverified"
  | "mfa-last-method"
  | "sudo-required"
  | "network"
  | "generic";

const BY_CODE: Record<string, AuthErrorKind> = {
  "auth.invalid_credentials": "invalid-credentials",
  "auth.two_factor_user_locked": "locked",
  "auth.reauth_locked": "locked",
  "auth.too_many_incorrect_attempts": "locked",
  "auth.too_many_failed_attempts": "locked",
  "auth.sudo_elevation_failed": "code-invalid",
  "auth.invalid_code": "code-invalid",
  "auth.invalid_authenticator_code": "code-invalid",
  "auth.code_invalid_or_expired": "code-expired",
  "auth.two_factor_challenge_locked": "challenge-ended",
  "auth.challenge_invalid_or_expired": "challenge-ended",
  "auth.verification_link_invalid_or_expired": "link-invalid",
  "auth.reset_link_invalid_or_expired": "link-invalid",
  "auth.account_already_registered": "exists",
  "auth.oauth_not_configured": "google-unavailable",
  "auth.oauth_nonce_invalid": "google-unavailable",
  "auth.oauth_token_invalid": "google-unavailable",
  "auth.oauth_email_conflict": "google-conflict",
  "auth.oauth_email_unverified": "google-unverified",
  "auth.mfa_required_cannot_disable": "mfa-last-method",
  "auth.sudo_required": "sudo-required",
};

export function authErrorKind(error: unknown): AuthErrorKind {
  if (error instanceof Error && error.name === "GoogleUnavailableError")
    return "google-unavailable";
  if (!isApiError(error)) return "network";
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code];
  if (error.status === 429) return "too-many";
  if (error.status === 0) return "network";
  /* Other link and code routes answer with codes named after them; any
     "invalid or expired" means the same to the user. */
  if (error.code?.includes("invalid_or_expired")) return "link-invalid";
  if (error.status === 401 && error.code === null) return "invalid-credentials";
  return "generic";
}

const TEXT: Record<AuthErrorKind, string> = {
  "invalid-credentials": "invalidCredentials",
  "too-many": "errors.tooMany",
  locked: "errors.locked",
  "code-invalid": "errors.codeInvalid",
  "code-expired": "errors.codeExpired",
  "challenge-ended": "errors.challengeEnded",
  "link-invalid": "errors.linkInvalid",
  exists: "errors.generic",
  "google-unavailable": "errors.googleUnavailable",
  "google-conflict": "errors.googleConflict",
  "google-unverified": "errors.googleUnverified",
  "mfa-last-method": "errors.mfaLastMethod",
  "sudo-required": "errors.generic",
  network: "errors.network",
  generic: "errors.generic",
};

/** The dictionary path (auth namespace) for an error. */
export function authErrorPath(error: unknown): string {
  return TEXT[authErrorKind(error)];
}
