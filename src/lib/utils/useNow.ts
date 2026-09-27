"use client";

import { useState } from "react";

/**
 * The time the component first rendered, held steady across re-renders.
 *
 * Reading `Date.now()` during render makes the output depend on when React
 * happens to re-render; the purity lint rule rejects it. For "today" and
 * "3 hours ago" labels the moment the page opened is close enough.
 */
export function useNow(): number {
  const [now] = useState(() => Date.now());
  return now;
}
