"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/* ==========================================================================
   QueryProvider
   --------------------------------------------------------------------------
   Why a library rather than a hook of our own: loading and error states are
   the easy half. The half that gets written badly by hand is everything
   after — request de-duplication, invalidating the right caches after a
   write, not refetching a list four times because four components asked for
   it, keeping a mutation's pending state honest when two fire at once.

   Those are solved problems, and the solution weighs about 13 KB. Writing
   our own would look clever for a week.

   The client is created inside state, not at module scope: at module scope
   one client would be shared across every request on the server, which
   leaks one user's cached data into another's render.
   ========================================================================== */

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            /* Reads come from this device, so nothing goes stale behind our
               back and there is nothing to refetch on window focus. Both of
               these want revisiting the day the data comes from a server
               that other people can also write to. */
            staleTime: Infinity,
            refetchOnWindowFocus: false,
            /* localStorage does not fail intermittently: if it throws once
               it will throw again, and a retry only delays the message. */
            retry: false,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
