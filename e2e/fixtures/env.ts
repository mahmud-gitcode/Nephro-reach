/* Env + synthetic accounts. Synthetic data only: these are the seed's demo
   accounts (Nephro-reach-backend/prisma/seed.ts:87-200, 2383-2391). */
import path from "node:path";

export const env = {
  baseURL: must("E2E_BASE_URL"), // http://localhost:41nn
  apiURL: must("E2E_API_URL").replace(/\/$/, ""), // http://localhost:31nn/api/v1
  /** Agent run dir mail sink: C:/nr-wt/<agent>/run/mail (smtp-sink.mjs writes NNNN.eml). */
  mailDir: process.env.E2E_MAIL_DIR ?? "",
  /** Backend checkout used only to resolve otplib (no new dependency). */
  backendDir: process.env.E2E_BACKEND_DIR ?? "",
  /** Port for the local fake Google issuer (fixtures/fake-google-issuer.ts). */
  fakeIssuerPort: Number(process.env.E2E_FAKE_ISSUER_PORT ?? 0),
  /** Test API started with short D2 durations (README "Session test API"). */
  shortSessions: process.env.E2E_SHORT_SESSIONS === "true",
  /** Seeded with SEED_SECURITY_FIXTURES=true (mfa.nurse fixture). */
  securityFixtures: process.env.E2E_SECURITY_FIXTURES === "true",
};

function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set (see e2e/README.md)`);
  return v;
}

export const apiOrigin = new URL(env.apiURL).origin;
export const appOrigin = new URL(env.baseURL).origin;
export const mailDir = () => {
  if (!env.mailDir) throw new Error("E2E_MAIL_DIR is not set");
  return path.resolve(env.mailDir);
};

export type Account = { email: string; password: string; name: string };

export const ACCOUNTS = {
  john: {
    email: "user@nephroreach.com",
    password: "user123",
    name: "John Taylor",
  },
  grace: {
    email: "grace@nephroreach.com",
    password: "user123",
    name: "Grace Taylor",
  },
  // Sarah: FULL caregiver grant on John and Grace (seed.ts ensureCaregiverGrant ~1004).
  caregiver: {
    email: "caregiver@nephroreach.com",
    password: "caregiver123",
    name: "Sarah Taylor",
  },
  // Owners of the four offices (seed.ts OFFICES).
  clinic: {
    email: "clinic@nephroreach.com",
    password: "clinic123",
    name: "Riverside Dialysis Center",
  },
  access: {
    email: "access@nephroreach.com",
    password: "access123",
    name: "Metro Vascular Access Center",
  },
  nephrology: {
    email: "nephrology@nephroreach.com",
    password: "nephrology123",
    name: "Riverside Nephrology Associates",
  },
  hospital: {
    email: "hospital@nephroreach.com",
    password: "hospital123",
    name: "Riverside General Hospital",
  },
  admin: {
    email: "admin@nephroreach.com",
    password: "admin123",
    name: "Jenny Wilson",
  },
  // A seeded staff member (seed.ts STAFF): Social Worker at Riverside.
  socialWorker: {
    email: "socialworker@nephroreach.com",
    password: "staff123",
    name: "Linda Moore, LMSW",
  },
  // Opt-in fixture: Nurse at Riverside with a fixed TOTP (seed.ts:2383-2391).
  mfaNurse: {
    email: "mfa.nurse@nephroreach.com",
    password: "staff123",
    name: "Test Nurse (MFA fixture)",
  },
} satisfies Record<string, Account>;

/** Synthetic TOTP secret of mfa.nurse (seed.ts:2389). Not a real credential. */
export const MFA_NURSE_TOTP_SECRET = "KRSXG5CTMVRXEZLUKRSXG5CTMVRXEZLU";

/* Seeded links (seed.ts:330-395), used by isolation tests:
   John  -> riverside (all areas), metro-access (PROFILE, DIALYSIS),
            riverside-nephrology (PROFILE, PERSONAL_LOGS, MEDICATIONS, LABS),
            riverside-general (PROFILE)
   Grace -> riverside (PROFILE, DIALYSIS, MEDICATIONS, LABS),
            riverside-nephrology (PROFILE, MEDICATIONS, LABS)
   So: access@ and hospital@ have NO relationship with Grace. */
export const ORG_NAMES = {
  riverside: "Riverside Dialysis Center",
  metroAccess: "Metro Vascular Access Center",
  nephrology: "Riverside Nephrology Associates",
  hospital: "Riverside General Hospital",
} as const;

/** Fresh synthetic identity for flows that mutate an account (register, lockout). */
export function throwawayAccount(tag: string): Account {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return {
    // .test is a reserved TLD: mail can never reach a real inbox.
    email: `e2e-${tag}-${id}@example.test`,
    password: `E2e-${id}-Pass!`,
    name: `E2E ${tag} ${id}`,
  };
}
