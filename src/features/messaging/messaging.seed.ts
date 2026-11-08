import type { CareTeamContact, Conversation } from "./messaging.types";
import { DEMO_MEMBER_MRN, DEMO_MEMBER_NAME } from "@/lib/data/demoIdentity";

/* ==========================================================================
   Messaging: the retired demo inbox (deprecated stub)
   --------------------------------------------------------------------------
   Phase 11 moved messaging to the API: no screen reads a seeded thread, and
   the ten demo conversations are deleted. What is left are the three
   constants other lanes still import, and a one-thread stand-in for one
   OFFICE test. NEVER use them to find or filter data: threads are found by
   the server's ids.

   Importers (2026-11-03), to be removed by their owners:
   - FACILITY: features/clinic/ClinicCheckIns.tsx, ClinicReports.tsx
     (and the test features/clinic/newPatientFlows.test.ts);
   - NEPHROLOGY_OFFICE: features/clinic/ClinicReports.tsx, and the page
     app/(portal)/dashboard/(nephrology)/nephrology/messages/page.tsx
     (display label passed to ClinicMessages only);
   - DEMO_MEMBER: features/clinic/memberFeed.ts,
     features/vascular-access/vascularAccess.data.ts (+ its test);
   - seedConversations: features/clinic/memberFeed.test.ts.
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

/** @deprecated The demo member's name. See above. */
export const DEMO_MEMBER = DEMO_MEMBER_NAME;

/** @deprecated One synthetic thread, with no messages, for the OFFICE
 *  lane's memberFeed test only. No screen imports it. */
export function seedConversations(_now: number): Conversation[] {
  void _now;
  return [
    {
      id: "demo-member--facility",
      memberName: DEMO_MEMBER_NAME,
      contact: FACILITY,
      category: "care-team",
      unread: 0,
      flagged: false,
      archived: false,
      patient: { mrn: DEMO_MEMBER_MRN },
      messages: [],
    },
  ];
}
