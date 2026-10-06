import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import {
  ORGANIZATIONS,
  organization,
  portalRole,
  seedStaff,
  type StaffAccount,
} from "./staff";

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

/** A list saved before a demo account existed (a new office, a new role)
 *  gets that account, so it can sign in without wiping anyone's edits.
 *  Seed accounts are matched by id: one the admin edited stays as edited. */
function withNewOrganizations(stored: StaffAccount[]): StaffAccount[] {
  const ids = new Set(stored.map((account) => account.id));
  const emails = new Set(stored.map((account) => account.email));
  const added = seedStaff(Date.now()).filter(
    (account) =>
      !ids.has(account.id) &&
      !emails.has(account.email) &&
      ORGANIZATIONS.some((org) => org.id === account.orgId),
  );
  const all = added.length === 0 ? stored : [...stored, ...added];
  /* A role saved before its organisation had its own set (the access
     center, 2026-10-06) reads as the nearest role in that set. */
  let changed = all !== stored;
  const normal = all.map((account) => {
    const portal = organization(account.orgId)?.portal;
    const role = portal ? portalRole(account.role, portal) : account.role;
    if (role === account.role) return account;
    changed = true;
    return { ...account, role };
  });
  return changed ? normal : stored;
}

export async function listStaff(): Promise<StaffAccount[]> {
  const stored = await readJson<unknown>(STAFF_KEY, null);
  if (isAccounts(stored)) {
    const full = withNewOrganizations(stored);
    if (full !== stored) await writeJson(STAFF_KEY, full);
    return full;
  }
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
    return isAccounts(stored)
      ? withNewOrganizations(stored)
      : seedStaff(Date.now());
  } catch {
    return seedStaff(Date.now());
  }
}
