import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { seedStaff, type StaffAccount } from "./staff";

/* ==========================================================================
   Staff accounts — storage
   --------------------------------------------------------------------------
   Demo only: passwords sit in this browser's storage beside the accounts.
   With a server, accounts and credentials live there, invitations go out
   by email, and nothing here keeps a password.
   ========================================================================== */

export const STAFF_KEY = storageKey("staff-accounts");

function isAccounts(value: unknown): value is StaffAccount[] {
  return (
    Array.isArray(value) &&
    value.every(
      (a) =>
        a &&
        typeof a === "object" &&
        typeof (a as StaffAccount).email === "string" &&
        typeof (a as StaffAccount).orgId === "string",
    )
  );
}

export async function listStaff(): Promise<StaffAccount[]> {
  const stored = await readJson<unknown>(STAFF_KEY, null);
  if (isAccounts(stored)) return stored;
  const seeded = seedStaff(Date.now());
  await writeJson(STAFF_KEY, seeded);
  return seeded;
}

export async function saveStaff(
  accounts: StaffAccount[],
): Promise<StaffAccount[]> {
  return writeJson(STAFF_KEY, accounts);
}

/**
 * The accounts, read synchronously for sign-in (which runs in a click
 * handler and has no loading state). The seed stands in until the admin
 * page has saved a list, so the demo staff can sign in on a fresh browser.
 */
export function readStaffForLogin(): StaffAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const stored: unknown = JSON.parse(
      window.localStorage.getItem(STAFF_KEY) ?? "null",
    );
    return isAccounts(stored) ? stored : seedStaff(Date.now());
  } catch {
    return seedStaff(Date.now());
  }
}
