/* ==========================================================================
   The API's identity shapes (backend src/modules/account, src/core/auth;
   specs 019, 025-027). Only the fields the client reads.
   ========================================================================== */

export type OrganizationType =
  | "PLATFORM"
  | "DIALYSIS_CENTER"
  | "ACCESS_CENTER"
  | "NEPHROLOGY_OFFICE"
  | "HOSPITAL"
  | "TRANSPLANT_CENTER";

export type ContextUser = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  language: "EN" | "ES";
  timeZone: string | null;
  isAccountVerified: boolean;
  mfaEnabled: boolean;
  mfaSetupRequired: boolean;
};

export type ContextPatient = {
  id: string;
  firstName: string;
  lastName: string;
};

export type ContextCaregiving = {
  grantId: string;
  patientId: string;
  firstName: string;
  lastName: string;
  relationship: string;
  preset: string;
  permissions: Record<string, number>;
};

export type ContextMembership = {
  organizationId: string;
  organizationName: string;
  organizationType: OrganizationType;
  organizationStatus: string;
  role: string;
  title: string | null;
  isOwner: boolean;
  permissions: Record<string, number>;
};

/** `GET /me/context`. */
export type MeContext = {
  user: ContextUser;
  patient: ContextPatient | null;
  caregiving: ContextCaregiving[];
  memberships: ContextMembership[];
  platform: ContextMembership | null;
};

export type TwoFactorType = "TOTP" | "EMAIL_OTP" | "SMS_OTP";

/** The sign-in challenge the API puts at the response root. */
export type ChallengeRoot = {
  challengeId?: string;
  methods?: TwoFactorType[];
};

export type SessionTier = "member" | "staff" | "platform";

/** `GET /auth/session` (spec 025 §4), dates still as ISO strings. */
export type CurrentSessionDto = {
  tier: SessionTier;
  idleTimeoutSeconds: number;
  maxAgeSeconds: number;
  idleExpiresAt: string;
  absoluteExpiresAt: string;
};

export type CurrentSession = {
  tier: SessionTier;
  idleTimeoutSeconds: number;
  maxAgeSeconds: number;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
};

export type AuthProviders = { google: boolean; apple: boolean };

export type SudoOption = {
  kind: "password" | "otp" | "2fa";
  channel?: "email" | "sms";
  type?: TwoFactorType;
  hint?: string | null;
  requiresSend?: boolean;
};

export type SudoStatus = {
  active: boolean;
  expiresAt?: number | string | null;
  method?: string | null;
};

export type TwoFactorMethod = {
  id: string;
  type: TwoFactorType;
  isEnabled: boolean;
  isPrimary: boolean;
  destination: string | null;
  lastUsedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
};

export type TotpEnrollment = {
  methodId: string;
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
};

export type ResetChannel = { id: string; type?: string; hint?: string };
export type ForgotPasswordResult = {
  resetId: string;
  channels: ResetChannel[];
};
