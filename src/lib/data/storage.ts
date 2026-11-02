/* ==========================================================================
   The storage adapter
   --------------------------------------------------------------------------
   Every feature reads and writes through here, and every function returns a
   Promise — even though the bytes currently come from localStorage, which
   is synchronous.

   That is the point. A backend arrives in about a month, and today not one
   screen in this app has a loading state, an error state, or a guard against
   a double submit: 40,000 lines and three `isLoading` flags between them.
   They are missing because synchronous storage never made them necessary.
   If the UI only meets its first Promise on the day the API lands, that day
   becomes a rewrite of every list and every form.

   So the boundary is async now and the states get built now. On the day the
   API lands, the body of each function below changes and nothing above it
   does.

   Failures are real too. localStorage throws in private mode, when the
   quota is full, and when a user has blocked site data — today those throws
   are swallowed by a bare `catch {}` in a dozen places, and the member sees
   their entry silently not save.
   ========================================================================== */

import { DEMO_MEMBER_EMAIL } from "./demoIdentity";

/** Thrown for anything the caller could reasonably show a message about. */
export class StorageError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

/* A microtask, not a timer: enough to make the call genuinely asynchronous
   so a component cannot read the result during its own render, without
   inventing latency that would make the app feel slower than it is. */
const tick = () => Promise.resolve();

function assertBrowser() {
  if (typeof window === "undefined") {
    throw new StorageError(
      "Storage was read on the server. Data hooks belong in client components.",
    );
  }
}

/* --------------------------------------------------------------------------
   Whose data
   --------------------------------------------------------------------------
   A member's own records (their logs, check-ins, labs, medications…) are
   theirs alone. The browser has one storage for everyone who signs in on
   it, so without this two members on one device read each other's logs,
   and a newly registered member opened on the demo patient's.

   So a member-owned key is filed under the signed-in member (the email
   `GET /me/context` reports; caregiver grants in this browser are still
   keyed by email until Phase 3). The demo
   patient keeps the plain key, which is also what the clinic reads for its
   linked patient (clinic/useMemberFeed), and staff and admin sessions read
   the plain key too. Shared records (messaging, vascular access, travel,
   the clinic's own stores) are one key for every role, as before.

   With a server, the member's id travels with the request instead.
   -------------------------------------------------------------------------- */

const MEMBER_OWNED = new Set([
  "classroom-learner",
  "community-likes",
  "custom-lab-results",
  "dialysis-access-photos",
  "dialysis-home-system",
  "dialysis-home-visits",
  "dialysis-modality",
  "dialysis-pd-exchanges",
  "dialysis-supplies",
  "dialysis-treatment-vitals",
  "dialysis-urine-output",
  "journey-notes",
  "journey-progress",
  "library-saved",
  "medication-doses",
  "medication-mood",
  "medication-refills",
  "medication-reminders",
  "medication-side-effects",
  "provider-orders",
  "rides",
  "table-talk-favorites",
  "table-talk-questions",
  "travel-reflections",
  "travel-treatments",
  "treatment-medications",
  "member-medications",
  "member-appointments",
  /* Added 2026-10-12/13: each member's own. */
  "dialysis-treatments",
  "dialysis-schedule",
  "clinic-labs-seen",
]);

/* Whose local stores this tab reads: set by AuthContext from the server's
   `GET /me/context` (Phase 2), never from anything the browser can edit.
   It replaces the prototype's demo session cookie, which any user could
   rewrite to read another member's local data. Null when signed out. */
export type LocalScope = { role: string; email: string };
let localScope: LocalScope | null = null;

/** AuthContext calls this after every context read, and with null on
 *  sign-out and session end. */
export function setLocalScope(scope: LocalScope | null): void {
  localScope = scope
    ? { role: scope.role, email: scope.email.trim().toLowerCase() }
    : null;
}

/** The signed-in user's role and email, as the server reported them. */
function sessionOf(): LocalScope | null {
  return localScope;
}

/* --------------------------------------------------------------------------
   A caregiver never reads a member's local store (Phase 3)
   --------------------------------------------------------------------------
   The prototype kept the caregiver's grants and chosen patient in this
   browser (`nr:caregiver-grants`, `nr:caregiver-viewing:<email>`); both are
   retired (legacyPurge.ts). The patient a caregiver acts for is now the
   portal context from `GET /me/context`, and the server checks the grant
   on every request. A member store that is still local (a feature not yet
   on the API) has no per-patient copy the server vouches for, so a
   caregiver reads an empty one, never the demo patient's or their own.
   -------------------------------------------------------------------------- */

/** The key a read or write actually uses: a member-owned key is filed
 *  under the signed-in member, unless that member is the demo patient. */
export function resolveKey(key: string): string {
  const name = key.startsWith("nr:") ? key.slice(3) : key;
  if (!MEMBER_OWNED.has(name)) return key;
  const session = sessionOf();
  if (session?.role === "caregiver") return `nr:caregiver-none:${name}`;
  if (
    !session ||
    session.role !== "user" ||
    !session.email ||
    session.email === DEMO_MEMBER_EMAIL
  )
    return key;
  return `nr:member:${session.email}:${name}`;
}

/**
 * What an empty member store shows: its sample data for the demo patient
 * (and any shared screen), nothing for a member who registered themselves.
 * A new member seeing sample medications they never entered would read
 * them as their own.
 */
export function sampleOr<T>(key: string, sample: T, empty: T): T {
  return resolveKey(key) === key ? sample : empty;
}

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  await tick();
  assertBrowser();
  key = resolveKey(key);

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch (cause) {
    throw new StorageError(
      "This browser is not allowing NephroReach to read saved data.",
      cause,
    );
  }

  if (raw === null) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch (cause) {
    // Corrupt entry: better to fall back than to crash the page. The member
    // loses nothing they can see, because the value was unreadable anyway.
    console.warn(`Ignoring unreadable value at "${key}".`, cause);
    return fallback;
  }
}

export async function writeJson<T>(key: string, value: T): Promise<T> {
  await tick();
  assertBrowser();
  key = resolveKey(key);

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (cause) {
    const full =
      cause instanceof DOMException &&
      (cause.name === "QuotaExceededError" ||
        cause.name === "NS_ERROR_DOM_QUOTA_REACHED");

    throw new StorageError(
      full
        ? "There is no room left to save this. Remove some older entries and try again."
        : "This browser is not allowing NephroReach to save data.",
      cause,
    );
  }

  return value;
}

export async function removeKey(key: string): Promise<void> {
  await tick();
  assertBrowser();
  key = resolveKey(key);
  try {
    window.localStorage.removeItem(key);
  } catch (cause) {
    throw new StorageError("This browser is not allowing that change.", cause);
  }
}

/** `nr:` namespaces our keys so they are obvious in devtools. */
export const storageKey = (name: string) => `nr:${name}`;
