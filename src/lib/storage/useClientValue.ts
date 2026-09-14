"use client";

import { useCallback, useState } from "react";
import { useIsMounted } from "@/lib/utils/useIsMounted";

/**
 * A value that only exists in the browser — one read out of `localStorage`,
 * a cookie, or anything else the server render cannot see.
 *
 * The usual shape for this is `useState(fallback)` plus an effect that reads
 * storage and sets state. That works, but it renders twice every time and
 * `react-hooks/set-state-in-effect` flags it, because the second render is
 * avoidable: React can tell us directly when hydration has happened.
 *
 * Here, `read()` runs during render once mounted, and `set` holds anything
 * this page changed afterwards. `refresh()` re-reads, for the callers that
 * subscribe to `storage` events.
 *
 *     const [plans, setPlans] = useClientValue(getStoredPlans, DEFAULTS);
 *
 * Two things to know:
 *
 *  - `read` runs on every render until something calls `set`, so keep it
 *    cheap. A JSON.parse of a short list is fine; anything heavier wants a
 *    cached snapshot and useSyncExternalStore.
 *  - `serverValue` must be a stable reference (a module constant), not a
 *    literal written inline, or every render returns a new object.
 *
 * This is a stopgap with a known replacement: the feature data layer, which
 * will own reads, writes and the loading and error states that arrive with
 * a real API.
 */
export function useClientValue<T>(read: () => T, serverValue: T) {
  const mounted = useIsMounted();
  const [override, setOverride] = useState<T | null>(null);

  const value = override ?? (mounted ? read() : serverValue);

  const refresh = useCallback(() => {
    setOverride(read());
  }, [read]);

  return [value, setOverride, refresh] as const;
}
