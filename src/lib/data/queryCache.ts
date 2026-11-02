/* ==========================================================================
   The live query caches
   --------------------------------------------------------------------------
   QueryProvider lives under the portal layout, AuthProvider above it, so
   sign-out and session end cannot reach the QueryClient through context.
   Each provider registers its client here; sign-out, session end and a
   portal-context switch clear every one of them, so no patient data stays
   in memory for whoever uses the tab next.
   ========================================================================== */

import type { QueryClient } from "@tanstack/react-query";
import { setActiveOrganization } from "@/lib/api/client";

const clients = new Set<QueryClient>();

/** Called by QueryProvider; returns the unregister function. */
export function registerQueryClient(client: QueryClient): () => void {
  clients.add(client);
  return () => {
    clients.delete(client);
  };
}

/** Drop every cached query and mutation in this tab. */
export function clearQueryCaches(): void {
  for (const client of clients) {
    void client.cancelQueries();
    client.clear();
  }
}

/** Switch between office mode (an organization id) and patient/caregiver
 *  mode (null). The cache is cleared so one context never shows data read
 *  in another (INT-6). */
export function switchPortalContext(organizationId: string | null): void {
  setActiveOrganization(organizationId);
  clearQueryCaches();
}
