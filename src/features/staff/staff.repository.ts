import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import {
  ORGANIZATIONS,
  isCustomRole,
  organization,
  portalRole,
  sampleStaffRoster,
  type StaffAccount,
} from "./staff";

/* ==========================================================================
   Staff accounts — storage
   --------------------------------------------------------------------------
   Demo roster for the staff team screen until FE-ORG moves it to the API
   (Phase 3). Since Phase 2 nothing here keeps a password and nobody signs in
   with it: accounts and credentials live on the server. Every read and
   write strips a `password` field an older version may have stored.
   ========================================================================== */

export const STAFF_KEY = storageKey("staff-accounts");

/** Drops any `password` an older version stored (Phase 2). */
function withoutPasswords(accounts: StaffAccount[]): StaffAccount[] {
  if (!accounts.some((account) => "password" in account)) return accounts;
  return accounts.map((account) => {
    const { password: _dropped, ...kept } = account as StaffAccount & {
      password?: unknown;
    };
    void _dropped;
    return kept;
  });
}

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
 *  gets that account, so it shows without wiping anyone's edits.
 *  Seed accounts are matched by id: one the admin edited stays as edited. */
function withNewOrganizations(stored: StaffAccount[]): StaffAccount[] {
  const ids = new Set(stored.map((account) => account.id));
  const emails = new Set(stored.map((account) => account.email));
  const added = sampleStaffRoster(Date.now()).filter(
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
    /* A role the organisation created stays as it is. */
    const role =
      portal && !isCustomRole(account.orgId, account.role)
        ? portalRole(account.role, portal)
        : account.role;
    if (role === account.role) return account;
    changed = true;
    return { ...account, role };
  });
  return changed ? normal : stored;
}

export async function listStaff(): Promise<StaffAccount[]> {
  const stored = await readJson<unknown>(STAFF_KEY, null);
  if (isAccounts(stored)) {
    const clean = withoutPasswords(stored);
    const full = withNewOrganizations(clean);
    if (full !== stored) await writeJson(STAFF_KEY, full);
    return full;
  }
  const seeded = sampleStaffRoster(Date.now());
  await writeJson(STAFF_KEY, seeded);
  return seeded;
}

export async function saveStaff(
  accounts: StaffAccount[],
): Promise<StaffAccount[]> {
  return writeJson(STAFF_KEY, withoutPasswords(accounts));
}
