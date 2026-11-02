/* ==========================================================================
   Auth repository: one function per server operation (ADR 0007 §1)
   --------------------------------------------------------------------------
   - Cookies only: the web client never sends `X-Auth-Transport: bearer`, so
     no token ever appears in a response body (ADR 0006 step 5).
   - Auth routes never carry the office header (`organizationId: null`).
   - Nothing here stores anything. One-time values (challenge ids, reset ids,
     TOTP secrets, backup codes) are returned to the caller, which keeps them
     in memory only.
   ========================================================================== */

import { api, apiRequest } from "@/lib/api/client";
import { toCurrentSession, toLoginBody, toRegisterBody } from "./auth.mapping";
import type { RegisterForm } from "./auth.mapping";
import type {
  AuthProviders,
  ChallengeRoot,
  CurrentSession,
  CurrentSessionDto,
  ForgotPasswordResult,
  MeContext,
  SudoOption,
  SudoStatus,
  TotpEnrollment,
  TwoFactorMethod,
  TwoFactorType,
} from "./auth.types";

const NO_ORG = { organizationId: null } as const;

const post = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: "POST", body, ...NO_ORG });

/* ------------------------------------------------------------- sign in */

export type SignInResult =
  | { kind: "signed-in" }
  | { kind: "two-factor"; challengeId: string; methods: TwoFactorType[] };

function signInResult(root: ChallengeRoot): SignInResult {
  return root.challengeId
    ? {
        kind: "two-factor",
        challengeId: root.challengeId,
        methods: root.methods ?? [],
      }
    : { kind: "signed-in" };
}

/** `POST /auth/login`. The 2FA challenge sits at the response root. */
export async function login(
  identifier: string,
  password: string,
): Promise<SignInResult> {
  const envelope = await apiRequest<unknown, ChallengeRoot>("/auth/login", {
    method: "POST",
    body: toLoginBody(identifier, password),
    ...NO_ORG,
  });
  return signInResult(envelope);
}

/** `POST /auth/register`: creates the account and starts a session. */
export async function register(
  form: RegisterForm,
  consent?: Record<string, unknown>,
): Promise<void> {
  await post("/auth/register", toRegisterBody(form, consent));
}

export const sendChallengeCode = (challengeId: string, type: TwoFactorType) =>
  post<void>("/auth/2fa/challenge/send", { challengeId, type });

/** A backup code goes in `code` with the method's type: the server tries the
 *  method first, then the backup codes. */
export const verifyChallenge = (
  challengeId: string,
  type: TwoFactorType,
  code: string,
) => post<void>("/auth/2fa/challenge/verify", { challengeId, type, code });

/* ------------------------------------------------------- the session */

export const fetchContext = () => api<MeContext>("/me/context", NO_ORG);

/** Passive: reading it never extends the session (spec 025 §4), and the
 *  client never refreshes on it (NO_REFRESH). */
export async function fetchCurrentSession(): Promise<CurrentSession> {
  return toCurrentSession(
    await api<CurrentSessionDto>("/auth/session", NO_ORG),
  );
}

/** An ordinary authenticated request: it counts as activity and moves the
 *  idle deadline (spec 025 §2). Refreshes the access cookie when needed. */
export const touchSession = () => api<unknown>("/auth/me", NO_ORG);

export const signOutEverywhere = () => post<void>("/auth/logout-all");

/** Fails closed: any error means no provider is shown (D5-G). */
export async function fetchProviders(): Promise<AuthProviders> {
  try {
    const providers = await api<Partial<AuthProviders>>(
      "/auth/providers",
      NO_ORG,
    );
    return {
      google: providers?.google === true,
      apple: providers?.apple === true,
    };
  } catch {
    return { google: false, apple: false };
  }
}

export const googleNonce = () =>
  post<{ nonce: string; expiresAt: string }>("/auth/oauth/google/nonce");

export async function googleSignIn(idToken: string): Promise<SignInResult> {
  const envelope = await apiRequest<unknown, ChallengeRoot>(
    "/auth/oauth/google",
    { method: "POST", body: { idToken }, ...NO_ORG },
  );
  return signInResult(envelope);
}

/* ------------------------------------------------ password and email */

export const forgotPassword = (identifier: string) =>
  post<ForgotPasswordResult>("/auth/password/forgot", {
    identifier: identifier.trim(),
  });

export const sendResetCode = (resetId: string, channelId: string) =>
  post<void>("/auth/password/forgot/send", { resetId, channelId });

export const resetByCode = (resetId: string, code: string, password: string) =>
  post<void>("/auth/password/reset/otp", { resetId, code, password });

export const resetByToken = (token: string, password: string) =>
  post<void>("/auth/password/reset", { token, password });

export const verifyEmailToken = (token: string) =>
  post<void>("/auth/email/verify", { token });

/** Signed in: the code from the verification email. */
export const verifyEmailCode = (code: string) =>
  post<void>("/auth/email/verify/confirm", { code });

/** Signed out: email + code. */
export const verifyEmailOtp = (email: string, code: string) =>
  post<void>("/auth/email/verify/otp", {
    email: email.trim().toLowerCase(),
    code,
  });

export const resendVerification = () =>
  post<void>("/auth/email/verify/resend/me");

export const resendVerificationFor = (email: string) =>
  post<void>("/auth/email/verify/resend", {
    email: email.trim().toLowerCase(),
  });

export const confirmEmailChange = (token: string) =>
  post<void>("/auth/email/change/confirm", { token });

export const confirmAddedEmail = (token: string) =>
  post<void>("/auth/identifiers/email/confirm", { token });

/* ------------------------------------------------------ patient setup */

export const createMyPatient = (body: {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
}) => post<unknown>("/me/patient", body);

/* --------------------------------------------------------------- sudo */

export const sudoStatus = () => api<SudoStatus>("/auth/sudo", NO_ORG);

export async function sudoOptions(): Promise<SudoOption[]> {
  const result = await api<{ methods?: SudoOption[] }>(
    "/auth/sudo/options",
    NO_ORG,
  );
  return result?.methods ?? [];
}

export const sudoPassword = (password: string) =>
  post<void>("/auth/sudo/password", { password });

export const sudoOtpRequest = (channel: "email" | "sms") =>
  post<void>("/auth/sudo/otp/request", { channel });

export const sudoOtpConfirm = (channel: "email" | "sms", code: string) =>
  post<void>("/auth/sudo/otp/confirm", { channel, code });

export const sudo2faSend = (type: TwoFactorType) =>
  post<void>("/auth/sudo/2fa/send", { type });

export const sudo2fa = (type: TwoFactorType, code: string) =>
  post<void>("/auth/sudo/2fa", { type, code });

/* ---------------------------------------------------------------- MFA */

export const listMfaMethods = () =>
  api<TwoFactorMethod[]>("/auth/2fa/methods", NO_ORG);

export const enrollTotp = () => post<TotpEnrollment>("/auth/2fa/enroll/totp");

/** Returns the first backup codes when this is the account's first method. */
export async function confirmTotp(code: string): Promise<string[] | null> {
  const result = await post<{ backupCodes?: string[] } | undefined>(
    "/auth/2fa/enroll/totp/confirm",
    { code },
  );
  return result?.backupCodes ?? null;
}

export const disableMfaMethod = (methodId: string) =>
  api<void>(`/auth/2fa/methods/${encodeURIComponent(methodId)}`, {
    method: "DELETE",
    ...NO_ORG,
  });

export async function regenerateBackupCodes(): Promise<string[]> {
  const result = await post<{ backupCodes?: string[] }>(
    "/auth/2fa/backup-codes/regenerate",
  );
  return result?.backupCodes ?? [];
}
