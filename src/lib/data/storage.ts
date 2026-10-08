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

   So a member-owned key is filed under the signed-in member. The demo
   patient keeps the plain key, which is also what the clinic reads for its
   linked patient (clinic/useMemberFeed), and staff and admin sessions read
   the plain key too. Shared records (messaging, vascular access, travel,
   the clinic's own stores) are one key for every role, as before.

   With a server, the member's id travels with the request instead.
   -------------------------------------------------------------------------- */

const MEMBER_OWNED = new Set([
  "between-treatment-check-ins",
  "care-team-questions",
  "classroom-learner",
  "clinic-notices",
  "custom-lab-results",
  "dialysis-access-photos",
  "dialysis-clinic",
  "dialysis-home-system",
  "dialysis-home-visits",
  "dialysis-modality",
  "dialysis-pd-exchanges",
  "dialysis-supplies",
  "dialysis-treatment-vitals",
  "dialysis-urine-output",
  "er-visits",
  "exercise-log",
  "weight-fluid-log",
  "journey-notes",
  "journey-progress",
  "library-saved",
  "medication-doses",
  "medication-mood",
  "medication-refills",
  "medication-reminders",
  "medication-side-effects",
  "nutrition-fluids",
  "nutrition-foods",
  "nutrition-goals",
  "profile-emergency-contact",
  "care-contacts",
  "provider-orders",
  "quick-actions",
  "rides",
  "table-talk-favorites",
  "table-talk-questions",
  "travel-reflections",
  "travel-treatments",
  "treatment-medications",
  "blood-pressure-readings",
  "bp-reminders",
  "member-medications",
  "member-appointments",
  "my-health",
]);

/** The signed-in session's role and email, read from the cookie. */
function sessionOf(): { role?: string; email?: string } | null {
  if (typeof document === "undefined") return null;
  const row = document.cookie
    .split("; ")
    .find((part) => part.startsWith("nr-session="));
  if (!row) return null;
  try {
    return JSON.parse(decodeURIComponent(row.slice("nr-session=".length)));
  } catch {
    return null;
  }
}

/** The key a read or write actually uses: a member-owned key is filed
 *  under the signed-in member, unless that member is the demo patient. */
export function resolveKey(key: string): string {
  const name = key.startsWith("nr:") ? key.slice(3) : key;
  if (!MEMBER_OWNED.has(name)) return key;
  const session = sessionOf();
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
