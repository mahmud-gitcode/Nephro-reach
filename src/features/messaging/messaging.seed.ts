import type { CareTeamContact } from "./messaging.types";

/* ==========================================================================
   Messaging: the retired demo inbox (deprecated stub)
   --------------------------------------------------------------------------
   Phase 11 moved messaging to the API: no screen reads a seeded thread, and
   the ten demo conversations are deleted. What is left are the two
   constants other lanes still import. NEVER use them to find or filter
   data: threads are found by the server's ids.

   Importers (refreshed by the Lead after the Phase 9, 10 and 11 merges,
   2026-11-08), to be removed by their owners:
   - FACILITY: features/clinic/ClinicCheckIns.tsx, ClinicReports.tsx
     (and the tests features/clinic/newPatientFlows.test.ts,
     features/messaging/messaging.rules.test.ts);
   - NEPHROLOGY_OFFICE: features/clinic/ClinicReports.tsx, and the page
     app/(portal)/dashboard/(nephrology)/nephrology/messages/page.tsx
     (display label passed to ClinicMessages only).
   DEMO_MEMBER and seedConversations had no importer left (Phase 9 deleted
   memberFeed.ts, Phase 10 the access seed) and are removed.
   ========================================================================== */

/** @deprecated The dialysis center's demo name. See above. */
export const FACILITY: CareTeamContact = {
  name: "Riverside Dialysis Center",
  role: "Your Dialysis Care Team",
  kind: "facility",
};

/** @deprecated The nephrology office's demo name. See above. */
export const NEPHROLOGY_OFFICE: CareTeamContact = {
  name: "Riverside Nephrology Associates",
  role: "Your Nephrology Office",
  kind: "facility",
};
