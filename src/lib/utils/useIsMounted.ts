"use client";

import { useSyncExternalStore } from "react";

/* Never notifies: the value it reports flips once, when React hydrates, and
   useSyncExternalStore already re-renders at that point. */
const subscribeNoop = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * `false` while rendering on the server and during hydration, `true` after.
 *
 * The obvious way to write this is `useState(false)` plus an effect that
 * sets it to `true` — which is what most of this codebase did, and what
 * `react-hooks/set-state-in-effect` flags: it schedules a second render pass
 * for something React can tell us directly.
 *
 * Use it to gate anything that only exists in the browser — `document`,
 * `localStorage`, a portal target — so the server render and the first
 * client render still agree and hydration does not mismatch.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    getClientSnapshot,
    getServerSnapshot,
  );
}
