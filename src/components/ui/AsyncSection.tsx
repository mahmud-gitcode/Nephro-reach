"use client";

import React from "react";
import { ErrorState } from "./ErrorState";

/* ==========================================================================
   AsyncSection
   --------------------------------------------------------------------------
   Every screen that reads data has the same four states — loading, failed,
   empty, loaded — and before this component the app had one of them. Written
   by hand at each call site they come out inconsistent: some screens check
   error before loading, some render an empty list while the read is still in
   flight, most forget the error branch entirely.

   So the order lives here, once, and it is deliberate:

     1. error   — a failed read is never an empty list. Showing "no entries"
                  when we simply could not find out is the worst of the four
                  mistakes, so error wins even over loading.
     2. loading — the skeleton, sized by the caller to match what follows.
     3. empty   — nothing to show, and it is true.
     4. loaded  — the children.

   Deliberately not tied to TanStack Query: it takes plain props, so a
   component can be tested and rendered in the gallery without a QueryClient
   above it. `useRides()` and its siblings adapt the query to these props.

   aria-busy marks the region, not the page, so a screen reader hears that
   this part is still arriving while the rest of the page stays usable.
   ========================================================================== */

export type AsyncSectionProps = {
  /** True while there is nothing to show yet. Use `isPending`, not `isFetching`. */
  pending: boolean;
  /** Anything truthy renders the error branch. */
  error?: unknown;
  /** Only consulted once the read has succeeded. */
  isEmpty?: boolean;
  /** Shown while pending. Shape it like the content it replaces. */
  skeleton: React.ReactNode;
  /** Shown when `isEmpty`. Usually an <EmptyState>. */
  empty?: React.ReactNode;
  /** Re-runs the read. Passed straight to ErrorState. */
  onRetry?: () => void;
  /** Overrides the default error copy. */
  errorTitle?: React.ReactNode;
  errorMessage?: React.ReactNode;
  children: React.ReactNode;
};

export function AsyncSection({
  pending,
  error,
  isEmpty = false,
  skeleton,
  empty,
  onRetry,
  errorTitle,
  errorMessage,
  children,
}: AsyncSectionProps) {
  if (error) {
    return (
      <ErrorState
        title={errorTitle}
        message={errorMessage}
        error={error}
        onRetry={onRetry}
      />
    );
  }

  if (pending) {
    return <div aria-busy="true">{skeleton}</div>;
  }

  if (isEmpty && empty) {
    return <>{empty}</>;
  }

  return <>{children}</>;
}

export default AsyncSection;
