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

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  await tick();
  assertBrowser();

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
  try {
    window.localStorage.removeItem(key);
  } catch (cause) {
    throw new StorageError("This browser is not allowing that change.", cause);
  }
}

/** `nr:` namespaces our keys so they are obvious in devtools. */
export const storageKey = (name: string) => `nr:${name}`;
