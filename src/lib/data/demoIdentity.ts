/* ==========================================================================
   The demo patient — one person everywhere
   --------------------------------------------------------------------------
   The member demo login, the messaging threads, the vascular access record,
   the clinic's roster, CCM and travel all describe the same patient. They
   used to disagree (Charles Xavier at sign-in, John Taylor in Messages, two
   different MRNs for John Taylor), so a clinic saw one person as two. Every
   one of them reads from here now.

   With a server this is simply the signed-in member's own record.
   ========================================================================== */

export const DEMO_MEMBER_EMAIL = "user@nephroreach.com";
export const DEMO_MEMBER_NAME = "John Taylor";
export const DEMO_MEMBER_MRN = "223344";
